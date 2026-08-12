import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { Part } from "@/types";

interface PartsState {
  items: Part[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PartsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchParts = createAsyncThunk("parts/fetchAll", async () => {
  return await api.get<Part[]>("/parts");
});

const partsSlice = createSlice({
  name: "parts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchParts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchParts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchParts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load parts";
      });
  },
});

export default partsSlice.reducer;
