"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  Car,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Truck,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchAppointments, updateAppointmentStatus } from "@/store/slices/appointmentsSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchThreads } from "@/store/slices/chatSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { buildKpis } from "@/lib/kpis";
import { DashboardLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const kpiIcons: Record<string, typeof Calendar> = {
  calendar: Calendar,
  wrench: Wrench,
  "file-check": FileCheck,
  car: Car,
  "message-square": MessageSquare,
  "check-circle": CheckCircle2,
};

const appointmentStatusStyles: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending Confirmation",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  confirmed: {
    label: "Confirmed Booking",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export default function AdvisorDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const tasks = useAppSelector((s) => s.tasks.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const threads = useAppSelector((s) => s.chat.threads);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const appointmentsStatus = useAppSelector((s) => s.appointments.status);

  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchAppointments());
    dispatch(fetchEstimates());
    dispatch(fetchThreads());
    dispatch(fetchServices());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchTasks()).unwrap(),
        dispatch(fetchVehicles()).unwrap(),
        dispatch(fetchAppointments()).unwrap(),
        dispatch(fetchEstimates()).unwrap(),
        dispatch(fetchThreads()).unwrap(),
        dispatch(fetchServices()).unwrap(),
        dispatch(fetchCustomers()).unwrap(),
      ]);
      toast.success("Dashboard data refreshed");
    } catch {
      toast.error("Failed to refresh dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  const kpis = useMemo(
    () => buildKpis("advisor", { tasks, vehicles, appointments, estimates, threads }),
    [tasks, vehicles, appointments, estimates, threads],
  );

  const pendingEstimates = useMemo(
    () => estimates.filter((e) => e.status === "pending"),
    [estimates],
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayKey),
    [appointments, todayKey],
  );

  const scheduleSlots = useMemo(() => {
    const list = todayAppointments.length > 0 ? todayAppointments : appointments.slice(0, 5);
    return list.map((a) => {
      const vehicle = vehicles.find((v) => v.id === a.vehicleId);
      const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
      const serviceTitles = a.serviceIds
        .map((id) => services.find((s) => s.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      return {
        appointment: a,
        time: a.time,
        title: serviceTitles || "Scheduled Workshop Service",
        customerName: customer?.name ?? "Customer",
        customerPhone: customer?.phone ?? "",
        vehicleName: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle",
        regNo: vehicle?.regNo ?? "—",
        current: a.status === "pending",
      };
    });
  }, [todayAppointments, appointments, vehicles, customers, services]);

  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed");
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase();
    return activeTasks.filter((t) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicleId) ?? t.vehicle;
      const customer = t.customer;
      const matchSearch =
        q === "" ||
        t.id.toLowerCase().includes(q) ||
        (customer?.name && customer.name.toLowerCase().includes(q)) ||
        (vehicle?.model && vehicle.model.toLowerCase().includes(q)) ||
        (vehicle?.regNo && vehicle.regNo.toLowerCase().includes(q)) ||
        t.services.some((s) => s.name.toLowerCase().includes(q));

      const matchFilter = taskFilter === "all" || t.status === taskFilter;
      return matchSearch && matchFilter;
    });
  }, [activeTasks, taskSearch, taskFilter, vehicles]);

  const unreadThread = useMemo(() => {
    return threads.find((t) => t.unread > 0) ?? threads[0] ?? null;
  }, [threads]);

  const initialLoading =
    (tasksStatus === "idle" ||
      tasksStatus === "loading" ||
      appointmentsStatus === "idle" ||
      appointmentsStatus === "loading") &&
    tasks.length === 0 &&
    appointments.length === 0;

  if (initialLoading) {
    return <DashboardLoading label="Loading advisor command center..." />;
  }

  const setAppointmentStatus = async (id: string, status: "confirmed" | "cancelled") => {
    try {
      await dispatch(updateAppointmentStatus({ id, status })).unwrap();
      toast.success(status === "confirmed" ? "Appointment confirmed" : "Appointment cancelled");
      dispatch(fetchAppointments());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-background min-h-screen p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {/* Top Header & Quick Action Hub */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {greeting}, {user?.name || "Service Advisor"}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                On Duty • Service Reception
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workshop Command Center • Oversee vehicle intake, diagnostics, mechanic allocations, and customer estimates.
            </p>
          </div>

          {/* Action Hub Buttons */}
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
            <Link
              href="/advisor/tasks/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" />
              Create Task
            </Link>
            <Link
              href="/advisor/receive"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary transition-colors"
            >
              <Truck className="size-3.5 text-primary" />
              Receive Vehicle
            </Link>
            <Link
              href="/advisor/task-cards/assign"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary transition-colors"
            >
              <UserCheck className="size-3.5 text-emerald-600" />
              Assign Bay
            </Link>
            <Link
              href="/advisor/appointments"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary transition-colors"
            >
              <CalendarPlus className="size-3.5 text-amber-600" />
              Bookings
            </Link>
          </div>
        </div>

        {/* Dynamic KPI Cards (Canonical Theme) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.icon] ?? Calendar;
            return (
              <div
                key={kpi.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-white p-4 shadow-xs hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-muted-foreground line-clamp-1">{kpi.label}</span>
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    <Icon className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-mono text-2xl font-bold tracking-tight text-foreground">{kpi.value}</span>
                  <span className="text-[10px] font-medium text-muted-foreground line-clamp-1 truncate max-w-[85px]">
                    {kpi.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main 2-Column Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Main Column: Active Tasks & Today's Schedule (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Active Workshop Tasks Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-foreground">Active Workshop Tasks</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {activeTasks.length} active
                  </span>
                </div>

                {/* Search & View Switcher */}
                <div className="flex items-center gap-2">
                  <div className="relative w-48 md:w-56">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      placeholder="Search tasks, plates, customer..."
                      className="h-8 rounded-xl border-border bg-white pl-8 text-xs focus:bg-white"
                    />
                    {taskSearch && (
                      <button
                        type="button"
                        onClick={() => setTaskSearch("")}
                        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center rounded-xl border border-border bg-[#f8f9fa] p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                        viewMode === "table"
                          ? "bg-white text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Table View"
                    >
                      <List className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("cards")}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                        viewMode === "cards"
                          ? "bg-white text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Cards View"
                    >
                      <LayoutGrid className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: "all", label: "All Active" },
                  { key: "received", label: "Received" },
                  { key: "inspecting", label: "Inspecting" },
                  { key: "repairing", label: "Repairing" },
                  { key: "testing", label: "Testing" },
                  { key: "ready", label: "Ready" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setTaskFilter(st.key)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                      taskFilter === st.key
                        ? "bg-primary text-white font-semibold shadow-2xs"
                        : "border border-border bg-white text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Tasks Content: Table or Cards */}
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-12 text-center">
                  <Wrench className="size-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-bold text-foreground">No tasks matching criteria</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try clearing your search query or selecting a different status filter.
                  </p>
                </div>
              ) : viewMode === "table" ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
                  <Table>
                    <TableHeader className="bg-[#f8f9fa]">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-28 text-xs font-bold text-muted-foreground">TASK & PLATE</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">CUSTOMER & VEHICLE</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">SERVICE LINES</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">STATUS</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground">ASSIGNED STAFF</TableHead>
                        <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTIONS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => {
                        const vehicle = vehicles.find((v) => v.id === task.vehicleId) ?? task.vehicle;
                        const customer = task.customer;
                        const mechanic = task.mechanic;
                        return (
                          <TableRow key={task.id} className="border-border hover:bg-secondary/40 transition-colors">
                            {/* Task ID & RegNo */}
                            <TableCell className="align-middle whitespace-nowrap">
                              <span className="font-mono text-xs font-bold text-primary">#{task.id}</span>
                              <div className="mt-0.5">
                                <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider">
                                  {vehicle?.regNo ?? "—"}
                                </span>
                              </div>
                            </TableCell>

                            {/* Customer & Vehicle */}
                            <TableCell className="align-middle">
                              <p className="text-xs font-bold text-foreground">{customer?.name ?? "—"}</p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                                {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                              </p>
                            </TableCell>

                            {/* Service Lines */}
                            <TableCell className="align-middle">
                              <p className="text-xs font-medium text-foreground truncate max-w-[200px]">
                                {task.services[0]?.name ?? "General Maintenance"}
                              </p>
                              {task.services.length > 1 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  +{task.services.length - 1} additional service{task.services.length > 2 ? "s" : ""}
                                </p>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="align-middle whitespace-nowrap">
                              <StatusBadge status={task.status} />
                            </TableCell>

                            {/* Staff / Bay */}
                            <TableCell className="align-middle whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-primary">
                                  {mechanic?.name ? mechanic.name.charAt(0) : "M"}
                                </span>
                                <div>
                                  <p className="text-xs font-medium text-foreground">{mechanic?.name ?? "Unassigned"}</p>
                                  <p className="text-[10px] text-muted-foreground">{task.station ?? "Main Workshop Bay"}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="align-middle text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/advisor/tasks/${task.id}`}
                                  className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 transition-colors"
                                >
                                  Details
                                </Link>
                                {!task.mechanicId && (
                                  <Link
                                    href={`/advisor/task-cards/assign?task=${task.id}`}
                                    className="inline-flex h-7 items-center rounded-lg border border-border bg-white px-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                                    title="Assign Mechanic"
                                  >
                                    Assign
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map((task) => {
                    const vehicle = vehicles.find((v) => v.id === task.vehicleId) ?? task.vehicle;
                    const customer = task.customer;
                    return (
                      <div
                        key={task.id}
                        className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs hover:border-primary/40 transition-all"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {vehicle && (
                                <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                                  <VehicleImage src={vehicle.image} alt={vehicle.model} fill className="object-cover" />
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-foreground">{customer?.name ?? "Customer"}</p>
                                <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider mt-0.5">
                                  {vehicle?.regNo ?? "—"}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-primary">#{task.id}</span>
                          </div>

                          <div className="border-t border-border pt-2">
                            <p className="text-xs font-bold text-foreground line-clamp-1">
                              {task.services[0]?.name ?? "Vehicle Service"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                          <StatusBadge status={task.status} />
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/advisor/tasks/${task.id}`}
                              className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
                            >
                              Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today's Workshop Schedule Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">Today&apos;s Appointments & Intake</h2>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {scheduleSlots.length} bookings
                  </span>
                </div>
                <Link
                  href="/advisor/appointments"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  View All Appointments
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {scheduleSlots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-xs text-muted-foreground">
                    No bookings scheduled for today.
                  </div>
                ) : (
                  scheduleSlots.map((slot) => {
                    const pill = appointmentStatusStyles[slot.appointment.status] ?? appointmentStatusStyles.pending;
                    return (
                      <div
                        key={slot.appointment.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-xs transition-all",
                          slot.current ? "border-amber-200 bg-amber-50/20" : "border-border",
                        )}
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          {/* Time Stamp Badge */}
                          <div className="flex min-w-[70px] flex-col items-center rounded-xl border border-border bg-[#f8f9fa] px-2.5 py-1.5 text-center">
                            <span className="font-mono text-xs font-bold text-foreground">{slot.time}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <Clock className="size-2.5" />
                              Arrival
                            </span>
                          </div>

                          {/* Customer & Vehicle Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-foreground">{slot.customerName}</p>
                              <span className={cn("rounded-full border px-2 py-0.2 text-[10px] font-semibold", pill.className)}>
                                {pill.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {slot.vehicleName} • <span className="font-mono font-semibold text-foreground">{slot.regNo}</span>
                            </p>
                            <p className="text-[11px] text-primary font-medium mt-0.5 line-clamp-1">{slot.title}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {slot.appointment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => void setAppointmentStatus(slot.appointment.id, "confirmed")}
                              className="h-7 gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                            >
                              <CalendarCheck className="size-3.5" />
                              Confirm
                            </Button>
                          )}
                          {slot.appointment.status === "confirmed" && (
                            <Link
                              href={`/advisor/receive?appointment=${slot.appointment.id}`}
                              className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white hover:bg-primary/90 shadow-2xs transition-colors"
                            >
                              <Truck className="size-3.5" />
                              Start Intake
                            </Link>
                          )}
                          {(slot.appointment.status === "pending" || slot.appointment.status === "confirmed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void setAppointmentStatus(slot.appointment.id, "cancelled")}
                              className="h-7 rounded-lg border-border px-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <CalendarX className="size-3.5" />
                            </Button>
                          )}
                          <Link
                            href={`/advisor/appointments/${slot.appointment.id}`}
                            className="inline-flex h-7 items-center rounded-lg border border-border bg-secondary px-2 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pending Estimates & Messages Hub (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Pending Customer Estimates Widget */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Pending Approvals</h2>
                </div>
                <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {pendingEstimates.length}
                </span>
              </div>

              {pendingEstimates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-[#f8f9fa] p-6 text-center text-xs text-muted-foreground">
                  All customer estimates have been approved or decided.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingEstimates.slice(0, 4).map((est) => {
                    const customer = customers.find((c) => c.id === est.customerId);
                    const vehicle = est.taskCard && "vehicle" in est.taskCard ? est.taskCard.vehicle : undefined;
                    return (
                      <div
                        key={est.id}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-[#f8f9fa] p-3.5 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{customer?.name ?? "Customer"}</span>
                          <span className="font-mono text-xs font-bold text-primary">${est.total.toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"} • Estimate #{est.id}
                        </p>
                        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                          <Link
                            href={`/advisor/estimates/new`}
                            className="inline-flex h-7 flex-1 items-center justify-center rounded-lg bg-white border border-border text-xs font-semibold text-foreground hover:bg-secondary"
                          >
                            Review
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.success(`Reminder sent to ${customer?.name || "Customer"}`)}
                            className="h-7 flex-1 gap-1 rounded-lg border-primary/20 bg-blue-50/60 text-xs font-semibold text-primary hover:bg-blue-100/60 cursor-pointer"
                          >
                            <Send className="size-3" />
                            Remind
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Unread Customer Inquiries Widget */}
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Customer Inquiries</h2>
                </div>
                <Link href="/advisor/chat" className="text-xs font-semibold text-primary hover:underline">
                  Open Chat
                </Link>
              </div>

              {unreadThread ? (
                <Link
                  href="/advisor/chat"
                  className="flex items-start gap-3 rounded-xl border border-border bg-[#f8f9fa] p-3.5 hover:border-primary/40 transition-all"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-primary text-xs">
                    {unreadThread.owner?.name
                      ? unreadThread.owner.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                      : "OW"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {unreadThread.owner?.name ?? "Vehicle Owner"}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(unreadThread.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {unreadThread.messages[unreadThread.messages.length - 1]?.text ?? unreadThread.subject}
                    </p>
                  </div>
                  {unreadThread.unread > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-2xs">
                      {unreadThread.unread}
                    </span>
                  )}
                </Link>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-[#f8f9fa] p-6 text-center text-xs text-muted-foreground">
                  No active inquiries pending.
                </div>
              )}
            </div>

            {/* Service Bay Status Card */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Workshop Capacity & Stations
              </h3>
              <div className="flex flex-col gap-2 pt-1 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">In Diagnostic Inspection</span>
                  <span className="font-mono font-bold text-foreground">
                    {tasks.filter((t) => t.status === "inspecting").length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Currently on Lifts (Repairing)</span>
                  <span className="font-mono font-bold text-foreground">
                    {tasks.filter((t) => t.status === "repairing").length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Road & Safety Testing</span>
                  <span className="font-mono font-bold text-foreground">
                    {tasks.filter((t) => t.status === "testing").length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Ready for Customer Pickup</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {tasks.filter((t) => t.status === "ready").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
