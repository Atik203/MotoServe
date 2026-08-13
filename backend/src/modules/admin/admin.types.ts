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

export interface CreateEmployeeBody {
  name: string;
  email: string;
  password: string;
  role: "advisor" | "mechanic";
  phone?: string;
  station?: string;
  specialization?: string;
  avatar?: string;
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
}

export interface ReportDto {
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
  activityLog: { id: string; user: string; action: string; time: Date }[];
}
