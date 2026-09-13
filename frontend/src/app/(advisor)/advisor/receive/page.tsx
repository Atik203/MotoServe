"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  CalendarCheck,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck2,
  Filter,
  Fuel,
  Gauge,
  KeyRound,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTaskCard, fetchTasks, updateTaskStatus } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { TableLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TaskCard, TaskStatus } from "@/types";

const STAGE_ORDER: TaskStatus[] = ["received", "inspecting", "repairing", "testing", "ready", "completed"];

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  received: { bg: "bg-blue-50", text: "text-[#0052cc]", border: "border-blue-200" },
  inspecting: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  repairing: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  testing: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  ready: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  completed: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const STATIONS = [
  "Main Bay / Station 01",
  "Main Bay / Station 02",
  "Main Bay / Station 03",
  "Station 04",
  "Station 05",
  "Quick Lube Bay",
  "Diagnostics Center",
];

function ReceiveVehicleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const urlAppointmentId = searchParams.get("appointment");

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const employees = useAppSelector((s) => s.employees.items);
  const appointments = useAppSelector((s) => s.appointments.items);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Intake Modal State
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [intakeMileage, setIntakeMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("1/2");
  const [keysReceived, setKeysReceived] = useState(true);
  const [stationBay, setStationBay] = useState(STATIONS[0]);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [issues, setIssues] = useState("");
  const [intakeBusy, setIntakeBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchEmployees());
    dispatch(fetchAppointments());
  }, [dispatch]);

  // If appointment query parameter exists, open intake modal pre-filled
  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlAppointmentId && appointments.length > 0) {
        const appt = appointments.find((a) => a.id === urlAppointmentId);
        if (appt) {
          setSelectedAppointmentId(appt.id);
          setSelectedVehicleId(appt.vehicleId);
          setSelectedCustomerId(appt.ownerId);
          const v = vehicles.find((item) => item.id === appt.vehicleId);
          if (v) setIntakeMileage(String(v.mileage || 25000));
          setIssues(appt.notes || "Vehicle checked in from appointment");
          setIntakeModalOpen(true);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [urlAppointmentId, appointments, vehicles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchTasks()).unwrap(),
        dispatch(fetchVehicles()).unwrap(),
        dispatch(fetchCustomers()).unwrap(),
        dispatch(fetchEmployees()).unwrap(),
        dispatch(fetchAppointments()).unwrap(),
      ]);
      toast.success("Workshop intake roster updated");
    } catch {
      toast.error("Failed to refresh records");
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPIs
  const counts = useMemo(() => {
    const inProgress = tasks.filter((t) => ["received", "inspecting", "repairing", "testing"].includes(t.status));
    const awaitingTech = inProgress.filter((t) => !t.mechanicId && (!t.mechanics || t.mechanics.length === 0));
    const ready = tasks.filter((t) => t.status === "ready");
    const todayStr = new Date().toISOString().slice(0, 10);
    const completed = tasks.filter((t) => t.status === "completed" && t.updatedAt?.slice(0, 10) === todayStr);

    return {
      all: tasks.length,
      inProgress: inProgress.length,
      awaitingTech: awaitingTech.length,
      ready: ready.length,
      completedToday: completed.length,
    };
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const v = vehicles.find((item) => item.id === t.vehicleId) ?? t.vehicle;
      const c = customers.find((item) => item.id === t.customerId) ?? t.customer;

      const matchesStage = stageFilter === "all" || t.status === stageFilter;
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        (v?.regNo ?? "").toLowerCase().includes(q) ||
        (v?.make ?? "").toLowerCase().includes(q) ||
        (v?.model ?? "").toLowerCase().includes(q) ||
        (c?.name ?? "").toLowerCase().includes(q) ||
        (c?.phone ?? "").toLowerCase().includes(q) ||
        (t.issues ?? "").toLowerCase().includes(q);

      return matchesStage && matchesSearch;
    });
  }, [tasks, vehicles, customers, search, stageFilter]);

  // Stage Advancement Handler
  const handleAdvanceStage = async (task: TaskCard) => {
    const currentIndex = STAGE_ORDER.indexOf(task.status as TaskStatus);
    if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
      const nextStage = STAGE_ORDER[currentIndex + 1];
      try {
        await dispatch(updateTaskStatus({ id: task.id, status: nextStage })).unwrap();
        toast.success(`Task ${task.id} advanced to ${nextStage.toUpperCase()}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update stage");
      }
    }
  };

  // Quick Intake Submit
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle to intake");
      return;
    }
    if (!selectedCustomerId) {
      toast.error("Please select a customer account");
      return;
    }

    setIntakeBusy(true);
    try {
      const fuelMap: Record<string, number> = { Empty: 5, "1/4": 25, "1/2": 50, "3/4": 75, Full: 100 };
      const created = await dispatch(
        createTaskCard({
          vehicleId: selectedVehicleId,
          customerId: selectedCustomerId,
          appointmentId: selectedAppointmentId || undefined,
          station: stationBay,
          priority,
          mileage: parseInt(intakeMileage, 10) || undefined,
          fuelLevel: fuelMap[fuelLevel] ?? 50,
          keysReceived,
          issues: issues.trim() || "Vehicle received for inspection and service",
        }),
      ).unwrap();

      toast.success(`Vehicle checked in! Task Card #${created.id} created.`);
      setIntakeModalOpen(false);
      setSelectedAppointmentId("");
      setSelectedVehicleId("");
      setSelectedCustomerId("");
      setIntakeMileage("");
      setIssues("");
      dispatch(fetchTasks());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vehicle intake failed");
    } finally {
      setIntakeBusy(false);
    }
  };

  const loading = (tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0;

  if (loading) {
    return <TableLoading label="Loading workshop reception roster..." />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Main Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicle Reception Desk</h1>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Physical Intake & Active Workload
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Check in arrived vehicles, verify odometer and custody, dispatch repair orders, and monitor active workshop bays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary cursor-pointer"
            >
              <RefreshCw className={cn("size-3.5 text-primary", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIntakeModalOpen(true)}
              className="gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="size-3.5" />
              Check In Vehicle
            </Button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setStageFilter("all")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              stageFilter === "all" ? "border-primary bg-blue-50/30" : "border-border bg-white hover:border-primary/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">In Workshop</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <Truck className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground mt-2">{counts.inProgress}</p>
          </div>

          <div
            onClick={() => setStageFilter("received")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              stageFilter === "received" ? "border-amber-400 bg-amber-50/40" : "border-border bg-white hover:border-amber-400/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Awaiting Allocation</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <UserCheck className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-amber-800 mt-2">{counts.awaitingTech}</p>
          </div>

          <div
            onClick={() => setStageFilter("ready")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              stageFilter === "ready" ? "border-emerald-400 bg-emerald-50/40" : "border-border bg-white hover:border-emerald-400/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Ready for Pickup</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-800 mt-2">{counts.ready}</p>
          </div>

          <div
            onClick={() => setStageFilter("completed")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              stageFilter === "completed" ? "border-slate-400 bg-slate-50" : "border-border bg-white hover:border-slate-400",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Completed Today</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground mt-2">{counts.completedToday}</p>
          </div>
        </div>

        {/* Filter Toolbar & View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by license plate, vehicle, customer, or task #..."
              className="h-9 w-full rounded-xl border border-border bg-[#f8f9fa] pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:border-primary transition-all"
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

          {/* Stage Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {["all", "received", "inspecting", "repairing", "testing", "ready", "completed"].map((st) => {
              const active = stageFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStageFilter(st)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer",
                    active
                      ? "bg-primary text-white shadow-2xs"
                      : "bg-[#f8f9fa] text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                  )}
                >
                  {st === "all" ? "All Stages" : st}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Table / Cards */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-[#f8f9fa] p-1 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Table View (Default)"
            >
              <List className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "cards"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Cards Grid View"
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </button>
          </div>
        </div>

        {/* Content Listing */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-16 text-center shadow-xs">
            <Car className="size-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-bold text-foreground">No vehicles matching filter</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              There are currently no workshop tasks matching your active search query or stage filter.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearch("");
                setStageFilter("all");
              }}
              variant="outline"
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-28 text-xs font-bold text-muted-foreground">TASK ID</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">VEHICLE DETAILS</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">CUSTOMER</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">STAGE / STATUS</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">BAY STATION</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">TECHNICIANS</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border text-xs">
                {filteredTasks.map((task) => {
                  const vehicle = vehicles.find((v) => v.id === task.vehicleId) ?? task.vehicle;
                  const customer = customers.find((c) => c.id === task.customerId) ?? task.customer;
                  const stageStyle = STAGE_COLORS[task.status] ?? {
                    bg: "bg-slate-50",
                    text: "text-slate-700",
                    border: "border-slate-200",
                  };

                  const assignedMechanics = (() => {
                    if (task.mechanics && task.mechanics.length > 0) return task.mechanics;
                    if (task.mechanicIds && task.mechanicIds.length > 0) {
                      return task.mechanicIds
                        .map((id) => employees.find((e) => e.id === id))
                        .filter(Boolean);
                    }
                    if (task.mechanicId) {
                      const m = employees.find((e) => e.id === task.mechanicId);
                      return m ? [m] : [];
                    }
                    return [];
                  })();

                  return (
                    <TableRow key={task.id} className="hover:bg-[#fbfcfd] transition-colors">
                      {/* Task ID */}
                      <TableCell className="font-mono font-bold text-foreground">
                        <Link href={`/advisor/tasks/${task.id}`} className="hover:text-primary hover:underline">
                          #{task.id}
                        </Link>
                        {task.priority && (
                          <span
                            className={cn(
                              "block font-sans text-[10px] font-bold uppercase mt-0.5",
                              task.priority === "high"
                                ? "text-rose-600"
                                : task.priority === "medium"
                                  ? "text-amber-600"
                                  : "text-slate-500",
                            )}
                          >
                            {task.priority}
                          </span>
                        )}
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-[#eef1f4]">
                            <VehicleImage
                              src={vehicle?.image || "/images/cars/car-1.png"}
                              alt={vehicle?.model ?? "Vehicle"}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider">
                                {vehicle?.regNo ?? "—"}
                              </span>
                              {task.mileage && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Gauge className="size-2.5" />
                                  {task.mileage.toLocaleString()} mi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div>
                          <p className="font-bold text-foreground">{customer?.name ?? "Customer"}</p>
                          <p className="text-[11px] text-muted-foreground">{customer?.phone ?? "No direct phone"}</p>
                        </div>
                      </TableCell>

                      {/* Stage Status */}
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                            stageStyle.bg,
                            stageStyle.text,
                            stageStyle.border,
                          )}
                        >
                          {task.status}
                        </span>
                      </TableCell>

                      {/* Station */}
                      <TableCell>
                        <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 text-[11px]">
                          {task.station || "Main Intake Bay"}
                        </span>
                      </TableCell>

                      {/* Technicians */}
                      <TableCell>
                        {assignedMechanics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedMechanics.map((m) => (
                              <span
                                key={m!.id}
                                className="rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                              >
                                {m!.name.split(" ")[0]}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <Link
                            href={`/advisor/task-cards/assign?task=${task.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                          >
                            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Assign Tech
                          </Link>
                        )}
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdvanceStage(task)}
                              className="h-7 text-[11px] font-semibold border-border bg-white hover:bg-blue-50 hover:text-primary"
                              title="Advance to next workflow stage"
                            >
                              Next Stage →
                            </Button>
                          )}
                          <Link href={`/advisor/tasks/${task.id}`}>
                            <Button
                              size="sm"
                              className="h-7 gap-1 bg-[#0052cc] text-[11px] font-semibold text-white hover:bg-[#0047b3]"
                            >
                              Details
                              <ChevronRight className="size-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => {
              const vehicle = vehicles.find((v) => v.id === task.vehicleId) ?? task.vehicle;
              const customer = customers.find((c) => c.id === task.customerId) ?? task.customer;
              const stageStyle = STAGE_COLORS[task.status] ?? {
                bg: "bg-slate-50",
                text: "text-slate-700",
                border: "border-slate-200",
              };

              return (
                <div
                  key={task.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs hover:border-primary/40 transition-all"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">#{task.id}</span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.2 text-[10px] font-bold capitalize",
                            stageStyle.bg,
                            stageStyle.text,
                            stageStyle.border,
                          )}
                        >
                          {task.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{task.station || "Bay 01"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-[#eef1f4]">
                        <VehicleImage
                          src={vehicle?.image || "/images/cars/car-1.png"}
                          alt={vehicle?.model ?? "Vehicle"}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#2a3042]">
                            {vehicle?.regNo ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">{customer?.name}</span>
                        </div>
                      </div>
                    </div>

                    {task.issues && (
                      <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600 line-clamp-2 italic">
                        &ldquo;{task.issues}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <Link
                      href={`/advisor/task-cards/assign?task=${task.id}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Assign Tech
                    </Link>
                    <Link href={`/advisor/tasks/${task.id}`}>
                      <Button size="sm" className="h-8 gap-1 bg-[#0052cc] text-xs font-semibold text-white hover:bg-[#0047b3]">
                        Manage Task
                        <ChevronRight className="size-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Intake Modal */}
      <Dialog open={intakeModalOpen} onOpenChange={setIntakeModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleIntakeSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Vehicle Reception & Physical Check-in</DialogTitle>
              <DialogDescription className="text-xs">
                Record vehicle odometer, fuel level, and custody upon physical arrival at the service bay.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-3 text-xs">
              {/* If origin is appointment */}
              {selectedAppointmentId && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-2.5 text-xs text-primary flex items-center justify-between">
                  <span>Linked to Appointment: #{selectedAppointmentId}</span>
                  <span className="font-bold">Prefilled</span>
                </div>
              )}

              {/* Customer Select */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Customer Account *</Label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedVehicleId("");
                  }}
                  required
                  className="h-9 rounded-lg border border-border bg-white px-3 text-xs outline-none focus:border-primary"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Select */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Vehicle *</Label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    const v = vehicles.find((item) => item.id === e.target.value);
                    if (v) setIntakeMileage(String(v.mileage || 25000));
                  }}
                  required
                  disabled={!selectedCustomerId}
                  className="h-9 rounded-lg border border-border bg-white px-3 text-xs outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">
                    {selectedCustomerId ? "-- Choose Customer Vehicle --" : "-- Select Customer First --"}
                  </option>
                  {vehicles
                    .filter((v) => v.ownerId === selectedCustomerId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} ({v.regNo})
                      </option>
                    ))}
                </select>
              </div>

              {/* Odometer & Fuel Level */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Intake Odometer Mileage</Label>
                  <Input
                    type="number"
                    value={intakeMileage}
                    onChange={(e) => setIntakeMileage(e.target.value)}
                    placeholder="e.g. 24500"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Fuel Gauge Level</Label>
                  <select
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-3 text-xs"
                  >
                    <option value="Empty">Empty (Reserve)</option>
                    <option value="1/4">1/4 Tank</option>
                    <option value="1/2">1/2 Tank</option>
                    <option value="3/4">3/4 Tank</option>
                    <option value="Full">Full Tank</option>
                  </select>
                </div>
              </div>

              {/* Workshop Bay & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Initial Station Bay</Label>
                  <select
                    value={stationBay}
                    onChange={(e) => setStationBay(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-white px-3 text-xs"
                  >
                    {STATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Priority</Label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high" | "urgent")}
                    className="h-9 rounded-lg border border-border bg-white px-3 text-xs capitalize"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Rush</option>
                  </select>
                </div>
              </div>

              {/* Keys Custody Check */}
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={keysReceived}
                  onChange={(e) => setKeysReceived(e.target.checked)}
                  className="rounded accent-primary size-4"
                />
                <span>Vehicle Keys received & stored in custody box</span>
              </label>

              {/* Customer Concerns / Notes */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Intake Reason / Issues</Label>
                <Textarea
                  value={issues}
                  onChange={(e) => setIssues(e.target.value)}
                  placeholder="Reported concerns, noises, or preliminary inspection requests..."
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIntakeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={intakeBusy}
                className="bg-[#0052cc] text-white hover:bg-[#0047b3]"
              >
                {intakeBusy ? "Receiving..." : "Complete Intake & Create Task Card"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReceiveVehiclePage() {
  return (
    <Suspense fallback={<TableLoading label="Loading reception desk..." />}>
      <ReceiveVehicleContent />
    </Suspense>
  );
}