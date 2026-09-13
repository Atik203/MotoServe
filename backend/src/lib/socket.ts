import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { COOKIE_NAME, verifyToken } from "./auth.js";
import { listThreads } from "../modules/shared/shared.service.js";
import { isAllowedOrigin } from "./cors.js";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: isAllowedOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const cookies = (socket.handshake.headers.cookie ?? "").split(";").map((c) => c.trim());
      const raw = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
      if (!raw) return next(new Error("Unauthorized"));
      socket.data.user = verifyToken(raw);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, role } = socket.data.user as { userId: string; role: string };
    socket.join(`user:${userId}`);
    const threads = await listThreads(role.toLowerCase(), userId);
    for (const thread of threads) socket.join(thread.id);

    socket.on("thread:join", (threadId: string) => {
      if (typeof threadId === "string" && threadId) {
        socket.join(threadId);
      }
    });

    socket.on("typing:start", (data: { threadId: string; senderName?: string }) => {
      if (data?.threadId) {
        socket.to(data.threadId).emit("typing:start", {
          threadId: data.threadId,
          senderName: data.senderName,
          userId,
        });
      }
    });

    socket.on("typing:stop", (data: { threadId: string }) => {
      if (data?.threadId) {
        socket.to(data.threadId).emit("typing:stop", {
          threadId: data.threadId,
          userId,
        });
      }
    });
  });

  return io;
}

export function getIo(): Server {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function safeEmit(rooms: string | string[], event: string, payload: unknown): void {
  try {
    if (!io) return;
    const list = Array.isArray(rooms) ? rooms : [rooms];
    let emitter: any = io;
    for (const r of list) {
      emitter = emitter.to(r);
    }
    emitter.emit(event, payload);
  } catch {
    // no-op — socket push is best-effort (unavailable on serverless)
  }
}
