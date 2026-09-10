import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { TaskCard, TaskNote, TaskStatus, PartUsed } from "@/types";

interface TasksState {
  items: TaskCard[];
  archivedItems: TaskCard[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TasksState = {
  items: [],
  archivedItems: [],
  status: "idle",
  error: null,
};

const STATUS_ORDER: TaskStatus[] = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

function applyStatus(task: TaskCard, status: TaskStatus): TaskCard {
  const targetIdx = STATUS_ORDER.indexOf(status);
  return {
    ...task,
    status,
    progress: task.progress.map((step) => {
      const idx = STATUS_ORDER.indexOf(step.step);
      return { ...step, done: idx <= targetIdx };
    }),
  };
}

export const fetchTasks = createAsyncThunk("tasks/fetchAll", async () => {
  return await api.get<TaskCard[]>("/tasks");
});

export const fetchTask = createAsyncThunk("tasks/fetchOne", async (id: string) => {
  return await api.get<TaskCard>(`/tasks/${id}`);
});

export const fetchArchivedTasks = createAsyncThunk("tasks/fetchArchived", async () => {
  return await api.get<TaskCard[]>("/tasks/archived");
});

export const createTaskCard = createAsyncThunk(
  "tasks/create",
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
    return await api.post<{ id: string }>("/tasks", data);
  },
);

export const assignMechanic = createAsyncThunk(
  "tasks/assign",
  async ({ id, mechanicId, station, notes }: { id: string; mechanicId: string; station?: string; notes?: string }) => {
    return await api.post<{ id: string }>(`/tasks/${id}/assign`, { mechanicId, station, notes });
  },
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async ({ id, status }: { id: string; status: TaskStatus }) => {
    const res = await api.patch<{ id: string; status: TaskStatus }>(`/tasks/${id}/status`, { status });
    return res;
  },
);

export const addTaskNote = createAsyncThunk(
  "tasks/addNote",
  async ({ id, author, text }: { id: string; author: string; text: string }) => {
    return await api.post<TaskNote>(`/tasks/${id}/notes`, { author, text });
  },
);

export const addPartUsed = createAsyncThunk(
  "tasks/addPart",
  async ({ id, part }: { id: string; part: { name: string; qty: number; unitPrice: number; supplier: string } }) => {
    return await api.post<PartUsed>(`/tasks/${id}/parts`, part);
  },
);

export const addTaskPhoto = createAsyncThunk(
  "tasks/addPhoto",
  async ({ id, key }: { id: string; key: string }) => {
    return await api.post<{ photos: string[] }>(`/tasks/${id}/photos`, { key });
  },
);

export const archiveTask = createAsyncThunk("tasks/archive", async (id: string) => {
  return await api.patch<{ id: string; ownerArchivedAt: string | null }>(`/tasks/${id}/archive`);
});

export const restoreTask = createAsyncThunk("tasks/restore", async (id: string) => {
  return await api.patch<{ id: string; ownerArchivedAt: string | null }>(`/tasks/${id}/restore`);
});

export const bulkArchiveTasks = createAsyncThunk("tasks/bulkArchive", async (ids: string[]) => {
  return await api.post<{ archived: number }>("/tasks/archive", { ids });
});

export const fetchJobs = fetchTasks;
export const fetchJob = fetchTask;
export const fetchArchivedJobs = fetchArchivedTasks;
export const createJobCard = createTaskCard;
export const updateJobStatus = updateTaskStatus;
export const addJobNote = addTaskNote;
export const addJobPhoto = addTaskPhoto;
export const archiveJob = archiveTask;
export const restoreJob = restoreTask;
export const bulkArchiveJobs = bulkArchiveTasks;

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    removePartUsed(state, action: PayloadAction<{ id: string; partId: string }>) {
      const task = state.items.find((j) => j.id === action.payload.id);
      if (task) task.partsUsed = task.partsUsed.filter((p) => p.id !== action.payload.partId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load tasks";
      })
      .addCase(fetchTask.fulfilled, (state, action) => {
        const i = state.items.findIndex((j) => j.id === action.payload.id);
        if (i === -1) state.items.unshift(action.payload);
        else state.items[i] = action.payload;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const task = state.items.find((j) => j.id === action.payload.id);
        if (task) {
          const i = state.items.indexOf(task);
          state.items[i] = applyStatus(task, action.payload.status);
        }
      })
      .addCase(addTaskNote.fulfilled, (state, action) => {
        const task = state.items.find((j) => j.id === action.meta.arg.id);
        if (task) task.notes.unshift(action.payload);
      })
      .addCase(addPartUsed.fulfilled, (state, action) => {
        const task = state.items.find((j) => j.id === action.meta.arg.id);
        if (task) task.partsUsed.push(action.payload);
      })
      .addCase(addTaskPhoto.fulfilled, (state, action) => {
        const task = state.items.find((j) => j.id === action.meta.arg.id);
        if (task) task.photos = action.payload.photos;
      })
      .addCase(fetchArchivedTasks.fulfilled, (state, action) => {
        state.archivedItems = action.payload;
      })
      .addCase(archiveTask.fulfilled, (state, action) => {
        const i = state.items.findIndex((j) => j.id === action.payload.id);
        if (i !== -1) {
          const [task] = state.items.splice(i, 1);
          state.archivedItems.unshift({ ...task, ownerArchivedAt: action.payload.ownerArchivedAt });
        }
      })
      .addCase(restoreTask.fulfilled, (state, action) => {
        const i = state.archivedItems.findIndex((j) => j.id === action.payload.id);
        if (i !== -1) {
          const [task] = state.archivedItems.splice(i, 1);
          state.items.unshift({ ...task, ownerArchivedAt: null });
        } else {
          const task = state.items.find((j) => j.id === action.payload.id);
          if (task) task.ownerArchivedAt = action.payload.ownerArchivedAt;
        }
      })
      .addCase(bulkArchiveTasks.fulfilled, (state, action) => {
        const archivedAt = new Date().toISOString();
        for (const id of action.meta.arg) {
          const i = state.items.findIndex((j) => j.id === id);
          if (i !== -1) {
            const [task] = state.items.splice(i, 1);
            state.archivedItems.unshift({ ...task, ownerArchivedAt: archivedAt });
          }
        }
      });
  },
});

export const { removePartUsed } = tasksSlice.actions;
export default tasksSlice.reducer;
