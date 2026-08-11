import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import demoData from "@/lib/demo-data";
import type { KpiCard } from "@/types";

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeJobId: string | null;
  kpis: KpiCard[];
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeJobId: null,
  kpis: [],
};

export const fetchKpis = createAsyncThunk("ui/fetchKpis", async (role: string) => {
  const kpis = await demoData.load("kpis");
  return kpis[role] ?? [];
});

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    setActiveJobId(state, action: PayloadAction<string | null>) {
      state.activeJobId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchKpis.fulfilled, (state, action) => {
      state.kpis = action.payload;
    });
  },
});

export const { toggleSidebar, setMobileNavOpen, setActiveJobId } = uiSlice.actions;
export default uiSlice.reducer;
