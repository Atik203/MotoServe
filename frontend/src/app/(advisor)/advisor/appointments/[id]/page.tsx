"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  Clock3,
  Copy,
  ExternalLink,
  Fuel,
  Gauge,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Settings,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "@/store/slices/appointmentsSlice";
import { DetailLoading } from "@/components/ui/loading";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { cn } from "@/lib/utils";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AdvisorAppointmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const tasks = useAppSelector((s) => s.tasks.items);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
    if (customers.length === 0) dispatch(fetchCustomers());
  }, [dispatch, vehicles.length, services.length, customers.length]);

  const appointment = appointments.find((a) => a.id === params.id) ?? null;
  const vehicle = appointment ? vehicles.find((v) => v.id === appointment.vehicleId) : undefined;
  const customer = appointment ? customers.find((c) => c.id === appointment.ownerId) ?? undefined : undefined;
  const contact = appointment?.owner ?? customer;

  const selectedServices = appointment
    ? appointment.serviceIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
    : [];

  const linkedTask = appointment
    ? tasks.find((t) => t.appointmentId === appointment.id) ??
      (appointment.taskCard?.id ? tasks.find((t) => t.id === appointment.taskCard?.id) : undefined)
    : undefined;

  const openRescheduleModal = () => {
    if (appointment) {
      setRescheduleDate(appointment.date ? appointment.date.slice(0, 10) : "");
      setRescheduleTime(appointment.time || "09:00 AM");
      setRescheduleNotes(appointment.notes || "");
    }
    setRescheduleOpen(true);
  };

  if (!appointment) {
    if (appointments.length === 0) {
      return <DetailLoading label="Loading appointment details..." />;
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background p-8 text-center">
        <AlertCircle className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-bold text-foreground">Appointment Not Found</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The appointment with ID <span className="font-mono font-semibold text-foreground">{params.id}</span> does not exist or may have been removed.
        </p>
        <Link href="/advisor/appointments">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="size-4" /> Back to Appointments
          </Button>
        </Link>
      </div>
    );
  }

  const setStatus = async (status: "confirmed" | "cancelled") => {
    try {
      await dispatch(updateAppointmentStatus({ id: appointment.id, status })).unwrap();
      toast.success(status === "confirmed" ? "Appointment confirmed" : "Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error("Please pick a date and time");
      return;
    }
    setIsUpdating(true);
    try {
      await dispatch(
        updateAppointment({
          id: appointment.id,
          data: {
            date: rescheduleDate,
            time: rescheduleTime,
            notes: rescheduleNotes,
            status: "confirmed",
          },
        }),
      ).unwrap();
      toast.success("Appointment rescheduled successfully");
      setRescheduleOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setIsUpdating(false);
    }
  };

  const startIntake = () => {
    router.push(`/advisor/receive?appointment=${encodeURIComponent(appointment.id)}`);
  };

  const copyAppointmentId = () => {
    navigator.clipboard.writeText(appointment.id);
    toast.success(`Copied ${appointment.id} to clipboard`);
  };

  const dateObj = new Date(appointment.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : appointment.date;

  const initials = (contact?.name ?? "Customer")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalCost = selectedServices.reduce((acc, s) => acc + s.basePrice, 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMins, 0);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link
                href="/advisor/appointments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="size-3.5" />
                Appointments
              </Link>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="font-mono text-xs font-bold text-foreground">{appointment.id}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Appointment Details
              </h1>
              <button
                type="button"
                onClick={copyAppointmentId}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground hover:bg-slate-50"
                title="Click to copy ID"
              >
                {appointment.id}
                <Copy className="size-3 text-slate-400" />
              </button>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold capitalize",
                  appointment.status === "confirmed"
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : appointment.status === "cancelled"
                      ? "border border-rose-200 bg-rose-50 text-rose-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {appointment.status === "confirmed" ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : appointment.status === "cancelled" ? (
                  <CalendarX className="size-3.5 text-rose-600" />
                ) : (
                  <Clock className="size-3.5 text-amber-600" />
                )}
                {appointment.status}
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openRescheduleModal}
              className="gap-1.5 border-border bg-white text-xs font-semibold shadow-xs hover:bg-slate-50"
            >
              <Calendar className="size-3.5 text-slate-600" />
              Reschedule
            </Button>
            {appointment.status !== "confirmed" && (
              <Button
                size="sm"
                onClick={() => setStatus("confirmed")}
                className="gap-1.5 bg-[#0052cc] text-xs font-semibold text-white shadow-xs hover:bg-[#0047b3]"
              >
                <CalendarCheck className="size-3.5" />
                Confirm
              </Button>
            )}
            {!linkedTask && appointment.status !== "cancelled" && (
              <Button
                size="sm"
                onClick={startIntake}
                className="gap-1.5 bg-emerald-600 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                <Sparkles className="size-3.5" />
                Start Intake
              </Button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Left Column (8 cols): Appointment Info, Vehicle, Services, Linked Task */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* Primary Date & Time Banner */}
            <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-border bg-white p-6 shadow-xs sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock3 className="size-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Scheduled Time
                  </p>
                  <p className="text-xl font-bold text-foreground">{formattedDate}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Time: {appointment.time}</span>
                    <span>•</span>
                    <span>Station: Main Intake Bay</span>
                    {appointment.createdAt && (
                      <>
                        <span>•</span>
                        <span>Booked on {new Date(appointment.createdAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t pt-3 sm:border-t-0 sm:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRescheduleModal}
                  className="w-full text-xs font-semibold sm:w-auto"
                >
                  Change Slot
                </Button>
              </div>
            </div>

            {/* Linked Workshop Task Status (if any) */}
            {linkedTask ? (
              <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Wrench className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Workshop Task Card Active
                      </span>
                      <span className="rounded bg-emerald-200/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                        {linkedTask.id}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-emerald-950">
                      Vehicle is in workshop: <span className="capitalize">{linkedTask.status}</span> stage
                    </p>
                  </div>
                </div>
                <Link href={`/advisor/estimates/new?task=${linkedTask.id}`}>
                  <Button size="sm" className="gap-1.5 bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800">
                    Manage Task Card
                    <ExternalLink className="size-3.5" />
                  </Button>
                </Link>
              </div>
            ) : appointment.status === "confirmed" ? (
              <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-blue-200 bg-blue-50/40 p-5 shadow-xs sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Ready for Workshop Intake</p>
                    <p className="text-xs text-muted-foreground">
                      Customer confirmed. Vehicle can be received to generate a live job card and bay assignment.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={startIntake}
                  size="sm"
                  className="shrink-0 gap-1.5 bg-primary text-xs font-semibold text-white hover:bg-primary/90"
                >
                  Receive Vehicle Now
                </Button>
              </div>
            ) : null}

            {/* Vehicle Overview Card */}
            <div className="rounded-[12px] border border-border bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">Vehicle Information</h2>
                  {vehicle && (
                    <div className="inline-flex items-center overflow-hidden rounded border border-slate-300 bg-[#edf0f8] shadow-inner">
                      <span className="bg-[#0052cc] px-1 py-0.5 text-[9px] font-bold text-white">US</span>
                      <span className="px-2 py-0.5 font-mono text-xs font-bold text-slate-800">{vehicle.regNo}</span>
                    </div>
                  )}
                </div>
                {vehicle && (
                  <Link
                    href={`/dashboard/vehicles/${vehicle.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View Vehicle
                    <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>

              {vehicle ? (
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-[#eef1f4]">
                    <VehicleImage src={vehicle.image} alt={vehicle.model} fill className="object-contain p-2" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.color ? `${vehicle.color} • ` : ""}VIN: <span className="font-mono">{vehicle.vin || "—"}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-slate-50/70 p-2 text-xs">
                        <Fuel className="size-3.5 text-slate-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Fuel</p>
                          <p className="font-semibold capitalize text-foreground">{vehicle.fuelType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-slate-50/70 p-2 text-xs">
                        <Gauge className="size-3.5 text-slate-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Mileage</p>
                          <p className="font-semibold text-foreground">{vehicle.mileage.toLocaleString()} mi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-slate-50/70 p-2 text-xs">
                        <Settings className="size-3.5 text-slate-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Gearbox</p>
                          <p className="font-semibold capitalize text-foreground">{vehicle.transmission || "Auto"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No vehicle profile attached to this appointment.</p>
              )}
            </div>

            {/* Requested Services Card */}
            <div className="rounded-[12px] border border-border bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Requested Services</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedServices.length} {selectedServices.length === 1 ? "service" : "services"} requested by customer
                  </p>
                </div>
                {selectedServices.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    Est. {totalDuration} mins
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col divide-y divide-border">
                {selectedServices.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <Wrench className="mx-auto mb-2 size-6 text-slate-300" />
                    No standard catalog services selected. Review custom request notes below.
                  </div>
                ) : (
                  selectedServices.map((srv) => (
                    <div key={srv.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Wrench className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{srv.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {srv.category ? `${cap(srv.category)} • ` : ""}{srv.durationMins} min estimated duration
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">${srv.basePrice.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Base Labor & Parts</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Price Calculation Footer */}
              {selectedServices.length > 0 && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Labor & Service Subtotal:</span>
                    <span className="font-semibold text-foreground">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estimated Sales Tax (8.5%):</span>
                    <span className="font-semibold text-foreground">${(totalCost * 0.085).toFixed(2)}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2.5 text-sm font-bold text-foreground">
                    <span>Estimated Total:</span>
                    <span className="text-base text-primary">${(totalCost * 1.085).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Customer Notes / Custom Request */}
              {appointment.notes && (
                <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                    <MessageSquare className="size-3.5" />
                    Customer Concern & Special Instructions
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 italic">
                    &ldquo;{appointment.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Customer Contact, Status Actions, Advisor SOP */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Customer Contact Card */}
            <div className="rounded-[12px] border border-border bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Owner
                </span>
                {customer?.status && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Active Client
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <h3 className="truncate text-base font-bold text-foreground">
                    {contact?.name ?? "Guest Customer"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Account ID: <span className="font-mono">{appointment.ownerId?.slice(0, 8) || "guest"}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 text-xs text-slate-700">
                <a
                  href={contact?.phone ? `tel:${contact.phone}` : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 transition-colors",
                    contact?.phone ? "hover:border-primary/30 hover:bg-blue-50/50 hover:text-primary" : "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Phone className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{contact?.phone || "No phone provided"}</span>
                </a>
                <a
                  href={contact?.email ? `mailto:${contact.email}` : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 transition-colors",
                    contact?.email ? "hover:border-primary/30 hover:bg-blue-50/50 hover:text-primary" : "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Mail className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate font-medium">{contact?.email || "No email provided"}</span>
                </a>
                <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-slate-600">
                  <MapPin className="size-4 shrink-0 text-slate-400" />
                  <span className="truncate">Main Facility • Service Bay 01</span>
                </div>
              </div>

              {/* Chat with Owner Link */}
              <div className="mt-4 pt-2">
                <Link href="/advisor/chat" className="block w-full">
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-primary/30 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    <MessageSquare className="size-3.5" />
                    Chat with Owner
                  </Button>
                </Link>
              </div>
            </div>

            {/* Advisor Action Controls */}
            <div className="flex flex-col gap-2.5 rounded-[12px] border border-border bg-white p-5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Advisor Actions
              </span>

              {appointment.status !== "confirmed" && (
                <Button
                  onClick={() => setStatus("confirmed")}
                  className="w-full gap-2 rounded-lg bg-[#0052cc] text-xs font-semibold text-white shadow-xs hover:bg-[#0047b3]"
                >
                  <CalendarCheck className="size-4" />
                  Confirm Appointment
                </Button>
              )}

              <Button
                variant="outline"
                onClick={openRescheduleModal}
                className="w-full gap-2 rounded-lg border-border bg-white text-xs font-semibold text-foreground shadow-xs hover:bg-slate-50"
              >
                <Calendar className="size-4 text-slate-600" />
                Reschedule Date & Time
              </Button>

              {!linkedTask && appointment.status !== "cancelled" && (
                <Button
                  onClick={startIntake}
                  className="w-full gap-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  <User className="size-4" />
                  Intake & Create Task Card
                </Button>
              )}

              {appointment.status !== "cancelled" && (
                <Button
                  onClick={() => setStatus("cancelled")}
                  variant="outline"
                  className="w-full gap-2 rounded-lg border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <CalendarX className="size-4" />
                  Cancel Appointment
                </Button>
              )}
            </div>

            {/* Standard Operating Procedure (SOP) */}
            <div className="rounded-[12px] border border-dashed border-border bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <HelpCircle className="size-4 text-primary" />
                Intake SOP Guide
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                    1
                  </span>
                  <span>Review customer concern notes and confirm arrival timing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                    2
                  </span>
                  <span>Verify vehicle mileage and existing scratches before bay intake.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                    3
                  </span>
                  <span>Generate task card and assign primary technician for inspection.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time slot for appointment{" "}
              <span className="font-mono font-semibold text-foreground">{appointment.id}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Updated Notes / Reason</label>
              <textarea
                rows={3}
                value={rescheduleNotes}
                onChange={(e) => setRescheduleNotes(e.target.value)}
                placeholder="Add updated customer preferences or reason for rescheduling..."
                className="w-full rounded-lg border border-border bg-white p-2.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRescheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdating}
              onClick={handleRescheduleSubmit}
              className="bg-[#0052cc] text-white hover:bg-[#0047b3]"
            >
              {isUpdating ? "Saving..." : "Save & Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}