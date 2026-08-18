"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarX,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AdminAppointmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const jobs = useAppSelector((s) => s.jobs.items);

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
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

  const setStatus = async (status: "confirmed" | "cancelled") => {
    try {
      await dispatch(updateAppointmentStatus({ id: appointment.id, status })).unwrap();
      toast.success(status === "confirmed" ? "Appointment confirmed" : "Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const date = new Date(appointment.date);
  const owner = appointment.owner;
  const initials = (owner?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <Link href="/admin/appointments" className="flex items-center gap-1 text-[11px] font-semibold text-[#424753] hover:text-primary">
            <ArrowLeft className="size-3" />
            Back to Appointments
          </Link>
          <p className="pt-1 text-[11px] text-muted-foreground">Dashboard › Appointments › {appointment.id}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-lg bg-primary-soft">
              <Clock3 className="size-6 text-primary" />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
              </p>
              <p className="text-sm text-muted-foreground">{appointment.time} • {appointment.id}</p>
            </div>
          </div>
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
            {appointment.status === "pending" && (
              <Button className="gap-2 rounded-lg" onClick={() => void setStatus("confirmed")}>
                <CalendarCheck className="size-4" />
                Confirm
              </Button>
            )}
            {appointment.status !== "cancelled" && (
              <Button variant="outline" className="gap-2 rounded-lg border-[#ba1a1a]/30 text-[#ba1a1a]" onClick={() => void setStatus("cancelled")}>
                <CalendarX className="size-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7 rounded-lg border border-border bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-base font-semibold text-foreground">Vehicle &amp; Services</h2>
            {vehicle && (
              <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#e2e8f0] bg-secondary p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-[#eef1f4]">
                  <VehicleImage src={vehicle.image} alt={vehicle.model} fill className="object-contain p-1" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-muted-foreground">{cap(vehicle.fuelType)} • {vehicle.mileage.toLocaleString()} mi</p>
                  <p className="pt-1 font-mono text-xs font-semibold text-foreground">{vehicle.regNo}</p>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-col divide-y divide-border">
              {selectedServices.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">No catalog services — custom request submitted.</p>
              ) : (
                selectedServices.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-md bg-primary-soft">
                        <Wrench className="size-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{cap(s.category)} • {s.durationMins} min</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">${s.basePrice.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
            {appointment.notes && (
              <div className="mt-4 flex gap-2 rounded-lg bg-[#eff6ff] p-4">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-[#424753]">{appointment.notes}</p>
              </div>
            )}
          </div>

          <div className="col-span-5 flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xs font-semibold tracking-[0.24px] text-muted-foreground uppercase">Customer</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{owner?.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">Owns {vehicle ? vehicle.regNo : "vehicle"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[#414754]">
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                  {owner?.phone ?? "—"}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  {owner?.email ?? "—"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-white p-[21px]">
              {linkedJob ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#4caf50]">
                    Converted to <span className="font-mono">{linkedJob.id}</span>
                  </p>
                  <Link href={`/admin/reports`} className="text-xs font-semibold text-primary hover:underline">
                    View reports
                  </Link>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Booking flow: owner books → advisor confirms → advisor creates the job card during intake.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}