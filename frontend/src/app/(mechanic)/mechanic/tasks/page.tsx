"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { PriorityPill, StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { RowsLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const STEP_ORDER = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

type Tab = "all" | "active" | "ready";

export default function MechanicTasksPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const assigned = useMemo(
    () =>
      tasks.filter((t) =>
        user
          ? t.mechanicId === user.id ||
            t.mechanicIds?.includes(user.id) ||
            t.mechanics?.some((m) => m.id === user.id)
          : !["completed"].includes(t.status),
      ),
    [tasks, user],
  );

  const filtered = useMemo(() => {
    if (tab === "active") return assigned.filter((t) => !["completed", "ready"].includes(t.status));
    if (tab === "ready") return assigned.filter((t) => t.status === "ready");
    return assigned;
  }, [assigned, tab]);

  const activeCount = assigned.filter((t) => !["completed", "ready"].includes(t.status)).length;
  const readyCount = assigned.filter((t) => t.status === "ready").length;

  if ((tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <RowsLoading label="Loading repair progress" />
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All Tasks", count: assigned.length },
    { key: "active", label: "Active", count: activeCount },
    { key: "ready", label: "Ready", count: readyCount },
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mechanic › Repair Progress</p>
            <h1 className="text-[28px] font-bold tracking-[-0.56px] text-foreground">Repair Progress</h1>
            <p className="pt-1 text-sm text-[#64748b]">
              {activeCount} active • {readyCount} ready for pickup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 shadow-[0_1px_1px_rgba(0,0,0,0.05)] w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  tab === t.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[8px] border border-dashed border-border bg-white py-20">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="size-6 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">No {tab !== "all" ? tab : ""} tasks found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((task) => {
              const vehicle = vehicles.find((v) => v.id === task.vehicleId);
              const stepIdx = STEP_ORDER.indexOf(task.status);
              const isCompleted = task.status === "completed";
              return (
                <div
                  key={task.id}
                  className="group flex items-center justify-between gap-6 rounded-[8px] border border-border bg-white p-[20px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-all hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(0,82,204,0.08)]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-[8px]",
                        isCompleted ? "bg-[rgba(76,175,80,0.1)]" : "bg-primary-soft",
                      )}
                    >
                      <Wrench
                        className={cn("size-5", isCompleted ? "text-[#4caf50]" : "text-primary")}
                      />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
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
                      <div className="flex items-center gap-3 pt-0.5">
                        <StatusBadge status={task.status} />
                        <PriorityPill priority={task.priority} />
                        <div className="flex items-center gap-1">
                          {STEP_ORDER.map((_, i) => (
                            <span
                              key={i}
                              className={cn(
                                "size-1.5 rounded-full transition-colors",
                                i < stepIdx
                                  ? "bg-primary"
                                  : i === stepIdx
                                    ? "bg-primary/50"
                                    : "bg-[#e5e7eb]",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/mechanic/tasks/${task.id}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-[6px] bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-all hover:bg-primary/90 group-hover:shadow-[0_2px_6px_rgba(0,82,204,0.25)]"
                  >
                    Open Task
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
