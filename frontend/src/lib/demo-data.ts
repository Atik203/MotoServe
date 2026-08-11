import type {
  Appointment,
  ChatThread,
  Customer,
  Employee,
  Estimate,
  Faq,
  Invoice,
  JobCard,
  KpiCard,
  Part,
  Rating,
  Service,
  Testimonial,
  Vehicle,
} from "@/types";

export type DemoFile =
  | "services"
  | "vehicles"
  | "customers"
  | "employees"
  | "jobs"
  | "parts"
  | "appointments"
  | "estimates"
  | "invoices"
  | "messages"
  | "ratings"
  | "kpis"
  | "reports"
  | "testimonials"
  | "faqs"
  | "pricing";

type DemoMap = {
  services: Service[];
  vehicles: Vehicle[];
  customers: Customer[];
  employees: Employee[];
  jobs: JobCard[];
  parts: Part[];
  appointments: Appointment[];
  estimates: Estimate[];
  invoices: Invoice[];
  messages: ChatThread[];
  ratings: Rating[];
  kpis: Record<string, KpiCard[]>;
  reports: {
    revenueByMonth: { month: string; revenue: number }[];
    workloadByMechanic: {
      mechanic: string;
      role?: string;
      active?: number;
      done?: number;
      completed?: number;
      avgHoursPerJob?: number;
    }[];
    serviceDistribution: { name: string; pct: number }[];
    jobsByStatus: { status: string; count: number }[];
    activityLog: { id: string; user: string; action: string; time: string }[];
  };
  testimonials: Testimonial[];
  faqs: Faq[];
  pricing: {
    hero: { title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
    stats: { id: string; label: string; value: string }[];
    plans: {
      id: string;
      name: string;
      description: string;
      highlight: boolean;
      features: string[];
      cta: string;
    }[];
  };
};

const cache = new Map<DemoFile, unknown>();

export async function load<K extends DemoFile>(file: K): Promise<DemoMap[K]> {
  const cached = cache.get(file);
  if (cached) return cached as DemoMap[K];

  const res = await fetch(`/demo/${file}.json`);
  if (!res.ok) throw new Error(`Failed to load demo data: ${file}`);
  const data = (await res.json()) as DemoMap[K];
  cache.set(file, data);
  return data;
}

export async function loadAll(): Promise<Record<DemoFile, DemoMap[DemoFile]>> {
  const files = [
    "services",
    "vehicles",
    "customers",
    "employees",
    "jobs",
    "parts",
    "appointments",
    "estimates",
    "invoices",
    "messages",
    "ratings",
    "kpis",
    "reports",
    "testimonials",
    "faqs",
    "pricing",
  ] as const;

  const entries = await Promise.all(files.map(async (f) => [f, await load(f)] as const));
  return Object.fromEntries(entries) as Record<DemoFile, DemoMap[DemoFile]>;
}

export function clearCache(): void {
  cache.clear();
}

const demoData = { load, loadAll, clearCache };
export default demoData;
