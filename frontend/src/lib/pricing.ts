export const TAX_RATE = 0.085;
export const DEFAULT_LABOR_RATE = 45;

export interface PricedServiceLine {
  price?: number | null;
  durationMins?: number | null;
  laborRate?: number | null;
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

export function laborHours(durationMins?: number | null) {
  const mins = durationMins ?? 0;
  return mins > 0 ? round2(mins / 60) : 0;
}

export function formatHours(hours: number) {
  if (!hours) return "0h";
  return Number.isInteger(hours) ? `${hours}h` : `${round2(hours)}h`;
}

export function computeAutoLabor(services: PricedServiceLine[]): number {
  return round2(
    services.reduce(
      (sum, s) => sum + (s.durationMins ? laborHours(s.durationMins) * (s.laborRate ?? DEFAULT_LABOR_RATE) : 0),
      0,
    ),
  );
}

export function summarizeItems(items: { category?: string; amount?: number }[]): PricingTotals {
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

export function computeTotals(
  services: PricedServiceLine[],
  parts: { subtotal?: number | null }[],
  estimateLabor = 0,
): PricingTotals & { autoLabor: number; laborTotal: number } {
  const servicesTotal = round2(services.reduce((sum, s) => sum + (s.price ?? 0), 0));
  const partsTotal = round2(parts.reduce((sum, p) => sum + (p.subtotal ?? 0), 0));
  const autoLabor = computeAutoLabor(services);
  const laborTotal = estimateLabor > 0 ? round2(estimateLabor) : autoLabor;
  const subtotal = round2(servicesTotal + partsTotal + laborTotal);
  const tax = round2(subtotal * TAX_RATE);
  return {
    servicesTotal,
    partsTotal,
    autoLabor,
    laborTotal,
    subtotal,
    tax,
    total: round2(subtotal + tax),
  };
}

export function buildTaskLines(task: {
  services?: PricedServiceLine[] | null;
  partsUsed?: { name?: string; qty?: number | null; unitPrice?: number | null; subtotal?: number | null }[] | null;
}): { lines: PricingLine[]; totals: PricingTotals } {
  const services = task.services ?? [];
  const parts = task.partsUsed ?? [];
  const lines: PricingLine[] = [];

  for (const s of services) {
    const price = round2(s.price ?? 0);
    const hours = laborHours(s.durationMins);
    const rate = round2(s.laborRate ?? DEFAULT_LABOR_RATE);
    lines.push({
      serviceId: (s as { id?: string }).id ?? null,
      description: (s as { name?: string }).name ?? "Service",
      category: "service",
      qty: 1,
      rate: price,
      amount: price,
    });
    if (hours > 0) {
      lines.push({
        serviceId: (s as { id?: string }).id ?? null,
        description: `Labor — ${(s as { name?: string }).name ?? "Service"}`,
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
