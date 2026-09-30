import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Employee } from "@/types";

interface EmployeesState {
  items: Employee[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EmployeesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchEmployees = createAsyncThunk("employees/fetchAll", async () => {
  return await api.get<Employee[]>("/employees");
});

export const createEmployee = createAsyncThunk(
  "employees/create",
  async (data: {
    name: string;
    email: string;
    password: string;
    role: "advisor" | "mechanic";
    phone?: string;
    station?: string;
    specialization?: string;
    avatar?: string;
    skills?: string[];
    nid?: string;
    gender?: string;
    dateOfBirth?: string;
    street?: string;
    city?: string;
    district?: string;
    zip?: string;
    country?: string;
    documents?: { name: string; key: string; kind?: string; url?: string }[];
    documentUrl?: string;
  }) => {
    return await api.post<Employee>("/employees", data);
  },
);

export const updateEmployee = createAsyncThunk(
  "employees/update",
  async ({ id, data }: { id: string; data: Partial<Omit<Employee, "id" | "role">> & { password?: string } }) => {
    return await api.patch<Employee>(`/employees/${id}`, data);
  },
);

export interface DeletionImpact {
  role: string;
  tasks: number;
  chats: number;
  partRequests: number;
  invoices: number;
}

export interface DeleteEmployeeResult {
  ok: boolean;
  name: string;
  role: string;
  unassignedTasks: number;
  reassignedTasks: number;
  reassignedChats: number;
  removedPartRequests: number;
  replacementName: string | null;
  filesDeleted: number;
}

export const fetchDeletionImpact = createAsyncThunk("employees/deletionImpact", async (id: string) => {
  return await api.get<DeletionImpact>(`/employees/${id}/deletion-impact`);
});

export const deleteEmployee = createAsyncThunk(
  "employees/delete",
  async ({ id, replacementAdvisorId }: { id: string; replacementAdvisorId?: string }) => {
    const qs = replacementAdvisorId ? `?replacementAdvisorId=${encodeURIComponent(replacementAdvisorId)}` : "";
    const result = await api.delete<DeleteEmployeeResult>(`/employees/${id}${qs}`);
    return { id, result };
  },
);

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load employees";
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload.id);
      });
  },
});

export default employeesSlice.reducer;
