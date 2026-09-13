"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Gauge,
  Info,
  RefreshCw,
  Search,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks, assignMechanic } from "@/store/slices/tasksSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DetailLoading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Employee, TaskCard } from "@/types";

const STATIONS = [
  "Main Bay / Station 01",
  "Main Bay / Station 02",
  "Main Bay / Station 03",
  "Station 04",
  "Station 05",
  "Quick Lube Bay",
  "Diagnostics Center",
];

const WORKLOAD_LIMIT = 5;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function AssignMechanicContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("task");
  const dispatch = useAppDispatch();

  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const employees = useAppSelector((s) => s.employees.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(urlTaskId ?? "");
  const [selectedMechanicIds, setSelectedMechanicIds] = useState<string[]>([]);
  const [stationBay, setStationBay] = useState(STATIONS[0]);
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
  }, [dispatch]);

  // Active workshop tasks eligible for assignment
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => !["completed", "ready"].includes(t.status));
  }, [tasks]);

  // Set default selected task if none
  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlTaskId) {
        setSelectedTaskId(urlTaskId);
      } else if (!selectedTaskId && activeTasks.length > 0) {
        const firstUnassigned = activeTasks.find(
          (t) => !t.mechanicId && (!t.mechanics || t.mechanics.length === 0),
        );
        setSelectedTaskId(firstUnassigned ? firstUnassigned.id : activeTasks[0].id);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [urlTaskId, activeTasks, selectedTaskId]);

  const currentTask: TaskCard | null = useMemo(() => {
    if (!selectedTaskId) return activeTasks[0] ?? null;
    return tasks.find((t) => t.id === selectedTaskId) ?? activeTasks[0] ?? null;
  }, [tasks, selectedTaskId, activeTasks]);

  // When current task changes, sync pre-existing mechanics and station
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTask) {
        if (currentTask.station) setStationBay(currentTask.station);
        if (currentTask.mechanicIds && currentTask.mechanicIds.length > 0) {
          setSelectedMechanicIds(currentTask.mechanicIds);
        } else if (currentTask.mechanicId) {
          setSelectedMechanicIds([currentTask.mechanicId]);
        } else {
          setSelectedMechanicIds([]);
        }
        if (currentTask.assignmentNotes) setNotes(currentTask.assignmentNotes);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentTask]);

  const mechanics = useMemo(
    () => employees.filter((e) => e.role === "mechanic" && e.status === "active"),
    [employees],
  );

  const workloadOf = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== "completed" && t.status !== "ready") {
        if (t.mechanicIds && t.mechanicIds.length > 0) {
          for (const mId of t.mechanicIds) counts.set(mId, (counts.get(mId) ?? 0) + 1);
        } else if (t.mechanicId) {
          counts.set(t.mechanicId, (counts.get(t.mechanicId) ?? 0) + 1);
        }
      }
    }
    return (id: string) => counts.get(id) ?? 0;
  }, [tasks]);

  // Filtered mechanics
  const filteredMechanics = useMemo(() => {
    const q = mechanicSearch.trim().toLowerCase();
    return mechanics.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.specialization ?? "").toLowerCase().includes(q) ||
        (m.station ?? "").toLowerCase().includes(q),
    );
  }, [mechanics, mechanicSearch]);

  // Filtered task queue
  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    return activeTasks.filter((t) => {
      const v = vehicles.find((item) => item.id === t.vehicleId) ?? t.vehicle;
      const c = customers.find((item) => item.id === t.customerId) ?? t.customer;
      const hasMechanic = Boolean(t.mechanicId || (t.mechanics && t.mechanics.length > 0));

      const matchesUnassigned = !unassignedOnly || !hasMechanic;
      const matchesSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        (v?.regNo ?? "").toLowerCase().includes(q) ||
        (v?.make ?? "").toLowerCase().includes(q) ||
        (v?.model ?? "").toLowerCase().includes(q) ||
        (c?.name ?? "").toLowerCase().includes(q);

      return matchesUnassigned && matchesSearch;
    });
  }, [activeTasks, vehicles, customers, taskSearch, unassignedOnly]);

  const toggleSelectMechanic = (id: string) => {
    setSelectedMechanicIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchEmployees()).unwrap(),
        dispatch(fetchTasks()).unwrap(),
        dispatch(fetchVehicles()).unwrap(),
      ]);
      toast.success("Roster updated");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!currentTask) {
      toast.error("Please select a task card");
      return;
    }
    if (selectedMechanicIds.length === 0) {
      toast.error("Please select at least one certified technician");
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(
        assignMechanic({
          id: currentTask.id,
          mechanicIds: selectedMechanicIds,
          mechanicId: selectedMechanicIds[0],
          station: stationBay,
          notes: notes.trim() || undefined,
        }),
      ).unwrap();

      const assignedNames = mechanics
        .filter((m) => selectedMechanicIds.includes(m.id))
        .map((m) => m.name)
        .join(", ");

      toast.success(`Assigned ${assignedNames} to task #${currentTask.id}`);
      router.push(`/advisor/tasks/${currentTask.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assignment dispatch failed");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = (tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0;

  if (loading) {
    return <DetailLoading label="Loading mechanic assignment workspace..." />;
  }

  const currentVehicle = currentTask
    ? vehicles.find((v) => v.id === currentTask.vehicleId) ?? currentTask.vehicle
    : null;
  const currentCustomer = currentTask
    ? customers.find((c) => c.id === currentTask.customerId) ?? currentTask.customer
    : null;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Link href="/advisor" className="hover:text-foreground">
                Advisor
              </Link>
              <span>›</span>
              <Link href="/advisor/tasks" className="hover:text-foreground">
                Workshop Tasks
              </Link>
              <span>›</span>
              <span className="text-[#0052cc]">Assign Mechanics</span>
            </nav>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Technician & Bay Allocation Desk
              </h1>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Capacity & Dispatch
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dispatch active repair tasks to available certified mechanics, balance workloads, and designate service stations.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary"
            >
              <Link href="/advisor/tasks">
                <ArrowLeft className="size-3.5" />
                All Tasks
              </Link>
            </Button>
          </div>
        </div>

        {/* 12-Column Responsive Workspace */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column (5 cols): Tasks Queue */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Active Workshop Tasks ({activeTasks.length})
              </h2>
              <button
                type="button"
                onClick={() => setUnassignedOnly((prev) => !prev)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all cursor-pointer",
                  unassignedOnly
                    ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
                    : "bg-white text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {unassignedOnly ? "Unassigned Only" : "Show All Active"}
              </button>
            </div>

            {/* Task Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search plate, customer, or task #..."
                className="h-9 w-full rounded-xl border border-border bg-white pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
              />
              {taskSearch && (
                <button
                  type="button"
                  onClick={() => setTaskSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Task List */}
            <div className="flex flex-col gap-2.5 max-h-[720px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center text-xs text-muted-foreground">
                  No active tasks matching filter.
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const isSelected = currentTask?.id === t.id;
                  const v = vehicles.find((item) => item.id === t.vehicleId) ?? t.vehicle;
                  const c = customers.find((item) => item.id === t.customerId) ?? t.customer;
                  const hasMechanic = Boolean(t.mechanicId || (t.mechanics && t.mechanics.length > 0));

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border p-3.5 text-xs transition-all cursor-pointer",
                        isSelected
                          ? "border-[#0052cc] bg-blue-50/40 shadow-xs ring-1 ring-[#0052cc]/30"
                          : "border-border bg-white hover:border-slate-300 hover:bg-slate-50/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">#{t.id}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold capitalize text-slate-700">
                            {t.status}
                          </span>
                        </div>
                        {hasMechanic ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Assigned
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200 animate-pulse">
                            Unassigned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-[#eef1f4]">
                          <VehicleImage
                            src={v?.image || "/images/cars/car-1.png"}
                            alt={v?.model ?? "Car"}
                            fill
                            className="object-contain p-0.5"
                          />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-foreground truncate">
                            {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042]">
                              {v?.regNo ?? "—"}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">{c?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column (7 cols): Mechanic Allocation Workspace */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            {currentTask ? (
              <>
                {/* Active Task Banner */}
                <Card className="rounded-xl border-border bg-white shadow-xs">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#0052cc]">#{currentTask.id}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#0052cc] border border-blue-200 capitalize">
                          {currentTask.status} stage
                        </span>
                      </div>
                      <Link
                        href={`/advisor/tasks/${currentTask.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View Full Details
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-[#eef1f4]">
                        <VehicleImage
                          src={currentVehicle?.image || "/images/cars/car-1.png"}
                          alt={currentVehicle?.model ?? "Vehicle"}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground">
                          {currentVehicle
                            ? `${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}`
                            : "Vehicle"}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 font-mono font-bold text-[#2a3042]">
                            {currentVehicle?.regNo ?? "—"}
                          </span>
                          <span>Owner: <strong className="text-foreground">{currentCustomer?.name}</strong></span>
                          {currentCustomer?.phone && <span>📞 {currentCustomer.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {currentTask.issues && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
                        <strong className="text-foreground">Intake Concerns:</strong> {currentTask.issues}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bay Reallocation & Instructions */}
                <Card className="rounded-xl border-border bg-white shadow-xs">
                  <CardContent className="flex flex-col gap-4 p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">Allocated Workshop Bay / Station</Label>
                        <select
                          value={stationBay}
                          onChange={(e) => setStationBay(e.target.value)}
                          className="h-9 rounded-lg border border-border bg-white px-3 text-xs outline-none focus:border-[#0052cc]"
                        >
                          {STATIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold">Special Instructions for Assigned Mechanics</Label>
                        <Input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Focus on brake caliper noise, test drive after bleed..."
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mechanic Roster Selection */}
                <Card className="rounded-xl border-border bg-white shadow-xs">
                  <div className="border-b border-border bg-[#f8f9fa] px-5 py-3.5 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Select Certified Mechanics ({selectedMechanicIds.length} chosen)
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Check one or more technicians to assign to Task #{currentTask.id}.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-56">
                      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={mechanicSearch}
                        onChange={(e) => setMechanicSearch(e.target.value)}
                        placeholder="Search mechanics..."
                        className="h-8 w-full rounded-lg border border-border bg-white pl-8 pr-2 text-xs outline-none focus:border-[#0052cc]"
                      />
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                      {filteredMechanics.map((m) => {
                        const isSelected = selectedMechanicIds.includes(m.id);
                        const workload = workloadOf(m.id);

                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleSelectMechanic(m.id)}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-3 text-xs transition-all cursor-pointer",
                              isSelected
                                ? "border-[#0052cc] bg-blue-50/50 shadow-xs ring-1 ring-[#0052cc]/30"
                                : "border-border bg-white hover:border-slate-300 hover:bg-slate-50/50",
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex size-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs",
                                  isSelected ? "bg-[#0052cc]" : "bg-slate-600",
                                )}
                              >
                                {initials(m.name)}
                              </div>
                              <div>
                                <h4 className="font-bold text-foreground">{m.name}</h4>
                                <p className="text-[11px] text-muted-foreground">
                                  {m.specialization || m.station || "Certified Mechanic"}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      "rounded px-1.5 py-0.2 text-[10px] font-bold",
                                      workload === 0
                                        ? "bg-emerald-100 text-emerald-800"
                                        : workload < WORKLOAD_LIMIT
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-rose-100 text-rose-800",
                                    )}
                                  >
                                    {workload === 0 ? "Available (0)" : `${workload} active tasks`}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "size-5 rounded border flex items-center justify-center text-white transition-all",
                                isSelected
                                  ? "bg-[#0052cc] border-[#0052cc]"
                                  : "border-slate-300 bg-white",
                              )}
                            >
                              {isSelected && <Check className="size-3.5" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dispatch Action */}
                    <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {selectedMechanicIds.length === 0 ? (
                          <span className="text-amber-700 font-semibold">Please select at least 1 technician</span>
                        ) : (
                          <span>
                            Selected: <strong className="text-foreground">{selectedMechanicIds.length} technician(s)</strong>
                          </span>
                        )}
                      </div>

                      <Button
                        onClick={handleConfirmAssignment}
                        disabled={submitting || selectedMechanicIds.length === 0}
                        className="gap-2 bg-[#0052cc] text-xs font-bold text-white shadow-xs hover:bg-[#0047b3] disabled:opacity-50 h-10 px-5"
                      >
                        <UserCheck className="size-4" />
                        {submitting ? "Assigning..." : `Assign & Dispatch to Task #${currentTask.id}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-white p-16 text-center text-muted-foreground text-sm">
                No task cards available in workshop queue.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssignMechanicPage() {
  return (
    <Suspense fallback={<DetailLoading label="Loading mechanic assignment workspace..." />}>
      <AssignMechanicContent />
    </Suspense>
  );
}
