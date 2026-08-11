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
      });
  },
});

export const { selectVehicle } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
