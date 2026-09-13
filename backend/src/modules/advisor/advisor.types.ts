export interface CreateTaskCardBody {
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
  mechanicId?: string;
  mechanicIds?: string[];
  assignmentNotes?: string;
  notes?: string;
}

export type CreateTaskBody = CreateTaskCardBody;

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
  mechanicId?: string;
  mechanicIds?: string[];
  station?: string;
  notes?: string;
}

export interface CreateEstimateBody {
  taskId: string;
  summary?: string;
  internalNotes?: string;
  items: { description: string; category: "service" | "parts" | "labor"; amount: number }[];
}

