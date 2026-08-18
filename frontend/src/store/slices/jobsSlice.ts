import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
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

const STATUS_ORDER = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

function applyStatus(job: JobCard, status: JobStatus): JobCard {
  const targetIdx = STATUS_ORDER.indexOf(status);
  return {
    ...job,
    status,
    progress: job.progress.map((step) => {
      const idx = STATUS_ORDER.indexOf(step.step);
      return { ...step, done: idx <= targetIdx };
    }),
  };
}

export const fetchJobs = createAsyncThunk("jobs/fetchAll", async () => {
  return await api.get<JobCard[]>("/jobs");
});

export const fetchJob = createAsyncThunk("jobs/fetchOne", async (id: string) => {
  return await api.get<JobCard>(`/jobs/${id}`);
});

export const createJobCard = createAsyncThunk(
  "jobs/create",
  async (data: {
    vehicleId: string;
    customerId: string;
    issues: string;
    priority?: string;
    station?: string;
    mileage?: number;
    fuelLevel?: number;
    keysReceived?: boolean;
    accessories?: string;
    appointmentId?: string;
    serviceIds?: string[];
    expectedDate?: string;
  }) => {
    return await api.post<{ id: string }>("/jobs", data);
  },
);

export const assignMechanic = createAsyncThunk(
  "jobs/assign",
  async ({ id, mechanicId, station, notes }: { id: string; mechanicId: string; station?: string; notes?: string }) => {
    return await api.post<{ id: string }>(`/jobs/${id}/assign`, { mechanicId, station, notes });
  },
);

export const updateJobStatus = createAsyncThunk(
  "jobs/updateStatus",
  async ({ id, status }: { id: string; status: JobStatus }) => {
    const res = await api.patch<{ id: string; status: JobStatus }>(`/jobs/${id}/status`, { status });
    return res;
  },
);

export const addJobNote = createAsyncThunk(
  "jobs/addNote",
  async ({ id, author, text }: { id: string; author: string; text: string }) => {
    return await api.post<JobNote>(`/jobs/${id}/notes`, { author, text });
  },
);

export const addPartUsed = createAsyncThunk(
  "jobs/addPart",
  async ({ id, part }: { id: string; part: { name: string; qty: number; unitPrice: number; supplier: string } }) => {
    return await api.post<PartUsed>(`/jobs/${id}/parts`, part);
  },
);

export const addJobPhoto = createAsyncThunk(
  "jobs/addPhoto",
  async ({ id, key }: { id: string; key: string }) => {
    return await api.post<{ photos: string[] }>(`/jobs/${id}/photos`, { key });
  },
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
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
      })
      .addCase(fetchJob.fulfilled, (state, action) => {
        const i = state.items.findIndex((j) => j.id === action.payload.id);
        if (i === -1) state.items.unshift(action.payload);
        else state.items[i] = action.payload;
      })
      .addCase(updateJobStatus.fulfilled, (state, action) => {
        const job = state.items.find((j) => j.id === action.payload.id);
        if (job) {
          const i = state.items.indexOf(job);
          state.items[i] = applyStatus(job, action.payload.status);
        }
      })
      .addCase(addJobNote.fulfilled, (state, action) => {
        const job = state.items.find((j) => j.id === action.meta.arg.id);
        if (job) job.notes.unshift(action.payload);
      })
      .addCase(addPartUsed.fulfilled, (state, action) => {
        const job = state.items.find((j) => j.id === action.meta.arg.id);
        if (job) job.partsUsed.push(action.payload);
      })
      .addCase(addJobPhoto.fulfilled, (state, action) => {
        const job = state.items.find((j) => j.id === action.meta.arg.id);
        if (job) job.photos = action.payload.photos;
      });
  },
});

export const { removePartUsed } = jobsSlice.actions;
export default jobsSlice.reducer;
