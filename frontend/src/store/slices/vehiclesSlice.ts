import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import demoData from "@/lib/demo-data";
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
  return await demoData.load("vehicles");
});

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    addVehicle(state, action: PayloadAction<Vehicle>) {
      state.items.push(action.payload);
    },
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
      });
  },
});

export const { addVehicle, selectVehicle } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
