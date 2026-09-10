"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileCheck,
  MessageSquare,
  Wrench,
  CheckCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchThreads, markThreadRead } from "@/store/slices/chatSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import type { Appointment, ChatThread, Estimate, Invoice, TaskCard } from "@/types";
import type { AuthUser } from "@/store/slices/authSlice";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "chat" | "estimate" | "task" | "invoice" | "appointment";
  title: string;
  subtitle: string;
  href: string;
  timestamp: string;
  unread: boolean;
  icon: typeof Bell;
  iconBg: string;
  iconColor: string;
  threadId?: string;
}

function timeAgo(dateString?: string | null): string {
  if (!dateString) return "Recent";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return "Recent";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildNotifications({
  user,
  threads,
  tasks,
  estimates,
  invoices,
  appointments,
  readIds,
}: {
  user: AuthUser | null;
  threads: ChatThread[];
  tasks: TaskCard[];
  estimates: Estimate[];
  invoices: Invoice[];
  appointments: Appointment[];
  readIds: Set<string>;
}): NotificationItem[] {
  const list: NotificationItem[] = [];
  const role = user?.role?.toLowerCase() ?? "owner";

  // 1. Unread chat threads
  for (const t of threads) {
    if (t.unread > 0) {
      const otherParty = role === "owner" ? t.advisor?.name ?? "Advisor" : t.owner?.name ?? "Customer";
      list.push({
        id: `chat-${t.id}`,
        type: "chat",
        title: `Message from ${otherParty}`,
        subtitle: `${t.unread} new unread message${t.unread > 1 ? "s" : ""}`,
        href: role === "owner" ? "/dashboard/chat" : `/${role}/chat`,
        timestamp: timeAgo(t.lastMessageAt),
        unread: !readIds.has(`chat-${t.id}`),
        icon: MessageSquare,
        iconBg: "bg-blue-50",
        iconColor: "text-primary",
        threadId: t.id,
      });
    }
  }

  if (role === "owner") {
    // 2. Pending Estimates
    for (const e of estimates) {
      if (e.status === "pending") {
        list.push({
          id: `est-${e.id}`,
          type: "estimate",
          title: "Estimate Awaiting Approval",
          subtitle: `${e.summary || "Review required"} • $${e.total.toFixed(2)}`,
          href: `/dashboard/estimates/${e.id}`,
          timestamp: timeAgo(e.createdAt),
          unread: !readIds.has(`est-${e.id}`),
          icon: FileCheck,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        });
      }
    }

    // 3. Task Status Updates (Ready or Active)
    for (const task of tasks) {
      if (task.status === "ready") {
        list.push({
          id: `task-ready-${task.id}`,
          type: "task",
          title: `Vehicle Ready: #${task.id}`,
          subtitle: "All services and tests completed. Ready for pickup.",
          href: `/dashboard/services/${task.id}`,
          timestamp: timeAgo(task.updatedAt || task.createdAt),
          unread: !readIds.has(`task-ready-${task.id}`),
          icon: CheckCircle2,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        });
      } else if (task.status === "repairing" || task.status === "testing") {
        list.push({
          id: `task-prog-${task.id}`,
          type: "task",
          title: `Service In Progress: #${task.id}`,
          subtitle: `${task.status === "repairing" ? "Repairing" : "Quality testing"} — ${task.issues}`,
          href: `/dashboard/services/track`,
          timestamp: timeAgo(task.updatedAt || task.createdAt),
          unread: !readIds.has(`task-prog-${task.id}`),
          icon: Wrench,
          iconBg: "bg-blue-50",
          iconColor: "text-primary",
        });
      }
    }

    // 4. Unpaid Invoices
    for (const inv of invoices) {
      if (inv.status !== "paid") {
        list.push({
          id: `inv-${inv.id}`,
          type: "invoice",
          title: "Invoice Pending Payment",
          subtitle: `Invoice #${inv.id} • $${inv.total.toFixed(2)} due`,
          href: "/dashboard/payments",
          timestamp: timeAgo(inv.issuedAt),
          unread: !readIds.has(`inv-${inv.id}`),
          icon: CreditCard,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        });
      }
    }

    // 5. Upcoming Appointments
    for (const apt of appointments) {
      if (apt.status === "confirmed" || apt.status === "pending") {
        list.push({
          id: `apt-${apt.id}`,
          type: "appointment",
          title: `Appointment ${apt.status === "confirmed" ? "Confirmed" : "Scheduled"}`,
          subtitle: `${apt.date} at ${apt.time}`,
          href: "/dashboard/appointments",
          timestamp: timeAgo(apt.createdAt),
          unread: !readIds.has(`apt-${apt.id}`),
          icon: Calendar,
          iconBg: "bg-indigo-50",
          iconColor: "text-indigo-600",
        });
      }
    }
  } else if (role === "advisor") {
    for (const task of tasks) {
      if (!task.mechanicId && task.status !== "completed") {
        list.push({
          id: `adv-task-${task.id}`,
          type: "task",
          title: `Task #${task.id} Awaiting Mechanic`,
          subtitle: "Vehicle received — assign a bay/mechanic",
          href: "/advisor/task-cards/assign",
          timestamp: timeAgo(task.createdAt),
          unread: !readIds.has(`adv-task-${task.id}`),
          icon: Wrench,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        });
      }
    }
    for (const apt of appointments) {
      if (apt.status === "pending") {
        list.push({
          id: `adv-apt-${apt.id}`,
          type: "appointment",
          title: "New Appointment Request",
          subtitle: `${apt.date} at ${apt.time}`,
          href: "/advisor/appointments",
          timestamp: timeAgo(apt.createdAt),
          unread: !readIds.has(`adv-apt-${apt.id}`),
          icon: Calendar,
          iconBg: "bg-blue-50",
          iconColor: "text-primary",
        });
      }
    }
  } else if (role === "mechanic") {
    for (const task of tasks) {
      if (task.mechanicId === user?.id && task.status !== "completed") {
        list.push({
          id: `mech-task-${task.id}`,
          type: "task",
          title: `Station Task: #${task.id}`,
          subtitle: `${task.priority.toUpperCase()} priority • ${task.issues}`,
          href: `/mechanic/tasks/${task.id}`,
          timestamp: timeAgo(task.updatedAt || task.createdAt),
          unread: !readIds.has(`mech-task-${task.id}`),
          icon: Wrench,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        });
      }
    }
  }

  return list;
}

export function NotificationMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const threads = useAppSelector((s) => s.chat.threads);
  const tasks = useAppSelector((s) => s.tasks.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const appointments = useAppSelector((s) => s.appointments.items);

  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("motoserve_notifications_read");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threads.length === 0) void dispatch(fetchThreads());
    if (tasks.length === 0) void dispatch(fetchTasks());
    if (estimates.length === 0) void dispatch(fetchEstimates());
    if (invoices.length === 0) void dispatch(fetchInvoices());
    if (appointments.length === 0) void dispatch(fetchAppointments());
  }, [dispatch, threads.length, tasks.length, estimates.length, invoices.length, appointments.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const persistReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    try {
      localStorage.setItem("motoserve_notifications_read", JSON.stringify(Array.from(newSet)));
    } catch {
      // Ignore storage errors
    }
  };

  const markItemAsRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    persistReadIds(updated);
  };

  const items = buildNotifications({
    user,
    threads,
    tasks,
    estimates,
    invoices,
    appointments,
    readIds,
  });

  const markAllAsRead = () => {
    const updated = new Set(readIds);
    items.forEach((item) => updated.add(item.id));
    persistReadIds(updated);
  };

  const unreadCount = items.filter((i) => i.unread).length;

  return (
    <div ref={menuRef} className="group/notif relative flex items-center">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isOpen && "bg-secondary text-foreground",
        )}
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover container: active when isOpen is true OR hovered via group/notif */}
      <div
        className={cn(
          "absolute top-[calc(100%+8px)] right-0 z-50 w-80 sm:w-96 rounded-xl border border-border bg-white shadow-xl transition-all duration-150 origin-top-right",
          isOpen
            ? "visible scale-100 opacity-100"
            : "invisible scale-95 opacity-0 pointer-events-none group-hover/notif:visible group-hover/notif:scale-100 group-hover/notif:opacity-100 group-hover/notif:pointer-events-auto",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                All caught up
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Bell className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No new notifications</p>
              <p className="text-xs text-muted-foreground">
                You will be notified here when your vehicle status, estimates, or messages update.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  markItemAsRead(item.id);
                  if (item.threadId) {
                    void dispatch(markThreadRead(item.threadId));
                  }
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-start gap-3 p-3.5 transition-colors hover:bg-secondary/60",
                  item.unread && "bg-primary-soft/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    item.iconBg,
                    item.iconColor,
                  )}
                >
                  <item.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn("text-xs truncate", item.unread ? "font-semibold text-foreground" : "font-medium text-[#424753]")}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
                {item.unread && (
                  <span className="size-2 mt-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />
                )}
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-4 py-2.5 bg-background/50 rounded-b-xl flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Showing {items.length} notification{items.length === 1 ? "" : "s"}
            </span>
            <Link
              href={user?.role === "owner" ? "/dashboard/services/track" : "/dashboard"}
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View Activity
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
