"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { CalendarPlus, CalendarX, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAppointments, updateAppointmentStatus } from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  pending: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]",
  confirmed: "bg-[rgba(0,82,204,0.1)] text-primary",
  cancelled: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function MyAppointmentsPage() {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);

  useEffect(() => {
    if (appointments.length === 0) dispatch(fetchAppointments());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, appointments.length, vehicles.length, services.length]);

  const cancel = async (id: string) => {
    try {
      await dispatch(updateAppointmentStatus({ id, status: "cancelled" })).unwrap();
      toast.success("Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel appointment");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Dashboard › Appointments</p>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">My Appointments</h1>
          </div>
          <Link
            href="/dashboard/appointments/book"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Plus className="size-4" />
            Book Appointment
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <CalendarPlus className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No appointments booked yet.</p>
            <Link href="/dashboard/appointments/book" className="rounded bg-primary px-4 py-2 text-xs font-semibold text-white">
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.map((appt) => {
              const vehicle = vehicles.find((v) => v.id === appt.vehicleId);
              const serviceNames = appt.serviceIds
                .map((id) => services.find((s) => s.id === id)?.name)
                .filter((n): n is string => Boolean(n));
              return (
                <div
                  key={appt.id}
                  className="flex items-center justify-between gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                      <CalendarPlus className="size-5 text-primary" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-semibold text-foreground">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"} — {appt.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(appt.date)}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(serviceNames.length ? serviceNames : ["Service"]).map((s) => (
                          <span key={s} className="rounded-full bg-[#f3f4f5] px-2.5 py-0.5 text-[11px] font-medium text-[#424753]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", statusStyle[appt.status])}>
                      {appt.status}
                    </span>
                    {appt.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => void cancel(appt.id)}
                        className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-semibold text-[#ba1a1a] transition-colors hover:border-[#ba1a1a]/40"
                      >
                        <CalendarX className="size-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
