export interface CreateJobCardBody {
  vehicleId: string;
  customerId: string;
  issues: string;
  priority?: string;
  station?: string;
  mileage?: number;
  fuelLevel?: number;
  keysReceived?: boolean;
  accessories?: string;
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
