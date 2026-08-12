export interface CreateVehicleBody {
  make: string;
  model: string;
  year: number;
  regNo: string;
  fuelType: "gasoline" | "diesel" | "hybrid" | "electric";
  mileage: number;
  vin?: string;
  color?: string;
  transmission?: string;
  image?: string;
}

export interface BookAppointmentBody {
  vehicleId: string;
  serviceIds: string[];
  date: string;
  time: string;
  notes?: string;
}

export interface DecideEstimateBody {
  decision: "approved" | "rejected";
}

export interface PayInvoiceBody {
  method: "card" | "cash" | "mobile";
}

export interface RateJobBody {
  score: number;
  review: string;
  serviceName: string;
}

export interface CreateThreadBody {
  advisorId: string;
  subject?: string;
  text: string;
}
