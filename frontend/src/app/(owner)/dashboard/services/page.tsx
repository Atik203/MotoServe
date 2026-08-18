"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2, ChevronRight, Gauge } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";

export default function ServiceTrackingListPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const vehicleFilter =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("vehicle") : null;

  useEffect(() => {
    if (jobs.length === 0) dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, jobs.length, vehicles.length]);

  const filteredJobs = vehicleFilter ? jobs.filter((j) => j.vehicleId === vehicleFilter) : jobs;
  const activeJobs = filteredJobs.filter((j) => !["completed", "ready"].includes(j.status));
  const pastJobs = filteredJobs.filter((j) => ["completed", "ready"].includes(j.status));
  const filterVehicle = vehicleFilter ? vehicles.find((v) => v.id === vehicleFilter) ?? null : null;

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

        {filteredJobs.length === 0 ? (
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
            {activeJobs.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground">In Progress</h2>
                {activeJobs.map((job) => {
                  const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                  return (
                    <div
                      key={job.id}
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
                          <StatusBadge status={job.status} />
                        </div>
                        <ProgressStepper steps={job.progress} size="sm" />
                      </div>
                      <Link
                        href={`/dashboard/services/${job.id}`}
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

            {pastJobs.length > 0 && (
              <section className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-foreground">Completed</h2>
                <div className="flex flex-col gap-3">
                  {pastJobs.map((job) => {
                    const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                    return (
                      <div
                        key={job.id}
                        className="flex items-center justify-between gap-6 rounded-lg border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="size-5 text-[#4caf50]" />
                          <p className="text-sm font-semibold text-foreground">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </p>
                          <span className="text-xs text-muted-foreground">Job {job.id}</span>
                        </div>
                        <Link href={`/dashboard/services/${job.id}`} className="text-xs font-semibold text-primary hover:underline">
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
