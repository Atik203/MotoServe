"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Clock,
  Edit2,
  LayoutGrid,
  List,
  Phone,
  RefreshCw,
  Search,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addAppointment,
  fetchAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { TableLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

const TIME_SLOTS = [
  "08:00 AM",
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function AdvisorAppointmentsPage() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const appointmentsStatus = useAppSelector((s) => s.appointments.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const tasks = useAppSelector((s) => s.tasks.items);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Booking Modal State
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState(TIME_SLOTS[2]); // 09:00 AM
  const [bookNotes, setBookNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reschedule Modal State
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchVehicles());
    dispatch(fetchServices());
    dispatch(fetchCustomers());
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchAppointments()).unwrap(),
        dispatch(fetchVehicles()).unwrap(),
        dispatch(fetchServices()).unwrap(),
        dispatch(fetchCustomers()).unwrap(),
        dispatch(fetchTasks()).unwrap(),
      ]);
      toast.success("Appointments updated");
    } catch {
      toast.error("Failed to refresh appointments");
    } finally {
      setIsRefreshing(false);
    }
  };

  // KPI Metrics
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments]);

  // Filtered Appointments
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const todayStr = new Date().toISOString().slice(0, 10);

    return appointments
      .filter((a) => {
        const vehicle = vehicles.find((v) => v.id === a.vehicleId);
        const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
        const serviceNames = a.serviceIds
          .map((id) => services.find((s) => s.id === id)?.name)
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          q === "" ||
          a.id.toLowerCase().includes(q) ||
          (customer?.name && customer.name.toLowerCase().includes(q)) ||
          (customer?.phone && customer.phone.toLowerCase().includes(q)) ||
          (customer?.email && customer.email.toLowerCase().includes(q)) ||
          (vehicle?.model && vehicle.model.toLowerCase().includes(q)) ||
          (vehicle?.regNo && vehicle.regNo.toLowerCase().includes(q)) ||
          serviceNames.includes(q) ||
          a.notes.toLowerCase().includes(q);

        const matchesStatus = statusFilter === "all" || a.status === statusFilter;

        let matchesDate = true;
        if (dateFilter === "today") {
          matchesDate = a.date === todayStr;
        } else if (dateFilter === "upcoming") {
          matchesDate = a.date >= todayStr && a.status !== "cancelled";
        } else if (dateFilter === "past") {
          matchesDate = a.date < todayStr;
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [appointments, vehicles, customers, services, search, statusFilter, dateFilter]);

  // Actions
  const handleStatusChange = async (id: string, status: "confirmed" | "cancelled") => {
    try {
      await dispatch(updateAppointmentStatus({ id, status })).unwrap();
      toast.success(status === "confirmed" ? "Appointment confirmed" : "Appointment cancelled");
      dispatch(fetchAppointments());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const handleOpenReschedule = (a: Appointment) => {
    setRescheduleAppointment(a);
    setRescheduleDate(a.date);
    setRescheduleTime(a.time);
    setRescheduleNotes(a.notes || "");
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleAppointment) return;
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please provide date and time");
      return;
    }
    setIsRescheduling(true);
    try {
      await dispatch(
        updateAppointment({
          id: rescheduleAppointment.id,
          data: {
            date: rescheduleDate,
            time: rescheduleTime,
            notes: rescheduleNotes.trim(),
            status: "confirmed",
          },
        }),
      ).unwrap();
      toast.success("Appointment rescheduled and confirmed");
      setRescheduleAppointment(null);
      dispatch(fetchAppointments());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setIsRescheduling(false);
    }
  };

  // Create Appointment Form
  const customerVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    return vehicles.filter((v) => v.ownerId === selectedCustomerId);
  }, [vehicles, selectedCustomerId]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }
    if (selectedServiceIds.length === 0) {
      toast.error("Please select at least one service");
      return;
    }
    if (!bookDate || !bookTime) {
      toast.error("Please select date and time");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        addAppointment({
          ownerId: selectedCustomerId,
          vehicleId: selectedVehicleId,
          serviceIds: selectedServiceIds,
          date: bookDate,
          time: bookTime,
          notes: bookNotes.trim(),
          status: "confirmed",
        }),
      ).unwrap();
      toast.success("Appointment booked successfully");
      setIsNewOpen(false);
      setSelectedCustomerId("");
      setSelectedVehicleId("");
      setSelectedServiceIds([]);
      setBookDate("");
      setBookNotes("");
      dispatch(fetchAppointments());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if ((appointmentsStatus === "idle" || appointmentsStatus === "loading") && appointments.length === 0) {
    return <TableLoading label="Loading advisor appointments roster..." />;
  }

  return (
    <div className="bg-background min-h-screen p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointment Desk</h1>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Customer Reception & Intake
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confirm scheduled customer bookings, allocate intake slots, or convert appointments directly into workshop task cards.
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
              onClick={() => {
                setBookDate(new Date().toISOString().slice(0, 10));
                setIsNewOpen(true);
              }}
              className="gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <CalendarPlus className="size-3.5" />
              Book Appointment
            </Button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setStatusFilter("all")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              statusFilter === "all" ? "border-primary bg-blue-50/30" : "border-border bg-white hover:border-primary/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Bookings</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <Calendar className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground mt-2">{counts.all}</p>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              statusFilter === "pending" ? "border-amber-400 bg-amber-50/40" : "border-border bg-white hover:border-amber-400/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Pending Confirmation</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-amber-800 mt-2">{counts.pending}</p>
          </div>

          <div
            onClick={() => setStatusFilter("confirmed")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              statusFilter === "confirmed" ? "border-emerald-400 bg-emerald-50/40" : "border-border bg-white hover:border-emerald-400/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Confirmed Bookings</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarCheck className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-700 mt-2">{counts.confirmed}</p>
          </div>

          <div
            onClick={() => setStatusFilter("cancelled")}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all cursor-pointer",
              statusFilter === "cancelled" ? "border-red-400 bg-red-50/40" : "border-border bg-white hover:border-red-400/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Cancelled / No-Show</span>
              <div className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <CalendarX className="size-4" />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-red-700 mt-2">{counts.cancelled}</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-64 md:w-80">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, plate, service..."
                className="h-9 rounded-xl border-border bg-[#f8f9fa] pl-9 text-xs focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-[#f8f9fa] p-1">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "confirmed", label: "Confirmed" },
                { key: "cancelled", label: "Cancelled" },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatusFilter(st.key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    statusFilter === st.key
                      ? "bg-white text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Date Quick Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-border bg-[#f8f9fa] pl-3 pr-8 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">Date: All Schedule</option>
                <option value="today">Date: Today Only</option>
                <option value="upcoming">Date: Upcoming</option>
                <option value="past">Date: Past History</option>
              </select>
            </div>

            {(search || statusFilter !== "all" || dateFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <X className="size-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl border border-border bg-[#f8f9fa] p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
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
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "cards"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Cards Grid"
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </button>
          </div>
        </div>

        {/* Content Listing: Table or Cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-16 text-center shadow-xs">
            <CalendarX className="size-12 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-bold text-foreground">No appointments found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              There are no customer appointments matching your active search query or status filter.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter("all");
              }}
              variant="outline"
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Clear Active Filters
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-32 text-xs font-bold text-muted-foreground">DATE & TIME</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">CUSTOMER</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">VEHICLE</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">REQUESTED SERVICES</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">INTAKE / JOB CARD</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const vehicle = vehicles.find((v) => v.id === a.vehicleId) ?? a.vehicle;
                  const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
                  const dateObj = new Date(a.date);
                  const linkedTask = a.taskCard ?? tasks.find((t) => t.appointmentId === a.id);
                  const pillClass = statusBadgeStyles[a.status] ?? statusBadgeStyles.pending;

                  return (
                    <TableRow key={a.id} className="border-border hover:bg-secondary/40 transition-colors">
                      {/* Date & Time */}
                      <TableCell className="align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex min-w-[50px] flex-col items-center rounded-lg border border-border bg-[#f8f9fa] px-2 py-1 text-center">
                            <span className="text-[9px] font-bold text-primary uppercase">
                              {MONTHS[dateObj.getMonth()] ?? "—"}
                            </span>
                            <span className="font-mono text-base font-bold text-foreground leading-tight">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-foreground">{a.time}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {dateObj.toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {customer?.name
                              ? customer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                              : "C"}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{customer?.name ?? "Customer"}</p>
                            {customer?.phone && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="size-2.5" />
                                {customer.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell className="align-middle">
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </p>
                          <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider mt-0.5">
                            {vehicle?.regNo ?? "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Services & Notes */}
                      <TableCell className="align-middle">
                        <div className="max-w-[220px]">
                          <p className="text-xs font-medium text-foreground truncate">
                            {a.serviceIds
                              .map((id) => services.find((s) => s.id === id)?.name)
                              .filter(Boolean)
                              .join(", ") || "General Service Request"}
                          </p>
                          {a.notes && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 italic">
                              &ldquo;{a.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle whitespace-nowrap">
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize", pillClass)}>
                          {a.status}
                        </span>
                      </TableCell>

                      {/* Linked Task Card / Intake */}
                      <TableCell className="align-middle whitespace-nowrap">
                        {linkedTask ? (
                          <Link
                            href={`/advisor/tasks/${linkedTask.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[11px] font-bold text-primary hover:underline"
                          >
                            <Wrench className="size-2.5" />
                            #{linkedTask.id}
                          </Link>
                        ) : a.status === "confirmed" ? (
                          <Link
                            href={`/advisor/receive?appointment=${a.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                          >
                            <Truck className="size-3" />
                            Start Intake
                          </Link>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Not Intaked</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => void handleStatusChange(a.id, "confirmed")}
                              className="h-7 gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                              title="Confirm booking"
                            >
                              <CalendarCheck className="size-3.5" />
                              Confirm
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReschedule(a)}
                            className="h-7 w-7 p-0 rounded-lg border-border text-foreground hover:bg-secondary cursor-pointer"
                            title="Reschedule appointment"
                          >
                            <Edit2 className="size-3 text-primary" />
                          </Button>

                          {(a.status === "pending" || a.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleStatusChange(a.id, "cancelled")}
                              className="h-7 w-7 p-0 rounded-lg border-border text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Cancel appointment"
                            >
                              <CalendarX className="size-3.5" />
                            </Button>
                          )}

                          <Link
                            href={`/advisor/appointments/${a.id}`}
                            className="inline-flex h-7 items-center rounded-lg bg-primary px-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 transition-colors"
                          >
                            Details
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
            {filtered.map((a) => {
              const vehicle = vehicles.find((v) => v.id === a.vehicleId) ?? a.vehicle;
              const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
              const dateObj = new Date(a.date);
              const pillClass = statusBadgeStyles[a.status] ?? statusBadgeStyles.pending;
              const linkedTask = a.taskCard ?? tasks.find((t) => t.appointmentId === a.id);

              return (
                <div
                  key={a.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs hover:border-primary/40 transition-all"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {vehicle && (
                          <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
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

                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", pillClass)}>
                        {a.status}
                      </span>
                    </div>

                    <div className="border-t border-border pt-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-primary" />
                          {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground" />
                          {a.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                        {a.serviceIds
                          .map((id) => services.find((s) => s.id === id)?.name)
                          .filter(Boolean)
                          .join(", ") || "General Workshop Service"}
                      </p>
                      {a.notes && (
                        <p className="text-[11px] text-muted-foreground italic line-clamp-1 mt-0.5">
                          &ldquo;{a.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div>
                      {linkedTask ? (
                        <Link
                          href={`/advisor/tasks/${linkedTask.id}`}
                          className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-primary hover:underline"
                        >
                          #{linkedTask.id}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">ID: #{a.id}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {a.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => void handleStatusChange(a.id, "confirmed")}
                          className="h-7 rounded-lg bg-emerald-600 px-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Confirm
                        </Button>
                      )}
                      {a.status === "confirmed" && !linkedTask && (
                        <Link
                          href={`/advisor/receive?appointment=${a.id}`}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs"
                        >
                          <Truck className="size-3" />
                          Intake
                        </Link>
                      )}
                      <Link
                        href={`/advisor/appointments/${a.id}`}
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

      {/* Book New Appointment Dialog */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Schedule Customer Appointment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a confirmed or pending booking on behalf of a vehicle owner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAppointment} className="flex flex-col gap-4 py-2 text-xs">
            {/* Customer Select */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">Select Customer *</Label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedVehicleId("");
                }}
                required
                className="h-9 rounded-xl border border-border bg-[#f8f9fa] px-3 text-xs font-medium text-foreground outline-none focus:bg-white cursor-pointer"
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
              <Label className="text-xs font-bold text-foreground">Select Vehicle *</Label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                disabled={!selectedCustomerId}
                className="h-9 rounded-xl border border-border bg-[#f8f9fa] px-3 text-xs font-medium text-foreground outline-none focus:bg-white cursor-pointer disabled:opacity-50"
              >
                <option value="">
                  {selectedCustomerId ? "-- Choose Customer Vehicle --" : "-- Select Customer First --"}
                </option>
                {customerVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} ({v.regNo})
                  </option>
                ))}
              </select>
            </div>

            {/* Services Multi-Select */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">Requested Services *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-border bg-[#f8f9fa]">
                {services.map((srv) => {
                  const checked = selectedServiceIds.includes(srv.id);
                  return (
                    <label
                      key={srv.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors cursor-pointer",
                        checked ? "border-primary bg-blue-50/60 font-semibold text-primary" : "border-border bg-white text-foreground",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedServiceIds((prev) =>
                            checked ? prev.filter((item) => item !== srv.id) : [...prev, srv.id],
                          );
                        }}
                        className="rounded accent-primary"
                      />
                      <span className="truncate">{srv.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-foreground">Date *</Label>
                <Input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  required
                  className="h-9 rounded-xl border-border bg-[#f8f9fa] text-xs focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-foreground">Time Slot *</Label>
                <select
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  required
                  className="h-9 rounded-xl border border-border bg-[#f8f9fa] px-3 text-xs font-medium text-foreground outline-none focus:bg-white cursor-pointer"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">Intake Concerns / Notes</Label>
              <Textarea
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                placeholder="E.g. customer reported brake squeal and requested multipoint check..."
                className="min-h-16 resize-none rounded-xl border-border bg-[#f8f9fa] text-xs"
              />
            </div>

            <DialogFooter className="mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-primary text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
              >
                {isSubmitting ? "Booking..." : "Confirm & Save Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal Dialog */}
      <Dialog open={rescheduleAppointment !== null} onOpenChange={(open) => !open && setRescheduleAppointment(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Reschedule Appointment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the assigned booking date, arrival time slot, or intake notes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-foreground">New Date *</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-9 rounded-xl border-border bg-[#f8f9fa] text-xs focus:bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-foreground">New Time Slot *</Label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="h-9 rounded-xl border border-border bg-[#f8f9fa] px-3 text-xs font-medium text-foreground outline-none focus:bg-white cursor-pointer"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">Advisor Notes / Reason</Label>
              <Textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Reason for reschedule or customer instructions..."
                className="min-h-20 resize-none rounded-xl border-border bg-[#f8f9fa] text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRescheduleAppointment(null)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveReschedule}
              disabled={isRescheduling}
              className="rounded-xl bg-primary text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
            >
              {isRescheduling ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}