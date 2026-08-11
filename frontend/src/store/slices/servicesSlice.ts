import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Service } from "@/types";

interface ServicesState {
  items: Service[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ServicesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchServices = createAsyncThunk("services/fetchAll", async () => {
  return await api.get<Service[]>("/services");
});

export const createService = createAsyncThunk("services/create", async (data: Omit<Service, "id">) => {
  return await api.post<Service>("/services", data);
});

export const updateService = createAsyncThunk(
  "services/update",
  async ({ id, data }: { id: string; data: Partial<Omit<Service, "id">> }) => {
    return await api.patch<Service>(`/services/${id}`, data);
  },
);

export const deleteService = createAsyncThunk("services/delete", async (id: string) => {
  await api.delete<{ ok: true }>(`/services/${id}`);
  return id;
});

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load services";
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const i = state.items.findIndex((s) => s.id === action.payload.id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      });
  },
});

export default servicesSlice.reducer;
