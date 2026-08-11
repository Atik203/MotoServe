import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import demoData from "@/lib/demo-data";
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
  return await demoData.load("services");
});

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    addService(state, action: PayloadAction<Service>) {
      state.items.unshift(action.payload);
    },
    updateService(state, action: PayloadAction<Service>) {
      const i = state.items.findIndex((s) => s.id === action.payload.id);
      if (i !== -1) state.items[i] = action.payload;
    },
    toggleServiceActive(state, action: PayloadAction<string>) {
      const s = state.items.find((item) => item.id === action.payload);
      if (s) s.active = !s.active;
    },
  },
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
      });
  },
});

export const { addService, updateService, toggleServiceActive } = servicesSlice.actions;
export default servicesSlice.reducer;
