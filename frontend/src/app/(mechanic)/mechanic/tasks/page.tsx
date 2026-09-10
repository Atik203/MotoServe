"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, ClipboardList, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { PriorityPill, StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { RowsLoading } from "@/components/ui/loading";

export default function MechanicTasksPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const assigned = tasks.filter((t) => (user ? t.mechanicId === user.id : !["completed", "ready"].includes(t.status)));
  const current = assigned.filter((t) => !["completed", "ready"].includes(t.status));

  if ((tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <RowsLoading label="Loading tasks" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Mechanic › Repair Progress</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Current Tasks</h1>
          <p className="pt-1 text-sm text-[#424753]">{current.length} active task{current.length === 1 ? "" : "s"} assigned to you.</p>
        </div>

        {assigned.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <ClipboardList className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {assigned.map((task) => {
              const vehicle = vehicles.find((v) => v.id === task.vehicleId);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                      <Wrench className="size-5 text-primary" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-base font-semibold text-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                        <span className="rounded-sm bg-[#edeeef] px-2 py-0.5 font-mono text-xs text-[#424753]">{vehicle?.regNo}</span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {task.id} • {task.services[0]?.name ?? task.issues}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <StatusBadge status={task.status} />
                        <PriorityPill priority={task.priority} />
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/mechanic/tasks/${task.id}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
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
