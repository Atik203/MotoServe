import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Station } from "@/types";

interface StationsState {
  items: Station[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: StationsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchStations = createAsyncThunk("stations/fetch", async () => {
  return api.get<Station[]>("/stations");
});

export const addStation = createAsyncThunk("stations/add", async (name: string) => {
  return api.post<Station>("/stations", { name });
});

export const editStation = createAsyncThunk(
  "stations/edit",
  async ({ id, name }: { id: string; name: string }) => {
    return api.patch<Station>(`/stations/${id}`, { name });
  },
);

export const removeStation = createAsyncThunk("stations/remove", async (id: string) => {
  await api.delete(`/stations/${id}`);
  return id;
});

const stationsSlice = createSlice({
  name: "stations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => { state.status = "loading"; })
      .addCase(fetchStations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchStations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed";
      })
      .addCase(addStation.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(editStation.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(removeStation.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      });
  },
});

export default stationsSlice.reducer;
