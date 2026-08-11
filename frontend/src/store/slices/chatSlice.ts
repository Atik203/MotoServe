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

function pushMessage(state: ChatState, threadId: string, message: ChatMessage) {
  const thread = state.threads.find((t) => t.id === threadId);
  if (!thread) return;
  if (thread.messages.some((m) => m.id === message.id)) return;
  thread.messages.push(message);
  thread.lastMessageAt = message.time;
  thread.unread = thread.id === state.activeThreadId ? 0 : thread.unread + 1;
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveThread(state, action: PayloadAction<string | null>) {
      state.activeThreadId = action.payload;
      const thread = state.threads.find((t) => t.id === action.payload);
      if (thread) thread.unread = 0;
    },
    markThreadRead(state, action: PayloadAction<string>) {
      const thread = state.threads.find((t) => t.id === action.payload);
      if (thread) thread.unread = 0;
    },
    receiveMessage(state, action: PayloadAction<{ threadId: string; message: ChatMessage }>) {
      pushMessage(state, action.payload.threadId, action.payload.message);
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
        pushMessage(state, action.meta.arg.threadId, action.payload);
      });
  },
});

export const { setActiveThread, markThreadRead, receiveMessage } = chatSlice.actions;
export default chatSlice.reducer;
