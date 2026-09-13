"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  Clock,
  Eye,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
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

export default function MyAppointmentsPage() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const appointmentsStatus = useAppSelector((s) => s.appointments.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointments.length === 0) dispatch(fetchAppointments());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, appointments.length, vehicles.length, services.length]);

  const refreshAll = () => {
    dispatch(fetchAppointments());
    dispatch(fetchVehicles());
    dispatch(fetchServices());
    toast.success("Appointments refreshed");
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { total, confirmed, pending, cancelled };
  }, [appointments]);

  const vehicleById = useCallback(
    (id: string) => vehicles.find((v) => v.id === id),
    [vehicles]
  );

  const serviceNamesForAppt = useCallback(
    (serviceIds: string[]) => {
      return serviceIds
        .map((id) => services.find((s) => s.id === id)?.name)
        .filter((n): n is string => Boolean(n));
    },
    [services]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const v = vehicleById(a.vehicleId);
      const names = serviceNamesForAppt(a.serviceIds).join(" ").toLowerCase();
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (v && (v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.regNo.toLowerCase().includes(q))) ||
        names.includes(q) ||
        a.time.toLowerCase().includes(q) ||
        a.date.includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== "all" && a.status !== statusFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [appointments, vehicleById, serviceNamesForAppt, search, statusFilter]);

  const openReschedule = (appt: Appointment) => {
    setReschedulingAppt(appt);
    setRescheduleDate(appt.date);
    setRescheduleTime(appt.time);
    setRescheduleNotes(appt.notes ?? "");
  };

  const handleSaveReschedule = async () => {
    if (!reschedulingAppt || !rescheduleDate || !rescheduleTime) {
      toast.error("Please select both a date and a time slot");
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        updateAppointment({
          id: reschedulingAppt.id,
          data: {
            date: rescheduleDate,
            time: rescheduleTime,
            notes: rescheduleNotes.trim(),
            status: "pending",
          },
        }),
      ).unwrap();
      toast.success("Appointment rescheduled successfully");
      setReschedulingAppt(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule appointment");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setSaving(true);
    try {
      await dispatch(updateAppointmentStatus({ id: cancellingAppt.id, status: "cancelled" })).unwrap();
      toast.success("Appointment cancelled");
      setCancellingAppt(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel appointment");
    } finally {
      setSaving(false);
    }
  };

  if ((appointmentsStatus === "idle" || appointmentsStatus === "loading") && appointments.length === 0) {
    return <TableLoading label="Loading appointments" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-foreground">Appointments</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">My Appointments</h1>
              <p className="text-sm text-muted-foreground pt-0.5">
                View, reschedule, or cancel your upcoming and past workshop service bookings.
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
                href="/dashboard/appointments/book"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <Plus className="size-4" />
                Book Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards (Admin Panel Style) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{metrics.total}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <CalendarDays className="size-5" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirmed</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{metrics.confirmed}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarCheck className="size-5" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending Confirmation</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{metrics.pending}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarClock className="size-5" />
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-xs">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cancelled</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{metrics.cancelled}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <CalendarX className="size-5" />
            </span>
          </div>
        </div>

        {/* Toolbar: Search, Status Tabs & Table/Grid Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3.5 shadow-xs">
          <div className="flex flex-1 items-center gap-3 min-w-[260px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by vehicle, service, time..."
                className="h-9 w-full rounded-xl bg-[#f1f3f5] pr-8 pl-9 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-border border border-transparent"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 size-4 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
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
                onClick={() => setStatusFilter("confirmed")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "confirmed"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Confirmed ({metrics.confirmed})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "pending"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Pending ({metrics.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("cancelled")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "cancelled"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Cancelled ({metrics.cancelled})
              </button>
            </div>
          </div>

          {/* View Mode Switcher (Table default vs Grid) */}
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
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
          </div>
        </div>

        {/* Content Views */}
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-white py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <CalendarPlus className="size-7" />
            </span>
            <div>
              <p className="text-base font-bold text-foreground">
                {appointments.length === 0 ? "No appointments booked yet" : "No appointments match your filters"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {appointments.length === 0
                  ? "Book your vehicle in advance to select your preferred date, time slot, and technician."
                  : "Try clearing your search keyword or switching status filters."}
              </p>
            </div>
            {appointments.length === 0 && (
              <Link
                href="/dashboard/appointments/book"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs"
              >
                Book Your First Appointment
              </Link>
            )}
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW (Default) */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa] border-b border-border">
                  <TableHead className="w-[220px] text-xs font-bold text-muted-foreground uppercase tracking-wider py-3.5">
                    Date & Time
                  </TableHead>
                  <TableHead className="w-[260px] text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Vehicle
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Services Requested
                  </TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appt) => {
                  const v = vehicleById(appt.vehicleId);
                  const names = serviceNamesForAppt(appt.serviceIds);
                  const dateObj = new Date(appt.date);
                  return (
                    <TableRow key={appt.id} className="hover:bg-[#f8f9fa]/80 transition-colors">
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex min-w-[46px] flex-col items-center rounded-lg border border-border bg-[#f1f3f5] px-2 py-1 shadow-2xs">
                            <span className="text-[10px] font-bold text-primary uppercase">
                              {MONTHS[dateObj.getMonth()] ?? "—"}
                            </span>
                            <span className="text-base font-bold text-foreground leading-none">
                              {dateObj.getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <Clock className="size-3 text-primary" /> {appt.time}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {v ? (
                          <div>
                            <Link
                              href={`/dashboard/vehicles/${v.id}`}
                              className="text-xs font-bold text-foreground hover:text-primary transition-colors"
                            >
                              {v.year} {v.make} {v.model}
                            </Link>
                            <div className="mt-0.5">
                              <span className="rounded-md border border-border bg-[#f8f9fa] px-2 py-0.5 font-mono text-[10px] font-bold text-foreground">
                                {v.regNo}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Vehicle #{appt.vehicleId}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {names.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Standard Inspection</span>
                          ) : (
                            names.map((name, i) => (
                              <span
                                key={i}
                                className="rounded-md border border-border bg-[#f8f9fa] px-2 py-0.5 text-[11px] font-medium text-foreground"
                              >
                                {name}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                            appt.status === "confirmed" && "bg-emerald-50 text-emerald-700",
                            appt.status === "pending" && "bg-amber-50 text-amber-700",
                            appt.status === "cancelled" && "bg-rose-50 text-rose-700",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              appt.status === "confirmed" && "bg-emerald-500",
                              appt.status === "pending" && "bg-amber-500",
                              appt.status === "cancelled" && "bg-rose-500",
                            )}
                          />
                          {appt.status}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedAppt(appt)}
                            className="flex size-8 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          {appt.status !== "cancelled" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openReschedule(appt)}
                                className="flex size-8 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                                title="Reschedule Appointment"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancellingAppt(appt)}
                                className="flex size-8 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Cancel Booking"
                              >
                                <X className="size-3.5" />
                              </button>
                            </>
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
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((appt) => {
              const v = vehicleById(appt.vehicleId);
              const names = serviceNamesForAppt(appt.serviceIds);
              const dateObj = new Date(appt.date);
              return (
                <div
                  key={appt.id}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div>
                    {/* Date Block & Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex min-w-[46px] flex-col items-center rounded-lg border border-border bg-[#f1f3f5] px-2 py-1 shadow-2xs">
                          <span className="text-[10px] font-bold text-primary uppercase">
                            {MONTHS[dateObj.getMonth()] ?? "—"}
                          </span>
                          <span className="text-base font-bold text-foreground leading-none">
                            {dateObj.getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Clock className="size-3 text-primary" /> {appt.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                          appt.status === "confirmed" && "bg-emerald-50 text-emerald-700",
                          appt.status === "pending" && "bg-amber-50 text-amber-700",
                          appt.status === "cancelled" && "bg-rose-50 text-rose-700",
                        )}
                      >
                        {appt.status}
                      </span>
                    </div>

                    {/* Vehicle info */}
                    <div className="pt-3">
                      {v ? (
                        <div>
                          <p className="text-sm font-bold text-foreground">{v.year} {v.make} {v.model}</p>
                          <span className="mt-1 inline-block rounded-md border border-border bg-[#f8f9fa] px-2 py-0.5 font-mono text-[10px] font-bold text-foreground">
                            {v.regNo}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-foreground">Vehicle #{appt.vehicleId}</p>
                      )}
                    </div>

                    {/* Services Tags */}
                    <div className="flex flex-wrap gap-1 pt-3">
                      {names.map((name, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-border bg-[#f8f9fa] px-2 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 border-t border-border pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAppt(appt)}
                      className="flex-1 rounded-xl border border-border py-2 text-center text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                    >
                      Details
                    </button>
                    {appt.status !== "cancelled" && (
                      <>
                        <button
                          type="button"
                          onClick={() => openReschedule(appt)}
                          className="flex-1 rounded-xl bg-primary-soft py-2 text-center text-xs font-bold text-primary hover:bg-primary/15 transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingAppt(appt)}
                          className="flex size-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-rose-300 hover:text-rose-600 transition-colors"
                          title="Cancel Booking"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <Dialog open={selectedAppt !== null} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <DialogContent className="max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Appointment Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Full summary of your booked workshop service session.
            </DialogDescription>
          </DialogHeader>
          {selectedAppt && (
            <div className="flex flex-col gap-4 pt-1">
              <div className="rounded-xl border border-border bg-[#f8f9fa] p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Scheduled Slot</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {new Date(selectedAppt.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-primary font-semibold mt-0.5">{selectedAppt.time}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-bold capitalize",
                    selectedAppt.status === "confirmed" && "bg-emerald-50 text-emerald-700",
                    selectedAppt.status === "pending" && "bg-amber-50 text-amber-700",
                    selectedAppt.status === "cancelled" && "bg-rose-50 text-rose-700",
                  )}
                >
                  {selectedAppt.status}
                </span>
              </div>

              {/* Vehicle section */}
              {(() => {
                const v = vehicleById(selectedAppt.vehicleId);
                return (
                  <div className="rounded-xl border border-border bg-white p-3.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Registered Vehicle</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {v ? `${v.year} ${v.make} ${v.model}` : `Vehicle ID #${selectedAppt.vehicleId}`}
                    </p>
                    {v && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Plate: {v.regNo} • Mileage: {v.mileage.toLocaleString()} mi
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Services section */}
              <div className="rounded-xl border border-border bg-white p-3.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Requested Services</p>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {serviceNamesForAppt(selectedAppt.serviceIds).map((name, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-border bg-[#f8f9fa] px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {selectedAppt.notes && (
                <div className="rounded-xl border border-border bg-white p-3.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Notes for Workshop</p>
                  <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">{selectedAppt.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedAppt(null)} className="rounded-xl">
              Close
            </Button>
            {selectedAppt && selectedAppt.status !== "cancelled" && (
              <Button
                onClick={() => {
                  const appt = selectedAppt;
                  setSelectedAppt(null);
                  openReschedule(appt);
                }}
                className="rounded-xl font-semibold shadow-xs"
              >
                Reschedule
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog
        open={reschedulingAppt !== null}
        onOpenChange={(open) => !open && setReschedulingAppt(null)}
      >
        <DialogContent className="max-w-md rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Reschedule Appointment</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a new date and preferred time slot for your appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">New Date *</Label>
              <Input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-10 rounded-xl border-border bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">Preferred Time Slot *</Label>
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="" disabled>
                  Select a time slot...
                </option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-foreground">Notes / Reason (Optional)</Label>
              <Textarea
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Let the technician know any updated concerns..."
                className="min-h-20 rounded-xl border-border bg-white resize-none text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setReschedulingAppt(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSaveReschedule}
              disabled={saving}
              className="rounded-xl font-semibold shadow-xs"
            >
              {saving ? "Saving..." : "Confirm Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancellingAppt !== null} onOpenChange={(open) => !open && setCancellingAppt(null)}>
        <DialogContent className="max-w-sm rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Cancel Appointment?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to cancel this booking? You can reschedule or book a new appointment at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancellingAppt(null)} className="rounded-xl">
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={saving}
              className="rounded-xl font-semibold shadow-xs"
            >
              {saving ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
