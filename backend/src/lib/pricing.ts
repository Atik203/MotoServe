export const TAX_RATE = 0.085;
export const DEFAULT_LABOR_RATE = 45;

export interface TaskServiceSnapshot {
  id?: string;
  name?: string;
  price?: number;
  durationMins?: number;
  laborRate?: number;
  category?: string;
}

export interface TaskPartSnapshot {
  id?: string;
  name?: string;
  qty?: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface PricingLine {
  serviceId?: string | null;
  description: string;
  category: "service" | "parts" | "labor";
  qty: number;
  rate: number;
  amount: number;
}

export interface PricingTotals {
  servicesTotal: number;
  laborTotal: number;
  partsTotal: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function laborHours(service: TaskServiceSnapshot) {
  const mins = service.durationMins ?? 0;
  return mins > 0 ? round2(mins / 60) : 0;
}

export function summarizeItems(
  items: { category?: string; amount?: number }[],
): PricingTotals {
  let servicesTotal = 0;
  let laborTotal = 0;
  let partsTotal = 0;

  for (const item of items) {
    const amount = round2(item.amount ?? 0);
    const category = (item.category ?? "").toLowerCase();
    if (category === "labor") laborTotal = round2(laborTotal + amount);
    else if (category === "parts") partsTotal = round2(partsTotal + amount);
    else servicesTotal = round2(servicesTotal + amount);
  }

  const subtotal = round2(servicesTotal + laborTotal + partsTotal);
  const tax = round2(subtotal * TAX_RATE);
  return { servicesTotal, laborTotal, partsTotal, subtotal, tax, total: round2(subtotal + tax) };
}

export function buildTaskLines(task: { services?: unknown; partsUsed?: unknown }): {
  lines: PricingLine[];
  totals: PricingTotals;
} {
  const services = Array.isArray(task.services) ? (task.services as TaskServiceSnapshot[]) : [];
  const parts = Array.isArray(task.partsUsed) ? (task.partsUsed as TaskPartSnapshot[]) : [];
  const lines: PricingLine[] = [];

  for (const s of services) {
    const price = round2(s.price ?? 0);
    const hours = laborHours(s);
    const rate = round2(s.laborRate ?? DEFAULT_LABOR_RATE);
    lines.push({
      serviceId: s.id ?? null,
      description: s.name ?? "Service",
      category: "service",
      qty: 1,
      rate: price,
      amount: price,
    });
    if (hours > 0) {
      lines.push({
        serviceId: s.id ?? null,
        description: `Labor — ${s.name ?? "Service"}`,
        category: "labor",
        qty: hours,
        rate,
        amount: round2(hours * rate),
      });
    }
  }

  for (const p of parts) {
    const qty = p.qty ?? 1;
    const rate = round2(p.unitPrice ?? (p.subtotal && qty ? p.subtotal / qty : 0));
    lines.push({
      description: p.name ?? "Part",
      category: "parts",
      qty,
      rate,
      amount: round2(p.subtotal ?? qty * rate),
    });
  }

  return { lines, totals: summarizeItems(lines) };
}
