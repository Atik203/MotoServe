"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCheck,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createThread,
  fetchThreads,
  markThreadRead,
  sendMessage,
  setActiveThread,
} from "@/store/slices/chatSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { getSocket } from "@/lib/socket";
import { useFileUrl } from "@/hooks/useFileUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChatThread } from "@/types";

interface CommunicationCenterProps {
  role: "owner" | "advisor";
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const formatDay = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({
  name,
  src,
  showOnline = false,
  size = "md",
}: {
  name: string;
  src?: string | null;
  showOnline?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const url = useFileUrl(src);
  const sizeClasses = {
    sm: "size-8 text-xs",
    md: "size-11 text-sm",
    lg: "size-12 text-base",
  }[size];

  return (
    <span className="relative inline-block shrink-0">
      {url ? (
        <span className={cn("relative block overflow-hidden rounded-full ring-1 ring-border/50", sizeClasses)}>
          <Image src={url} alt={name} fill className="object-cover" />
        </span>
      ) : (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-primary-soft font-bold text-primary ring-1 ring-primary/20",
            sizeClasses,
          )}
        >
          {getInitials(name)}
        </span>
      )}
      {showOnline && (
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </span>
  );
}

const OWNER_QUICK_REPLIES = [
  "When will my vehicle be ready?",
  "Can I get an update on the inspection?",
  "Approved, please proceed with the service.",
  "Please send the updated estimate.",
];

const ADVISOR_QUICK_REPLIES = [
  "Your vehicle is currently in inspection.",
  "The estimate is ready for your review.",
  "Good news! Your vehicle is ready for pickup.",
  "Please give us a quick call when you have a moment.",
];

export function CommunicationCenter({ role }: CommunicationCenterProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const threads = useAppSelector((s) => s.chat.threads);
  const chatStatus = useAppSelector((s) => s.chat.status);
  const activeThreadId = useAppSelector((s) => s.chat.activeThreadId);
  const employees = useAppSelector((s) => s.employees.items);
  const customers = useAppSelector((s) => s.customers.items);

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const [text, setText] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [advisorId, setAdvisorId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("Vehicle service inquiry");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(() => getSocket()?.connected ?? false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickReplies = role === "owner" ? OWNER_QUICK_REPLIES : ADVISOR_QUICK_REPLIES;

  useEffect(() => {
    dispatch(fetchThreads());
    if (role === "owner") {
      dispatch(fetchEmployees());
    } else {
      dispatch(fetchCustomers());
    }
  }, [dispatch, role]);

  useEffect(() => {
    const timer = setInterval(() => {
      void dispatch(fetchThreads()).catch(() => {});
    }, 12000);
    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      dispatch(setActiveThread(threads[0].id));
    }
  }, [activeThreadId, threads, dispatch]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const threadsLoading = (chatStatus === "idle" || chatStatus === "loading") && threads.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThreadId, activeThread?.messages.length]);

  // Real-time socket listeners for live connection status, typing, and thread joining
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onTypingStart = (data: { threadId: string; senderName?: string; userId?: string }) => {
      if (data.threadId === activeThreadId && data.userId !== currentUser?.id) {
        setTypingUser(data.senderName || (role === "owner" ? "Service Advisor" : "Vehicle Owner"));
      }
    };

    const onTypingStop = (data: { threadId: string; userId?: string }) => {
      if (data.threadId === activeThreadId && data.userId !== currentUser?.id) {
        setTypingUser(null);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    if (activeThreadId) {
      socket.emit("thread:join", activeThreadId);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [activeThreadId, currentUser?.id, role]);

  // Auto-mark active thread as read if it has unread messages
  useEffect(() => {
    if (activeThread && activeThread.unread > 0) {
      void dispatch(markThreadRead(activeThread.id)).catch(() => {});
    }
  }, [activeThread, dispatch]);

  const otherName = (thread: ChatThread) =>
    role === "owner" ? (thread.advisor?.name ?? "Service Advisor") : (thread.owner?.name ?? "Vehicle Owner");

  const otherAvatar = (thread: ChatThread) =>
    role === "owner" ? thread.advisor?.avatar : thread.owner?.avatar;

  const advisors = useMemo(() => employees.filter((e) => e.role === "advisor"), [employees]);

  const unreadThreadsCount = useMemo(() => {
    return threads.reduce((acc, t) => acc + (t.unread > 0 ? 1 : 0), 0);
  }, [threads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let sorted = [...threads].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );

    if (filterTab === "unread") {
      sorted = sorted.filter((t) => t.unread > 0);
    }

    if (!q) return sorted;
    return sorted.filter((thread) => {
      const name = otherName(thread).toLowerCase();
      const lastText = (thread.messages.at(-1)?.text ?? "").toLowerCase();
      return thread.subject.toLowerCase().includes(q) || name.includes(q) || lastText.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, search, filterTab, role]);

  const selectThread = (thread: ChatThread) => {
    setTypingUser(null);
    dispatch(setActiveThread(thread.id));
    getSocket()?.emit("thread:join", thread.id);
    if (thread.unread > 0) {
      void dispatch(markThreadRead(thread.id)).catch(() => {});
    }
  };

  const handleInputChange = (val: string) => {
    setText(val);
    const socket = getSocket();
    if (!socket || !activeThread) return;

    if (!isTypingRef.current && val.trim().length > 0) {
      isTypingRef.current = true;
      socket.emit("typing:start", {
        threadId: activeThread.id,
        senderName: currentUser?.name || (role === "owner" ? "Vehicle Owner" : "Service Advisor"),
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing:stop", { threadId: activeThread.id });
    }, 2200);
  };

  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeThread) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      getSocket()?.emit("typing:stop", { threadId: activeThread.id });
    }

    dispatch(sendMessage({ threadId: activeThread.id, text: trimmed }));
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = (suggestion: string) => {
    setText(suggestion);
    inputRef.current?.focus();
  };

  const handleNewThread = async (e: FormEvent) => {
    e.preventDefault();
    if (role === "owner" && !advisorId) {
      toast.error("Please select a service advisor");
      return;
    }
    if (role === "advisor" && !customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a first message");
      return;
    }

    setSending(true);
    try {
      const thread = await dispatch(
        createThread({
          advisorId: role === "owner" ? advisorId : undefined,
          customerId: role === "advisor" ? customerId : undefined,
          subject: subject.trim() || "Vehicle service inquiry",
          text: message.trim(),
        }),
      ).unwrap();

      const recipientName =
        role === "owner" ? (thread.advisor?.name ?? "advisor") : (thread.owner?.name ?? "customer");
      toast.success(`Conversation started with ${recipientName}`);
      setNewOpen(false);
      setAdvisorId("");
      setCustomerId("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setSending(false);
    }
  };

  if (threadsLoading) {
    return <ChatLoading />;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-background">
      {/* Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-6 py-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chat</h1>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors shadow-2xs",
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200",
              )}
              title={isConnected ? "Real-time socket connected" : "Connecting to real-time server..."}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500",
                )}
              />
              {isConnected ? "Live" : "Connecting"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {role === "owner"
              ? "Real-time direct messaging with your designated service advisor"
              : "Real-time direct messaging with vehicle owners and customers"}
          </p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)} className="gap-2 rounded-xl shadow-xs font-semibold">
          <Plus className="size-4" />
          New Conversation
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left Sidebar: Threads List */}
        <aside className="flex w-[350px] shrink-0 flex-col border-r border-border bg-white">
          <div className="p-3.5 pb-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="h-10 w-full rounded-xl bg-[#f1f3f5] pr-8 pl-9 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-border border border-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs (All / Unread) */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 border-b border-border/60">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer",
                filterTab === "all"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              All ({threads.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("unread")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                filterTab === "unread"
                  ? "bg-primary text-white shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              Unread
              {unreadThreadsCount > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    filterTab === "unread" ? "bg-white text-primary" : "bg-primary text-white",
                  )}
                >
                  {unreadThreadsCount}
                </span>
              )}
            </button>
          </div>

          {/* Threads List */}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                  <MessageSquare className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {threads.length === 0 ? "No conversations yet" : "No conversations found"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {threads.length === 0
                      ? "Start a new conversation to communicate in real time."
                      : "Try searching with a different name or subject."}
                  </p>
                </div>
                {threads.length === 0 && (
                  <Button size="sm" variant="outline" onClick={() => setNewOpen(true)} className="gap-2 rounded-xl mt-1">
                    <Plus className="size-3.5" />
                    Start Conversation
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((thread) => {
                const active = thread.id === activeThreadId;
                const last = thread.messages[thread.messages.length - 1];
                const hasUnread = thread.unread > 0;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectThread(thread)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all mb-1 cursor-pointer",
                      active
                        ? "bg-primary-soft/80 border border-primary/20 shadow-2xs"
                        : "hover:bg-secondary/70 border border-transparent",
                    )}
                  >
                    <Avatar name={otherName(thread)} src={otherAvatar(thread)} showOnline={isConnected} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "truncate text-sm font-semibold",
                            active ? "text-primary" : "text-foreground",
                          )}
                        >
                          {otherName(thread)}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[11px]",
                            hasUnread ? "font-bold text-primary" : "text-muted-foreground",
                          )}
                        >
                          {formatTime(thread.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "truncate text-xs mt-0.5",
                          hasUnread ? "font-semibold text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {last?.text ?? thread.subject}
                      </p>
                    </div>
                    {hasUnread && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
                        {thread.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Canvas: Chat Content */}
        <section className="flex min-w-0 flex-1 flex-col bg-[#f8f9fa]">
          {activeThread ? (
            <>
              {/* Active Conversation Topbar */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-6 py-3.5 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={otherName(activeThread)} src={otherAvatar(activeThread)} showOnline={isConnected} size="md" />
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{otherName(activeThread)}</p>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {role === "owner" ? "Service Advisor" : "Vehicle Owner"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground mt-0.5 font-medium">
                      Subject: {activeThread.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:5550192834"
                    className="flex size-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-2xs transition-colors hover:border-primary/40 hover:text-primary"
                    title="Quick Call"
                  >
                    <Phone className="size-4" />
                  </a>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-3">
                <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
                  {activeThread.messages.map((msg, i) => {
                    const prev = activeThread.messages[i - 1];
                    const showDate = !prev || formatDay(msg.time) !== formatDay(prev.time);
                    const mine = msg.sender === role;
                    const grouped = prev && !showDate && prev.sender === msg.sender;
                    return (
                      <Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-3">
                            <span className="rounded-full bg-white/90 px-3.5 py-1 text-[11px] font-medium text-muted-foreground shadow-2xs border border-border/60">
                              {formatDay(msg.time)}
                            </span>
                          </div>
                        )}
                        <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", !grouped && "mt-2")}>
                          {!mine && !grouped && (
                            <Avatar name={otherName(activeThread)} src={otherAvatar(activeThread)} size="sm" />
                          )}
                          {!mine && grouped && <span className="size-8 shrink-0" />}

                          <div
                            className={cn(
                              "max-w-[76%] px-4 py-2.5 text-sm leading-relaxed transition-all",
                              mine
                                ? "rounded-2xl rounded-br-xs bg-[#0052cc] text-white shadow-xs"
                                : "rounded-2xl rounded-bl-xs border border-border/80 bg-white text-foreground shadow-2xs",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            <p
                              className={cn(
                                "mt-1 flex items-center justify-end gap-1 text-[10px] select-none",
                                mine ? "text-white/75" : "text-muted-foreground",
                              )}
                            >
                              {formatTime(msg.time)}
                              {mine && <CheckCheck className="size-3" />}
                            </p>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Typing Indicator Bar */}
              {typingUser && (
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-6 py-1.5 text-xs text-muted-foreground border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                  </span>
                  <span>
                    <strong className="font-semibold text-foreground">{typingUser}</strong> is typing...
                  </span>
                </div>
              )}

              {/* Bottom Quick-Replies & Input Area */}
              <div className="shrink-0 border-t border-border bg-white p-4">
                {/* Quick Reply Chips */}
                <div className="mx-auto max-w-3xl mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground shrink-0 mr-1">
                    <Sparkles className="size-3 text-primary" /> Suggestions:
                  </span>
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(reply)}
                      className="whitespace-nowrap rounded-full border border-border bg-[#f8f9fa] px-3 py-1 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary transition-all cursor-pointer shadow-2xs"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Main Message Input Bar */}
                <form onSubmit={handleSend} className="mx-auto max-w-3xl">
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-[#f8f9fa] px-3.5 py-2 shadow-2xs focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary cursor-pointer"
                      aria-label="Attach file"
                    >
                      <Paperclip className="size-[18px]" />
                    </button>
                    <input
                      ref={inputRef}
                      value={text}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message... (Press Enter to send)"
                      className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary cursor-pointer"
                      aria-label="Emoji"
                    >
                      <Smile className="size-[18px]" />
                    </button>
                    <button
                      type="submit"
                      disabled={!text.trim()}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Send message"
                    >
                      <Send className="size-4" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft">
                <MessageSquare className="size-7 text-primary" />
              </span>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">Select a conversation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a contact from the left or start a new conversation.
                </p>
              </div>
              <Button size="sm" onClick={() => setNewOpen(true)} className="gap-2 rounded-xl mt-2 font-semibold shadow-xs">
                <Plus className="size-3.5" />
                New Conversation
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">New Conversation</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {role === "owner"
                ? "Choose a service advisor to start a direct chat with."
                : "Choose a vehicle owner / customer to send a message."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewThread} className="flex flex-col gap-4 pt-1">
            {role === "owner" ? (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Service Advisor *</Label>
                <select
                  value={advisorId}
                  onChange={(e) => setAdvisorId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>
                    Select advisor...
                  </option>
                  {advisors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.station || "Service Station"})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Vehicle Owner / Customer *</Label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>
                    Select customer...
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Brake inspection inquiry"
                className="h-10 rounded-xl border-border bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">First Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I need help with..."
                className="min-h-24 rounded-xl border-border bg-white resize-none"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={sending} className="gap-2 rounded-xl font-semibold shadow-xs">
                <Plus className="size-3.5" />
                {sending ? "Starting..." : "Start Conversation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
