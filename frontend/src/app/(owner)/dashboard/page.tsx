"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck,
  Gauge,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, selectVehicle } from "@/store/slices/vehiclesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { buildKpis } from "@/lib/kpis";
import { DashboardLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";

const TASK_STEPS = ["received", "inspecting", "repairing", "testing", "ready"] as const;

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
  const d = new Date(ts);
  const time = d.getTime();
  if (!Number.isFinite(time)) return "recently";
  const diff = now - time;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const tasks = useAppSelector((s) => s.tasks.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const services = useAppSelector((s) => s.services.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehiclesStatus = useAppSelector((s) => s.vehicles.status);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchTasks());
    dispatch(fetchEstimates());
    dispatch(fetchAppointments());
    dispatch(fetchServices());
    dispatch(fetchInvoices());
  }, [dispatch]);

  const refreshAll = () => {
    dispatch(fetchVehicles());
    dispatch(fetchTasks());
    dispatch(fetchEstimates());
    dispatch(fetchAppointments());
    dispatch(fetchServices());
    dispatch(fetchInvoices());
    toast.success("Dashboard metrics refreshed");
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const vehicleById = useCallback(
    (id?: string | null) => (id ? vehicles.find((v) => v.id === id) : undefined),
    [vehicles],
  );

  const [now] = useState(() => Date.now());

  // Pass all datasets to buildKpis so Upcoming Appointments & Payments compute accurately
  const kpis = useMemo(
    () => buildKpis("owner", { tasks, vehicles, appointments, estimates, invoices }),
    [tasks, vehicles, appointments, estimates, invoices],
  );

  const activeTasks = useMemo(
    () => tasks.filter((t) => ["received", "inspecting", "repairing", "testing"].includes(t.status)),
    [tasks],
  );
  const readyTasks = useMemo(() => tasks.filter((t) => t.status === "ready"), [tasks]);
  const activeTask = activeTasks[0] ?? readyTasks[0] ?? null;
  const activeVehicle = activeTask ? vehicleById(activeTask.vehicleId) : undefined;
  const taskStepIndex = activeTask ? TASK_STEPS.indexOf(activeTask.status as (typeof TASK_STEPS)[number]) : -1;

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
        tint: "bg-blue-50 text-primary",
        title: "Estimate awaiting review",
        body: `${e.summary || "Inspection findings available"} • $${e.total.toFixed(2)}`,
        href: `/dashboard/estimates/${e.id}`,
        at: new Date(e.createdAt).getTime(),
      });
      if (++i >= 4) break;
    }
    for (const t of tasks) {
      const lastStepTs =
        t.progress[t.progress.length - 1]?.timestamp || (t as unknown as { updatedAt?: string }).updatedAt;
      const parsedAt = lastStepTs ? new Date(lastStepTs).getTime() : NaN;
      const validAt = Number.isFinite(parsedAt) ? parsedAt : now;

      if (t.status === "ready") {
        const v = vehicleById(t.vehicleId);
        items.push({
          id: `ready-${t.id}`,
          icon: CheckCircle2,
          tint: "bg-emerald-50 text-emerald-600",
          title: "Ready for pickup",
          body: `${v ? `${v.year} ${v.make} ${v.model} ` : ""}${t.services.map((s) => s.name).join(", ")}`,
          href: `/dashboard/services/${t.id}`,
          at: validAt,
        });
      } else if (t.status === "completed") {
        items.push({
          id: `done-${t.id}`,
          icon: CheckCircle2,
          tint: "bg-emerald-50 text-emerald-600",
          title: "Service completed",
          body: `${t.services.map((s) => s.name).join(", ")} finished for your vehicle`,
          href: `/dashboard/services/${t.id}`,
          at: validAt,
        });
      }
    }
    for (const a of upcomingAppointments) {
      if (a.status === "confirmed") {
        const v = vehicleById(a.vehicleId);
        items.push({
          id: `apt-${a.id}`,
          icon: Calendar,
          tint: "bg-amber-50 text-amber-600",
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
        tint: "bg-rose-50 text-rose-600",
        title: `Invoice ${inv.id} pending`,
        body: `${v ? `${v.make} ${v.model} — ` : ""}${inv.total.toLocaleString("en-US", { style: "currency", currency: "USD" })} due for payment`,
        href: "/dashboard/payments",
        at: new Date(inv.issuedAt).getTime(),
      });
    }
    return items.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [pendingEstimates, tasks, upcomingAppointments, dueInvoices, now, vehicleById]);

  const initialLoading =
    (tasksStatus === "idle" ||
      tasksStatus === "loading" ||
      vehiclesStatus === "idle" ||
      vehiclesStatus === "loading") &&
    tasks.length === 0 &&
    vehicles.length === 0;

  if (initialLoading) {
    return <DashboardLoading label="Loading dashboard" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Breadcrumb & Header Bar */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <span>Dashboard</span>
            <span>›</span>
            <span className="text-foreground">Overview</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {firstName}!</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  Verified Owner
                </span>
              </div>
              <p className="pt-1 text-sm text-muted-foreground">
                {activeTasks.length > 0
                  ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} registered • ${activeTasks.length} active service${activeTasks.length === 1 ? "" : "s"} tracking right now.`
                  : `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} registered • Fleet is all clear.`}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-xs hover:bg-secondary cursor-pointer"
              >
                <RefreshCw className="size-3.5 text-primary" />
                Refresh
              </Button>
              <Link
                href={vehicles.length > 0 ? "/dashboard/appointments/book" : "/dashboard/vehicles/new"}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <Plus className="size-4" />
                {vehicles.length > 0 ? "Book a Service" : "Register a Vehicle"}
              </Link>
            </div>
          </div>
        </div>


        {/* Responsive KPI Metrics Grid (Fully Dynamic) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.icon] ?? Calendar;
            return (
              <div
                key={kpi.id}
                className="flex min-h-32 flex-col justify-between rounded-2xl border border-border bg-white p-4 shadow-xs transition-all hover:border-primary/40"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    {kpi.label}
                  </span>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</p>
                  <p
                    className={cn(
                      "flex items-center gap-1 pt-1 text-[11px] font-semibold",
                      kpi.trend === "up" && "text-emerald-600",
                      kpi.trend === "down" && "text-rose-600",
                      kpi.trend === "flat" && "text-muted-foreground",
                    )}
                  >
                    {kpi.trend === "up" && <ArrowUpRight className="size-3.5" />}
                    {kpi.trend === "down" && <span className="size-3 text-center">!</span>}
                    {kpi.delta}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left 8 Cols: Active Service & My Fleet */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* Active Service Tracker Card */}
            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground">Active Service Tracker</h2>
                  {activeTask && (
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      #{activeTask.id}
                    </span>
                  )}
                </div>
                {activeTask && <StatusBadge status={activeTask.status as never} />}
              </div>

              {activeTask && activeVehicle ? (
                <>
                  {/* Vehicle & Advisor Profile Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-[#f8f9fa] p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
                        <VehicleImage
                          src={activeVehicle.image}
                          alt={activeVehicle.model}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/vehicles/${activeVehicle.id}`}
                          className="block text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded-md border border-border bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                            {activeVehicle.regNo}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {activeTask.services.map((s) => s.name).join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Service Advisor
                        </p>
                        <p className="text-xs font-bold text-foreground">
                          {activeTask.advisor?.name ?? "Assigned at Intake"}
                        </p>
                        {activeTask.station && (
                          <p className="text-[10px] text-muted-foreground">{activeTask.station}</p>
                        )}
                      </div>
                      <Link
                        href="/dashboard/chat"
                        className="flex size-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground shadow-2xs hover:border-primary hover:text-primary transition-colors"
                        title="Chat with Advisor"
                      >
                        <MessageSquare className="size-4" />
                      </Link>
                    </div>
                  </div>

                  {/* 5-Stage Stepper */}
                  <div className="relative py-4 px-2">
                    <div className="absolute top-8 right-6 left-6 h-1 rounded-full bg-[#e2e8f0]" />
                    {taskStepIndex >= 0 && (
                      <div
                        className="absolute top-8 left-6 h-1 rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(taskStepIndex / (TASK_STEPS.length - 1), 0.05) * 100,
                          )}%`,
                        }}
                      />
                    )}
                    <div className="flex items-start justify-between relative z-10">
                      {TASK_STEPS.map((step, i) => {
                        const state = i < taskStepIndex ? "done" : i === taskStepIndex ? "active" : "pending";
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <span
                              className={cn(
                                "flex size-8 items-center justify-center rounded-full transition-all ring-4 ring-white",
                                state === "done" && "bg-primary text-white shadow-xs",
                                state === "active" && "border-2 border-primary bg-white shadow-md",
                                state === "pending" && "border border-[#e2e8f0] bg-secondary text-muted-foreground",
                              )}
                            >
                              {state === "done" ? (
                                <CheckCircle2 className="size-4 text-white" />
                              ) : state === "active" ? (
                                <span className="size-2.5 animate-pulse rounded-full bg-primary" />
                              ) : (
                                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                              )}
                            </span>
                            <span
                              className={cn(
                                "mt-2 text-xs",
                                state === "active"
                                  ? "font-bold text-primary"
                                  : state === "done"
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground font-medium",
                              )}
                            >
                              {cap(step)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Navigation */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-[#f8f9fa] px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      Real-time servicing status updated automatically from the workshop floor.
                    </span>
                    <Link
                      href={`/dashboard/services/${activeTask.id}`}
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Follow Live Timeline <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Wrench className="size-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No active service right now</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your vehicles are all clear and in top operating condition.
                    </p>
                  </div>
                  <Link
                    href={vehicles.length > 0 ? "/dashboard/appointments/book" : "/dashboard/vehicles/new"}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs mt-1"
                  >
                    {vehicles.length > 0 ? "Book a Service" : "Register a Vehicle"}
                  </Link>
                </div>
              )}
            </section>

            {/* My Fleet Section */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">My Fleet</h2>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {vehicles.length}
                  </span>
                </div>
                <Link
                  href="/dashboard/vehicles"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View All Fleet ›
                </Link>
              </div>

              {vehicles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-14 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Car className="size-6" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No vehicles registered yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add your car to track maintenance, estimates, and repair timelines.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/vehicles/new"
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs mt-1"
                  >
                    <Plus className="size-3.5" />
                    Register a Vehicle
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vehicles.map((vehicle) => {
                    const inService = tasks.some(
                      (t) =>
                        t.vehicleId === vehicle.id &&
                        ["received", "inspecting", "repairing", "testing"].includes(t.status),
                    );
                    const isReady = tasks.some((t) => t.vehicleId === vehicle.id && t.status === "ready");
                    const count = tasks.filter((t) => t.vehicleId === vehicle.id).length;
                    return (
                      <div
                        key={vehicle.id}
                        className="group overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                      >
                        <Link href={`/dashboard/vehicles/${vehicle.id}`}>
                          <div className="relative h-36 bg-[#f1f3f5] p-2 flex items-center justify-center">
                            <VehicleImage
                              src={vehicle.image}
                              alt={vehicle.model}
                              fill
                              className="object-contain p-2"
                            />
                            <span className="absolute top-2.5 right-2.5 rounded-md border border-border/80 bg-white/95 px-2 py-0.5 font-mono text-[11px] font-bold text-foreground shadow-2xs">
                              {vehicle.regNo}
                            </span>
                            {inService && (
                              <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                                In Service
                              </span>
                            )}
                            {isReady && (
                              <span className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                Ready
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex flex-col gap-2 p-4">
                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}`}
                            className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors"
                          >
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </Link>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Gauge className="size-3.5 text-primary" />
                            {vehicle.mileage.toLocaleString()} mi • {count} service{count === 1 ? "" : "s"}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <Link
                              href={`/dashboard/services?vehicle=${encodeURIComponent(vehicle.id)}`}
                              className="flex-1 rounded-xl border border-border bg-white py-2 text-center text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                            >
                              History
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                dispatch(selectVehicle(vehicle.id));
                                router.push("/dashboard/appointments/book");
                              }}
                              className="flex-1 rounded-xl bg-primary-soft py-2 text-center text-xs font-semibold text-primary hover:bg-primary/15 transition-colors cursor-pointer"
                            >
                              Book Service
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

          {/* Right 4 Cols: Upcoming Appointments & Activity Updates */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Upcoming Appointments Widget */}
            <section className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold tracking-tight text-foreground">Upcoming Appointments</h2>
                <Link
                  href="/dashboard/appointments"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View All
                </Link>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Calendar className="size-6 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">No upcoming appointments scheduled.</p>
                  <Link
                    href="/dashboard/appointments/book"
                    className="mt-1 text-xs font-bold text-primary hover:underline"
                  >
                    Book a Service Slot
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
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
                        className="flex items-center rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-[#f8f9fa]"
                      >
                        <div className="flex min-w-[48px] flex-col items-center rounded-lg border border-border bg-[#f1f3f5] px-2 py-1 shadow-2xs">
                          <span className="text-[10px] font-bold text-primary uppercase">
                            {MONTHS[date.getMonth()] ?? "—"}
                          </span>
                          <span className="text-lg font-bold text-foreground leading-none">
                            {date.getDate()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pl-3">
                          <p className="truncate text-xs font-bold text-foreground">
                            {names || "Service Appointment"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"} • {a.time}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                            a.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700",
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

            {/* Recent Updates & Activity Feed */}
            <section className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-bold tracking-tight text-foreground">Recent Updates</h2>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Live
                </span>
              </div>
              {activities.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                  No recent activity updates.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-border/60">
                  {activities.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href ?? "/dashboard"}
                      className="flex items-start gap-3 py-2.5 transition-colors hover:bg-secondary/40 rounded-lg px-1.5"
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg mt-0.5",
                          n.tint,
                        )}
                      >
                        <n.icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                        <p className="flex items-center gap-1 pt-1 text-[10px] text-muted-foreground">
                          <Clock3 className="size-2.5" />
                          {timeAgo(n.at, now)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}