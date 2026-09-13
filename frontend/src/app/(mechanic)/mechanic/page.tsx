"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
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
import { DashboardLoading } from "@/components/ui/loading";

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

const quickActions: { label: string; icon: LucideIcon; href: string }[] = [
  { label: "Repair Progress", icon: Wrench, href: "/mechanic/tasks" },
  { label: "Parts Request", icon: Package, href: "/mechanic/parts" },
  { label: "History", icon: ClipboardList, href: "/mechanic/history" },
];

export default function MechanicDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const parts = useAppSelector((s) => s.parts.items);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    if (parts.length === 0) dispatch(fetchParts());
  }, [dispatch, parts.length]);

  const vehicleById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const mechanicId = user?.id;

  const assignedTasks = useMemo(
    () =>
      tasks.filter((j) =>
        mechanicId
          ? j.mechanicId === mechanicId ||
            j.mechanicIds?.includes(mechanicId) ||
            j.mechanics?.some((m) => m.id === mechanicId)
          : j.mechanicId === null || j.status === "repairing",
      ),
    [tasks, mechanicId],
  );

  const activeTasks = useMemo(
    () => assignedTasks.filter((j) => !["completed", "ready"].includes(j.status)),
    [assignedTasks],
  );

  const activeTask = useMemo(
    () => assignedTasks.find((j) => j.status === "repairing") ?? assignedTasks[0],
    [assignedTasks],
  );

  const kpiCards = useMemo(
    () => buildKpis("mechanic", { tasks: assignedTasks, userId: mechanicId }),
    [assignedTasks, mechanicId],
  );

  if (tasksStatus === "loading" || tasksStatus === "idle" || (tasks.length > 0 && vehicles.length === 0)) {
    return <DashboardLoading label="Loading mechanic dashboard" />;
  }

  const firstName = user?.name?.split(" ")[0] ?? "Mechanic";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const todayParts = assignedTasks.flatMap((j) => j.partsUsed);

  if (assignedTasks.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-[#64748b]">Welcome back</p>
              <h1 className="text-2xl font-semibold text-foreground">{greeting}, {firstName}</h1>
              <p className="text-sm text-[#64748b]">{user?.station ?? "Main Bay"} • No active tasks</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Calendar className="size-3.5 text-[#64748b]" />
              <span className="text-xs font-semibold tracking-[0.24px] text-[#64748b]">{todayLabel}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 rounded-[12px] border border-dashed border-border bg-white py-24 text-center shadow-[0_1px_1.5px_rgba(0,0,0,0.1)]">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft">
              <Wrench className="size-7 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">No assigned tasks yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Tasks assigned to you by the service advisor will appear here.</p>
            </div>
            <Button asChild className="mt-2 rounded-lg text-sm font-semibold">
              <Link href="/mechanic/tasks">View All Tasks</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeIdx = activeTask ? STEP_ORDER.indexOf(activeTask.status) : -1;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#64748b]">Welcome back</p>
            <h1 className="text-2xl font-semibold text-foreground">{greeting}, {firstName}</h1>
            <p className="text-sm text-[#64748b]">{user?.station ?? "Main Bay"} • {activeTasks.length} active task{activeTasks.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Calendar className="size-3.5 text-[#64748b]" />
            <span className="text-xs font-semibold tracking-[0.24px] text-[#64748b]">{todayLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpiIcon[kpi.icon] ?? ClipboardList;
            return (
              <div
                key={kpi.id}
                className="flex h-[104px] flex-col justify-between rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-sm text-[#64748b]">{kpi.label}</span>
                  <span className={cn("flex size-8 items-center justify-center rounded-lg", kpiChip[kpi.icon])}>
                    <Icon className="size-4" />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className="text-[32px] font-bold leading-none text-[#111827]">{kpi.value}</span>
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

            <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-border pb-[9px]">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Wrench className="size-4 text-primary" />
                  My Active Tasks
                </h2>
                <Link href="/mechanic/tasks" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View All <ArrowRight className="size-3" />
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {activeTasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <CheckCircle2 className="size-8 text-[#4caf50]" />
                    <p className="text-sm text-muted-foreground">All tasks completed!</p>
                  </div>
                ) : (
                  activeTasks.map((task) => {
                    const vehicle = vehicleById.get(task.vehicleId);
                    const stepIdx = STEP_ORDER.indexOf(task.status);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-border p-[17px] transition-colors hover:bg-[#f9fafb]"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                            <Wrench className="size-5 text-primary" />
                          </span>
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : task.vehicleId}
                              </p>
                              {vehicle?.regNo && (
                                <span className="shrink-0 rounded bg-[#edeeef] px-1.5 py-0.5 font-mono text-xs text-[#424753]">
                                  {vehicle.regNo}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-[#64748b]">
                              {task.id} • {task.services[0]?.name ?? task.issues}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <StatusBadge status={task.status} />
                              <PriorityPill priority={task.priority} />
                              <div className="flex items-center gap-1 pl-1">
                                {STEP_ORDER.slice(0, 6).map((step, i) => (
                                  <span
                                    key={step}
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      i < stepIdx ? "bg-primary" : i === stepIdx ? "bg-primary/60" : "bg-border",
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/mechanic/tasks/${task.id}`}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-[#f9fafb] px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          Open Task
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="flex items-center gap-2 border-b border-border pb-[9px] text-base font-semibold text-foreground">
                <Package className="size-4 text-[#8b5000]" />
                Parts Used Today
              </h2>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Part Name</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Task</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Qty</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Unit Price</TableHead>
                    <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayParts.length === 0 && (
                    <TableRow className="border-border">
                      <TableCell className="py-6 text-sm text-muted-foreground" colSpan={5}>
                        No parts have been flagged for your current tasks.
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
                    const taskCard = assignedTasks.find((t) => t.partsUsed.some((p) => p.id === part.id));
                    return (
                      <TableRow key={part.id} className="border-border">
                        <TableCell className="text-sm font-medium text-foreground">{part.name}</TableCell>
                        <TableCell className="font-mono text-xs text-[#64748b]">{taskCard?.id ?? "—"}</TableCell>
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
            <section className="flex flex-col gap-3 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center justify-center gap-2 rounded-[8px] border border-border bg-[#f8f9fa] py-[20px] transition-all hover:border-primary/50 hover:bg-primary-soft hover:shadow-[0_1px_4px_rgba(0,82,204,0.12)]"
                  >
                    <action.icon className="size-5 text-muted-foreground" />
                    <span className="text-center text-xs font-semibold tracking-[0.24px] text-foreground leading-tight">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {activeTask && (
              <section className="flex flex-col gap-5 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Current Repair Progress</h2>
                  <span className="rounded bg-[#edeeef] px-2 py-0.5 font-mono text-[11px] font-medium text-[#64748b]">
                    {activeTask.id}
                  </span>
                </div>

                <div className="relative flex flex-col gap-5 pb-2 pl-6">
                  <div className="absolute top-2 bottom-4 left-[11px] w-0.5 bg-border" />
                  {activeTask.progress.map((step, i) => {
                    const isDone = i < activeIdx;
                    const isActive = i === activeIdx;
                    return (
                      <div key={step.step} className="relative flex flex-col gap-0.5">
                        <span
                          className={cn(
                            "absolute -left-6 top-0 flex size-[22px] items-center justify-center rounded-full border-2",
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
                            !isDone && !isActive && "font-medium text-muted-foreground",
                          )}
                        >
                          {step.label}
                        </p>
                        {step.timestamp && (
                          <p className="text-[11px] text-muted-foreground">{step.timestamp}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={`/mechanic/tasks/${activeTask.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  View full timeline <ArrowRight className="size-3" />
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
