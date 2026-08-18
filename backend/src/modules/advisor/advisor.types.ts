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
  appointmentId?: string;
  serviceIds?: string[];
  expectedDate?: string;
}

export interface CreateCustomerBody {
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

export interface AssignMechanicBody {
  mechanicId: string;
  station?: string;
}

export interface CreateEstimateBody {
  jobId: string;
  summary?: string;
  items: { description: string; category: "service" | "parts" | "labor"; amount: number }[];
}
