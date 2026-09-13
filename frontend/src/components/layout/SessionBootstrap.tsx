"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMe } from "@/store/slices/authSlice";
import { fetchThreads, receiveMessage } from "@/store/slices/chatSlice";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { roleHome, type Role } from "@/lib/nav";
import type { ChatMessage } from "@/types";

interface SocketMessage extends ChatMessage {
  threadId: string;
}

interface SessionBootstrapProps {
  requiredRole?: Role;
}

export function SessionBootstrap({ requiredRole }: SessionBootstrapProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (!user && !booted) {
      void dispatch(fetchMe()).finally(() => setBooted(true));
    }
  }, [dispatch, user, booted]);

  useEffect(() => {
    if (!booted) return;
    if (!user) {
      router.replace("/login");
    } else if (requiredRole && user.role !== requiredRole) {
      router.replace(roleHome(user.role));
    }
  }, [booted, user, requiredRole, router]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    void dispatch(fetchThreads());

    const socket = connectSocket();
    if (!socket) return;
    const onMessage = (msg: SocketMessage) => {
      dispatch(receiveMessage({ threadId: msg.threadId, message: msg }));
      void dispatch(fetchThreads());

      if (typeof window !== "undefined") {
        const isChatPage = window.location.pathname.endsWith("/chat");
        const isFromMe = msg.sender === user.role.toLowerCase();
        if (!isChatPage && !isFromMe) {
          const senderLabel = user.role === "owner" ? "Service Advisor" : "Vehicle Owner";
          toast.info(`New message from ${senderLabel}`, {
            description: msg.text,
            action: {
              label: "Open Chat",
              onClick: () => router.push(user.role === "owner" ? "/dashboard/chat" : `/${user.role}/chat`),
            },
          });
        }
      }
    };
    const onThread = () => {
      dispatch(fetchThreads());
    };
    const onThreadRead = () => {
      dispatch(fetchThreads());
    };
    socket.on("message:new", onMessage);
    socket.on("thread:new", onThread);
    socket.on("thread:read", onThreadRead);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("thread:new", onThread);
      socket.off("thread:read", onThreadRead);
    };
  }, [user, dispatch, router]);

  return null;
}
