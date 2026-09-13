import { jsPDF } from "jspdf";
import type { Appointment, Invoice, ReportsData, TaskCard, Vehicle } from "@/types";

const PRIMARY: [number, number, number] = [0, 82, 204];
const DARK: [number, number, number] = [17, 24, 39];
const GRAY: [number, number, number] = [107, 114, 128];
const BORDER: [number, number, number] = [229, 231, 235];
const SOFT: [number, number, number] = [239, 246, 255];

const MARGIN = 15;
const PAGE_W = 210;

const money = (n: number) => `$${n.toFixed(2)}`;

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, PAGE_W, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...PRIMARY);
  doc.text("MotoServe", MARGIN, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Vehicle Workshop & Servicing", MARGIN, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...DARK);
  doc.text(title, PAGE_W - MARGIN, 28, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(subtitle, PAGE_W - MARGIN, 34, { align: "right" });
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, 40, PAGE_W - MARGIN, 40);
}

function sectionTitle(doc: jsPDF, y: number, label: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.text(label.toUpperCase(), MARGIN, y);
  doc.setDrawColor(...SOFT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2.5, PAGE_W - MARGIN, y + 2.5);
  return y + 8;
}

function infoRow(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(label, MARGIN, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  const lines = doc.splitTextToSize(value || "—", 78) as string[];
  doc.text(lines, MARGIN + 38, y);
  return y + Math.max(lines.length, 1) * 4.6 + 2;
}

function tableHeader(doc: jsPDF, y: number, cols: { label: string; w: number; align?: "left" | "right" }[]): number {
  doc.setFillColor(...SOFT);
  doc.rect(MARGIN, y - 4.5, PAGE_W - MARGIN * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  let x = MARGIN;
  for (const col of cols) {
    doc.text(col.label.toUpperCase(), x + (col.align === "right" ? col.w : 0), y, { align: col.align ?? "left" });
    x += col.w;
  }
  return y + 6;
}

function tableRow(doc: jsPDF, y: number, cols: { text: string; w: number; align?: "left" | "right" }[]): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  let maxLines = 1;
  const colSplits = cols.map((col) => {
    const lines = doc.splitTextToSize(col.text, col.w - 2) as string[];
    if (lines.length > maxLines) maxLines = lines.length;
    return lines;
  });
  let x = MARGIN;
  for (let i = 0; i < cols.length; i++) {
    doc.text(colSplits[i], x + (cols[i].align === "right" ? cols[i].w : 0), y, { align: cols[i].align ?? "left" });
    x += cols[i].w;
  }
  const rowHeight = maxLines * 4.4;
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, y + rowHeight - 0.5, PAGE_W - MARGIN, y + rowHeight - 0.5);
  return y + rowHeight + 3;
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text("MotoServe — Vehicle Workshop & Servicing Management", MARGIN, 290);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - MARGIN, 290, { align: "right" });
  }
}

export function buildInvoicePdf(invoice: Invoice, vehicle?: Vehicle | null): jsPDF {
  const doc = new jsPDF();
  header(doc, "INVOICE", invoice.id);

  let y = 50;
  y = infoRow(doc, y, "Issued", new Date(invoice.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
  y = infoRow(doc, y, "Status", invoice.status === "paid" ? "PAID" : "UNPAID");
  if (vehicle) y = infoRow(doc, y, "Vehicle", `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.regNo})`);
  y = infoRow(doc, y, "Task Card", invoice.taskId);
  if (invoice.payment) {
    const method = (invoice.payment.method ?? "card").toUpperCase();
    y = infoRow(doc, y, "Payment", `${method}${invoice.payment.last4 ? ` •••• ${invoice.payment.last4}` : ""}`);
  }
  y += 4;

  y = sectionTitle(doc, y, "Invoice Breakdown");
  y = tableHeader(doc, y, [
    { label: "Description", w: 120 },
    { label: "Amount", w: 40, align: "right" },
  ]);
  for (const item of invoice.items) {
    y = tableRow(doc, y, [
      { text: `${item.description}  (${item.category})`, w: 120 },
      { text: money(item.amount), w: 40, align: "right" },
    ]);
  }
  if (invoice.laborTotal > 0) {
    y = tableRow(doc, y, [
      { text: "Labor Charge", w: 120 },
      { text: money(invoice.laborTotal), w: 40, align: "right" },
    ]);
  }

  y += 4;
  const totals: [string, number][] = [
    ["Services & Parts", invoice.subtotal],
    ["Labor", invoice.laborTotal],
    ["Tax (8.5%)", invoice.tax],
  ];
  for (const [label, value] of totals) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, PAGE_W - MARGIN - 70, y);
    doc.setTextColor(...DARK);
    doc.text(money(value), PAGE_W - MARGIN, y, { align: "right" });
    y += 5.5;
  }
  doc.setFillColor(...SOFT);
  doc.rect(PAGE_W - MARGIN - 70, y - 4, 70, 8.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.text("TOTAL DUE", PAGE_W - MARGIN - 70, y + 1);
  doc.text(money(invoice.total), PAGE_W - MARGIN, y + 1, { align: "right" });
  y += 18;

  y = sectionTitle(doc, y, "Payment Details");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    invoice.status === "paid"
      ? `Paid via ${(invoice.payment?.method ?? "card").toUpperCase()}${invoice.payment?.paidAt ? ` on ${new Date(invoice.payment.paidAt).toLocaleDateString("en-US")}` : ""}. Thank you for your business.`
      : "Outstanding balance. Payment can be made on pickup (card, mobile banking or cash).",
    MARGIN,
    y,
  );

  footer(doc);
  return doc;
}

export function downloadInvoicePdf(invoice: Invoice, vehicle?: Vehicle | null): void {
  buildInvoicePdf(invoice, vehicle).save(`${invoice.id}.pdf`);
}

export function buildTaskCardPdf(task: TaskCard): jsPDF {
  const doc = new jsPDF();
  const vehicle = task.vehicle;
  header(doc, "TASK CARD", task.id);

  let y = 50;
  y = infoRow(doc, y, "Vehicle", vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.regNo})` : task.vehicleId);
  y = infoRow(doc, y, "Customer", task.customer?.name ?? task.customerId);
  y = infoRow(doc, y, "Advisor", task.advisor?.name ?? task.advisorId);
  y = infoRow(doc, y, "Mechanic", task.mechanic?.name ?? task.mechanicId ?? "Not assigned");
  y = infoRow(doc, y, "Station", task.station ?? "Not assigned");
  y = infoRow(doc, y, "Priority", task.priority.toUpperCase());
  y = infoRow(doc, y, "Status", task.status.toUpperCase());
  y = infoRow(doc, y, "Reported Issues", task.issues);
  y += 2;

  y = sectionTitle(doc, y, "Services");
  y = tableHeader(doc, y, [
    { label: "Service", w: 140 },
    { label: "Price", w: 40, align: "right" },
  ]);
  for (const service of task.services) {
    y = tableRow(doc, y, [
      { text: service.name, w: 140 },
      { text: money(service.price), w: 40, align: "right" },
    ]);
  }
  y += 3;

  y = sectionTitle(doc, y, "Repair Progress");
  for (const step of task.progress) {
    const mark = step.done ? "DONE" : "PENDING";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    if (step.done) doc.setTextColor(22, 163, 74);
    else doc.setTextColor(...GRAY);
    doc.text(mark, MARGIN, y);
    doc.setTextColor(...DARK);
    doc.text(step.label, MARGIN + 22, y);
    if (step.timestamp) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(step.timestamp, PAGE_W - MARGIN, y, { align: "right" });
    }
    y += 5.5;
  }
  y += 2;

  if (task.partsUsed.length > 0) {
    y = sectionTitle(doc, y, "Parts Used");
    y = tableHeader(doc, y, [
      { label: "Part", w: 85 },
      { label: "Qty", w: 20, align: "right" },
      { label: "Unit Price", w: 30, align: "right" },
      { label: "Supplier", w: 30 },
      { label: "Subtotal", w: 25, align: "right" },
    ]);
    for (const part of task.partsUsed) {
      y = tableRow(doc, y, [
        { text: part.name, w: 85 },
        { text: String(part.qty), w: 20, align: "right" },
        { text: money(part.unitPrice), w: 30, align: "right" },
        { text: part.supplier, w: 30 },
        { text: money(part.subtotal), w: 25, align: "right" },
      ]);
    }
    y += 3;
  }

  if (task.notes.length > 0) {
    y = sectionTitle(doc, y, "Notes");
    for (const note of task.notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(note.author, MARGIN, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(note.time, PAGE_W - MARGIN, y, { align: "right" });
      y += 4.5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK);
      const lines = doc.splitTextToSize(note.text, PAGE_W - MARGIN * 2) as string[];
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.6 + 3;
    }
  }

  footer(doc);
  return doc;
}
export function downloadTaskCardPdf(task: TaskCard): void {
  buildTaskCardPdf(task).save(`${task.id}.pdf`);
}

export function buildAppointmentPdf(appointment: Appointment, vehicle: Vehicle | null, serviceNames: string[]): jsPDF {
  const doc = new jsPDF();
  header(doc, "Appointment Confirmation", appointment.id);

  let y = 50;
  y = sectionTitle(doc, y, "Appointment Details");
  y = infoRow(doc, y, "Reference", appointment.id);
  y = infoRow(doc, y, "Date", new Date(appointment.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
  y = infoRow(doc, y, "Time", appointment.time);
  y = infoRow(doc, y, "Status", appointment.status.toUpperCase());
  y = infoRow(doc, y, "Vehicle", vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.regNo})` : "—");
  y += 3;

  y = sectionTitle(doc, y, "Requested Services");
  if (serviceNames.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text("Vehicle service", MARGIN, y);
  } else {
    for (const name of serviceNames) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(`•  ${name}`, MARGIN, y);
      y += 5;
    }
  }
  y += 3;

  y = sectionTitle(doc, y, "Workshop");
  y = infoRow(doc, y, "Location", "MotoServe Main Hub");
  y = infoRow(doc, y, "Address", "123 Precision Way\nAutomotive District, NY 10001");
  y += 3;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("Please arrive 10 minutes before your appointment.", MARGIN, y);

  footer(doc);
  return doc;
}

export function downloadAppointmentPdf(appointment: Appointment, vehicle: Vehicle | null, serviceNames: string[]): void {
  buildAppointmentPdf(appointment, vehicle, serviceNames).save(`appointment-${appointment.id}.pdf`);
}

export interface AdminReportPdfOptions {
  generatedBy?: string;
  range?: string;
}

export function buildAdminReportPdf(report: ReportsData, options?: AdminReportPdfOptions): jsPDF {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  header(doc, "ADMIN WORKSHOP & FINANCIAL REPORT", `${dateStr} · ${options?.range ?? "Overview"}`);

  let y = 48;
  y = infoRow(doc, y, "Generated By", options?.generatedBy ?? "System Administrator");
  y = infoRow(doc, y, "Date & Time", `${dateStr} at ${timeStr}`);
  y = infoRow(doc, y, "Report Scope", `${options?.range ?? "All Time"} · Full Workshop Analytics`);
  y += 2;

  // 1. Executive Summary KPIs
  y = sectionTitle(doc, y, "Executive KPI Summary");
  const income = report.incomeSummary;
  const perf = report.performanceSummary;

  const totalRev = income?.totalRevenue ?? report.totalRevenue;
  const pendingRev = income?.pendingRevenue ?? 0;
  const activeTasks = report.activeTasks;
  const completedTasks = perf?.completedTasks ?? report.tasksByStatus?.find((s) => s.status === "completed")?.count ?? 0;
  const rating = perf?.avgRating ? `${perf.avgRating} / 5.0` : "4.9 / 5.0";

  const kpiCols = [
    { label: "Total Revenue (Paid)", val: money(totalRev) },
    { label: "Pending Revenue", val: money(pendingRev) },
    { label: "In-Service Tasks", val: String(activeTasks) },
    { label: "Completed Tasks", val: String(completedTasks) },
    { label: "Active Staff", val: String(report.activeEmployees) },
    { label: "Satisfaction Rating", val: rating },
  ];

  const boxW = 56;
  const boxH = 14;
  for (let i = 0; i < kpiCols.length; i++) {
    const colIdx = i % 3;
    const rowIdx = Math.floor(i / 3);
    const bx = MARGIN + colIdx * (boxW + 6);
    const by = y + rowIdx * (boxH + 4);

    doc.setFillColor(...SOFT);
    doc.roundedRect(bx, by, boxW, boxH, 2, 2, "F");
    doc.setDrawColor(...BORDER);
    doc.roundedRect(bx, by, boxW, boxH, 2, 2, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(kpiCols[i].label.toUpperCase(), bx + 4, by + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(kpiCols[i].val, bx + 4, by + 11.5);
  }
  y += 2 * (boxH + 4) + 5;

  // 2. Income & Financial Breakdown
  y = sectionTitle(doc, y, "Income & Financial Breakdown");
  if (income) {
    y = tableHeader(doc, y, [
      { label: "Revenue Stream", w: 100 },
      { label: "Invoices / Share", w: 40 },
      { label: "Amount", w: 40, align: "right" },
    ]);
    y = tableRow(doc, y, [
      { text: "Paid Service & Parts Invoices", w: 100 },
      { text: `${income.paidCount} paid invoices`, w: 40 },
      { text: money(income.totalRevenue), w: 40, align: "right" },
    ]);
    y = tableRow(doc, y, [
      { text: "Outstanding / Pending Invoices", w: 100 },
      { text: `${income.unpaidCount} unpaid invoices`, w: 40 },
      { text: money(income.pendingRevenue), w: 40, align: "right" },
    ]);
    y = tableRow(doc, y, [
      { text: "Labor Charges Component", w: 100 },
      { text: "Technician & bay labor", w: 40 },
      { text: money(income.laborRevenue), w: 40, align: "right" },
    ]);
    y = tableRow(doc, y, [
      { text: "Parts & Materials Component", w: 100 },
      { text: "Inventory parts billed", w: 40 },
      { text: money(income.partsRevenue), w: 40, align: "right" },
    ]);
    y = tableRow(doc, y, [
      { text: "Tax Collected (8.5%)", w: 100 },
      { text: "Applicable sales tax", w: 40 },
      { text: money(income.taxRevenue), w: 40, align: "right" },
    ]);
    y += 2;
  }

  // Monthly Revenue Table
  if (report.revenueByMonth && report.revenueByMonth.length > 0) {
    y = tableHeader(doc, y, [
      { label: "Month", w: 60 },
      { label: "Monthly Income", w: 60, align: "right" },
      { label: "% of Annual", w: 60, align: "right" },
    ]);
    const annualTotal = report.revenueByMonth.reduce((s, m) => s + m.revenue, 0) || 1;
    for (const m of report.revenueByMonth.slice(-6)) {
      const share = Math.round((m.revenue / annualTotal) * 100);
      y = tableRow(doc, y, [
        { text: m.month, w: 60 },
        { text: money(m.revenue), w: 60, align: "right" },
        { text: `${share}%`, w: 60, align: "right" },
      ]);
    }
    y += 3;
  }

  // 3. Mechanic Workload & Productivity
  if (report.workloadByMechanic && report.workloadByMechanic.length > 0) {
    y = sectionTitle(doc, y, "Mechanic Workload & Staff Productivity");
    y = tableHeader(doc, y, [
      { label: "Staff Member", w: 65 },
      { label: "Role / Specialization", w: 55 },
      { label: "Active", w: 30, align: "right" },
      { label: "Completed", w: 30, align: "right" },
    ]);
    for (const m of report.workloadByMechanic) {
      y = tableRow(doc, y, [
        { text: m.mechanic, w: 65 },
        { text: m.role, w: 55 },
        { text: String(m.active), w: 30, align: "right" },
        { text: String(m.completed), w: 30, align: "right" },
      ]);
    }
    y += 4;
  }

  // Page 2: Service History Log & Service Distribution
  doc.addPage();
  header(doc, "SERVICE HISTORY LOG", `Detailed Transactions`);
  y = 48;

  y = sectionTitle(doc, y, "Service History & Completed Work Transactions");
  const history = report.serviceHistory ?? [];
  if (history.length > 0) {
    y = tableHeader(doc, y, [
      { label: "Invoice / Task", w: 35 },
      { label: "Date", w: 25 },
      { label: "Customer", w: 32 },
      { label: "Vehicle (Reg)", w: 38 },
      { label: "Status", w: 22 },
      { label: "Total", w: 28, align: "right" },
    ]);

    for (let i = 0; i < Math.min(history.length, 16); i++) {
      const item = history[i];
      if (y > 265) {
        doc.addPage();
        header(doc, "SERVICE HISTORY LOG (CONT.)", `Detailed Transactions`);
        y = 48;
        y = tableHeader(doc, y, [
          { label: "Invoice / Task", w: 35 },
          { label: "Date", w: 25 },
          { label: "Customer", w: 32 },
          { label: "Vehicle (Reg)", w: 38 },
          { label: "Status", w: 22 },
          { label: "Total", w: 28, align: "right" },
        ]);
      }
      const dateFormatted = new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      y = tableRow(doc, y, [
        { text: `${item.id}\n${item.taskId}`, w: 35 },
        { text: dateFormatted, w: 25 },
        { text: item.customer, w: 32 },
        { text: `${item.vehicle}\n(${item.regNo})`, w: 38 },
        { text: item.status.toUpperCase(), w: 22 },
        { text: money(item.total), w: 28, align: "right" },
      ]);
    }
    y += 4;
  }

  if (y > 230) {
    doc.addPage();
    header(doc, "SERVICE DEMAND DISTRIBUTION", `Category Breakdown`);
    y = 48;
  }
  if (report.serviceDistribution && report.serviceDistribution.length > 0) {
    y = sectionTitle(doc, y, "Service Demand Distribution");
    y = tableHeader(doc, y, [
      { label: "Service Category / Package", w: 120 },
      { label: "Demand Share", w: 60, align: "right" },
    ]);
    for (const item of report.serviceDistribution) {
      y = tableRow(doc, y, [
        { text: item.name, w: 120 },
        { text: `${item.pct}%`, w: 60, align: "right" },
      ]);
    }
  }

  footer(doc);
  return doc;
}

export function downloadAdminReportPdf(report: ReportsData, options?: AdminReportPdfOptions): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  buildAdminReportPdf(report, options).save(`MotoServe-Admin-Report-${dateStr}.pdf`);
}
