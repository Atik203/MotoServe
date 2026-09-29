import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { PartRequest } from "@/types";

interface PartRequestsState {
  items: PartRequest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PartRequestsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchPartRequests = createAsyncThunk("partRequests/fetch", async () => {
  const data = await api.get<PartRequest[]>("/parts/requests");
  return data.map((r) => ({ ...r, status: r.status.toLowerCase() as PartRequest["status"] }));
});

export const submitPartRequest = createAsyncThunk(
  "partRequests/submit",
  async (body: { partName: string; qty: number; taskCardId?: string; partId?: string; notes?: string }) => {
    const data = await api.post<PartRequest>("/parts/request", body);
    return { ...data, status: data.status.toLowerCase() as PartRequest["status"] };
  },
);

export const reviewPartRequest = createAsyncThunk(
  "partRequests/review",
  async ({ id, status, reviewNote }: { id: string; status: "approved" | "rejected" | "fulfilled"; reviewNote?: string }) => {
    const data = await api.patch<PartRequest>(`/parts/requests/${id}`, { status, reviewNote });
    return { ...data, status: data.status.toLowerCase() as PartRequest["status"] };
  },
);

const partRequestsSlice = createSlice({
  name: "partRequests",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartRequests.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPartRequests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchPartRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load";
      })
      .addCase(submitPartRequest.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(reviewPartRequest.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      });
  },
});

export default partRequestsSlice.reducer;
