import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import demoData from "@/lib/demo-data";
import type { ChatMessage, ChatThread } from "@/types";

interface ChatState {
  threads: ChatThread[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  activeThreadId: string | null;
}

const initialState: ChatState = {
  threads: [],
  status: "idle",
  error: null,
  activeThreadId: null,
};

export const fetchThreads = createAsyncThunk("chat/fetchAll", async () => {
  return await demoData.load("messages");
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveThread(state, action: PayloadAction<string | null>) {
      state.activeThreadId = action.payload;
    },
    sendMessage(state, action: PayloadAction<{ threadId: string; message: ChatMessage }>) {
      const thread = state.threads.find((t) => t.id === action.payload.threadId);
      if (!thread) return;
      thread.messages.push(action.payload.message);
      thread.lastMessageAt = action.payload.message.time;
      thread.unread = 0;
    },
    markThreadRead(state, action: PayloadAction<string>) {
      const thread = state.threads.find((t) => t.id === action.payload);
      if (thread) thread.unread = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreads.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.threads = action.payload;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load chat threads";
      });
  },
});

export const { setActiveThread, sendMessage, markThreadRead } = chatSlice.actions;
export default chatSlice.reducer;
