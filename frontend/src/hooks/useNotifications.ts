"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileCheck,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchThreads, markThreadRead } from "@/store/slices/chatSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import type { Appointment, ChatThread, Estimate, Invoice, TaskCard, Vehicle } from "@/types";

export interface NotificationItem {
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
  createdAt?: string;
}

export interface ActivityItem {
  id: string;
  type: "chat" | "estimate" | "task" | "invoice" | "appointment";
  category: "tasks" | "estimates" | "invoices" | "appointments" | "chat";
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  actionLabel: string;
  timestamp: string;
  fullDate: string;
  dateObj: Date;
  unread: boolean;
  statusBadge?: {
    label: string;
    className: string;
  };
  icon: typeof Bell;
  iconBg: string;
  iconColor: string;
  threadId?: string;
  metadata?: {
    vehicle?: string;
    regNo?: string;
    amount?: string;
    priority?: string;
    status?: string;
    advisor?: string;
    mechanic?: string;
  };
}

export function parseSafeDate(dateString?: string | null): Date {
  if (!dateString) return new Date(0);
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function timeAgo(dateString?: string | null): string {
  if (!dateString) return "Recent";
  const date = parseSafeDate(dateString);
  if (date.getTime() === 0) return "Recent";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return "Just now";

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

export function formatFullDate(dateString?: string | null): string {
  if (!dateString) return "Recent";
  const date = parseSafeDate(dateString);
  if (date.getTime() === 0) return "Recent";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STORAGE_KEY = "motoserve_notifications_read";
const SYNC_EVENT = "motoserve_notifications_updated";

function getStoredReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function buildActiveNotifications({
  threads,
  estimates,
  tasks,
  invoices,
  appointments,
  readIds,
  role,
  userId,
}: {
  threads: ChatThread[];
  estimates: Estimate[];
  tasks: TaskCard[];
  invoices: Invoice[];
  appointments: Appointment[];
  readIds: Set<string>;
  role: string;
  userId?: string;
}): NotificationItem[] {
  const list: NotificationItem[] = [];

  // Chat threads
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
        createdAt: t.lastMessageAt,
      });
    }
  }

  if (role === "owner") {
    // Pending Estimates
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
          createdAt: e.createdAt,
        });
      }
    }

    // Tasks updates
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
          createdAt: task.updatedAt || task.createdAt,
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
          createdAt: task.updatedAt || task.createdAt,
        });
      }
    }

    // Unpaid Invoices
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
          createdAt: inv.issuedAt,
        });
      }
    }

    // Upcoming Appointments
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
          createdAt: apt.createdAt,
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
          createdAt: task.createdAt,
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
          createdAt: apt.createdAt,
        });
      }
    }
  } else if (role === "mechanic") {
    for (const task of tasks) {
      if (task.mechanicId === userId && task.status !== "completed") {
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
          createdAt: task.updatedAt || task.createdAt,
        });
      }
    }
  }

  return list;
}

function buildActivities({
  tasks,
  estimates,
  invoices,
  appointments,
  threads,
  vehicles,
  readIds,
  role,
}: {
  tasks: TaskCard[];
  estimates: Estimate[];
  invoices: Invoice[];
  appointments: Appointment[];
  threads: ChatThread[];
  vehicles: Vehicle[];
  readIds: Set<string>;
  role: string;
}): ActivityItem[] {
  const list: ActivityItem[] = [];
  const vehiclesById = new Map<string, Vehicle>(vehicles.map((v) => [v.id, v]));

  // Tasks Activities
  for (const task of tasks) {
    const v = task.vehicle ?? vehiclesById.get(task.vehicleId);
    const vehicleName = v ? `${v.make} ${v.model}` : "Vehicle";
    const regNo = v?.regNo;
    const dateObj = parseSafeDate(task.updatedAt || task.createdAt);

    let statusBadge = {
      label: task.status.toUpperCase(),
      className: "bg-secondary text-muted-foreground border-border",
    };

    if (task.status === "ready") {
      statusBadge = { label: "READY FOR PICKUP", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    } else if (task.status === "repairing") {
      statusBadge = { label: "IN REPAIR", className: "bg-blue-50 text-primary border-blue-200" };
    } else if (task.status === "testing") {
      statusBadge = { label: "QUALITY TESTING", className: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    } else if (task.status === "completed") {
      statusBadge = { label: "COMPLETED", className: "bg-secondary text-foreground border-border" };
    } else if (task.status === "received" || task.status === "inspecting") {
      statusBadge = { label: "INSPECTION", className: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    const id = `act-task-${task.id}`;
    const isUnread = !readIds.has(id);

    list.push({
      id,
      type: "task",
      category: "tasks",
      title: `Service Task: #${task.id}`,
      subtitle: `${vehicleName}${regNo ? ` (${regNo})` : ""} — ${task.services.map((s) => s.name).join(", ") || task.issues}`,
      description: task.issues || "Scheduled vehicle servicing and routine checks.",
      href: role === "owner" ? `/dashboard/services/${task.id}` : role === "mechanic" ? `/mechanic/tasks/${task.id}` : `/advisor/tasks`,
      actionLabel: task.status === "ready" ? "View Service & Collect" : "View Service Details",
      timestamp: timeAgo(task.updatedAt || task.createdAt),
      fullDate: formatFullDate(task.updatedAt || task.createdAt),
      dateObj,
      unread: isUnread,
      statusBadge,
      icon: task.status === "ready" ? CheckCircle2 : Wrench,
      iconBg: task.status === "ready" ? "bg-emerald-50" : "bg-blue-50",
      iconColor: task.status === "ready" ? "text-emerald-600" : "text-primary",
      metadata: {
        vehicle: vehicleName,
        regNo,
        priority: task.priority,
        status: task.status,
        advisor: task.advisor?.name,
        mechanic: task.mechanic?.name,
      },
    });
  }

  // Estimates Activities
  for (const est of estimates) {
    const dateObj = parseSafeDate(est.createdAt);
    const isPending = est.status === "pending";
    const isApproved = est.status === "approved";
    const id = `act-est-${est.id}`;

    list.push({
      id,
      type: "estimate",
      category: "estimates",
      title: `Estimate #${est.id} ${isPending ? "Awaiting Approval" : isApproved ? "Approved" : "Declined"}`,
      subtitle: `${est.summary || "Workshop estimate"} • $${est.total.toFixed(2)}`,
      description: `Estimate covers ${est.items.length} item(s) for vehicle repair and servicing. Total: $${est.total.toFixed(2)}.`,
      href: role === "owner" ? `/dashboard/estimates/${est.id}` : `/advisor/estimates`,
      actionLabel: isPending ? "Review & Approve" : "View Estimate Breakdown",
      timestamp: timeAgo(est.createdAt),
      fullDate: formatFullDate(est.createdAt),
      dateObj,
      unread: !readIds.has(id),
      statusBadge: isPending
        ? { label: "ACTION REQUIRED", className: "bg-amber-50 text-amber-700 border-amber-200" }
        : isApproved
          ? { label: "APPROVED", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
          : { label: "DECLINED", className: "bg-red-50 text-red-700 border-red-200" },
      icon: FileCheck,
      iconBg: isPending ? "bg-amber-50" : "bg-blue-50",
      iconColor: isPending ? "text-amber-600" : "text-primary",
      metadata: {
        amount: `$${est.total.toFixed(2)}`,
        status: est.status,
      },
    });
  }

  // Invoices Activities
  for (const inv of invoices) {
    const dateObj = parseSafeDate(inv.issuedAt);
    const isPaid = inv.status === "paid";
    const id = `act-inv-${inv.id}`;

    list.push({
      id,
      type: "invoice",
      category: "invoices",
      title: `Invoice #${inv.id} ${isPaid ? "Paid" : "Pending Payment"}`,
      subtitle: `Amount: $${inv.total.toFixed(2)} • Task #${inv.taskId}`,
      description: `Labor: $${inv.laborTotal.toFixed(2)}, Parts: $${inv.partsTotal.toFixed(2)}, Tax: $${inv.tax.toFixed(2)}.`,
      href: role === "owner" ? "/dashboard/payments" : `/dashboard/payments`,
      actionLabel: isPaid ? "View Receipt" : "Pay Invoice",
      timestamp: timeAgo(inv.issuedAt),
      fullDate: formatFullDate(inv.issuedAt),
      dateObj,
      unread: !readIds.has(id),
      statusBadge: isPaid
        ? { label: "PAID", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
        : { label: "UNPAID", className: "bg-purple-50 text-purple-700 border-purple-200" },
      icon: CreditCard,
      iconBg: isPaid ? "bg-emerald-50" : "bg-purple-50",
      iconColor: isPaid ? "text-emerald-600" : "text-purple-600",
      metadata: {
        amount: `$${inv.total.toFixed(2)}`,
        status: inv.status,
      },
    });
  }

  // Appointments Activities
  for (const apt of appointments) {
    const dateObj = parseSafeDate(apt.createdAt);
    const isConfirmed = apt.status === "confirmed";
    const isPending = apt.status === "pending";
    const id = `act-apt-${apt.id}`;

    list.push({
      id,
      type: "appointment",
      category: "appointments",
      title: `Appointment ${isConfirmed ? "Confirmed" : isPending ? "Pending Confirmation" : "Cancelled"}`,
      subtitle: `Scheduled for ${apt.date} at ${apt.time}`,
      description: apt.notes ? `Customer notes: "${apt.notes}"` : "Service slot reserved at workshop bay.",
      href: role === "owner" ? "/dashboard/appointments" : `/advisor/appointments`,
      actionLabel: "View Booking",
      timestamp: timeAgo(apt.createdAt),
      fullDate: formatFullDate(apt.createdAt),
      dateObj,
      unread: !readIds.has(id),
      statusBadge: isConfirmed
        ? { label: "CONFIRMED", className: "bg-blue-50 text-primary border-blue-200" }
        : isPending
          ? { label: "PENDING", className: "bg-amber-50 text-amber-700 border-amber-200" }
          : { label: "CANCELLED", className: "bg-red-50 text-red-700 border-red-200" },
      icon: Calendar,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      metadata: {
        status: apt.status,
      },
    });
  }

  // Chat Threads Activities
  for (const t of threads) {
    const otherParty = role === "owner" ? t.advisor?.name ?? "Advisor" : t.owner?.name ?? "Customer";
    const lastMsg = t.messages?.[t.messages.length - 1];
    const dateObj = parseSafeDate(t.lastMessageAt);
    const id = `act-chat-${t.id}`;

    list.push({
      id,
      type: "chat",
      category: "chat",
      title: `Communication with ${otherParty}`,
      subtitle: t.subject || "Service Conversation",
      description: lastMsg ? `"${lastMsg.text}"` : "Active communication thread regarding your vehicle servicing.",
      href: role === "owner" ? "/dashboard/chat" : `/${role}/chat`,
      actionLabel: t.unread > 0 ? `Reply (${t.unread} new)` : "Open Chat",
      timestamp: timeAgo(t.lastMessageAt),
      fullDate: formatFullDate(t.lastMessageAt),
      dateObj,
      unread: t.unread > 0 || !readIds.has(id),
      statusBadge: t.unread > 0
        ? { label: `${t.unread} UNREAD`, className: "bg-blue-50 text-primary border-blue-200" }
        : { label: "ACTIVE", className: "bg-secondary text-muted-foreground border-border" },
      icon: MessageSquare,
      iconBg: "bg-blue-50",
      iconColor: "text-primary",
      threadId: t.id,
    });
  }

  return list.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

export function useNotifications() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const threads = useAppSelector((s) => s.chat.threads);
  const tasks = useAppSelector((s) => s.tasks.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [readIds, setReadIds] = useState<Set<string>>(getStoredReadIds);

  useEffect(() => {
    const handleSync = () => {
      setReadIds(getStoredReadIds());
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  useEffect(() => {
    if (threads.length === 0) void dispatch(fetchThreads());
    if (tasks.length === 0) void dispatch(fetchTasks());
    if (estimates.length === 0) void dispatch(fetchEstimates());
    if (invoices.length === 0) void dispatch(fetchInvoices());
    if (appointments.length === 0) void dispatch(fetchAppointments());
    if (vehicles.length === 0) void dispatch(fetchVehicles());
  }, [
    dispatch,
    threads.length,
    tasks.length,
    estimates.length,
    invoices.length,
    appointments.length,
    vehicles.length,
  ]);

  const updateReadIds = (next: Set<string>) => {
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      window.dispatchEvent(new Event(SYNC_EVENT));
    } catch {
      // ignore
    }
  };

  const markAsRead = (id: string, threadId?: string) => {
    const next = new Set(readIds);
    next.add(id);
    updateReadIds(next);
    if (threadId) {
      void dispatch(markThreadRead(threadId));
    }
  };

  const markAsUnread = (id: string) => {
    const next = new Set(readIds);
    next.delete(id);
    updateReadIds(next);
  };

  const role = user?.role?.toLowerCase() ?? "owner";

  // 1. Build active notifications
  const notifications = useMemo(() => {
    return buildActiveNotifications({
      threads,
      estimates,
      tasks,
      invoices,
      appointments,
      readIds,
      role,
      userId: user?.id,
    });
  }, [threads, estimates, tasks, invoices, appointments, readIds, role, user?.id]);

  // 2. Build full activities
  const allActivities = useMemo(() => {
    return buildActivities({
      tasks,
      estimates,
      invoices,
      appointments,
      threads,
      vehicles,
      readIds,
      role,
    });
  }, [tasks, estimates, invoices, appointments, threads, vehicles, readIds, role]);

  const markAllAsRead = (idsToMark?: string[]) => {
    const next = new Set(readIds);
    if (idsToMark) {
      idsToMark.forEach((id) => next.add(id));
    } else {
      notifications.forEach((n) => next.add(n.id));
      allActivities.forEach((a) => next.add(a.id));
    }
    updateReadIds(next);
  };

  const clearAllRead = () => {
    updateReadIds(new Set());
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const countsByCategory = useMemo(() => {
    return {
      all: allActivities.length,
      unread: allActivities.filter((a) => a.unread).length,
      tasks: allActivities.filter((a) => a.category === "tasks").length,
      estimates: allActivities.filter((a) => a.category === "estimates").length,
      invoices: allActivities.filter((a) => a.category === "invoices").length,
      appointments: allActivities.filter((a) => a.category === "appointments").length,
      chat: allActivities.filter((a) => a.category === "chat").length,
    };
  }, [allActivities]);

  return {
    user,
    role,
    notifications,
    allActivities,
    unreadCount,
    countsByCategory,
    readIds,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    clearAllRead,
  };
}
