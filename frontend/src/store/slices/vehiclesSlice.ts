import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Vehicle } from "@/types";

interface VehiclesState {
  items: Vehicle[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  selectedVehicleId: string | null;
}

const initialState: VehiclesState = {
  items: [],
  status: "idle",
  error: null,
  selectedVehicleId: null,
};

export const fetchVehicles = createAsyncThunk("vehicles/fetchAll", async () => {
  return await api.get<Vehicle[]>("/vehicles");
});

export const addVehicle = createAsyncThunk(
  "vehicles/create",
  async (data: Omit<Vehicle, "id" | "ownerId"> & { ownerId?: string }) => {
    return await api.post<Vehicle>("/vehicles", data);
  },
);

export const updateVehicle = createAsyncThunk(
  "vehicles/update",
  async ({ id, data }: { id: string; data: Partial<Omit<Vehicle, "id" | "ownerId">> }) => {
    return await api.patch<Vehicle>(`/vehicles/${id}`, data);
  },
);

export const deleteVehicle = createAsyncThunk("vehicles/delete", async (id: string) => {
  await api.delete<{ ok: boolean }>(`/vehicles/${id}`);
  return id;
});

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    selectVehicle(state, action: PayloadAction<string | null>) {
      state.selectedVehicleId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load vehicles";
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const i = state.items.findIndex((v) => v.id === action.payload.id);
        if (i !== -1) state.items[i] = action.payload;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.items = state.items.filter((v) => v.id !== action.payload);
        if (state.selectedVehicleId === action.payload) state.selectedVehicleId = null;
      });
  },
});

export const { selectVehicle } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
