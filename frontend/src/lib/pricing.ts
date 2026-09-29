export const TAX_RATE = 0.085;
export const DEFAULT_LABOR_RATE = 45;

export interface PricedServiceLine {
  price?: number | null;
  durationMins?: number | null;
  laborRate?: number | null;
}

export function computeAutoLabor(services: PricedServiceLine[]): number {
  return services.reduce(
    (sum, s) => sum + (s.durationMins ? (s.durationMins / 60) * (s.laborRate ?? DEFAULT_LABOR_RATE) : 0),
    0,
  );
}

export function computeTotals(
  services: PricedServiceLine[],
  parts: { subtotal?: number | null }[],
  estimateLabor = 0,
) {
  const servicesTotal = services.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const partsTotal = parts.reduce((sum, p) => sum + (p.subtotal ?? 0), 0);
  const autoLabor = computeAutoLabor(services);
  const laborTotal = estimateLabor > 0 ? estimateLabor : autoLabor;
  const subtotal = servicesTotal + partsTotal + laborTotal;
  const tax = subtotal * TAX_RATE;
  return {
    servicesTotal,
    partsTotal,
    autoLabor,
    laborTotal,
    subtotal,
    tax,
    total: subtotal + tax,
  };
}
