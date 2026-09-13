"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gauge,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { ProgressStepper } from "@/components/roles/mechanic/ProgressStepper";
import { TableLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STAGES = ["received", "inspecting", "repairing", "testing", "ready"] as const;

export default function ServiceTrackingListPage() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "ready" | "completed">("all");
  const [vehicleFilterId, setVehicleFilterId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("vehicle");
    }
    return null;
  });

  useEffect(() => {
    if (tasks.length === 0) dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, tasks.length, vehicles.length]);

  const refreshAll = () => {
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    toast.success("Service tracking refreshed");
  };

  const vehicleById = useCallback(
    (id: string) => vehicles.find((v) => v.id === id),
    [vehicles]
  );

  const metrics = useMemo(() => {
    const inProgress = tasks.filter((t) => ["received", "inspecting", "repairing", "testing"].includes(t.status)).length;
    const ready = tasks.filter((t) => t.status === "ready").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return {
      total: tasks.length,
      inProgress,
      ready,
      completed,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const v = vehicleById(task.vehicleId);
      const q = search.trim().toLowerCase();

      if (vehicleFilterId && task.vehicleId !== vehicleFilterId) {
        return false;
      }

      const servicesText = task.services.map((s) => s.name).join(" ").toLowerCase();
      const matchesSearch =
        !q ||
        task.id.toLowerCase().includes(q) ||
        servicesText.includes(q) ||
        (task.advisor?.name && task.advisor.name.toLowerCase().includes(q)) ||
        (v && (v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.regNo.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (statusFilter === "in_progress") {
        return ["received", "inspecting", "repairing", "testing"].includes(task.status);
      }
      if (statusFilter === "ready") {
        return task.status === "ready";
      }
      if (statusFilter === "completed") {
        return task.status === "completed";
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, vehicleById, search, statusFilter, vehicleFilterId]);

  const selectedVehicle = vehicleFilterId ? vehicleById(vehicleFilterId) : null;

  if ((tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0) {
    return <TableLoading label="Loading services" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-foreground">Service Tracking</span>
            {selectedVehicle && (
              <>
                <span>›</span>
                <span className="text-primary font-bold">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Service Tracking</h1>
              <p className="pt-1 text-sm text-muted-foreground">
                {selectedVehicle
                  ? `Live tracking records for ${selectedVehicle.regNo} (${selectedVehicle.make} ${selectedVehicle.model}).`
                  : "Follow real-time inspection, repair, and test milestones for your vehicles."}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedVehicle && (
                <button
                  type="button"
                  onClick={() => setVehicleFilterId(null)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer mr-2"
                >
                  Clear vehicle filter
                </button>
              )}
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
                href="/dashboard/appointments/book"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <CalendarPlus className="size-4" />
                Book Service
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <Wrench className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">In Progress</p>
              <p className="text-2xl font-bold text-foreground">{metrics.inProgress}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Ready for Pickup</p>
              <p className="text-2xl font-bold text-foreground">{metrics.ready}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Clock className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Completed</p>
              <p className="text-2xl font-bold text-foreground">{metrics.completed}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Gauge className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total Tracked</p>
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
            </div>
          </div>
        </div>

        {/* Toolbar with Search, Status Pills, and Table/Cards toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job ID, vehicle, service, advisor..."
                className="h-9 rounded-xl border-border bg-[#f8f9fa] pl-9 text-xs focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                All ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("in_progress")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "in_progress"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Active ({metrics.inProgress})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ready")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "ready"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Ready ({metrics.ready})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "completed"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Completed ({metrics.completed})
              </button>
            </div>
          </div>

          {/* View Mode Switcher (Table default vs Cards) */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-[#f8f9fa] p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Table View"
            >
              <List className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "cards"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Cards View"
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </button>
          </div>
        </div>

        {/* Content View: Table (Default) or Cards */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Gauge className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No tracking records found</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {search
                ? "Try searching for a different vehicle, job number, or service."
                : "Your active service tracking cards will show up here as your vehicle progresses through the workshop."}
            </p>
            <Link
              href="/dashboard/appointments/book"
              className="mt-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
            >
              Book a Service
            </Link>
          </div>
        ) : viewMode === "table" ? (
          /* Table View (Default) */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[120px] text-xs font-bold text-muted-foreground">JOB / TASK</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">VEHICLE</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">SERVICES</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">ADVISOR & BAY</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">STAGE & STATUS</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const vehicle = vehicleById(task.vehicleId);
                  const stepNames: Record<string, string> = {
                    received: "Received",
                    inspecting: "Inspecting",
                    repairing: "Repairing",
                    testing: "Testing",
                    ready: "Ready",
                    completed: "Completed",
                  };
                  const stepIndex = STAGES.indexOf(task.status as (typeof STAGES)[number]);
                  const stepDisplay =
                    task.status === "completed"
                      ? "Completed"
                      : stepIndex >= 0
                        ? `Stage ${stepIndex + 1} of 5: ${stepNames[task.status] ?? task.status}`
                        : task.status;

                  return (
                    <TableRow key={task.id} className="border-border hover:bg-[#f8f9fa]/60 transition-colors">
                      {/* Job ID */}
                      <TableCell className="align-middle">
                        <span className="font-mono text-xs font-bold text-primary">#{task.id}</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                            {vehicle && (
                              <VehicleImage
                                src={vehicle.image}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                            </p>
                            <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider mt-0.5">
                              {vehicle?.regNo ?? "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Services */}
                      <TableCell className="align-middle">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {task.services.map((s) => (
                            <span
                              key={s.id}
                              className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground"
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      {/* Advisor & Bay */}
                      <TableCell className="align-middle">
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {task.advisor?.name ?? "Assigned Advisor"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {task.station ?? "Main Workshop Bay"}
                          </p>
                        </div>
                      </TableCell>

                      {/* Stage & Status */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={task.status} />
                          </div>
                          <p className="text-[10px] font-medium text-muted-foreground capitalize">
                            {stepDisplay}
                          </p>
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="align-middle text-right">
                        <Link
                          href={`/dashboard/services/${task.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 transition-colors"
                        >
                          {["completed", "ready"].includes(task.status) ? "View Summary" : "Track Live"}
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Cards View */
          <div className="flex flex-col gap-4">
            {filteredTasks.map((task) => {
              const vehicle = vehicleById(task.vehicleId);
              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs transition-all hover:border-primary/40 md:flex-row md:items-center md:gap-6"
                >
                  <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                    {vehicle && (
                      <VehicleImage
                        src={vehicle.image}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-bold text-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                        <span className="rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#2a3042]">
                          {vehicle?.regNo}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">#{task.id}</span>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {task.services.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>

                    <ProgressStepper steps={task.progress} size="sm" />
                  </div>

                  <Link
                    href={`/dashboard/services/${task.id}`}
                    className="flex shrink-0 items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 transition-colors"
                  >
                    Track Live
                    <ChevronRight className="size-3.5" />
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
