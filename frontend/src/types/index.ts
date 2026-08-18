export type ServiceCategory = "maintenance" | "repairs" | "inspections";

export type UserRole = "admin" | "advisor" | "mechanic" | "owner";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number;
  durationMins: number;
  description: string;
  active: boolean;
  marketing?: {
    name: string;
    from: string;
    durationLabel: string;
    tags: string[];
    tagStyle?: "info" | "warning";
    image: string;
    blurb: string;
  };
}

export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  regNo: string;
  fuelType: FuelType;
  mileage: number;
  image: string;
  vin?: string | null;
  color?: string | null;
  transmission?: string | null;
  photos?: string[] | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  nid: string;
  drivingLicense: string;
  status: "pending" | "approved" | "rejected";
  verifiedAt: string | null;
  occupation?: string | null;
  street?: string | null;
  city?: string | null;
  district?: string | null;
  zip?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  avatar?: string | null;
  documentUrl?: string | null;
  documents?: { name: string; key: string; kind: "nid" | "license" }[] | null;
  joinedAt?: string;
}

export type EmployeeRole = "advisor" | "mechanic";

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  email: string;
  phone: string;
  avatar: string;
  station?: string;
  specialization?: string;
  status: "active" | "inactive";
  joinedAt: string;
  activeJobs?: number;
  completedJobs?: number;
}

export type JobStatus = "received" | "inspecting" | "repairing" | "testing" | "ready" | "completed";
export type JobPriority = "low" | "medium" | "high";

export interface JobServiceLine {
  id: string;
  name: string;
  price: number;
}

export interface JobProgressStep {
  step: JobStatus;
  label: string;
  timestamp: string | null;
  done: boolean;
}

export interface JobNote {
  id: string;
  author: string;
  time: string;
  text: string;
}

export interface PartUsed {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  supplier: string;
  subtotal: number;
}

export interface JobCard {
  id: string;
  vehicleId: string;
  customerId: string;
  advisorId: string;
  mechanicId: string | null;
  station: string | null;
  priority: JobPriority;
  status: JobStatus;
  services: JobServiceLine[];
  issues: string;
  progress: JobProgressStep[];
  notes: JobNote[];
  partsUsed: PartUsed[];
  photos: string[];
  vehicle?: Vehicle;
  customer?: { id: string; name: string };
  advisor?: { id: string; name: string };
  mechanic?: { id: string; name: string };
  appointmentId?: string | null;
  appointment?: Appointment | null;
  expectedDate?: string | null;
  mileage?: number | null;
  fuelLevel?: number | null;
  keysReceived?: boolean | null;
  accessories?: string | null;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  supplier: string;
  stock: number;
}

export interface Appointment {
  id: string;
  ownerId: string;
  vehicleId: string;
  serviceIds: string[];
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  notes: string;
  createdAt: string;
  owner?: { id: string; name: string; phone?: string; email?: string; avatar?: string };
  vehicle?: Vehicle;
  jobCard?: JobCard | null;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  nid?: string;
  occupation?: string;
  street?: string;
  city?: string;
  district?: string;
  zip?: string;
  country?: string;
}

export interface EstimateItem {
  id: string;
  description: string;
  category: "service" | "parts" | "labor";
  amount: number;
}

export interface Estimate {
  id: string;
  jobId: string;
  customerId: string;
  advisorId: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  summary: string;
  items: EstimateItem[];
  total: number;
  jobCard?: { id: string; vehicle?: Vehicle };
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: "service" | "parts";
  amount: number;
}

export interface Invoice {
  id: string;
  jobId: string;
  customerId: string;
  vehicleId: string;
  issuedAt: string;
  status: "paid" | "unpaid";
  items: InvoiceItem[];
  laborTotal: number;
  partsTotal: number;
  subtotal: number;
  tax: number;
  total: number;
  payment: { method: "card" | "cash"; paidAt: string; last4: string | null } | null;
}

export interface ChatMessage {
  id: string;
  sender: "advisor" | "owner";
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  ownerId: string;
  advisorId: string;
  subject: string;
  unread: number;
  lastMessageAt: string;
  owner?: { id: string; name: string; avatar: string | null };
  advisor?: { id: string; name: string; avatar: string | null };
  messages: ChatMessage[];
}

export interface Rating {
  id: string;
  jobId: string;
  customerId: string;
  serviceName: string;
  score: number;
  review: string;
  date: string;
}

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  icon: string;
}

export interface ReportsData {
  totalRevenue: number;
  activeJobs: number;
  registeredCustomers: number;
  activeEmployees: number;
  revenueByMonth: { month: string; revenue: number }[];
  jobsByStatus: { status: string; count: number }[];
  workloadByMechanic: {
    mechanic: string;
    role: string;
    active: number;
    completed: number;
    avgHoursPerJob?: number;
  }[];
  serviceDistribution: { name: string; pct: number }[];
  activityLog: { id: string; user: string; action: string; time: string }[];
}

export interface Testimonial {
  id: string;
  name: string;
  vehicle: string;
  rating: number;
  review: string;
  date: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}
