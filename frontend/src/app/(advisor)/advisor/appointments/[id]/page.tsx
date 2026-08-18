"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
  User,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAppointments, updateAppointmentStatus } from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { cn } from "@/lib/utils";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Button } from "@/components/ui/button";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AdvisorAppointmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const jobs = useAppSelector((s) => s.jobs.items);

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
    if (customers.length === 0) dispatch(fetchCustomers());
  }, [dispatch, vehicles.length, services.length, customers.length]);

  const appointment = appointments.find((a) => a.id === params.id) ?? null;
  const vehicle = appointment ? vehicles.find((v) => v.id === appointment.vehicleId) : undefined;
  const customer = appointment ? customers.find((c) => c.id === appointment.ownerId)?? undefined : undefined;
  const contact = appointment?.owner ?? customer;
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

  const startIntake = () => router.push(`/advisor/receive?appointment=${encodeURIComponent(appointment.id)}`);
  const date = new Date(appointment.date);
  const initials = (contact?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <Link href="/advisor/appointments" className="flex items-center gap-1 text-[11px] font-semibold text-[#424753] hover:text-primary">
            <ArrowLeft className="size-3" />
            Back to Appointments
          </Link>
          <p className="pt-1 text-[11px] text-muted-foreground">Dashboard › Appointments › {appointment.id}</p>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-4">
                <span className="flex size-14 items-center justify-center rounded-lg bg-primary-soft">
                  <Clock3 className="size-6 text-primary" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {date.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-sm text-muted-foreground">{appointment.time} • {appointment.id}</p>
                </div>
              </div>
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
            </div>

            <div className="rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Vehicle</h2>
                {vehicle && (
                  <Link href={`/dashboard/vehicles/${vehicle.id}`} className="text-xs font-semibold text-primary hover:underline">
                    View in garage
                  </Link>
                )}
              </div>
              {vehicle ? (
                <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#e2e8f0] bg-secondary p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-[#eef1f4]">
                    <VehicleImage src={vehicle.image} alt={vehicle.model} fill className="object-contain p-1" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cap(vehicle.fuelType)} • {vehicle.transmission ?? "—"} • {vehicle.mileage.toLocaleString()} mi
                    </p>
                    <p className="pt-1 font-mono text-xs font-semibold text-foreground">{vehicle.regNo}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Vehicle details unavailable.</p>
              )}

              <h2 className="mt-6 text-base font-semibold text-foreground">Services</h2>
              <div className="mt-3 flex flex-col divide-y divide-border">
                {selectedServices.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">No catalog services — custom request below.</p>
                ) : (
                  selectedServices.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary-soft">
                          <Wrench className="size-4 text-primary" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">${s.basePrice.toFixed(2)} • {s.durationMins} min</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {appointment.notes && (
                <div className="mt-4 flex gap-2 rounded-lg bg-[#eff6ff] p-4">
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-[11px] font-semibold text-primary uppercase">Custom request</p>
                    <p className="text-sm text-[#424753]">{appointment.notes}</p>
                  </div>
                </div>
              )}

              {linkedJob && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-[rgba(76,175,80,0.08)] p-4">
                  <p className="text-sm font-semibold text-[#4caf50]">
                    Converted to job card <span className="font-mono">{linkedJob.id}</span>
                  </p>
                  <Link href="/advisor/job-cards" className="flex items-center text-xs font-semibold text-[#4caf50] hover:underline">
                    Manage job <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xs font-semibold tracking-[0.24px] text-muted-foreground uppercase">Customer</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{contact?.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{customer ? cap(customer.status) : "—"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[#414754]">
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                  {contact?.phone ?? "—"}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  {contact?.email ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {appointment.status !== "cancelled" && (
                <>
                  <Button
                    onClick={async () => {
                      await setStatus("confirmed");
                    }}
                    className="w-full gap-2 rounded-lg"
                  >
                    <CalendarCheck className="size-4" />
                    Confirm Appointment
                  </Button>
                  <Button
                    onClick={async () => {
                      await setStatus("cancelled");
                    }}
                    variant="outline"
                    className="w-full gap-2 rounded-lg border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[rgba(186,26,26,0.06)]"
                  >
                    <CalendarX className="size-4" />
                    Cancel Appointment
                  </Button>
                </>
              )}
              {appointment.status === "confirmed" && (
                <Button onClick={startIntake} className="w-full gap-2 rounded-lg bg-[#4caf50] text-white hover:bg-[#388e3c]">
                  <User className="size-4" />
                  Start Intake
                </Button>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-border bg-white p-[21px]">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Start intake after confirming to prefill the receive form with this vehicle and customer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}