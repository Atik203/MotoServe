import type {
  Appointment,
  ChatThread,
  Customer,
  Employee,
  Estimate,
  Invoice,
  JobCard,
  KpiCard,
  Part,
  Rating,
  Service,
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
  | "pricing"
  | "home";

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
  testimonials: {
    hero: { title: string; subtitle: string };
    video: { image: string; quote: string; author: string };
    stats: {
      rating: string;
      ratingLabel: string;
      ratingNote: string;
      efficiency: string;
      efficiencyLabel: string;
      efficiencyNote: string;
    };
    reviews: {
      id: string;
      name: string;
      role: string;
      rating: number;
      avatar?: string;
      initials?: string;
      review: string;
    }[];
    cta: { title: string; subtitle: string; button: string };
  };
  faqs: {
    categories: string[];
    faqs: { id: string; category: string; question: string; answer: string }[];
    cta: { title: string; subtitle: string };
  };
  home: { features: { id: string; title: string; description: string; icon: string }[] };
  pricing: {
    hero: { title: string; subtitle: string };
    cards: {
      id: string;
      title: string;
      subtitle: string;
      price: string;
      priceSuffix: string;
      duration: string;
      icon: string;
      badge: string | null;
      highlight: boolean;
      accent?: "brown";
      features: string[];
      cta: string;
      ctaVariant?: "outline" | "brown";
    }[];
    pricingFaq: { question: string; answer: string }[];
    cta: { title: string; subtitle: string; button: string };
  };
};

const cache = new Map<DemoFile, unknown>();

export async function load<K extends DemoFile>(file: K): Promise<DemoMap[K]> {
  const cached = cache.get(file);
  if (cached) return cached as DemoMap[K];

  const res = await fetch(`/demo/${file}.json`);
  if (!res.ok) throw new Error(`Failed to load demo data: ${file}`);
  const data = (await res.json()) as Record<string, unknown>;
  const unwrapped = (data[file] ?? data) as DemoMap[K];
  cache.set(file, unwrapped);
  return unwrapped;
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
    "home",
  ] as const;

  const entries = await Promise.all(files.map(async (f) => [f, await load(f)] as const));
  return Object.fromEntries(entries) as Record<DemoFile, DemoMap[DemoFile]>;
}

export function clearCache(): void {
  cache.clear();
}

const demoData = { load, loadAll, clearCache };
export default demoData;
