"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Clock,
  Eye,
  LayoutGrid,
  List,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addAppointment,
  deleteAppointment,
  fetchAppointments,
  updateAppointment,
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
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

const PAGE_SIZE = 8;

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
  pending: "bg-[rgba(255,193,7,0.12)] text-[#8b5000] border-[rgba(255,193,7,0.3)]",
  confirmed: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
  cancelled: "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]",
};

export default function AdminAppointmentsPage() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const appointmentsStatus = useAppSelector((s) => s.appointments.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const tasks = useAppSelector((s) => s.tasks.items);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled" | "today">("all");
  const [timeframeFilter, setTimeframeFilter] = useState<"all" | "today" | "tomorrow" | "this-week" | "past-due">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc" | "status">("date-asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);

  // Dialog States
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [deletingItem, setDeletingItem] = useState<Appointment | null>(null);
  const [viewItem, setViewItem] = useState<Appointment | null>(null);
  const [cancellingItem, setCancellingItem] = useState<Appointment | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // New Booking Form State
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newVehicleId, setNewVehicleId] = useState("");
  const [newServiceIds, setNewServiceIds] = useState<string[]>([]);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState("09:00 AM");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    dispatch(fetchAppointments());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
    if (customers.length === 0) dispatch(fetchCustomers());
    if (tasks.length === 0) dispatch(fetchTasks());
  }, [dispatch, vehicles.length, services.length, customers.length, tasks.length]);

  const refresh = () => {
    dispatch(fetchAppointments());
    toast.success("Appointments refreshed");
  };

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filtered dataset
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      // Status filter
      if (statusFilter === "today") {
        if (a.date !== todayStr) return false;
      } else if (statusFilter !== "all") {
        if (a.status !== statusFilter) return false;
      }

      // Timeframe filter
      if (timeframeFilter === "today" && a.date !== todayStr) return false;
      if (timeframeFilter === "tomorrow") {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const tomStr = d.toISOString().split("T")[0];
        if (a.date !== tomStr) return false;
      }
      if (timeframeFilter === "this-week") {
        const apptDate = new Date(a.date);
        const now = new Date();
        const diffDays = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < -1 || diffDays > 7) return false;
      }
      if (timeframeFilter === "past-due") {
        if (a.date >= todayStr || a.status === "cancelled") return false;
      }

      // Search keyword
      const q = search.trim().toLowerCase();
      if (!q) return true;

      const vehicle = vehicles.find((v) => v.id === a.vehicleId);
      const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
      const apptServices = a.serviceIds.map((id) => services.find((s) => s.id === id)?.name || "").join(" ");

      return (
        a.id.toLowerCase().includes(q) ||
        (customer?.name && customer.name.toLowerCase().includes(q)) ||
        (customer?.phone && customer.phone.toLowerCase().includes(q)) ||
        (customer?.email && customer.email.toLowerCase().includes(q)) ||
        (vehicle?.regNo && vehicle.regNo.toLowerCase().includes(q)) ||
        (vehicle?.make && vehicle.make.toLowerCase().includes(q)) ||
        (vehicle?.model && vehicle.model.toLowerCase().includes(q)) ||
        apptServices.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q))
      );
    });
  }, [appointments, statusFilter, timeframeFilter, search, todayStr, vehicles, customers, services]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "date-asc") {
        return (a.date + a.time).localeCompare(b.date + b.time);
      }
      if (sortBy === "date-desc") {
        return (b.date + b.time).localeCompare(a.date + a.time);
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });
  }, [filtered, sortBy]);

  // Aggregated Counts
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
  const todayCount = appointments.filter((a) => a.date === todayStr).length;

  // Pagination
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const rows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(pageCount, 6) }, (_, i) => i + 1);

  // Status Actions
  const handleConfirm = async (a: Appointment) => {
    setActionBusy(true);
    try {
      await dispatch(updateAppointment({ id: a.id, data: { status: "confirmed" } })).unwrap();
      toast.success(`Appointment #${a.id.slice(-6).toUpperCase()} confirmed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingItem) return;
    setActionBusy(true);
    try {
      await dispatch(updateAppointment({ id: cancellingItem.id, data: { status: "cancelled" } })).unwrap();
      toast.success(`Appointment cancelled`);
      setCancellingItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel appointment");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRescheduleOpen = (a: Appointment) => {
    setRescheduleItem(a);
    setRescheduleDate(a.date);
    setRescheduleTime(a.time);
    setRescheduleNotes(a.notes || "");
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleItem || !rescheduleDate || !rescheduleTime) {
      toast.error("Please pick a valid date and time slot");
      return;
    }
    setActionBusy(true);
    try {
      await dispatch(
        updateAppointment({
          id: rescheduleItem.id,
          data: {
            date: rescheduleDate,
            time: rescheduleTime,
            notes: rescheduleNotes.trim(),
          },
        }),
      ).unwrap();
      toast.success(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      setRescheduleItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingItem) return;
    setActionBusy(true);
    try {
      await dispatch(deleteAppointment(deletingItem.id)).unwrap();
      toast.success("Appointment removed");
      setDeletingItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionBusy(false);
    }
  };

  // New Booking Handler
  const handleNewBooking = async () => {
    if (!newVehicleId || newServiceIds.length === 0 || !newDate || !newTime) {
      toast.error("Please select a vehicle, at least one service, date, and time slot");
      return;
    }
    setActionBusy(true);
    try {
      await dispatch(
        addAppointment({
          ownerId: newCustomerId || undefined,
          vehicleId: newVehicleId,
          serviceIds: newServiceIds,
          date: newDate,
          time: newTime,
          notes: newNotes.trim(),
        }),
      ).unwrap();
      toast.success("Appointment booked successfully");
      setNewBookingOpen(false);
      setNewVehicleId("");
      setNewServiceIds([]);
      setNewNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setActionBusy(false);
    }
  };

  const toggleNewService = (id: string) => {
    setNewServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  // Vehicles for selected customer in booking dialog
  const availableVehicles = useMemo(() => {
    if (!newCustomerId) return vehicles;
    return vehicles.filter((v) => v.ownerId === newCustomerId);
  }, [vehicles, newCustomerId]);

  if ((appointmentsStatus === "idle" || appointmentsStatus === "loading") && appointments.length === 0) {
    return <TableLoading label="Loading appointment dashboard" />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f5] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-[#424753]">
            <Link href="/admin/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span>Operations</span>
            <span>›</span>
            <span className="text-foreground">Appointments</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Appointment Management</h1>
              <p className="text-xs text-muted-foreground pt-0.5">
                Overview of workshop service bookings, customer schedules, confirmations, and repair intakes.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-semibold text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-secondary"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setNewBookingOpen(true)}
                className="gap-1.5 rounded-md bg-[#004492] px-4 py-2 text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
              >
                <CalendarPlus className="size-4" />
                Book Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
              <Calendar className="size-4 text-[#004492]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-foreground">{totalCount}</span>
            <span className="text-[11px] text-muted-foreground">all-time records</span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
              <span className="size-2 rounded-full bg-[#ffc107]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-[#b45309]">{pendingCount}</span>
            <span className="text-[11px] text-muted-foreground">needs confirmation</span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-wider">Confirmed</span>
              <span className="size-2 rounded-full bg-[#15803d]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-[#15803d]">{confirmedCount}</span>
            <span className="text-[11px] text-muted-foreground">scheduled for bay</span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Schedule</span>
              <CalendarClock className="size-4 text-[#004492]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-foreground">{todayCount}</span>
            <span className="text-[11px] text-muted-foreground">{todayStr}</span>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-wider">Cancelled</span>
              <span className="size-2 rounded-full bg-[#e11d48]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-[#64748b]">{cancelledCount}</span>
            <span className="text-[11px] text-muted-foreground">declined or missed</span>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="flex flex-col gap-3.5 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All Bookings", count: totalCount },
                  { key: "pending", label: "Pending", count: pendingCount },
                  { key: "confirmed", label: "Confirmed", count: confirmedCount },
                  { key: "today", label: "Today", count: todayCount },
                  { key: "cancelled", label: "Cancelled", count: cancelledCount },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(t.key);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    statusFilter === t.key
                      ? "bg-[#004492] text-white shadow-sm"
                      : "border border-[#e2e8f0] bg-white text-[#424753] hover:border-[#004492]/40 hover:text-[#004492]",
                  )}
                >
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      statusFilter === t.key ? "bg-white/20 text-white" : "bg-[#f3f4f5] text-[#64748b]",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-md bg-[#f3f4f5] p-[3px]">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                  viewMode === "cards" ? "bg-white text-[#004492] shadow-sm" : "text-[#64748b] hover:text-foreground",
                )}
              >
                <LayoutGrid className="size-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                  viewMode === "table" ? "bg-white text-[#004492] shadow-sm" : "text-[#64748b] hover:text-foreground",
                )}
              >
                <List className="size-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Secondary Controls: Search, Timeframe & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3">
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by customer, phone, plate, service..."
                className="h-9 rounded-md border-[#e2e8f0] bg-white pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:border-[#004492]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Timeframe selector */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5 text-[#004492]" />
                <span>Window:</span>
                <select
                  value={timeframeFilter}
                  onChange={(e) => {
                    setTimeframeFilter(e.target.value as typeof timeframeFilter);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-foreground outline-none focus:border-[#004492]"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Scheduled Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this-week">This Week</option>
                  <option value="past-due">Past Due (Unconfirmed)</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown className="size-3.5" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-foreground outline-none focus:border-[#004492]"
                >
                  <option value="date-asc">Date: Soonest First</option>
                  <option value="date-desc">Date: Latest First</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Reset filter button */}
              {(search || statusFilter !== "all" || timeframeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setTimeframeFilter("all");
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs font-medium text-[#424753]">
          <span>
            Showing <strong className="text-foreground">{rows.length}</strong> of{" "}
            <strong className="text-foreground">{sorted.length}</strong> appointments
            {filtered.length !== totalCount && ` (filtered from ${totalCount} total)`}
          </span>
        </div>

        {/* View Mode: Cards or Table */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-white py-20 text-center shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#004492]">
              <CalendarPlus className="size-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No appointments found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {search || statusFilter !== "all" || timeframeFilter !== "all"
                ? "No bookings match your current filter parameters. Try clearing the search or resetting filters."
                : "No customer service appointments scheduled in the system. Click below to book an appointment."}
            </p>
            {search || statusFilter !== "all" || timeframeFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTimeframeFilter("all");
                  setPage(1);
                }}
                className="mt-4 text-xs"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setNewBookingOpen(true)}
                className="mt-4 gap-1.5 rounded-md bg-[#004492] text-xs text-white"
              >
                <CalendarPlus className="size-3.5" />
                Book New Appointment
              </Button>
            )}
          </div>
        ) : viewMode === "cards" ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {rows.map((a) => {
              const vehicle = vehicles.find((v) => v.id === a.vehicleId);
              const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
              const dateObj = new Date(a.date);
              const isPast = new Date(`${a.date}T23:59:59`) < new Date();
              const apptServices = a.serviceIds
                .map((id) => services.find((s) => s.id === id))
                .filter(Boolean);
              const totalPrice = apptServices.reduce((acc, s) => acc + (s?.basePrice || 0), 0);

              return (
                <div
                  key={a.id}
                  className="flex flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:border-[#004492]/40"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="flex min-w-[72px] flex-col items-center rounded-xl border border-[#e2e8f0] bg-[#f8f9fa] p-2.5 text-center shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#004492]">
                        {MONTHS[dateObj.getMonth()] ?? "—"}
                      </span>
                      <span className="text-2xl font-black text-foreground">{dateObj.getDate()}</span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground pt-0.5">
                        <Clock className="size-2.5" />
                        {a.time}
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </span>
                          {vehicle?.regNo && (
                            <span className="rounded bg-[#f3f4f5] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#424753]">
                              {vehicle.regNo}
                            </span>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-1.5">
                          {isPast && a.status === "pending" && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              Past Due
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                              statusBadgeStyles[a.status] || "bg-secondary text-muted-foreground",
                            )}
                          >
                            {a.status}
                          </span>
                        </div>
                      </div>

                      {/* Customer Contact line */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#424753]">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <User className="size-3 text-muted-foreground" />
                          {customer?.name || "Customer"}
                        </span>
                        {customer?.phone && (
                          <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="size-2.5 text-muted-foreground" />
                            <span>{customer.phone}</span>
                          </a>
                        )}
                        {customer?.email && (
                          <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-primary">
                            <Mail className="size-2.5 text-muted-foreground" />
                            <span className="truncate max-w-[140px]">{customer.email}</span>
                          </a>
                        )}
                      </div>

                      {/* Requested Services Tags */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {apptServices.map((s) => (
                          <span
                            key={s?.id}
                            className="inline-flex items-center gap-1 rounded bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold text-[#004492] border border-[#bfdbfe]"
                          >
                            <Wrench className="size-2.5" />
                            {s?.name}
                          </span>
                        ))}
                        {totalPrice > 0 && (
                          <span className="text-[10px] font-bold text-[#004492]">
                            · Est. ${totalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Notes snippet */}
                      {a.notes && (
                        <p className="mt-2 flex items-start gap-1 text-[11px] text-muted-foreground line-clamp-1 bg-[#f8f9fa] p-1.5 rounded">
                          <MessageSquare className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                          <span>{a.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#e2e8f0] pt-3">
                    <span className="text-[11px] font-mono text-muted-foreground">#{a.id.slice(-8).toUpperCase()}</span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewItem(a)}
                        className="h-8 px-2 text-xs font-semibold text-[#424753]"
                        title="View Details"
                      >
                        <Eye className="size-3.5 mr-1" />
                        Details
                      </Button>

                      {a.status === "pending" && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionBusy}
                          onClick={() => void handleConfirm(a)}
                          className="h-8 gap-1 rounded-md bg-[#15803d] px-3 text-xs font-semibold text-white hover:bg-[#15803d]/90"
                        >
                          <CalendarCheck className="size-3.5" />
                          Confirm
                        </Button>
                      )}

                      {a.status === "confirmed" && (
                        <Button
                          asChild
                          size="sm"
                          className="h-8 gap-1 rounded-md bg-[#004492] px-3 text-xs font-semibold text-white hover:bg-[#004492]/90"
                        >
                          <Link href={`/advisor/tasks/new?appointmentId=${a.id}`}>
                            <Wrench className="size-3.5" />
                            Start Intake
                          </Link>
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRescheduleOpen(a)}
                        className="h-8 px-2 text-xs font-semibold text-[#424753]"
                        title="Reschedule"
                      >
                        <CalendarClock className="size-3.5 mr-1" />
                        Reschedule
                      </Button>

                      {a.status !== "cancelled" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCancellingItem(a)}
                          className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          title="Cancel Booking"
                        >
                          <CalendarX className="size-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingItem(a)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] border-b border-[#e2e8f0]">
                  <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Schedule</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Customer</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Vehicle</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Services</TableHead>
                  <TableHead className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#424753]">Status</TableHead>
                  <TableHead className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#424753]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => {
                  const vehicle = vehicles.find((v) => v.id === a.vehicleId);
                  const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
                  const dateObj = new Date(a.date);
                  const apptServices = a.serviceIds
                    .map((id) => services.find((s) => s.id === id))
                    .filter(Boolean);

                  return (
                    <TableRow key={a.id} className="border-t border-[#e2e8f0] transition-colors hover:bg-[#f8f9fa]">
                      <TableCell className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          <span className="text-[11px] font-semibold text-[#004492] flex items-center gap-1">
                            <Clock className="size-3" />
                            {a.time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{customer?.name || "Customer"}</span>
                          <span className="text-[11px] text-muted-foreground">{customer?.phone || customer?.email || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </span>
                          {vehicle?.regNo && (
                            <span className="font-mono text-[10px] text-muted-foreground">{vehicle.regNo}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {apptServices.map((s) => (
                            <span
                              key={s?.id}
                              className="rounded bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#004492]"
                            >
                              {s?.name}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-center">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase",
                            statusBadgeStyles[a.status] || "bg-secondary text-muted-foreground",
                          )}
                        >
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {a.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => void handleConfirm(a)}
                              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Confirm appointment"
                            >
                              <CalendarCheck className="size-4" />
                            </button>
                          )}
                          {a.status === "confirmed" && (
                            <Link
                              href={`/advisor/tasks/new?appointmentId=${a.id}`}
                              className="rounded p-1.5 text-[#004492] hover:bg-[#eff6ff] transition-colors"
                              title="Start Repair Intake"
                            >
                              <Wrench className="size-4" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRescheduleOpen(a)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-[#eff6ff] hover:text-[#004492] transition-colors"
                            title="Reschedule"
                          >
                            <CalendarClock className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewItem(a)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-[#eff6ff] hover:text-[#004492] transition-colors"
                            title="Details"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(a)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-5 py-3.5 text-xs font-medium text-[#424753] rounded-xl border bg-white shadow-xs">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length} appointments
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded border border-[#e2e8f0] bg-white p-2 text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                Previous
              </button>
              {pageNumbers.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPage(label)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded text-xs font-semibold tracking-[0.24px] transition-colors",
                    safePage === label
                      ? "bg-[#004492] text-white shadow-sm"
                      : "border border-[#e2e8f0] bg-white text-[#424753] hover:bg-secondary",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                className="rounded border border-[#e2e8f0] bg-white p-2 text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Appointment Modal Dialog */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Schedule Customer Appointment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Book a workshop service appointment for walk-in or phone-in customers.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Customer select */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Customer Account</Label>
              <select
                value={newCustomerId}
                onChange={(e) => {
                  setNewCustomerId(e.target.value);
                  setNewVehicleId("");
                }}
                className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-xs text-foreground outline-none focus:border-[#004492]"
              >
                <option value="">Select customer (or all registered vehicles)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle select */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Vehicle <span className="text-rose-500">*</span>
              </Label>
              <select
                value={newVehicleId}
                onChange={(e) => setNewVehicleId(e.target.value)}
                className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-xs text-foreground outline-none focus:border-[#004492]"
              >
                <option value="">Select vehicle...</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year} {v.make} {v.model} — [{v.regNo}]
                  </option>
                ))}
              </select>
            </div>

            {/* Services multi-select */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Select Services <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[11px] text-[#004492] font-semibold">
                  {newServiceIds.length} selected
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-md border border-[#e2e8f0] p-2 bg-[#f8f9fa]">
                {services.map((s) => {
                  const active = newServiceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleNewService(s.id)}
                      className={cn(
                        "flex items-center justify-between rounded p-2 text-left text-xs transition-colors border",
                        active
                          ? "bg-[#eff6ff] border-[#004492] text-[#004492] font-semibold"
                          : "bg-white border-[#e2e8f0] text-[#424753] hover:border-[#004492]/40",
                      )}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-1 shrink-0">${s.basePrice.toFixed(0)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time slot */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Appointment Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Time Slot</Label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-xs text-foreground outline-none focus:border-[#004492]"
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
              <Label className="text-xs font-semibold text-foreground">Customer Notes & Reported Symptoms</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Mention customer complaints, special requests, or parts to inspect..."
                className="min-h-16 text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setNewBookingOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionBusy}
              onClick={() => void handleNewBooking()}
              className="bg-[#004492] text-xs text-white"
            >
              {actionBusy ? "Booking..." : "Schedule Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal Dialog */}
      <Dialog open={rescheduleItem !== null} onOpenChange={(open) => !open && setRescheduleItem(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Reschedule Appointment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a new date and time slot for booking #{rescheduleItem?.id.slice(-6).toUpperCase()}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">New Date</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">New Time Slot</Label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-xs text-foreground outline-none focus:border-[#004492]"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Update Customer Notes</Label>
              <Textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                className="min-h-16 text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setRescheduleItem(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionBusy}
              onClick={() => void handleRescheduleSubmit()}
              className="bg-[#004492] text-xs text-white"
            >
              {actionBusy ? "Updating..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancellingItem !== null} onOpenChange={(open) => !open && setCancellingItem(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Cancel Appointment?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This appointment will be marked as cancelled. The customer will be notified of the cancellation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setCancellingItem(null)} className="text-xs">
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionBusy}
              onClick={() => void handleCancelSubmit()}
              className="text-xs"
            >
              {actionBusy ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deletingItem !== null} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Delete Appointment Record?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete appointment #{deletingItem?.id.slice(-6).toUpperCase()} permanently? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeletingItem(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionBusy}
              onClick={() => void handleDeleteSubmit()}
              className="text-xs"
            >
              {actionBusy ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewItem !== null} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase",
                  viewItem ? statusBadgeStyles[viewItem.status] : "",
                )}
              >
                {viewItem?.status}
              </span>
              <span className="font-mono text-xs text-muted-foreground">#{viewItem?.id.slice(-8).toUpperCase()}</span>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground pt-2">Appointment Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Customer scheduling and vehicle service request breakdown.
            </DialogDescription>
          </DialogHeader>

          {viewItem && (
            <div className="flex flex-col gap-4 py-2 text-xs">
              {/* Schedule time banner */}
              <div className="flex items-center justify-between rounded-lg bg-[#eff6ff] p-3 border border-[#bfdbfe]">
                <div className="flex items-center gap-2 text-[#004492]">
                  <Calendar className="size-4" />
                  <span className="font-semibold text-sm">
                    {new Date(viewItem.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <span className="font-bold text-sm text-[#004492] flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {viewItem.time}
                </span>
              </div>

              {/* Customer & Vehicle Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Customer</span>
                  <p className="mt-1 font-bold text-foreground text-sm">
                    {customers.find((c) => c.id === viewItem.ownerId)?.name || viewItem.owner?.name || "Customer"}
                  </p>
                  <p className="text-muted-foreground">
                    {customers.find((c) => c.id === viewItem.ownerId)?.phone || viewItem.owner?.phone || "—"}
                  </p>
                  <p className="text-muted-foreground">
                    {customers.find((c) => c.id === viewItem.ownerId)?.email || viewItem.owner?.email || "—"}
                  </p>
                </div>

                <div className="rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle</span>
                  {(() => {
                    const v = vehicles.find((veh) => veh.id === viewItem.vehicleId);
                    return v ? (
                      <>
                        <p className="mt-1 font-bold text-foreground text-sm">
                          {v.year} {v.make} {v.model}
                        </p>
                        <p className="font-mono text-[11px] font-semibold text-[#004492]">Plate: {v.regNo}</p>
                        <p className="text-muted-foreground capitalize">{v.fuelType} · {v.mileage.toLocaleString()} mi</p>
                      </>
                    ) : (
                      <p className="mt-1 text-muted-foreground">Vehicle record not found</p>
                    );
                  })()}
                </div>
              </div>

              {/* Requested Services */}
              <div className="rounded-lg border border-[#e2e8f0] p-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Requested Services</span>
                <div className="mt-2 flex flex-col gap-1.5">
                  {viewItem.serviceIds.map((sid) => {
                    const s = services.find((srv) => srv.id === sid);
                    return (
                      <div key={sid} className="flex items-center justify-between border-b border-[#e2e8f0] pb-1.5 last:border-0 last:pb-0">
                        <span className="font-semibold text-foreground">{s?.name || sid}</span>
                        <span className="font-bold text-[#004492]">${s?.basePrice.toFixed(2) || "0.00"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {viewItem.notes && (
                <div className="rounded-lg border border-[#e2e8f0] bg-[#fafafa] p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Customer Notes</span>
                  <p className="mt-1 text-foreground leading-relaxed">{viewItem.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setViewItem(null)} className="text-xs">
              Close
            </Button>
            {viewItem?.status === "confirmed" && (
              <Button asChild className="bg-[#004492] text-xs text-white">
                <Link href={`/advisor/tasks/new?appointmentId=${viewItem.id}`}>
                  <Wrench className="size-3.5 mr-1" />
                  Start Intake
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}