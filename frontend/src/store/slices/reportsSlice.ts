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

export const fetchReports = createAsyncThunk(
  "reports/fetchAll",
  async (params?: Record<string, string | undefined>) => {
    const queryParts = params
      ? Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== "" && v !== "all")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
      : [];
    const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    return await api.get<ReportsData>(`/reports${qs}`);
  }
);

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
