"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { CalendarPlus, History, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";

export default function MyVehiclesPage() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (jobs.length === 0) dispatch(fetchJobs());
  }, [dispatch, vehicles.length, jobs.length]);

  const jobsByVehicle = (vehicleId: string) => jobs.filter((j) => j.vehicleId === vehicleId);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard › My Vehicles</p>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">My Vehicles</h1>
          </div>
          <Link
            href="/dashboard/vehicles/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Plus className="size-4" />
            Register New Vehicle
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft">
              <Plus className="size-6 text-primary" />
            </span>
            <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
            <Link
              href="/dashboard/vehicles/new"
              className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Register Your First Vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const vehicleJobs = jobsByVehicle(vehicle.id);
              const activeJob = vehicleJobs.find((j) => !["completed", "ready"].includes(j.status));
              return (
                <div
                  key={vehicle.id}
                  className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <div className="relative h-40 w-full bg-secondary">
                    <Image src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
                    <span className="absolute right-3 bottom-3 rounded-sm bg-[rgba(46,49,50,0.8)] px-2.5 py-1 text-[11px] font-semibold tracking-[0.5px] text-white">
                      {vehicle.regNo}
                    </span>
                    {activeJob && (
                      <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                        In Service
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 p-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)} • {vehicle.mileage.toLocaleString()} mi
                      </p>
                    </div>
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                      <Link
                        href="/dashboard/appointments/book"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded bg-primary-soft py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        <CalendarPlus className="size-3.5" />
                        Book Service
                      </Link>
                      <Link
                        href="/dashboard/history"
                        className="flex flex-1 items-center justify-center gap-1.5 rounded border border-border py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
                      >
                        <History className="size-3.5" />
                        History ({vehicleJobs.length})
                      </Link>
                    </div>
                    {activeJob && (
                      <Link
                        href={`/dashboard/services/${activeJob.id}`}
                        className="text-center text-xs font-semibold text-primary hover:underline"
                      >
                        Track {activeJob.id} — {activeJob.status.charAt(0).toUpperCase() + activeJob.status.slice(1)}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
