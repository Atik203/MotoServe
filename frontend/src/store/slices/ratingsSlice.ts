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

export const rateTask = createAsyncThunk(
  "ratings/create",
  async ({
    taskId,
    score,
    review,
    serviceName,
  }: {
    taskId: string;
    score: number;
    review: string;
    serviceName: string;
  }) => {
    return await api.post<Rating>(`/tasks/${taskId}/rate`, { score, review, serviceName });
  },
);

export const deleteTaskRating = createAsyncThunk("ratings/delete", async (taskId: string) => {
  await api.delete(`/tasks/${taskId}/rate`);
  return { taskId };
});

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
      .addCase(rateTask.fulfilled, (state, action) => {
        const id = action.payload.taskId;
        const idx = state.items.findIndex((r) => r.taskId === id);
        if (idx !== -1) state.items[idx] = action.payload;
        else state.items.unshift(action.payload);
      })
      .addCase(deleteTaskRating.fulfilled, (state, action) => {
        const id = action.payload.taskId;
        state.items = state.items.filter((r) => r.taskId !== id);
      });
  },
});

export default ratingsSlice.reducer;

