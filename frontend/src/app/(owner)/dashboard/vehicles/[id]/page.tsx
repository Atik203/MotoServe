"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarCheck,
  ChevronRight,
  CircleDashed,
  Clock3,
  Fuel,
  Gauge,
  Hash,
  History,
  ImagePlus,
  Palette,
  Pencil,
  Settings2,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, selectVehicle } from "@/store/slices/vehiclesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { Button } from "@/components/ui/button";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function VehicleDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);

  useEffect(() => {
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (jobs.length === 0) dispatch(fetchJobs());
  }, [dispatch, vehicles.length, jobs.length]);

  const vehicle = vehicles.find((v) => v.id === params.id) ?? null;
  const vehicleJobs = useMemo(() => jobs.filter((j) => j.vehicleId === params.id), [jobs, params.id]);
  const activeJob = vehicleJobs.find((j) => !["completed", "ready"].includes(j.status)) ?? null;
  const completedCount = vehicleJobs.filter((j) => ["completed", "ready"].includes(j.status)).length;

  if (!vehicle) {
    return (
      <div className="bg-background min-h-screen p-8">
        <div className="mx-auto max-w-7xl text-sm text-muted-foreground">
          {vehicles.length === 0 ? "Loading vehicle..." : "Vehicle not found."}
        </div>
      </div>
    );
  }

  const bookService = () => {
    dispatch(selectVehicle(vehicle.id));
    router.push("/dashboard/appointments/book");
  };

  const fuelIcon = vehicle.fuelType === "electric" ? "EV" : vehicle.fuelType === "hybrid" ? "HY" : vehicle.fuelType.charAt(0).toUpperCase();

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/vehicles" className="font-medium text-muted-foreground hover:text-primary">
              Dashboard
            </Link>
            <span className="text-muted-foreground">›</span>
            <Link href="/dashboard/vehicles" className="font-medium text-muted-foreground hover:text-primary">
              My Vehicles
            </Link>
            <span className="text-muted-foreground">›</span>
            <span className="font-semibold text-foreground">{vehicle.regNo}</span>
          </nav>
          <Link
            href={`/dashboard/vehicles/${vehicle.id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Pencil className="size-3.5" />
            Edit Vehicle
          </Link>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-12">
            <div className="relative col-span-4 bg-gradient-to-br from-[#eef1f4] to-[#e3e8f0]">
              <div className="relative h-full min-h-64 p-6">
                <VehicleImage src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-contain p-5" />
              </div>
              <span className="absolute bottom-4 left-4 rounded-md bg-[rgba(46,49,50,0.85)] px-3 py-1.5 font-mono text-sm font-semibold tracking-[0.5px] text-white backdrop-blur-[2px]">
                {vehicle.regNo}
              </span>
              <span className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-[2px]">
                <span className={`size-1.5 rounded-full ${activeJob ? "bg-[#ffc107] animate-pulse" : "bg-emerald-500"}`} />
                {activeJob ? "In Service" : "Available"}
              </span>
            </div>

            <div className="col-span-8 flex flex-col justify-between gap-5 p-7">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold tracking-[0.35px] text-primary uppercase">
                  {cap(vehicle.fuelType)} • {vehicle.transmission ?? "—"}
                </p>
                <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-primary">
                    <Fuel className="size-3.5" />
                    {fuelIcon === "EV" ? "Electric" : fuelIcon === "HY" ? "Hybrid" : fuelIcon === "D" ? "Diesel" : "Gasoline"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-semibold text-[#424753]">
                    <Settings2 className="size-3.5" />
                    {vehicle.transmission ?? "Transmission"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-semibold text-[#424753]">
                    <Gauge className="size-3.5" />
                    {vehicle.mileage.toLocaleString()} mi
                  </span>
                  {vehicle.color && (
                    <span className="flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-semibold text-[#424753]">
                      <Palette className="size-3.5" />
                      {vehicle.color}
                    </span>
                  )}
                </div>
                {vehicle.vin && (
                  <p className="flex items-center gap-1.5 font-mono text-xs tracking-[0.5px] text-muted-foreground">
                    <Hash className="size-3.5" />
                    VIN: {vehicle.vin}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={bookService} className="gap-2 rounded-lg px-5">
                  <CalendarCheck className="size-4" />
                  Book Service
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/services?vehicle=${encodeURIComponent(vehicle.id)}`)}
                  className="gap-2 rounded-lg border-border bg-white px-5"
                >
                  <History className="size-4" />
                  Service History
                </Button>
                <Link
                  href={`/dashboard/vehicles/${vehicle.id}/edit`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Pencil className="size-4" />
                  Edit Vehicle
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-[#fafbfc]">
            <div className="flex items-center gap-2 px-6 py-3.5">
              <CircleDashed className="size-4 text-primary" />
              <div>
                <p className="text-[11px] font-semibold tracking-[0.24px] text-muted-foreground uppercase">Status</p>
                <p className="text-sm font-semibold text-foreground">{activeJob ? "Workshop" : "At home"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 py-3.5">
              <Wrench className="size-4 text-primary" />
              <div>
                <p className="text-[11px] font-semibold tracking-[0.24px] text-muted-foreground uppercase">Services Done</p>
                <p className="text-sm font-semibold text-foreground">{completedCount} completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-6 py-3.5">
              <ImagePlus className="size-4 text-primary" />
              <div>
                <p className="text-[11px] font-semibold tracking-[0.24px] text-muted-foreground uppercase">Photos</p>
                <p className="text-sm font-semibold text-foreground">{(vehicle.photos ?? []).length + 1} attached</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7 rounded-[12px] border border-border bg-white p-7 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.24px] text-foreground">
              <Settings2 className="size-4.5 text-primary" />
              Vehicle Information
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-8">
              {[
                { label: "Brand", value: vehicle.make },
                { label: "Model", value: vehicle.model },
                { label: "Model Year", value: String(vehicle.year) },
                { label: "Registration No.", value: vehicle.regNo },
                { label: "Color", value: vehicle.color ?? "—" },
                { label: "Fuel Type", value: cap(vehicle.fuelType) },
                { label: "Transmission", value: vehicle.transmission ?? "—" },
                { label: "Mileage", value: `${vehicle.mileage.toLocaleString()} mi` },
                { label: "VIN", value: vehicle.vin ?? "—", mono: true },
                { label: "Owner ID", value: vehicle.ownerId, mono: true },
              ].map((row, i) => (
                <div key={row.label} className={`py-3.5 ${i >= 8 ? "border-t" : i % 2 === 0 ? "" : ""} ${i % 2 === 0 ? "border-b border-border" : "border-b border-border"}`}>
                  <p className="text-[11px] font-semibold tracking-[0.24px] text-muted-foreground uppercase">{row.label}</p>
                  <p className={`pt-1 text-sm font-semibold text-foreground ${row.mono ? "font-mono" : ""}`}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-5 flex flex-col gap-6">
            <div className="rounded-[12px] border border-border bg-white p-7 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.24px] text-foreground">
                <ImagePlus className="size-4.5 text-primary" />
                Photos
              </h2>
              {(vehicle.photos ?? []).length === 0 ? (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-[#fafbfc] py-8 text-center">
                  <ImagePlus className="size-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No extra photos attached.
                    <br />
                    Add them from the Edit page.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[vehicle.image, ...(vehicle.photos ?? [])]
                    .filter((x, i, arr) => x && (i === 0 || arr.indexOf(x) === i))
                    .map((key, i) => (
                      <div key={`${key}-${i}`} className={`overflow-hidden rounded-lg border border-border bg-[#eef1f4] ${i === 0 ? "col-span-2 h-44" : "h-24"}`}>
                        <div className="relative h-full w-full">
                          <VehicleImage src={key} alt={`${vehicle.model} photo ${i + 1}`} fill className={i === 0 ? "object-contain p-3" : "object-cover"} />
                        </div>
                        {i === 0 && (
                          <span className="absolute top-2 left-2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {activeJob && (
              <div className="rounded-[12px] border border-[#b3c9ff] bg-[#eff6ff] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary">
                      <Wrench className="size-4.5 text-white" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Active Job</p>
                      <p className="font-mono text-xs font-semibold text-primary">{activeJob.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={activeJob.status} />
                </div>
                <p className="pt-3 text-xs leading-relaxed text-[#424753]">
                  {activeJob.services.map((s) => s.name).join(", ") || "General service in progress"}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/dashboard/services/${activeJob.id}`)}
                  className="mt-3 gap-1 rounded-lg px-3 text-xs font-semibold text-primary hover:bg-primary-soft"
                >
                  Track progress
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between px-7 pt-6 pb-4">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-[-0.24px] text-foreground">
              <History className="size-4.5 text-primary" />
              Service History
            </h2>
            <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#424753]">
              {vehicleJobs.length} record{vehicleJobs.length === 1 ? "" : "s"}
            </span>
          </div>
          {vehicleJobs.length === 0 ? (
            <div className="mx-7 mb-7 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-[#fafbfc] py-12">
              <CircleDashed className="size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No service records yet for this vehicle.</p>
              <Button onClick={bookService} className="gap-2 rounded-lg">
                <CalendarCheck className="size-4" />
                Book a Service
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border px-7 pb-2">
              {vehicleJobs.map((job) => (
                <div key={job.id} className="flex items-center gap-4 py-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                    <Wrench className="size-4.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
                      {job.id}
                      <span className="flex items-center gap-1 font-sans text-[11px] font-medium text-muted-foreground">
                        <Clock3 className="size-3" />
                        {job.progress.length > 0 && job.progress[0]?.timestamp
                          ? new Date(job.progress[0].timestamp).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "In progress"}
                      </span>
                    </p>
                    <p className="truncate pt-1 text-sm text-[#424753]">
                      {job.services.map((s) => s.name).join(" • ") || job.issues}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                  <Link
                    href={`/dashboard/services/${job.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Details
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}