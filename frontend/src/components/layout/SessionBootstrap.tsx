"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMe } from "@/store/slices/authSlice";
import { fetchThreads, receiveMessage } from "@/store/slices/chatSlice";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { ChatMessage } from "@/types";

interface SocketMessage extends ChatMessage {
  threadId: string;
}

export function SessionBootstrap() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }
    const socket = connectSocket();
    const onMessage = (msg: SocketMessage) => {
      dispatch(receiveMessage({ threadId: msg.threadId, message: msg }));
    };
    const onThread = () => {
      dispatch(fetchThreads());
    };
    socket.on("message:new", onMessage);
    socket.on("thread:new", onThread);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("thread:new", onThread);
    };
  }, [user, dispatch]);

  return null;
}
