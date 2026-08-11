"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
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
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchThreads } from "@/store/slices/chatSlice";
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

const schedule = [
  {
    time: "09:00",
    period: "AM",
    title: "Oil Change & Filter",
    meta: "David Smith - Ford Ranger",
    current: false,
  },
  {
    time: "10:30",
    period: "AM",
    title: "Brake Inspection",
    meta: "Emma Wilson - Honda Civic",
    current: true,
  },
];

export default function AdvisorDashboardPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const threads = useAppSelector((s) => s.chat.threads);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
    dispatch(fetchAppointments());
    dispatch(fetchEstimates());
    dispatch(fetchThreads());
  }, [dispatch]);

  const kpis = useMemo(
    () => buildKpis("advisor", { jobs, vehicles, appointments, estimates, threads }),
    [jobs, vehicles, appointments, estimates, threads],
  );

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex gap-[16px]">
          <Link
            href="/advisor/job-cards/new"
            className="flex items-center gap-[8px] rounded-[8px] bg-primary px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Plus className="size-[13.5px]" />
            Create Job Card
          </Link>
          <Link
            href="/advisor/receive"
            className="flex items-center gap-[8px] rounded-[8px] border border-[#e5e7eb] bg-white px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Truck className="size-[16px]" />
            Receive Vehicle
          </Link>
          <Link
            href="/advisor/job-cards/assign"
            className="flex items-center gap-[8px] rounded-[8px] border border-[#e5e7eb] bg-white px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <UserCheck className="size-[16px]" />
            Assign Mechanic
          </Link>
        </div>

        <div className="flex gap-[24px]">
          {kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.icon] ?? Calendar;
            return (
              <div
                key={kpi.id}
                className="flex flex-1 flex-col justify-between rounded-[8px] border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between gap-[8px] pb-[8px]">
                  <span className="text-[12px] font-semibold tracking-[0.24px] text-[#424753]">{kpi.label}</span>
                  <Icon className="size-[16px] shrink-0 text-muted-foreground" />
                </div>
                <div className="flex w-full items-end justify-between">
                  <span className="text-[24px] font-semibold tracking-[-0.24px] text-[#191c1d]">{kpi.value}</span>
                  <span className="text-[11px] font-medium text-[#64748b]">View All</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className="w-full overflow-hidden rounded-[8px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-[16px] pt-[16px] pb-[17px]">
                <h2 className="text-[20px] font-semibold text-foreground">Job Cards</h2>
                <button
                  type="button"
                  aria-label="Job card options"
                  className="rounded-[2px] px-[4px] pt-[4px] pb-[10px] text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-[18px]" />
                </button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                    <TableHead className="h-auto w-[116px] px-[16px] pt-[8px] pb-[9px] text-[12px] font-medium tracking-[0.24px] text-[#424753]">
                      ID
                    </TableHead>
                    <TableHead className="h-auto w-[148px] px-[16px] pt-[8px] pb-[9px] text-[12px] font-medium tracking-[0.24px] text-[#424753]">
                      Customer
                    </TableHead>
                    <TableHead className="h-auto w-[108px] px-[16px] pt-[8px] pb-[9px] text-[12px] font-medium tracking-[0.24px] text-[#424753]">
                      Vehicle
                    </TableHead>
                    <TableHead className="h-auto px-[16px] pt-[8px] pb-[9px] text-[12px] font-medium tracking-[0.24px] text-[#424753]">
                      Status
                    </TableHead>
                    <TableHead className="h-auto px-[16px] pt-[8px] pb-[9px] text-right text-[12px] font-medium tracking-[0.24px] text-[#424753]">
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
                        <TableCell className="px-[16px] py-[20px] text-[14px] font-medium text-[#191c1d]">
                          #{job.id}
                        </TableCell>
                        <TableCell className="px-[16px] py-[20px] text-[14px] text-[#191c1d]">
                          {customer?.name ?? "—"}
                        </TableCell>
                        <TableCell className="px-[16px] py-[13px]">
                          <p className="text-[12px] text-[#64748b]">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}
                          </p>
                          <p className="text-[14px] text-[#191c1d]">{vehicle?.regNo ?? "—"}</p>
                        </TableCell>
                        <TableCell className="px-[16px] py-[20px]">
                          <span
                            className={cn(
                              "inline-block rounded-[12px] border px-[9px] py-[3px] text-[12px] font-medium whitespace-nowrap",
                              pill.className,
                            )}
                          >
                            {pill.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-[16px] py-[18px] text-right">
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

              <button
                type="button"
                className="flex w-full items-center justify-center border-t border-[#e5e7eb] bg-[#f8f9fa] px-[8px] pt-[14.5px] pb-[10px] text-[12px] font-semibold tracking-[0.24px] text-primary"
              >
                View All Active Jobs
              </button>
            </section>

            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Today&apos;s Schedule</h2>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    aria-label="Previous appointment"
                    className="rounded-[2px] bg-[#f3f4f5] px-[4px] pt-[4px] pb-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="size-[9px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next appointment"
                    className="rounded-[2px] bg-[#f3f4f5] px-[4px] pt-[4px] pb-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="size-[9px]" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-[12px]">
                {schedule.map((slot) => (
                  <div key={slot.time} className="relative flex items-start gap-[16px]">
                    <div className="flex w-[64px] flex-col items-end gap-[2.5px] pt-[9.5px]">
                      <span
                        className={cn(
                          "text-[12px] font-semibold tracking-[0.24px]",
                          slot.current ? "text-primary" : "text-[#191c1d]",
                        )}
                      >
                        {slot.time}
                      </span>
                      <span className={cn("text-[10px]", slot.current ? "text-primary" : "text-[#64748b]")}>
                        {slot.period}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "absolute top-[8px] left-[68px] rounded-full bg-primary shadow-[0_0_0_4px_white]",
                        slot.current ? "top-[6px] left-[66px] size-[12px] bg-[#ffc107]" : "size-[8px]",
                      )}
                    />
                    <div
                      className={cn(
                        "flex flex-1 items-center justify-between gap-[16px] rounded-[4px] border p-[13px]",
                        slot.current
                          ? "border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.05)]"
                          : "border-[#e5e7eb] bg-[#f3f4f5]",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold tracking-[0.24px] text-[#191c1d]">{slot.title}</p>
                        <p className="text-[14px] text-[#424753]">{slot.meta}</p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded-[2px] border border-[#e5e7eb] bg-white px-[9px] py-[5px] text-[12px] text-[#191c1d]"
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[12px] rounded-[8px] border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Pending Estimates</h2>
                <span className="rounded-[12px] bg-[#f44336] px-[8px] py-[2px] text-[12px] text-white">3</span>
              </div>

              <div className="flex flex-col gap-[10px] rounded-[4px] border border-[#e5e7eb] p-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold tracking-[0.24px] text-[#191c1d]">John Doe</span>
                  <span className="text-[14px] font-medium text-[#f44336]">$1,250</span>
                </div>
                <p className="text-[12px] text-[#64748b]">Toyota Camry • Waiting 2h</p>
                <div className="flex gap-[8px]">
                  <button
                    type="button"
                    className="flex-1 rounded-[2px] bg-[#f3f4f5] py-[6px] text-[12px] text-[#191c1d]"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-[2px] bg-primary/10 py-[6px] text-[12px] text-primary"
                  >
                    Remind
                  </button>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-[12px] rounded-[8px] border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Messages</h2>

              <div className="flex items-start gap-[12px] rounded-[4px] border border-[#e5e7eb] p-[13px]">
                <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[12px] bg-[#ffb05f] text-[12px] font-bold text-[#754300]">
                  SJ
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-[8px]">
                    <span className="text-[12px] font-semibold tracking-[0.24px] text-[#191c1d]">Sarah Jenkins</span>
                    <span className="shrink-0 text-[10px] text-[#64748b]">10m</span>
                  </div>
                  <p className="truncate text-[12px] text-[#424753]">Is my car ready yet?</p>
                </div>
                <span className="mt-[6px] size-[8px] shrink-0 rounded-[12px] bg-primary" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
