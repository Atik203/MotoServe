"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2, ChevronRight, Gauge } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";
import { RowsLoading } from "@/components/ui/loading";

export default function ServiceTrackingListPage() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const vehicleFilter =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("vehicle") : null;

  useEffect(() => {
    if (tasks.length === 0) dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, tasks.length, vehicles.length]);

  const filteredTasks = vehicleFilter ? tasks.filter((t) => t.vehicleId === vehicleFilter) : tasks;
  const activeTasks = filteredTasks.filter((t) => !["completed", "ready"].includes(t.status));
  const pastTasks = filteredTasks.filter((t) => ["completed", "ready"].includes(t.status));
  const filterVehicle = vehicleFilter ? vehicles.find((v) => v.id === vehicleFilter) ?? null : null;

  if ((tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <RowsLoading label="Loading services" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Dashboard › Service Tracking{filterVehicle ? ` › ${filterVehicle.year} ${filterVehicle.make} ${filterVehicle.model}` : ""}
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Service Tracking</h1>
            {filterVehicle && (
              <Link href="/dashboard/services" className="text-xs font-semibold text-primary hover:underline">
                Clear filter — show all vehicles
              </Link>
            )}
          </div>
          <p className="pt-1 text-sm text-[#424753]">
            {filterVehicle
              ? `Service records for ${filterVehicle.regNo}.`
              : "Follow the live progress of your vehicles in the workshop."}
          </p>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <Gauge className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filterVehicle ? "No service records for this vehicle yet." : "No service records found."}
            </p>
            <Link href="/dashboard/appointments/book" className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white">
              Book a Service
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {activeTasks.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground">In Progress</h2>
                {activeTasks.map((task) => {
                  const vehicle = vehicles.find((v) => v.id === task.vehicleId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                    >
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-secondary">
                        {vehicle && <VehicleImage src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <p className="text-base font-semibold text-foreground">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </p>
                          <span className="rounded-sm bg-[#edeeef] px-2 py-0.5 font-mono text-xs text-[#424753]">{vehicle?.regNo}</span>
                          <StatusBadge status={task.status} />
                        </div>
                        <ProgressStepper steps={task.progress} size="sm" />
                      </div>
                      <Link
                        href={`/dashboard/services/${task.id}`}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                      >
                        View Details
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </section>
            )}

            {pastTasks.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground">Completed</h2>
                <div className="flex flex-col gap-3">
                  {pastTasks.map((task) => {
                    const vehicle = vehicles.find((v) => v.id === task.vehicleId);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-6 rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="size-5 text-[#4caf50]" />
                          <p className="text-sm font-semibold text-foreground">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </p>
                          <span className="text-xs text-muted-foreground">Task {task.id}</span>
                        </div>
                        <Link href={`/dashboard/services/${task.id}`} className="text-xs font-semibold text-primary hover:underline">
                          View Details
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
