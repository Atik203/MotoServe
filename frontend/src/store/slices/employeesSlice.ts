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

export const deleteEmployee = createAsyncThunk("employees/delete", async (id: string) => {
  return await api.delete<{ ok: boolean }>(`/employees/${id}`);
});

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
        const meta = action.meta.arg as string;
        const employee = state.items.find((e) => e.id === meta);
        if (employee) employee.status = "inactive";
      });
  },
});

export default employeesSlice.reducer;
