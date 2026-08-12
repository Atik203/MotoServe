export interface CreateJobCardBody {
  vehicleId: string;
  customerId: string;
  advisorId: string;
  issues: string;
  priority?: "low" | "medium" | "high";
  station?: string;
}

export interface AssignMechanicBody {
  mechanicId: string;
  station?: string;
}

export interface CreateEstimateBody {
  jobId: string;
  summary?: string;
  items: { description: string; category: "service" | "parts" | "labor"; amount: number }[];
}
