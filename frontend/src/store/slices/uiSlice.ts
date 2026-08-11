import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeJobId: string | null;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeJobId: null,
};

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
});

export const { toggleSidebar, setMobileNavOpen, setActiveJobId } = uiSlice.actions;
export default uiSlice.reducer;
