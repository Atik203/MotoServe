export interface UpdateTaskStatusBody {
  status: "received" | "inspecting" | "repairing" | "testing" | "ready" | "completed";
}

export type AddTaskNoteBody = { author: string; text: string; time?: string };
export type AddPartUsedBody = { name: string; qty: number; unitPrice: number; supplier: string };
export type CreatePartRequestBody = {
  partName: string;
  qty: number;
  taskCardId?: string;
  partId?: string;
  notes?: string;
};
