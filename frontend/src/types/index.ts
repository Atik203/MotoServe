export type ServiceCategory = "maintenance" | "repairs" | "inspections";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  basePrice: number;
  durationMins: number;
  description: string;
  active: boolean;
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
