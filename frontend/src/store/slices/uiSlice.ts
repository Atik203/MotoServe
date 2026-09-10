import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeTaskId: string | null;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeTaskId: null,
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
    setActiveTaskId(state, action: PayloadAction<string | null>) {
      state.activeTaskId = action.payload;
    },
  },
});

export const { toggleSidebar, setMobileNavOpen, setActiveTaskId } = uiSlice.actions;
export default uiSlice.reducer;
