export interface UpdateJobStatusBody {
  status: "received" | "inspecting" | "repairing" | "testing" | "ready" | "completed";
}

export interface AddJobNoteBody {
  author: string;
  text: string;
  time?: string;
}

export interface AddPartUsedBody {
  name: string;
  qty: number;
  unitPrice: number;
  supplier: string;
}
