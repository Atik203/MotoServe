"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  MessageSquare,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Truck,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchAppointments, updateAppointmentStatus } from "@/store/slices/appointmentsSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchThreads } from "@/store/slices/chatSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { buildKpis } from "@/lib/kpis";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobStatus } from "@/types";

const kpiIcons: Record<string, typeof Calendar> = {
  calendar: Calendar,
  wrench: Wrench,
  "file-check": FileCheck,
  car: Car,
  "message-square": MessageSquare,
  "check-circle": CheckCircle2,
};

const statusPills: Record<JobStatus, { label: string; className: string }> = {
  received: {
    label: "Received",
    className: "border-[rgba(100,116,139,0.2)] bg-[rgba(100,116,139,0.1)] text-[#64748b]",
  },
  inspecting: {
    label: "Inspecting",
    className: "border-[rgba(100,116,139,0.2)] bg-[rgba(100,116,139,0.1)] text-[#64748b]",
  },
  repairing: {
    label: "In Progress",
    className: "border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] text-[#ffc107]",
  },
  testing: {
    label: "Waiting Parts",
    className: "border-[rgba(244,67,54,0.2)] bg-[rgba(244,67,54,0.1)] text-[#f44336]",
  },
  ready: {
    label: "Ready for Pickup",
    className: "border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
  },
  completed: {
    label: "Completed",
    className: "border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
  },
};

const appointmentStatus: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
  confirmed: { label: "Confirmed", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" },
  cancelled: { label: "Cancelled", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]" },
};

export default function AdvisorDashboardPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const threads = useAppSelector((s) => s.chat.threads);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
    dispatch(fetchAppointments());
    dispatch(fetchEstimates());
    dispatch(fetchThreads());
    dispatch(fetchServices());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const kpis = useMemo(
    () => buildKpis("advisor", { jobs, vehicles, appointments, estimates, threads }),
    [jobs, vehicles, appointments, estimates, threads],
  );

  const pendingEstimates = estimates.filter((e) => e.status === "pending");
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a) => a.date === todayKey);
  const scheduleSlots = (todayAppointments.length > 0 ? todayAppointments : appointments.slice(0, 4)).map((a) => ({
    appointment: a,
    time: a.time,
    title: a.serviceIds.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "Vehicle service",
    meta: `${a.owner?.name ?? "Owner"} • ${a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : "Vehicle"}`,
    current: a.status === "pending",
  }));
  const unreadThread = threads.find((t) => t.unread > 0) ?? threads[0] ?? null;

  const setAppointmentStatus = async (id: string, status: "confirmed" | "cancelled") => {
    try {
      await dispatch(updateAppointmentStatus({ id, status })).unwrap();
      toast.success(status === "confirmed" ? "Appointment confirmed" : "Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex gap-4">
          <Link
            href="/advisor/job-cards/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Plus className="size-[13.5px]" />
            Create Job Card
          </Link>
          <Link
            href="/advisor/receive"
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Truck className="size-4" />
            Receive Vehicle
          </Link>
          <Link
            href="/advisor/job-cards/assign"
            className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <UserCheck className="size-4" />
            Assign Mechanic
          </Link>
        </div>

        <div className="flex gap-6">
          {kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.icon] ?? Calendar;
            return (
              <div
                key={kpi.id}
                className="flex flex-1 flex-col justify-between rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between gap-2 pb-2">
                  <span className="text-xs font-semibold tracking-[0.24px] text-[#424753]">{kpi.label}</span>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex w-full items-end justify-between">
                  <span className="text-2xl font-semibold tracking-[-0.24px] text-[#191c1d]">{kpi.value}</span>
                  <span className="text-[11px] font-medium text-[#64748b]">View All</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="w-full overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-4 pt-4 pb-[17px]">
                <h2 className="text-xl font-semibold text-foreground">Job Cards</h2>
                <button
                  type="button"
                  aria-label="Job card options"
                  className="rounded-sm px-1 pt-1 pb-2.5 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-[18px]" />
                </button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                    <TableHead className="h-auto w-[116px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                      ID
                    </TableHead>
                    <TableHead className="h-auto w-[148px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                      Customer
                    </TableHead>
                    <TableHead className="h-auto w-[108px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                      Vehicle
                    </TableHead>
                    <TableHead className="h-auto px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                      Status
                    </TableHead>
                    <TableHead className="h-auto px-4 pt-2 pb-[9px] text-right text-xs font-medium tracking-[0.24px] text-[#424753]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job, i) => {
                    const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                    const customer = job.customer;
                    const pill = statusPills[job.status];
                    return (
                      <TableRow
                        key={job.id}
                        className={cn("border-[#e5e7eb] hover:bg-transparent", i % 2 === 1 && "bg-[rgba(243,244,245,0.3)]")}
                      >
                        <TableCell className="px-4 py-5 text-sm font-medium text-[#191c1d]">
                          #{job.id}
                        </TableCell>
                        <TableCell className="px-4 py-5 text-sm text-[#191c1d]">
                          {customer?.name ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-[13px]">
                          <p className="text-xs text-[#64748b]">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}
                          </p>
                          <p className="text-sm text-[#191c1d]">{vehicle?.regNo ?? "—"}</p>
                        </TableCell>
                        <TableCell className="px-4 py-5">
                          <span
                            className={cn(
                              "inline-block rounded-xl border px-[9px] py-0.75 text-xs font-medium whitespace-nowrap",
                              pill.className,
                            )}
                          >
                            {pill.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-[18px] text-right">
                          <button
                            type="button"
                            aria-label={`Options for ${job.id}`}
                            className="inline-flex items-center justify-center pb-[5px] text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="size-[13px]" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Link
                href="/advisor/job-cards/assign"
                className="flex w-full items-center justify-center border-t border-[#e5e7eb] bg-[#f8f9fa] px-2 pt-[14.5px] pb-2.5 text-xs font-semibold tracking-[0.24px] text-primary hover:underline"
              >
                View All Active Jobs
              </Link>
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Today&apos;s Schedule</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous appointment"
                    className="rounded-sm bg-[#f3f4f5] px-1 pt-1 pb-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="size-[9px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next appointment"
                    className="rounded-sm bg-[#f3f4f5] px-1 pt-1 pb-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="size-[9px]" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {scheduleSlots.length === 0 ? (
                  <div className="rounded border border-dashed border-[#e5e7eb] px-4 py-10 text-center text-sm text-muted-foreground">
                    No appointments scheduled.
                  </div>
                ) : (
                  scheduleSlots.map((slot) => {
                    const pill = appointmentStatus[slot.appointment.status] ?? appointmentStatus.pending;
                    return (
                      <div key={slot.appointment.id} className="relative flex items-start gap-4">
                        <div className="flex w-16 flex-col items-end gap-[2.5px] pt-[9.5px]">
                          <span
                            className={cn(
                              "text-xs font-semibold tracking-[0.24px]",
                              slot.current ? "text-primary" : "text-[#191c1d]",
                            )}
                          >
                            {slot.time}
                          </span>
                          <span className={cn("text-[10px]", slot.current ? "text-primary" : "text-[#64748b]")}>
                            {slot.appointment.status}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "absolute top-2 left-17 rounded-full bg-primary shadow-[0_0_0_4px_white]",
                            slot.current ? "top-1.5 left-[66px] size-3 bg-[#ffc107]" : "size-2",
                          )}
                        />
                        <div
                          className={cn(
                            "flex flex-1 items-center justify-between gap-4 rounded border p-[13px]",
                            slot.current
                              ? "border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.05)]"
                              : "border-[#e5e7eb] bg-[#f3f4f5]",
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-semibold tracking-[0.24px] text-[#191c1d]">
                                {slot.title}
                              </p>
                              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", pill.className)}>
                                {pill.label}
                              </span>
                            </div>
                            <p className="truncate text-sm text-[#424753]">{slot.meta}</p>
                          </div>
                          {slot.appointment.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => void setAppointmentStatus(slot.appointment.id, "confirmed")}
                              className="shrink-0 rounded-sm bg-primary px-[9px] py-[5px] text-xs font-semibold text-white"
                            >
                              Confirm
                            </button>
                          )}
                          {(slot.appointment.status === "pending" || slot.appointment.status === "confirmed") && (
                            <button
                              type="button"
                              onClick={() => void setAppointmentStatus(slot.appointment.id, "cancelled")}
                              className="shrink-0 rounded-sm border border-[#e5e7eb] bg-white px-[9px] py-[5px] text-xs text-[#ba1a1a]"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Pending Estimates</h2>
                <span className="rounded-xl bg-[#f44336] px-2 py-0.5 text-xs text-white">
                  {pendingEstimates.length}
                </span>
              </div>

              {pendingEstimates.length === 0 ? (
                <div className="rounded border border-dashed border-[#e5e7eb] px-4 py-8 text-center text-sm text-muted-foreground">
                  No pending estimates.
                </div>
              ) : (
                pendingEstimates.slice(0, 3).map((estimate) => {
                  const customer = customers.find((c) => c.id === estimate.customerId);
                  const vehicle = estimate.jobCard && "vehicle" in estimate.jobCard ? estimate.jobCard.vehicle : undefined;
                  return (
                    <div key={estimate.id} className="flex flex-col gap-2.5 rounded border border-[#e5e7eb] p-[13px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-[0.24px] text-[#191c1d]">
                          {customer?.name ?? "Owner"}
                        </span>
                        <span className="text-sm font-medium text-[#f44336]">${estimate.total.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-[#64748b]">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"} • {estimate.id}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href={`/advisor/estimates/new`}
                          className="flex-1 rounded-sm bg-[#f3f4f5] py-1.5 text-center text-xs text-[#191c1d]"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => toast.success(`Reminder sent to ${customer?.name ?? "owner"}`)}
                          className="flex-1 rounded-sm bg-primary/10 py-1.5 text-xs text-primary"
                        >
                          Remind
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Messages</h2>
                <Link href="/advisor/chat" className="text-xs font-semibold text-primary hover:underline">
                  View All
                </Link>
              </div>

              {unreadThread ? (
                <Link
                  href="/advisor/chat"
                  className="flex items-start gap-3 rounded border border-[#e5e7eb] p-[13px] transition-colors hover:border-primary/40"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#ffb05f] text-xs font-bold text-[#754300]">
                    {unreadThread.owner?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) ?? "O"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold tracking-[0.24px] text-[#191c1d]">
                        {unreadThread.owner?.name ?? "Vehicle Owner"}
                      </span>
                      <span className="shrink-0 text-[10px] text-[#64748b]">
                        {new Date(unreadThread.lastMessageAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[#424753]">
                      {unreadThread.messages[unreadThread.messages.length - 1]?.text ?? unreadThread.subject}
                    </p>
                  </div>
                  {unreadThread.unread > 0 && (
                    <span className="mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {unreadThread.unread}
                    </span>
                  )}
                </Link>
              ) : (
                <div className="rounded border border-dashed border-[#e5e7eb] px-4 py-8 text-center text-sm text-muted-foreground">
                  No messages yet.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
