import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import type { UserRole } from "@/types";

export type DemoRole = UserRole;

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  avatar?: string | null;
  phone?: string | null;
  station?: string | null;
  specialization?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

export const loginUser = createAsyncThunk("auth/login", async ({ email, password }: { email: string; password: string }) => {
  return await api.post<AuthUser>("/auth/login", { email, password });
});

export const registerUser = createAsyncThunk(
  "auth/register",
  async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    dateOfBirth?: string;
    gender?: string;
    nid?: string;
    drivingLicense?: string;
    occupation?: string;
    street?: string;
    city?: string;
    district?: string;
    zip?: string;
    country?: string;
  }) => {
    return await api.post<{ id: string; name: string; email: string; role: string; status: string }>(
      "/auth/register",
      data,
    );
  },
);

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (email: string) => {
  return await api.post<{ ok: boolean; resetToken?: string }>("/auth/forgot-password", { email });
});

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }: { token: string; password: string }) => {
    return await api.post<{ ok: boolean }>("/auth/reset-password", { token, password });
  },
);

export const fetchMe = createAsyncThunk("auth/me", async () => {
  return await api.get<AuthUser>("/auth/me");
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Login failed";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.error.message ?? "Registration failed";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = "idle";
        state.error = null;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
