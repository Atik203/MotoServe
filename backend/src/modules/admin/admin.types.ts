export interface CreateServiceBody {
  name: string;
  category: "maintenance" | "repairs" | "inspections";
  basePrice: number;
  durationMins: number;
  description?: string;
  active?: boolean;
}

export interface VerifyCustomerBody {
  decision: "approved" | "rejected";
}

export interface EmployeeDocument {
  name: string;
  key: string;
  kind?: string;
  url?: string;
}

export interface CreateEmployeeBody {
  name: string;
  email: string;
  password: string;
  role: "advisor" | "mechanic";
  phone?: string;
  station?: string;
  specialization?: string;
  avatar?: string;
  nid?: string;
  gender?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  district?: string;
  zip?: string;
  country?: string;
  documents?: EmployeeDocument[];
  documentUrl?: string;
}

export interface UpdateEmployeeBody {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  station?: string;
  specialization?: string;
  avatar?: string | null;
  status?: "active" | "inactive";
  nid?: string;
  gender?: string;
  dateOfBirth?: string;
  street?: string;
  city?: string;
  district?: string;
  zip?: string;
  country?: string;
  documents?: EmployeeDocument[];
  documentUrl?: string;
}

export interface IncomeSummaryDto {
  totalRevenue: number;
  pendingRevenue: number;
  laborRevenue: number;
  partsRevenue: number;
  taxRevenue: number;
  paidCount: number;
  unpaidCount: number;
}

export interface ServiceHistoryItemDto {
  id: string;
  taskId: string;
  date: string;
  customer: string;
  vehicle: string;
  regNo: string;
  service: string;
  mechanic: string;
  status: string;
  total: number;
}

export interface ReportDto {
  totalRevenue: number;
  activeTasks: number;
  registeredCustomers: number;
  activeEmployees: number;
  revenueByMonth: { month: string; revenue: number }[];
  tasksByStatus: { status: string; count: number }[];
  workloadByMechanic: {
    mechanic: string;
    role: string;
    active: number;
    completed: number;
    avgHoursPerTask?: number;
  }[];
  serviceDistribution: { name: string; pct: number }[];
  activityLog: { id: string; user: string; action: string; time: Date }[];
  incomeSummary?: IncomeSummaryDto;
  serviceHistory?: ServiceHistoryItemDto[];
  performanceSummary?: {
    completedTasks: number;
    avgRating: number;
    totalRatingsCount: number;
  };
}

