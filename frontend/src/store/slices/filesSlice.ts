import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/lib/api";

interface FilesState {
  urls: Record<string, string>;
}

const initialState: FilesState = {
  urls: {},
};

export const fetchFileUrl = createAsyncThunk("files/url", async (key: string) => {
  const res = await api.post<{ url: string }>("/upload/presign-get", { key });
  return { key, url: res.url };
});

const filesSlice = createSlice({
  name: "files",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchFileUrl.fulfilled, (state, action) => {
      state.urls[action.payload.key] = action.payload.url;
    });
  },
});

export default filesSlice.reducer;
