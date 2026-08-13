import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Rating } from "@/types";

interface RatingsState {
  items: Rating[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RatingsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchRatings = createAsyncThunk("ratings/fetchAll", async () => {
  return await api.get<Rating[]>("/ratings");
});

export const rateJob = createAsyncThunk(
  "ratings/create",
  async ({ jobId, score, review, serviceName }: { jobId: string; score: number; review: string; serviceName: string }) => {
    return await api.post<Rating>(`/jobs/${jobId}/rate`, { score, review, serviceName });
  },
);

const ratingsSlice = createSlice({
  name: "ratings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRatings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchRatings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchRatings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load ratings";
      })
      .addCase(rateJob.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.jobId === action.payload.jobId);
        if (idx !== -1) state.items[idx] = action.payload;
        else state.items.unshift(action.payload);
      });
  },
});

export default ratingsSlice.reducer;
