"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  Calendars,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck,
  Gauge,
  Plus,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, selectVehicle } from "@/store/slices/vehiclesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { buildKpis } from "@/lib/kpis";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";

const JOB_STEPS = ["received", "inspecting", "repairing", "testing", "ready"] as const;

const kpiIcons: Record<string, typeof Calendar> = {
  calendar: Calendar,
  wrench: Wrench,
  car: Car,
  wallet: Wallet,
  bell: Bell,
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function timeAgo(ts: string | number | Date, now: number): string {
  const diff = now - new Date(ts).getTime();
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ActivityItem {
  id: string;
  icon: typeof FileCheck;
  tint: string;
  title: string;
  body: string;
  href?: string;
  at: number;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const services = useAppSelector((s) => s.services.items);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchJobs());
    dispatch(fetchEstimates());
    dispatch(fetchAppointments());
    dispatch(fetchServices());
    dispatch(fetchInvoices());
  }, [dispatch]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const vehicleById = (id?: string | null) => (id ? vehicles.find((v) => v.id === id) : undefined);

  const [now] = useState(() => Date.now());

  const kpis = useMemo(() => buildKpis("owner", { jobs, vehicles }), [jobs, vehicles]);

  const activeJobs = useMemo(
    () => jobs.filter((j) => ["received", "inspecting", "repairing", "testing"].includes(j.status)),
    [jobs],
  );
  const activeJob = activeJobs[0] ?? null;
  const activeVehicle = activeJob ? vehicleById(activeJob.vehicleId) : undefined;
  const jobStepIndex = activeJob ? JOB_STEPS.indexOf(activeJob.status as (typeof JOB_STEPS)[number]) : -1;

  const pendingEstimates = useMemo(() => estimates.filter((e) => e.status === "pending"), [estimates]);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== "cancelled")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 3),
    [appointments],
  );

  const dueInvoices = useMemo(
    () => invoices.filter((i) => i.status !== "paid").sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [invoices],
  );

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    let i = 0;
    for (const e of pendingEstimates) {
      items.push({
        id: `est-${e.id}`,
        icon: FileCheck,
        tint: "bg-[rgba(0,91,191,0.1)]",
        title: "Estimate awaiting review",
        body: `${e.summary}`,
        href: `/dashboard/estimates/${e.id}`,
        at: new Date(e.createdAt).getTime(),
      });
      if (++i >= 4) break;
    }
    for (const j of jobs) {
      if (j.status === "ready") {
        const v = vehicleById(j.vehicleId);
        items.push({
          id: `ready-${j.id}`,
          icon: CheckCircle2,
          tint: "bg-[rgba(76,175,80,0.1)]",
          title: "Ready for pickup",
          body: `${v ? `${v.year} ${v.make} ${v.model} ` : ""}${j.services.map((s) => s.name).join(", ")}`,
          href: `/dashboard/services/${j.id}`,
          at: new Date(j.progress[j.progress.length - 1]?.timestamp ?? now).getTime(),
        });
      } else if (j.status === "completed") {
        items.push({
          id: `done-${j.id}`,
          icon: CheckCircle2,
          tint: "bg-[rgba(76,175,80,0.1)]",
          title: "Service completed",
          body: `${j.services.map((s) => s.name).join(", ")} finished for your vehicle`,
          href: `/dashboard/services/${j.id}`,
          at: new Date(j.progress[j.progress.length - 1]?.timestamp ?? now).getTime(),
        });
      }
    }
    for (const a of upcomingAppointments) {
      if (a.status === "confirmed") {
        const v = vehicleById(a.vehicleId);
        items.push({
          id: `apt-${a.id}`,
          icon: Calendar,
          tint: "bg-[rgba(255,193,7,0.12)]",
          title: "Appointment confirmed",
          body: `${v ? `${v.make} ${v.model} ` : "Vehicle "}— ${new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${a.time}`,
          href: "/dashboard/appointments",
          at: new Date(a.createdAt).getTime(),
        });
      }
    }
    for (const inv of dueInvoices) {
      const v = vehicleById(inv.vehicleId);
      items.push({
        id: `inv-${inv.id}`,
        icon: Wallet,
        tint: "bg-[rgba(186,26,26,0.08)]",
        title: `Invoice ${inv.id} pending`,
        body: `${v ? `${v.make} ${v.model} — ` : ""}${inv.total.toLocaleString("en-US", { style: "currency", currency: "USD" })} due for ${cap(inv.status)} payment`,
        href: "/dashboard/payments",
        at: new Date(inv.issuedAt).getTime(),
      });
    }
    return items.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [pendingEstimates, jobs, upcomingAppointments, dueInvoices, invoices, now]);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Welcome back, {firstName}!</h1>
            <p className="pt-1 text-base text-[#414754]">
              {activeJob
                ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} registered — ${activeJobs.length} service${activeJobs.length === 1 ? "" : "s"} tracking right now.`
                : "Your fleet is all clear. Book a service or register a new vehicle anytime."}
            </p>
          </div>
          <Link
            href={vehicles.length > 0 ? "/dashboard/appointments/book" : "/dashboard/vehicles/new"}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-primary/90"
          >
            <Plus className="size-4" />
            {vehicles.length > 0 ? "Book a Service" : "Register a Vehicle"}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.icon] ?? Calendar;
            return (
              <div
                key={kpi.id}
                className="flex min-h-32 flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="text-xs font-semibold tracking-[0.6px] text-[#414754] uppercase">{kpi.label}</span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                    <Icon className="size-4 text-primary" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.24px] text-foreground">{kpi.value}</p>
                  <p
                    className={cn(
                      "flex items-center gap-1 pt-0.5 text-[11px] font-medium",
                      kpi.trend === "up" ? "text-[#4caf50]" : kpi.trend === "down" ? "text-[#ba1a1a]" : "text-muted-foreground",
                    )}
                  >
                    {kpi.trend === "up" && <ArrowUpRight className="size-[11.7px]" />}
                    {kpi.trend === "down" && <span className="size-[12.8px]">!</span>}
                    {kpi.delta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Active Service</h2>
                {activeJob && <StatusBadge status={activeJob.status as never} />}
              </div>

              {activeJob && activeVehicle ? (
                <>
                  <div className="flex items-center rounded-lg border border-[#e2e8f0] bg-secondary p-[17px]">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-[#eef1f4]">
                      <VehicleImage src={activeVehicle.image} alt={activeVehicle.model} fill className="object-contain p-1" />
                    </div>
                    <div className="min-w-0 flex-1 pl-4">
                      <Link href={`/dashboard/vehicles/${activeVehicle.id}`} className="block text-xs font-semibold tracking-[0.24px] text-foreground hover:text-primary">
                        {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                      </Link>
                      <p className="truncate text-sm text-[#414754]">
                        Plate: {activeVehicle.regNo} • {activeJob.services.map((s) => s.name).join(", ")}
                      </p>
                    </div>
                    <div className="hidden pl-4 text-right sm:block">
                      <p className="text-[11px] font-medium text-[#414754]">Service Advisor</p>
                      <p className="flex items-center justify-end gap-1 text-xs font-semibold tracking-[0.24px] text-foreground">
                        <Gauge className="size-[10.7px]" />
                        {activeJob.advisor?.name ?? "Assigned at intake"}
                      </p>
                      {activeJob.station && <p className="pt-0.5 text-[10px] text-muted-foreground">{activeJob.station}</p>}
                    </div>
                  </div>

                  <div className="relative py-4">
                    <div className="absolute top-8 right-8 left-8 h-0.5 bg-[#e2e8f0]" />
                    {jobStepIndex >= 0 && <div className="absolute top-8 left-[5.65%] h-0.5 bg-primary" style={{ width: `${Math.max(jobStepIndex / (JOB_STEPS.length - 1), 0.0001) * 100}%` }} />}
                    <div className="flex h-[54px] items-start justify-between">
                      {JOB_STEPS.map((step, i) => {
                        const state = i < jobStepIndex ? "done" : i === jobStepIndex ? "active" : "pending";
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <span
                              className={cn(
                                "flex size-8 items-center justify-center rounded-full transition-colors",
                                state === "done" && "bg-primary shadow-[0_0_0_4px_white,0_1px_2px_0px_rgba(0,0,0,0.05)]",
                                state === "active" && "border-2 border-primary bg-white shadow-[0_0_0_4px_white]",
                                state === "pending" && "border border-[#e2e8f0] bg-secondary",
                              )}
                            >
                              {state === "done" ? (
                                <CheckCircle2 className="size-[15px] text-white" />
                              ) : state === "active" ? (
                                <span className="size-2 animate-pulse rounded-full bg-primary" />
                              ) : (
                                <span className="size-1.5 rounded-full bg-[#e2e8f0]" />
                              )}
                            </span>
                            <span className={cn("mt-2 text-[11px]", state === "active" ? "font-bold text-primary" : "font-semibold text-[#414754]")}>
                              {cap(step)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-secondary px-[17px] py-[9px]">
                    <span className="text-sm text-[#414754]">Follow live progress of this job</span>
                    <Link
                      href={`/dashboard/services/${activeJob.id}`}
                      className="flex items-center gap-1 text-xs font-semibold tracking-[0.24px] text-primary"
                    >
                      Track <ChevronRight className="size-3" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#e2e8f0] py-10">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft">
                    <Wrench className="size-5 text-primary" />
                  </span>
                  <p className="text-sm text-muted-foreground">No active service right now — your vehicles are all clear.</p>
                  <Link href={vehicles.length > 0 ? "/dashboard/appointments/book" : "/dashboard/vehicles/new"} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white">
                    {vehicles.length > 0 ? "Book a Service" : "Register a Vehicle"}
                  </Link>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">My Fleet</h2>
                <Link href="/dashboard/vehicles" className="text-xs font-semibold text-primary hover:underline">
                  View All
                </Link>
              </div>
              {vehicles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#e2e8f0] bg-white py-14">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft">
                    <Car className="size-5 text-primary" />
                  </span>
                  <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
                  <Link href="/dashboard/vehicles/new" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white">
                    <Plus className="size-3.5" />
                    Register a Vehicle
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {vehicles.map((vehicle) => {
                    const inService = jobs.some((j) => j.vehicleId === vehicle.id && ["received", "inspecting", "repairing", "testing"].includes(j.status));
                    const count = jobs.filter((j) => j.vehicleId === vehicle.id).length;
                    return (
                      <div
                        key={vehicle.id}
                        className="group overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:border-primary/40"
                      >
                        <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                          <div className="relative h-32 bg-[#eef1f4] p-2">
                            <VehicleImage src={vehicle.image} alt={vehicle.model} fill className="object-contain" />
                            <span className="absolute top-2 right-2 rounded-md border border-[#e2e8f0] bg-white/90 px-2 py-0.75 font-mono text-[11px] font-medium text-foreground backdrop-blur-[2px]">
                              {vehicle.regNo}
                            </span>
                            {inService && (
                              <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                                <span className="size-1 animate-pulse rounded-full bg-white" />
                                In service
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex flex-col gap-2 p-4">
                          <Link href={`/dashboard/vehicles/${vehicle.id}`} className="block text-xs font-semibold tracking-[0.24px] text-foreground group-hover:text-primary">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Link>
                          <p className="flex items-center gap-1 text-[11px] font-medium text-[#414754]">
                            <Gauge className="size-[11.7px]" />
                            {vehicle.mileage.toLocaleString()} mi • {count} service{count === 1 ? "" : "s"}
                          </p>
                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/services?vehicle=${encodeURIComponent(vehicle.id)}`}
                              className="flex-1 rounded-lg border border-[#e2e8f0] px-3 py-[9px] text-center text-[11px] font-semibold text-foreground hover:bg-muted"
                            >
                              History
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                dispatch(selectVehicle(vehicle.id));
                                router.push("/dashboard/appointments/book");
                              }}
                              className="flex-1 rounded-lg bg-[rgba(216,226,255,0.2)] px-3 py-[9px] text-center text-[11px] font-semibold text-primary hover:bg-[rgba(216,226,255,0.35)]"
                            >
                              Book
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <h2 className="text-xs font-semibold tracking-[0.24px] text-foreground">Recent Updates</h2>
                <span className="text-[11px] font-medium text-muted-foreground">{activities.length} new</span>
              </div>
              {activities.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[#e2e8f0] px-4 py-8 text-center text-sm text-muted-foreground">
                  No recent updates yet. Book a service to see live updates here.
                </p>
              ) : (
                <div className="flex flex-col">
                  {activities.map((n, idx) => (
                    <Link
                      key={n.id}
                      href={n.href ?? "/dashboard"}
                      className={cn(
                        "flex gap-2 rounded-lg p-2 transition-colors hover:bg-muted",
                        idx === 0 && "bg-[rgba(216,226,255,0.15)]",
                      )}
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", n.tint)}>
                        <n.icon className="size-3.5 text-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground">{n.title}</p>
                        <p className="line-clamp-2 text-xs leading-[18px] text-[#414754]">{n.body}</p>
                        <p className="flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground">
                          <Clock3 className="size-2.5" />
                          {timeAgo(n.at, now)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                <h2 className="text-xs font-semibold tracking-[0.24px] text-foreground">Upcoming Appointments</h2>
                <Link href="/dashboard/appointments" className="text-[11px] font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[#e2e8f0] px-4 py-8 text-center">
                  <Calendars className="size-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
                  <Link href="/dashboard/appointments/book" className="mt-1 text-xs font-semibold text-primary hover:underline">
                    Book a service
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingAppointments.map((a) => {
                    const v = vehicleById(a.vehicleId);
                    const date = new Date(a.date);
                    const names = a.serviceIds
                      .map((id) => services.find((s) => s.id === id))
                      .filter((x) => !!x)
                      .map((x) => x!.name)
                      .join(", ");
                    return (
                      <Link
                        key={a.id}
                        href="/dashboard/appointments"
                        className="flex items-center rounded-lg border border-[#e2e8f0] p-2.5 transition-colors hover:border-primary/40"
                      >
                        <div className="flex min-w-[50px] flex-col items-center rounded-md border border-[#e2e8f0] bg-secondary px-[9px] py-[5px]">
                          <span className="text-[10px] font-medium text-[#ba1a1a] uppercase">{MONTHS[date.getMonth()] ?? "—"}</span>
                          <span className="text-xl font-semibold text-foreground">{date.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1 pl-4">
                          <p className="truncate text-[11px] font-medium text-foreground">{names || "Custom service request"}</p>
                          <p className="truncate text-xs text-[#414754]">
                            {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"} • {a.time}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            a.status === "confirmed"
                              ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]"
                              : "bg-[rgba(255,193,7,0.1)] text-[#8b5000]",
                          )}
                        >
                          {a.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}