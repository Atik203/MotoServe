import { jsPDF } from "jspdf";
import type { Invoice, JobCard, Vehicle } from "@/types";

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
  let x = MARGIN;
  const lines = doc.splitTextToSize(cols[0].text, cols[0].w - 2) as string[];
  doc.text(lines, x, y);
  for (let i = 1; i < cols.length; i++) {
    x += cols[i - 1].w;
    doc.text(cols[i].text, x + (cols[i].align === "right" ? cols[i].w : 0), y, { align: cols[i].align ?? "left" });
  }
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, y + 2.5, PAGE_W - MARGIN, y + 2.5);
  return y + Math.max(lines.length, 1) * 4.6 + 4;
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
  y = infoRow(doc, y, "Job Card", invoice.jobId);
  if (invoice.payment) {
    const method = (invoice.payment.method ?? "card").toUpperCase();
    y = infoRow(doc, y, "Payment", `${method}${invoice.payment.last4 ? ` •••• ${invoice.payment.last4}` : ""}`);
  }
  y += 4;

  y = sectionTitle(doc, y, "Invoice Breakdown");
  y = tableHeader(doc, y, [
    { label: "Description", w: 110 },
    { label: "Qty", w: 20, align: "right" },
    { label: "Rate", w: 30, align: "right" },
    { label: "Amount", w: 20, align: "right" },
  ]);
  for (const item of invoice.items) {
    const qty = item.category === "parts" ? 2 : 1;
    y = tableRow(doc, y, [
      { text: item.description, w: 110 },
      { text: String(qty), w: 20, align: "right" },
      { text: money(item.amount / qty), w: 30, align: "right" },
      { text: money(item.amount), w: 20, align: "right" },
    ]);
  }
  y = tableRow(doc, y, [
    { text: "Labor Charge", w: 110 },
    { text: "3.5", w: 20, align: "right" },
    { text: "$60.00/hr", w: 30, align: "right" },
    { text: money(invoice.laborTotal), w: 20, align: "right" },
  ]);

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

export function buildJobCardPdf(job: JobCard): jsPDF {
  const doc = new jsPDF();
  const vehicle = job.vehicle;
  header(doc, "JOB CARD", job.id);

  let y = 50;
  y = infoRow(doc, y, "Vehicle", vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.regNo})` : job.vehicleId);
  y = infoRow(doc, y, "Customer", job.customer?.name ?? job.customerId);
  y = infoRow(doc, y, "Advisor", job.advisor?.name ?? job.advisorId);
  y = infoRow(doc, y, "Mechanic", job.mechanic?.name ?? job.mechanicId ?? "Not assigned");
  y = infoRow(doc, y, "Station", job.station ?? "Not assigned");
  y = infoRow(doc, y, "Priority", job.priority.toUpperCase());
  y = infoRow(doc, y, "Status", job.status.toUpperCase());
  y = infoRow(doc, y, "Reported Issues", job.issues);
  y += 2;

  y = sectionTitle(doc, y, "Services");
  y = tableHeader(doc, y, [
    { label: "Service", w: 140 },
    { label: "Price", w: 40, align: "right" },
  ]);
  for (const service of job.services) {
    y = tableRow(doc, y, [
      { text: service.name, w: 140 },
      { text: money(service.price), w: 40, align: "right" },
    ]);
  }
  y += 3;

  y = sectionTitle(doc, y, "Repair Progress");
  for (const step of job.progress) {
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

  if (job.partsUsed.length > 0) {
    y = sectionTitle(doc, y, "Parts Used");
    y = tableHeader(doc, y, [
      { label: "Part", w: 85 },
      { label: "Qty", w: 20, align: "right" },
      { label: "Unit Price", w: 30, align: "right" },
      { label: "Supplier", w: 30 },
      { label: "Subtotal", w: 25, align: "right" },
    ]);
    for (const part of job.partsUsed) {
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

  if (job.notes.length > 0) {
    y = sectionTitle(doc, y, "Notes");
    for (const note of job.notes) {
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

export function downloadJobCardPdf(job: JobCard): void {
  buildJobCardPdf(job).save(`${job.id}.pdf`);
}
