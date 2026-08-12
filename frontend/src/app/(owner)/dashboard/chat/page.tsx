"use client";

import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCheck, Paperclip, Plus, Search, Send, Smile } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchThreads,
  markThreadRead,
  sendMessage,
  setActiveThread,
} from "@/store/slices/chatSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { cn } from "@/lib/utils";
import type { ChatThread } from "@/types";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const formatDay = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const roNumber = (subject: string) => subject.split(" ")[0];

const statusPill = (status: string | undefined) => {
  if (status === "completed")
    return { label: "PAID", className: "bg-[rgba(34,197,94,0.1)] text-[#16a34a]" };
  if (status === "received" || status === "inspecting")
    return { label: "AWAITING APPROVAL", className: "bg-[rgba(239,68,68,0.1)] text-[#dc2626]" };
  return { label: "IN PROGRESS", className: "bg-[rgba(255,193,7,0.15)] text-[#a16207]" };
};

export default function CommunicationCenterPage() {
  const dispatch = useAppDispatch();
  const threads = useAppSelector((s) => s.chat.threads);
  const activeThreadId = useAppSelector((s) => s.chat.activeThreadId);
  const jobs = useAppSelector((s) => s.jobs.items);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    dispatch(fetchThreads());
    dispatch(fetchJobs());
  }, [dispatch]);

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) dispatch(setActiveThread(threads[0].id));
  }, [activeThreadId, threads, dispatch]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const ownerName = (thread: ChatThread) =>
    thread.owner?.name ?? roNumber(thread.subject);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => {
      const name = ownerName(thread).toLowerCase();
      const lastText = thread.messages[thread.messages.length - 1]?.text.toLowerCase() ?? "";
      return (
        thread.subject.toLowerCase().includes(q) ||
        name.includes(q) ||
        lastText.includes(q)
      );
    });
  }, [threads, search]);

  const selectThread = (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    dispatch(setActiveThread(threadId));
    if (thread && thread.unread > 0) dispatch(markThreadRead(threadId));
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeThread) return;
    dispatch(sendMessage({ threadId: activeThread.id, text: trimmed }));
    setText("");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-0 p-0">
      <div className="shrink-0 p-6 pb-0">
        <h1 className="text-2xl font-semibold text-[#191c1d]">Communication Center</h1>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[360px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white">
          <div className="relative m-16">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b7280]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages, customers, or ROs..."
              className="h-[38px] w-full rounded-xl bg-[#edeeef] pr-3.5 pl-9 text-sm text-[#191c1d] outline-none placeholder:text-[#9ca3af]"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((thread, idx) => {
              const active = thread.id === activeThreadId;
              const pill = statusPill(jobs.find((j) => j.id === roNumber(thread.subject))?.status);
              const name = ownerName(thread);
              const last = thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  className={cn(
                    "relative flex w-full items-start gap-3 border-b border-[#e5e7eb] p-16 text-left",
                    active && "bg-[#f3f4f5]",
                  )}
                >
                  {active && <span className="absolute top-0 left-0 h-full w-1 bg-primary" />}
                  <span
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold",
                      idx % 2 === 0 ? "bg-[#ffb05f] text-[#754300]" : "bg-primary-soft text-primary",
                    )}
                  >
                    {getInitials(name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#191c1d]">
                        {name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[11px]",
                          thread.unread > 0 ? "font-semibold text-primary" : "text-[#6b7280]",
                        )}
                      >
                        {formatTime(thread.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[#424753]">
                      {last?.text}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5">
                      <span className="rounded bg-[rgba(0,82,204,0.1)] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.5px] text-primary uppercase">
                        {roNumber(thread.subject)}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.5px] uppercase",
                          pill.className,
                        )}
                      >
                        {pill.label}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#f8f9fa]">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {activeThread ? (
              <div className="flex flex-col gap-2">
                {activeThread.messages.map((msg, i) => {
                  const prev = activeThread.messages[i - 1];
                  const showDate = !prev || formatDay(msg.time) !== formatDay(prev.time);
                  const sent = msg.sender === "advisor";
                  return (
                    <Fragment key={msg.id}>
                      {showDate && (
                        <div className="py-3 text-center text-[11px] font-medium text-[#6b7280]">
                          {formatDay(msg.time)}
                        </div>
                      )}
                      {sent ? (
                        <div className="flex items-end justify-end gap-1.5">
                          <div className="max-w-[243px] rounded-bl-2xl rounded-br-2xl rounded-tl-2xl rounded-tr-sm bg-primary px-16 py-12 text-sm leading-snug text-white">
                            {msg.text}
                          </div>
                          <CheckCheck className="mb-1.5 size-3 shrink-0 text-primary" />
                        </div>
                      ) : (
                        <div className="flex items-end gap-2">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-bold",
                              i % 2 === 0 ? "bg-[#ffb05f] text-[#754300]" : "bg-primary-soft text-primary",
                            )}
                          >
                            {getInitials(ownerName(activeThread))}
                          </span>
                          <div className="max-w-[70%] rounded-bl-2xl rounded-br-2xl rounded-tl-sm rounded-tr-2xl border border-[#e5e7eb] bg-white px-17 py-13 text-sm leading-snug text-[#191c1d]">
                            {msg.text}
                          </div>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
                <div className="flex items-end gap-2">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-bold",
                      activeThread.messages.length % 2 === 0
                        ? "bg-[#ffb05f] text-[#754300]"
                        : "bg-primary-soft text-primary",
                    )}
                  >
                    {getInitials(ownerName(activeThread))}
                  </span>
                  <div className="flex items-center gap-[5px] rounded-bl-2xl rounded-br-2xl rounded-tl-sm rounded-tr-2xl border border-[#e5e7eb] bg-white px-4 py-3.5">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="size-1.5 animate-bounce rounded-full bg-[#9ca3af]"
                        style={{ animationDelay: `${dot * 140}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-[#6b7280]">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft">
                  <Search className="size-6 text-primary" />
                </span>
                <p className="text-sm font-medium">Select a conversation to start messaging</p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="shrink-0 border-t border-[#e5e7eb] bg-white p-16"
          >
            <div className="flex items-center gap-8 rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] px-4 py-2.5">
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#6b7280] hover:text-primary"
                aria-label="Attach RO"
              >
                <Plus className="size-[18px]" />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#191c1d] outline-none placeholder:text-[#9ca3af]"
              />
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#6b7280] hover:text-primary"
                aria-label="Attach file"
              >
                <Paperclip className="size-[18px]" />
              </button>
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#6b7280] hover:text-primary"
                aria-label="Emoji"
              >
                <Smile className="size-[18px]" />
              </button>
              <button
                type="submit"
                className="flex size-[34px] shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary/90"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
