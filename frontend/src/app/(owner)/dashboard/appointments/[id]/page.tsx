"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarX,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAppointments, updateAppointmentStatus } from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { cn } from "@/lib/utils";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";

export default function OwnerAppointmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const jobs = useAppSelector((s) => s.jobs.items);

  useEffect(() => {
    dispatch(fetchAppointments());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
    dispatch(fetchJobs());
  }, [dispatch, vehicles.length, services.length]);

  const appointment = appointments.find((a) => a.id === params.id) ?? null;
  const vehicle = appointment ? vehicles.find((v) => v.id === appointment.vehicleId) : undefined;
  const selectedServices = appointment
    ? appointment.serviceIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
    : [];
  const linkedJob = appointment ? jobs.find((j) => j.appointmentId === appointment.id) : undefined;

  if (!appointment) {
    return (
      <div className="bg-background min-h-screen p-8 text-sm text-muted-foreground">
        {appointments.length === 0 ? "Loading appointment..." : "Appointment not found."}
      </div>
    );
  }

  const cancel = async () => {
    try {
      await dispatch(updateAppointmentStatus({ id: appointment.id, status: "cancelled" })).unwrap();
      toast.success("Appointment cancelled");
      router.push("/dashboard/appointments");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel appointment");
    }
  };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const date = new Date(appointment.date);
  const stepsDone = appointment.status === "cancelled" ? 0 : appointment.status === "confirmed" || linkedJob ? 2 : 1;
  const steps = [
    { label: "Booked", icon: CalendarCheck },
    { label: "Confirmed", icon: CheckCircle2 },
    { label: "Job Card", icon: Wrench },
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <Link href="/dashboard/appointments" className="flex items-center gap-1 text-[11px] font-semibold text-[#424753] hover:text-primary">
            <ArrowLeft className="size-3" />
            Back to My Appointments
          </Link>
          <p className="pt-1 text-[11px] text-muted-foreground">Dashboard › Appointments › {appointment.id}</p>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-border bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-12">
            <div className="relative col-span-4 bg-gradient-to-br from-[#eef1f4] to-[#e3e8f0]">
              {vehicle && (
                <div className="relative h-full min-h-56 p-5">
                  <VehicleImage src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-contain p-4" />
                </div>
              )}
              {vehicle && (
                <span className="absolute bottom-4 left-4 rounded-md bg-[rgba(46,49,50,0.85)] px-3 py-1.5 font-mono text-sm font-semibold tracking-[0.5px] text-white">
                  {vehicle.regNo}
                </span>
              )}
            </div>

            <div className="col-span-8 flex flex-col justify-between gap-5 p-7">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                      appointment.status === "confirmed"
                        ? "bg-[rgba(0,82,204,0.1)] text-primary"
                        : appointment.status === "cancelled"
                          ? "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]"
                          : "bg-[rgba(255,193,7,0.15)] text-[#8b5000]",
                    )}
                  >
                    {appointment.status}
                  </span>
                  {linkedJob && (
                    <span className="rounded-full bg-[rgba(76,175,80,0.12)] px-3 py-1 text-xs font-semibold text-[#4caf50]">
                      Converted to {linkedJob.id}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">
                  {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle Service"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#414754]">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-4 text-primary" />
                    {date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })} • {appointment.time}
                  </span>
                </div>
              </div>

              <div className="relative py-4">
                <div className="absolute top-5 right-6 left-6 h-0.5 bg-[#e2e8f0]" />
                {stepsDone > 0 && <div className="absolute top-5 left-[5.5%] h-0.5 bg-primary" style={{ width: `${(Math.max(stepsDone - 0.5, 0) / (steps.length - 1)) * 100}%` }} />}
                <div className="flex justify-between px-1">
                  {steps.map((s, i) => {
                    const done = i < stepsDone;
                    const active = i === stepsDone;
                    const cancelled = appointment.status === "cancelled" && i === 0;
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full",
                            done ? "bg-primary text-white" : cancelled ? "bg-[#ba1a1a] text-white" : active ? "border-2 border-primary bg-white text-primary" : "border border-[#e2e8f0] bg-secondary text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className={cn("mt-2 text-[11px] font-semibold", done ? "text-primary" : active ? "text-primary" : "text-muted-foreground")}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {vehicle && (
                  <Link href={`/dashboard/vehicles/${vehicle.id}`} className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/50 hover:text-primary">
                    <Car className="size-4" />
                    View Vehicle
                  </Link>
                )}
                {linkedJob && (
                  <Link href={`/dashboard/services/${linkedJob.id}`} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">
                    Track {linkedJob.id} <ChevronRight className="size-4" />
                  </Link>
                )}
                {appointment.status !== "cancelled" && (
                  <Button variant="outline" onClick={() => void cancel()} className="gap-2 rounded-lg border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[rgba(186,26,26,0.06)]">
                    <CalendarX className="size-4" />
                    Cancel Appointment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7 rounded-[12px] border border-border bg-white p-7 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
            <h2 className="text-lg font-bold tracking-[-0.24px] text-foreground">Requested Services</h2>
            {selectedServices.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-border bg-[#fafbfc] p-4 text-sm text-muted-foreground">
                No catalog service selected — a custom request was submitted.
              </p>
            ) : (
              <div className="mt-4 flex flex-col divide-y divide-border">
                {selectedServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-md bg-primary-soft">
                        <Wrench className="size-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {cap(s.category)} • {s.durationMins} min
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      ${s.basePrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-5 flex flex-col gap-6">
            <div className="rounded-[12px] border border-border bg-white p-6 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <h2 className="text-sm font-bold text-foreground">Booking Details</h2>
              <dl className="mt-3 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Booking ID</dt>
                  <dd className="font-mono font-semibold text-foreground">{appointment.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-semibold text-foreground">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Time</dt>
                  <dd className="font-semibold text-foreground">{appointment.time}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-semibold capitalize text-foreground">{appointment.status}</dd>
                </div>
              </dl>
              {appointment.notes && (
                <div className="mt-4 flex gap-2 rounded-lg bg-[#eff6ff] p-3">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[11px] font-semibold text-primary uppercase">Custom request note</p>
                    <p className="text-sm text-[#424753]">{appointment.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[12px] border border-dashed border-border bg-white p-6">
              <p className="text-sm text-muted-foreground">
                {linkedJob
                  ? `This booking was converted to job card ${linkedJob.id}. Track its progress anytime.`
                  : "The workshop will confirm your booking soon. Bookings are handled by our service advisors."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}