import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
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
  return await api.get<ChatThread[]>("/chat/threads");
});

export const sendMessage = createAsyncThunk(
  "chat/send",
  async ({ threadId, text }: { threadId: string; text: string }) => {
    return await api.post<ChatMessage>("/chat/messages", { threadId, text });
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveThread(state, action: PayloadAction<string | null>) {
      state.activeThreadId = action.payload;
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
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const thread = state.threads.find((t) => t.id === action.meta.arg.threadId);
        if (!thread) return;
        thread.messages.push(action.payload);
        thread.lastMessageAt = action.payload.time;
        thread.unread = 0;
      });
  },
});

export const { setActiveThread, markThreadRead } = chatSlice.actions;
export default chatSlice.reducer;
