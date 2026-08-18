import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Estimate } from "@/types";

interface EstimatesState {
  items: Estimate[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: EstimatesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchEstimates = createAsyncThunk("estimates/fetchAll", async () => {
  return await api.get<Estimate[]>("/estimates");
});

export const createEstimate = createAsyncThunk(
  "estimates/create",
  async (data: {
    jobId: string;
    summary?: string;
    internalNotes?: string;
    items: { description: string; category: "service" | "parts" | "labor"; amount: number }[];
  }) => {
    return await api.post<Estimate>("/estimates", data);
  },
);

export const decideEstimate = createAsyncThunk(
  "estimates/decide",
  async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) => {
    return await api.patch<{ id: string; status: "approved" | "rejected" | "pending" }>(
      `/estimates/${id}/decide`,
      { decision },
    );
  },
);

const estimatesSlice = createSlice({
  name: "estimates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEstimates.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchEstimates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchEstimates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load estimates";
      })
      .addCase(createEstimate.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(decideEstimate.fulfilled, (state, action) => {
        const estimate = state.items.find((e) => e.id === action.payload.id);
        if (estimate) estimate.status = action.payload.status;
      });
  },
});

export default estimatesSlice.reducer;
