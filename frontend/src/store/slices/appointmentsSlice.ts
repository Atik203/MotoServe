import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import demoData from "@/lib/demo-data";
import type { Appointment } from "@/types";

interface AppointmentsState {
  items: Appointment[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AppointmentsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchAppointments = createAsyncThunk("appointments/fetchAll", async () => {
  return await demoData.load("appointments");
});

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    addAppointment(state, action: PayloadAction<Appointment>) {
      state.items.unshift(action.payload);
    },
    updateAppointmentStatus(
      state,
      action: PayloadAction<{ id: string; status: Appointment["status"] }>,
    ) {
      const appt = state.items.find((a) => a.id === action.payload.id);
      if (appt) appt.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load appointments";
      });
  },
});

export const { addAppointment, updateAppointmentStatus } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
