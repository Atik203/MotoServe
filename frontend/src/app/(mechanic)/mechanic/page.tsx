"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchParts } from "@/store/slices/partsSlice";
import { buildKpis } from "@/lib/kpis";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PriorityPill, StatusBadge } from "@/components/roles/mechanic/StatusBadge";

const kpiIcon: Record<string, LucideIcon> = {
  "clipboard-list": ClipboardList,
  wrench: Wrench,
  package: Package,
  "check-circle": CheckCircle2,
};

const kpiChip: Record<string, string> = {
  "clipboard-list": "bg-[rgba(0,82,204,0.1)] text-primary",
  wrench: "bg-[rgba(255,193,7,0.1)] text-warning",
  package: "bg-[rgba(139,80,0,0.1)] text-[#8b5000]",
  "check-circle": "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
};

const STEP_ORDER = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

const quickActions: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Repair Progress", icon: Wrench, href: "/mechanic/jobs" },
  { label: "Parts Inventory", icon: Package, href: "/mechanic/parts" },
  { label: "History", icon: ClipboardList, href: "/mechanic/history" },
];

export default function MechanicDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const jobs = useAppSelector((s) => s.jobs.items);
  const jobsStatus = useAppSelector((s) => s.jobs.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const parts = useAppSelector((s) => s.parts.items);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
    if (parts.length === 0) dispatch(fetchParts());
  }, [dispatch, parts.length]);

  const vehicleById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const mechanicId = user?.id;

  const assignedJobs = useMemo(
    () => jobs.filter((j) => (mechanicId ? j.mechanicId === mechanicId : j.mechanicId === null || j.status === "repairing")),
    [jobs, mechanicId],
  );

  const activeJob = useMemo(
    () => assignedJobs.find((j) => j.status === "repairing") ?? assignedJobs[0],
    [assignedJobs],
  );

  const kpiCards = useMemo(
    () => buildKpis("mechanic", { jobs: assignedJobs, userId: mechanicId }),
    [assignedJobs, mechanicId],
  );

  if (jobsStatus === "loading" || jobsStatus === "idle" || (jobs.length > 0 && vehicles.length === 0)) {
    return (
      <div className="bg-background min-h-screen p-8">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const firstName = user?.name.split(" ")[0] ?? "Mechanic";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const activeCount = jobs.filter((j) => !["completed", "ready"].includes(j.status)).length;
  const todayParts = assignedJobs.flatMap((j) => j.partsUsed);

  if (assignedJobs.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-foreground">{greeting}, {firstName}</h1>
              <p className="text-sm text-[#64748b]">{user?.station ?? "Main Bay"} • {activeCount} active jobs</p>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="size-3 text-[#64748b]" />
              <span className="text-xs font-semibold tracking-[0.24px] text-[#64748b]">{todayLabel}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-24 text-center">
            <Wrench className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">No assigned jobs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Jobs assigned to you by the service advisor will appear here.</p>
            </div>
            <Button asChild className="mt-2 rounded-lg text-sm font-semibold">
              <Link href="/mechanic/jobs">View All Jobs</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeIdx = activeJob ? STEP_ORDER.indexOf(activeJob.status) : -1;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-foreground">{greeting}, {firstName}</h1>
            <p className="text-sm text-[#64748b]">{user?.station ?? "Main Bay"} • {activeCount} active jobs</p>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="size-3 text-[#64748b]" />
            <span className="text-xs font-semibold tracking-[0.24px] text-[#64748b]">{todayLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {kpiCards.map((kpi) => {
            const Icon = kpiIcon[kpi.icon] ?? ClipboardList;
            return (
              <div
                key={kpi.id}
                className="flex h-[104px] flex-col justify-between rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-sm text-[#64748b]">{kpi.label}</span>
                  <span className={cn("flex size-8 items-center justify-center rounded-lg", kpiChip[kpi.icon])}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-[32px] font-bold text-[#111827]">{kpi.value}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      kpi.trend === "up"
                        ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]"
                        : "bg-[rgba(255,193,7,0.1)] text-warning",
                    )}
                  >
                    {kpi.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-border pb-[9px]">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <Wrench className="size-5" />
                  Assigned Tasks
                </h2>
                <span className="text-xs font-semibold tracking-[0.24px] text-primary">View All</span>
              </div>

              <div className="flex flex-col gap-3">
                {assignedJobs.map((job) => {
                  const vehicle = vehicleById.get(job.vehicleId);
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border p-[17px]"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Wrench className="size-5" />
                        </span>
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : job.vehicleId}
                          </p>
                          <p className="truncate text-xs text-[#64748b]">
                            Plate {vehicle?.regNo ?? "—"} • {job.services[0]?.name ?? job.issues}
                          </p>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={job.status} />
                            <PriorityPill priority={job.priority} />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" asChild className="rounded border-border bg-background text-foreground">
                          <Link href={`/mechanic/jobs/${job.id}`}>View Details</Link>
                        </Button>
                        <Button
                          size="sm"
                          asChild
                          className="rounded bg-primary-soft text-primary hover:bg-primary/10"
                        >
                          <Link href={`/mechanic/jobs/${job.id}`}>Update Progress</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-xl font-semibold text-foreground">
                <Package className="size-5" />
                Parts Used Today
              </h2>

              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part Name</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Qty</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Unit Price</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayParts.length === 0 && (
                    <TableRow className="border-border">
                      <TableCell className="py-6 text-sm text-muted-foreground" colSpan={4}>
                        No parts have been flagged for your current jobs.
                      </TableCell>
                    </TableRow>
                  )}
                  {todayParts.map((part) => {
                    const catalog = parts.find((p) => p.name.toLowerCase() === part.name.toLowerCase());
                    const stock = catalog?.stock ?? 0;
                    const pill =
                      stock <= 0
                        ? { label: "Out of Stock", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]" }
                        : stock <= 10
                          ? { label: "Low Stock", className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" }
                          : { label: "In Stock", className: "bg-[rgba(16,185,129,0.1)] text-[#047857]" };
                    return (
                      <TableRow key={part.id} className="border-border">
                        <TableCell className="text-sm font-medium text-foreground">{part.name}</TableCell>
                        <TableCell className="text-sm text-foreground">{part.qty}</TableCell>
                        <TableCell className="text-sm text-foreground">${part.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={cn("inline-flex rounded-full px-[9px] py-1 text-xs font-medium", pill.className)}>
                            {pill.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href ?? "/mechanic"}
                    className="flex flex-col items-center justify-center gap-2 rounded border border-border bg-[#f8f9fa] py-[25px] transition-colors hover:border-primary/50"
                  >
                    <action.icon className="size-5 text-muted-foreground" />
                    <span className="text-xs font-semibold tracking-[0.24px] text-foreground">{action.label}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Current Repair Progress</h2>
                <span className="text-[11px] font-medium text-muted-foreground">{activeJob.id}</span>
              </div>

              <div className="relative flex flex-col gap-6 pb-2 pl-6">
                <div className="absolute top-2 bottom-4 left-[11px] w-0.5 bg-border" />
                {activeJob.progress.map((step, i) => {
                  const isDone = i < activeIdx;
                  const isActive = i === activeIdx;
                  return (
                    <div key={step.step} className="relative flex flex-col gap-1">
                      <span
                        className={cn(
                          "absolute -left-6 top-0 flex size-6 items-center justify-center rounded-full border-2",
                          isDone && "border-primary bg-primary text-white",
                          isActive && "border-primary bg-white",
                          !isDone && !isActive && "border-border bg-muted",
                        )}
                      >
                        {isDone ? (
                          <Check className="size-3" />
                        ) : isActive ? (
                          <span className="size-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <p
                        className={cn(
                          "text-xs tracking-[0.24px]",
                          isActive ? "font-bold text-primary" : "font-semibold text-foreground",
                          !isDone && !isActive && "font-semibold text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>
                      {step.timestamp && <p className="text-sm text-muted-foreground">{step.timestamp}</p>}
                    </div>
                  );
                })}
              </div>

              <Link href={`/mechanic/jobs/${activeJob.id}`} className="text-xs font-semibold text-primary">
                View full timeline
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
