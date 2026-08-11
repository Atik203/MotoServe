import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { ReportsData } from "@/types";

interface ReportsState {
  data: ReportsData | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ReportsState = {
  data: null,
  status: "idle",
  error: null,
};

export const fetchReports = createAsyncThunk("reports/fetchAll", async () => {
  return await api.get<ReportsData>("/reports");
});

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load reports";
      });
  },
});

export default reportsSlice.reducer;
