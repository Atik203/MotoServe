"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, CalendarPlus, CalendarX, Clock3, MessageSquare, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAppointments, updateAppointmentStatus } from "@/store/slices/appointmentsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

const FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const statusStyle: Record<string, string> = {
  pending: "bg-[rgba(255,193,7,0.12)] text-[#8b5000]",
  confirmed: "bg-[rgba(0,82,204,0.1)] text-primary",
  cancelled: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface AppointmentManagerProps {
  title?: string;
  subtitle?: string;
  detailsBase: string;
  onIntake?: (appointment: Appointment) => void;
}

export function AppointmentManager({ title = "Appointments", subtitle, detailsBase, onIntake }: AppointmentManagerProps) {
  const dispatch = useAppDispatch();
  const appointments = useAppSelector((s) => s.appointments.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    dispatch(fetchAppointments());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (services.length === 0) dispatch(fetchServices());
    if (customers.length === 0) dispatch(fetchCustomers());
  }, [dispatch, vehicles.length, services.length, customers.length]);

  const counts = useMemo(
    () => ({
      all: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    }),
    [appointments],
  );

  const filtered = useMemo(
    () =>
      appointments
        .filter((a) => filter === "all" || a.status === filter)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [appointments, filter],
  );

  const setStatus = async (a: Appointment, status: "confirmed" | "cancelled") => {
    try {
      await dispatch(updateAppointmentStatus({ id: a.id, status })).unwrap();
      toast.success(status === "confirmed" ? `Appointment confirmed` : "Appointment cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard › {title}</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">{title}</h1>
          {subtitle && <p className="pt-1 text-sm text-[#414754]">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-1 rounded-lg bg-[#f3f4f6] p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                  filter === f ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
                <span className={cn("ml-1.5", f === "pending" ? "text-[#8b5000]" : f === "confirmed" ? "text-primary" : "text-muted-foreground")}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {counts.pending} pending{counts.pending > 0 ? " — confirm them to start intake" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <CalendarPlus className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter} appointments.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((a) => {
              const vehicle = vehicles.find((v) => v.id === a.vehicleId);
              const customer = customers.find((c) => c.id === a.ownerId) ?? a.owner;
              const ownerLine = customer
                ? `${customer.name}${"phone" in customer && customer.phone ? ` • ${customer.phone}` : ""}`
                : "Customer";
              const serviceNames = a.serviceIds
                .map((id) => services.find((s) => s.id === id)?.name)
                .filter((n): n is string => Boolean(n));
              const date = new Date(a.date);
              const isPast = new Date(`${a.date}T23:59:59`) < new Date();
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-5 rounded-lg border border-border bg-white p-[21px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:border-primary/40"
                >
                  <Link href={`${detailsBase}/${a.id}`} className="flex flex-1 items-center gap-5">
                    <div className="flex min-w-[62px] flex-col items-center rounded-lg border border-border bg-secondary px-3 py-2">
                      <span className="text-[10px] font-semibold tracking-[0.3px] text-[#ba1a1a] uppercase">
                        {MONTHS[date.getMonth()] ?? "—"}
                      </span>
                      <span className="text-2xl font-bold text-foreground">{date.getDate()}</span>
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                        <Clock3 className="size-2.5" />
                        {a.time}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                        {vehicle && <span className="rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#424753]">{vehicle.regNo}</span>}
                      </div>
                      <p className="pt-0.5 text-xs text-[#414754]">
                        {ownerLine} • {serviceNames.length > 0 ? serviceNames.join(", ") : "Custom service request"}
                      </p>
                      {a.notes && (
                        <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                          <MessageSquare className="size-3 shrink-0" />
                          <span className="truncate">{a.notes}</span>
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold capitalize", statusStyle[a.status])}>
                      {a.status}
                    </span>
                    {isPast && a.status !== "cancelled" && (
                      <span className="text-[10px] font-medium text-[#ba1a1a]">Past due</span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {a.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(a, "confirmed")}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                      >
                        <CalendarCheck className="size-3.5" />
                        Confirm
                      </button>
                    )}
                    {a.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => void setStatus(a, "cancelled")}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-[#ba1a1a] transition-colors hover:border-[#ba1a1a]/40"
                      >
                        <CalendarX className="size-3.5" />
                        Cancel
                      </button>
                    )}
                    {onIntake && a.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => onIntake(a)}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        <Wrench className="size-3.5" />
                        Start Intake
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