"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CheckCheck, MessageSquare, Paperclip, Plus, Search, Send, Smile } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createThread,
  fetchThreads,
  markThreadRead,
  sendMessage,
  setActiveThread,
} from "@/store/slices/chatSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { useFileUrl } from "@/hooks/useFileUrl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const url = useFileUrl(src);
  const fallback = (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
      {getInitials(name)}
    </span>
  );
  if (!url) return fallback;
  return (
    <span className="relative block size-11 shrink-0 overflow-hidden rounded-full">
      <Image src={url} alt={name} fill className="object-cover" />
    </span>
  );
}

export function CommunicationCenter({ role }: CommunicationCenterProps) {
  const dispatch = useAppDispatch();
  const threads = useAppSelector((s) => s.chat.threads);
  const activeThreadId = useAppSelector((s) => s.chat.activeThreadId);
  const employees = useAppSelector((s) => s.employees.items);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [advisorId, setAdvisorId] = useState("");
  const [subject, setSubject] = useState("Vehicle service inquiry");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchThreads());
    if (role === "owner") dispatch(fetchEmployees());
  }, [dispatch, role]);

  useEffect(() => {
    const timer = setInterval(() => {
      void dispatch(fetchThreads()).catch(() => {});
    }, 8000);
    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) dispatch(setActiveThread(threads[0].id));
  }, [activeThreadId, threads, dispatch]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThreadId, activeThread?.messages.length]);

  const otherName = (thread: ChatThread) =>
    role === "owner" ? (thread.advisor?.name ?? "Service Advisor") : (thread.owner?.name ?? "Vehicle Owner");

  const otherAvatar = (thread: ChatThread) =>
    role === "owner" ? thread.advisor?.avatar : thread.owner?.avatar;

  const advisors = useMemo(() => employees.filter((e) => e.role === "advisor"), [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const name = otherName(thread).toLowerCase();
      const lastText = (thread.messages.at(-1)?.text ?? "").toLowerCase();
      return thread.subject.toLowerCase().includes(q) || name.includes(q) || lastText.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, search, role]);

  const selectThread = (thread: ChatThread) => {
    dispatch(setActiveThread(thread.id));
    if (thread.unread > 0) {
      void dispatch(markThreadRead(thread.id)).catch(() => {});
    }
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeThread) return;
    dispatch(sendMessage({ threadId: activeThread.id, text: trimmed }));
    setText("");
  };

  const handleNewThread = async (e: FormEvent) => {
    e.preventDefault();
    if (!advisorId || !message.trim()) {
      toast.error("Select an advisor and write a first message");
      return;
    }
    setSending(true);
    try {
      const thread = await dispatch(
        createThread({
          advisorId,
          subject: subject.trim() || "Vehicle service inquiry",
          text: message.trim(),
        }),
      ).unwrap();
      toast.success(`Conversation started with ${thread.advisor?.name ?? "advisor"}`);
      setNewOpen(false);
      setAdvisorId("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Communication Center</h1>
          <p className="text-sm text-muted-foreground">
            {role === "owner" ? "Chat with your service advisor" : "Chat with your vehicle owners"}
          </p>
        </div>
        {role === "owner" && (
          <Button size="sm" onClick={() => setNewOpen(true)} className="gap-2 rounded-lg">
            <Plus className="size-4" />
            New Conversation
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-white">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="h-[38px] w-full rounded-lg bg-[#edeeef] pr-3.5 pl-9 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <MessageSquare className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  {threads.length === 0 ? "No conversations yet" : "No conversations match your search"}
                </p>
                {threads.length === 0 && role === "owner" && (
                  <Button size="sm" variant="outline" onClick={() => setNewOpen(true)} className="gap-2 rounded-lg">
                    <Plus className="size-3.5" />
                    Start a Conversation
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((thread) => {
                const active = thread.id === activeThreadId;
                const last = thread.messages[thread.messages.length - 1];
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => selectThread(thread)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                      active ? "bg-primary-soft" : "hover:bg-[#f3f4f5]",
                    )}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={otherName(thread)} src={otherAvatar(thread)} />
                      {thread.unread > 0 && (
                        <span className="absolute -right-0.5 -bottom-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
                          {thread.unread}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{otherName(thread)}</span>
                        <span className={cn("shrink-0 text-[11px]", thread.unread > 0 ? "font-semibold text-primary" : "text-muted-foreground")}>
                          {formatTime(thread.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                        {last?.text ?? thread.subject}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#f8f9fa]">
          {activeThread ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-border bg-white px-6 py-3">
                <Avatar name={otherName(activeThread)} src={otherAvatar(activeThread)} />
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm font-semibold text-foreground">{otherName(activeThread)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {role === "owner" ? "Service Advisor" : "Vehicle Owner"} • {activeThread.subject}
                  </p>
                </div>
              </div>

              <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
                  {activeThread.messages.map((msg, i) => {
                    const prev = activeThread.messages[i - 1];
                    const showDate = !prev || formatDay(msg.time) !== formatDay(prev.time);
                    const mine = msg.sender === "advisor";
                    const grouped = prev && !showDate && prev.sender === msg.sender;
                    return (
                      <Fragment key={msg.id}>
                        {showDate && (
                          <div className="py-2 text-center text-[11px] font-medium text-muted-foreground">
                            {formatDay(msg.time)}
                          </div>
                        )}
                        <div className={cn("flex", mine ? "justify-end" : "justify-start", !grouped && "mt-2")}>
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
                              mine
                                ? "rounded-br-sm bg-primary text-white"
                                : "rounded-bl-sm border border-border bg-white text-foreground",
                            )}
                          >
                            <p>{msg.text}</p>
                            <p
                              className={cn(
                                "mt-1 flex items-center justify-end gap-1 text-[10px]",
                                mine ? "text-white/70" : "text-muted-foreground",
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

              <form onSubmit={handleSend} className="shrink-0 border-t border-border bg-white p-4">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-[#f8f9fa] px-3 py-2">
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#edeeef] hover:text-primary"
                    aria-label="Attach file"
                  >
                    <Paperclip className="size-[18px]" />
                  </button>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#edeeef] hover:text-primary"
                    aria-label="Emoji"
                  >
                    <Smile className="size-[18px]" />
                  </button>
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-primary/90 disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft">
                <MessageSquare className="size-7 text-primary" />
              </span>
              <p className="text-sm font-medium">Select a conversation to start messaging</p>
              {threads.length === 0 && role === "owner" && (
                <Button size="sm" onClick={() => setNewOpen(true)} className="gap-2 rounded-lg">
                  <Plus className="size-3.5" />
                  New Conversation
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">New Conversation</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Choose a service advisor to start a chat with.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewThread} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Service Advisor *</Label>
              <select
                value={advisorId}
                onChange={(e) => setAdvisorId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select advisor...
                </option>
                {advisors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Vehicle service inquiry"
                className="h-10 rounded-lg border-border bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">First Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi, I need help with..."
                className="min-h-24 rounded-lg border-border bg-white resize-none"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewOpen(false)} className="rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={sending} className="gap-2 rounded-lg">
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
