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
      });
  },
});

export default employeesSlice.reducer;
