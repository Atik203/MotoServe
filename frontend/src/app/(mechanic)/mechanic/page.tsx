"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Gauge,
  MessageSquare,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
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

const STEP_ORDER = ["received", "inspecting", "repairing", "testing", "completed"];

const quickActions: { label: string; icon: LucideIcon; href?: string }[] = [
  { label: "Repair Progress", icon: Wrench, href: "/mechanic/jobs" },
  { label: "Parts Request", icon: Package },
  { label: "Diagnostic Tools", icon: Gauge },
  { label: "Workshop Chat", icon: MessageSquare, href: "/mechanic/chat" },
];

export default function MechanicDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const vehicleById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const mechanicId = user?.id ?? "emp-002";

  const assignedJobs = useMemo(
    () => jobs.filter((j) => j.mechanicId === mechanicId || j.id === "JC-1044"),
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

  if (kpiCards.length === 0 || jobs.length === 0 || vehicles.length === 0) {
    return (
      <div className="bg-background min-h-screen p-[32px]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const activeIdx = activeJob ? STEP_ORDER.indexOf(activeJob.status) : -1;

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-[4px]">
            <h1 className="text-[24px] font-semibold text-foreground">Good Morning, Alex</h1>
            <p className="text-[14px] text-[#64748b]">Main Bay / Station 04 • 12 active jobs today</p>
          </div>
          <div className="flex items-center gap-[4px]">
            <Calendar className="size-[12px] text-[#64748b]" />
            <span className="text-[12px] font-semibold tracking-[0.24px] text-[#64748b]">Today, Aug 12</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[24px]">
          {kpiCards.map((kpi) => {
            const Icon = kpiIcon[kpi.icon] ?? ClipboardList;
            return (
              <div
                key={kpi.id}
                className="flex h-[104px] flex-col justify-between rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-[14px] text-[#64748b]">{kpi.label}</span>
                  <span className={cn("flex size-[32px] items-center justify-center rounded-[8px]", kpiChip[kpi.icon])}>
                    <Icon className="size-[16px]" />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-[8px]">
                  <span className="text-[32px] font-bold text-[#111827]">{kpi.value}</span>
                  <span
                    className={cn(
                      "rounded-full px-[8px] py-[2px] text-[12px] font-medium",
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

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-border pb-[9px]">
                <h2 className="flex items-center gap-[8px] text-[20px] font-semibold text-foreground">
                  <Wrench className="size-[20px]" />
                  Assigned Tasks
                </h2>
                <span className="text-[12px] font-semibold tracking-[0.24px] text-primary">View All</span>
              </div>

              <div className="flex flex-col gap-[12px]">
                {assignedJobs.map((job) => {
                  const vehicle = vehicleById.get(job.vehicleId);
                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-[16px] rounded-[8px] border border-border p-[17px]"
                    >
                      <div className="flex min-w-0 items-center gap-[16px]">
                        <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px] bg-primary-soft text-primary">
                          <Wrench className="size-[20px]" />
                        </span>
                        <div className="flex min-w-0 flex-col gap-[4px]">
                          <p className="truncate text-[14px] font-semibold text-foreground">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : job.vehicleId}
                          </p>
                          <p className="truncate text-[12px] text-[#64748b]">
                            Plate {vehicle?.regNo ?? "—"} • {job.services[0]?.name ?? job.issues}
                          </p>
                          <div className="flex items-center gap-[8px]">
                            <StatusBadge status={job.status} />
                            <PriorityPill priority={job.priority} />
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-[8px]">
                        <Button variant="outline" size="sm" asChild className="rounded-[4px] border-border bg-background text-foreground">
                          <Link href={`/mechanic/jobs/${job.id}`}>View Details</Link>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => toast.info(`Open ${job.id} to update progress`)}
                          className="rounded-[4px] bg-primary-soft text-primary hover:bg-primary/10"
                        >
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="flex items-center gap-[8px] border-b border-border pb-[9px] text-[20px] font-semibold text-foreground">
                <Package className="size-[20px]" />
                Parts Used Today
              </h2>

              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Part Name</TableHead>
                    <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Qty</TableHead>
                    <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Unit Price</TableHead>
                    <TableHead className="text-[12px] font-medium uppercase text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeJob.partsUsed.map((part) => (
                    <TableRow key={part.id} className="border-border">
                      <TableCell className="text-[14px] font-medium text-foreground">{part.name}</TableCell>
                      <TableCell className="text-[14px] text-foreground">{part.qty}</TableCell>
                      <TableCell className="text-[14px] text-foreground">${part.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-[rgba(16,185,129,0.1)] px-[9px] py-[4px] text-[12px] font-medium text-[#047857]">
                          In Stock
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-[8px]">
                {quickActions.map((action) => {
                  const content = (
                    <>
                      <action.icon className="size-[20px] text-muted-foreground" />
                      <span className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{action.label}</span>
                    </>
                  );
                  const className =
                    "flex flex-col items-center justify-center gap-[8px] rounded-[4px] border border-border bg-[#f8f9fa] py-[25px] transition-colors hover:border-primary/50";
                  return action.href ? (
                    <Link key={action.label} href={action.href} className={className}>
                      {content}
                    </Link>
                  ) : (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => toast.info(`${action.label} — coming with the backend`)}
                      className={className}
                    >
                      {content}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-[24px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Current Repair Progress</h2>
                <span className="text-[11px] font-medium text-muted-foreground">{activeJob.id}</span>
              </div>

              <div className="relative flex flex-col gap-[24px] pb-[8px] pl-[24px]">
                <div className="absolute top-[8px] bottom-[16px] left-[11px] w-[2px] bg-border" />
                {activeJob.progress.map((step, i) => {
                  const isDone = i < activeIdx;
                  const isActive = i === activeIdx;
                  return (
                    <div key={step.step} className="relative flex flex-col gap-[4px]">
                      <span
                        className={cn(
                          "absolute -left-[24px] top-0 flex size-[24px] items-center justify-center rounded-full border-2",
                          isDone && "border-primary bg-primary text-white",
                          isActive && "border-primary bg-white",
                          !isDone && !isActive && "border-border bg-muted",
                        )}
                      >
                        {isDone ? (
                          <Check className="size-[12px]" />
                        ) : isActive ? (
                          <span className="size-[8px] rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <p
                        className={cn(
                          "text-[12px] tracking-[0.24px]",
                          isActive ? "font-bold text-primary" : "font-semibold text-foreground",
                          !isDone && !isActive && "font-semibold text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>
                      {step.timestamp && <p className="text-[14px] text-muted-foreground">{step.timestamp}</p>}
                    </div>
                  );
                })}
              </div>

              <Link href={`/mechanic/jobs/${activeJob.id}`} className="text-[12px] font-semibold text-primary">
                View full timeline
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
