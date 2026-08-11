import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import demoData from "@/lib/demo-data";
import type { JobCard, JobNote, JobStatus, PartUsed } from "@/types";

interface JobsState {
  items: JobCard[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: JobsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchJobs = createAsyncThunk("jobs/fetchAll", async () => {
  return await demoData.load("jobs");
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    updateJobStatus(state, action: PayloadAction<{ id: string; status: JobStatus }>) {
      const job = state.items.find((j) => j.id === action.payload.id);
      if (!job) return;
      job.status = action.payload.status;
      job.progress.forEach((step) => {
        const idx = job.progress.indexOf(step);
        const targetIdx = ["received", "inspecting", "repairing", "testing", "completed"].indexOf(
          action.payload.status,
        );
        step.done = idx <= targetIdx;
        if (idx === targetIdx) step.done = true;
      });
    },
    addJobNote(state, action: PayloadAction<{ id: string; note: JobNote }>) {
      const job = state.items.find((j) => j.id === action.payload.id);
      if (job) job.notes.unshift(action.payload.note);
    },
    addPartUsed(state, action: PayloadAction<{ id: string; part: PartUsed }>) {
      const job = state.items.find((j) => j.id === action.payload.id);
      if (job) job.partsUsed.push(action.payload.part);
    },
    removePartUsed(state, action: PayloadAction<{ id: string; partId: string }>) {
      const job = state.items.find((j) => j.id === action.payload.id);
      if (job) job.partsUsed = job.partsUsed.filter((p) => p.id !== action.payload.partId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load jobs";
      });
  },
});

export const { updateJobStatus, addJobNote, addPartUsed, removePartUsed } = jobsSlice.actions;
export default jobsSlice.reducer;
