import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DemoRole = "admin" | "advisor" | "mechanic" | "owner";

interface AuthState {
  user: { id: string; name: string; email: string; role: DemoRole; avatar?: string } | null;
  demoRole: DemoRole | null;
}

const initialState: AuthState = {
  user: null,
  demoRole: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginDemo(state, action: PayloadAction<{ name: string; email: string; role: DemoRole; avatar?: string }>) {
      state.user = { id: "demo", ...action.payload };
      state.demoRole = action.payload.role;
    },
    logout(state) {
      state.user = null;
      state.demoRole = null;
    },
  },
});

export const { loginDemo, logout } = authSlice.actions;
export default authSlice.reducer;
