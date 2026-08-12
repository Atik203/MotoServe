import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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

export const updateAppointmentStatus = createAsyncThunk(
  "appointments/updateStatus",
  async ({ id, status }: { id: string; status: "confirmed" | "cancelled" }) => {
    return await api.patch<Appointment>(`/appointments/${id}`, { status });
  },
);

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {},
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
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        const appt = state.items.find((a) => a.id === action.payload.id);
        if (appt) appt.status = action.payload.status;
      });
  },
});

export default appointmentsSlice.reducer;
