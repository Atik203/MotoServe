import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
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
  return await api.get<Appointment[]>("/appointments");
});

export const addAppointment = createAsyncThunk(
  "appointments/create",
  async (data: { vehicleId: string; serviceIds: string[]; date: string; time: string; notes?: string }) => {
    return await api.post<Appointment>("/appointments", data);
  },
);

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
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
      })
      .addCase(addAppointment.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const { updateAppointmentStatus } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
