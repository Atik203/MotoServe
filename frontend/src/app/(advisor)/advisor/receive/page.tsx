"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Gauge,
  Mail,
  Phone,
  Plus,
  UserRound,
  Wrench,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createJobCard } from "@/store/slices/jobsSlice";
import { fetchVehicles, addVehicle } from "@/store/slices/vehiclesSlice";
import { fetchCustomers, createCustomer } from "@/store/slices/customersSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { VehicleForm, type VehicleFormData } from "@/components/roles/owner/VehicleForm";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { cn } from "@/lib/utils";
import type { Appointment, Customer, Service, Vehicle } from "@/types";

const sectionTitle = "text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]";
const fieldLabel = "text-xs font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "w-full rounded border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-[9px] text-sm text-[#191c1d] placeholder:text-[#9ca3af] outline-none";
const card = "flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const primaryBtn =
  "flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-60";
const outlineBtn =
  "rounded-lg border border-[#e5e7eb] bg-white px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";

const priorities = ["low", "medium", "high"] as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ReceiveVehiclePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const services = useAppSelector((s) => s.services.items);

  const [mode, setMode] = useState<"appointment" | "walkin">("appointment");
  const [appointmentId, setAppointmentId] = useState(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("appointment") ?? "" : "") ?? "",
  );
  const [walkinCustomerId, setWalkinCustomerId] = useState("");
  const [walkinVehicleId, setWalkinVehicleId] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", email: "" });
  const [keysReceived, setKeysReceived] = useState(true);
  const [priority, setPriority] = useState<(typeof priorities)[number]>("medium");
  const [issues, setIssues] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [accessories, setAccessories] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchAppointments());
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  const appointment: Appointment | null = appointmentId
    ? (appointments.find((a) => a.id === appointmentId) ?? null)
    : null;
  const resolvedCustomerId = appointment?.ownerId ?? walkinCustomerId;
  const resolvedVehicle: Vehicle | null = appointment
    ? (vehicles.find((v) => v.id === appointment.vehicleId) ?? null)
    : (vehicles.find((v) => v.id === walkinVehicleId) ?? null);
  const customer: Customer | null = customers.find((c) => c.id === resolvedCustomerId) ?? null;

  const confirmedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "confirmed"),
    [appointments],
  );

  const vehiclesOfCustomer = useMemo(
    () => vehicles.filter((v) => v.ownerId === resolvedCustomerId),
    [vehicles, resolvedCustomerId],
  );

  const appointmentServices = useMemo(
    () =>
      appointment
        ? services
            .filter((s) => appointment.serviceIds.includes(s.id))
            .map((s) => s.name)
        : [],
    [appointment, services],
  );

  const selectAppointment = (id: string) => {
    setAppointmentId(id);
    const a = appointments.find((x) => x.id === id);
    const v = a ? vehicles.find((x) => x.id === a.vehicleId) : undefined;
    if (a) {
      setSelectedServiceIds(a.serviceIds);
      setIssues(
        [a.notes, ...services.filter((s) => a.serviceIds.includes(s.id)).map((s) => s.name)]
          .filter(Boolean)
          .join(" • "),
      );
      setWalkinCustomerId(a.ownerId);
      setWalkinVehicleId(a.vehicleId);
      if (v) setMileage(String(v.mileage));
    }
  };

  const selectCustomer = (id: string) => {
    setWalkinCustomerId(id);
    setWalkinVehicleId("");
    setNewVehicleOpen(false);
    const customerVehicles = vehicles.filter((v) => v.ownerId === id);
    if (customerVehicles.length === 1) {
      setWalkinVehicleId(customerVehicles[0].id);
      setMileage(String(customerVehicles[0].mileage));
    }
  };

  const selectVehicle = (id: string) => {
    setWalkinVehicleId(id);
    const v = vehicles.find((x) => x.id === id);
    if (v) setMileage(String(v.mileage));
  };

  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    try {
      const created = await dispatch(
        createCustomer({
          name: newCustomerForm.name.trim(),
          phone: newCustomerForm.phone.trim(),
          email: newCustomerForm.email.trim() || undefined,
        }),
      ).unwrap();
      setWalkinCustomerId(created.id);
      setNewCustomerForm({ name: "", phone: "", email: "" });
      setNewCustomerOpen(false);
      toast.success(`Customer ${created.name} registered`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register customer");
    }
  };

  const handleNewVehicle = async (data: VehicleFormData) => {
    if (!resolvedCustomerId) {
      throw new Error("Pick or register a customer first");
    }
    const vehicle = await dispatch(addVehicle({ ...data, ownerId: resolvedCustomerId })).unwrap();
    setWalkinVehicleId(vehicle.id);
    setNewVehicleOpen(false);
    toast.success("Vehicle registered for customer");
  };

  const createCard = async () => {
    if (!resolvedVehicle || !resolvedCustomerId) {
      toast.error("Select or register a vehicle and its owner first");
      return;
    }
    if (!issues.trim()) {
      toast.error("Please add reported problems");
      return;
    }
    setSubmitting(true);
    try {
      const res = await dispatch(
        createJobCard({
          vehicleId: resolvedVehicle.id,
          customerId: resolvedCustomerId,
          issues: issues.trim(),
          priority,
          station: "Main Bay / Station 04",
          mileage: Number(mileage.replace(/[^0-9]/g, "")) || undefined,
          fuelLevel: fuelLevel ? Number(fuelLevel) : undefined,
          keysReceived,
          accessories: accessories.trim() || undefined,
          appointmentId: appointment?.id,
          serviceIds: selectedServiceIds,
          expectedDate: expectedDate || undefined,
        }),
      ).unwrap();
      toast.success(`Job card ${res.id} created`);
      router.push("/advisor/job-cards/assign");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job card");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (customer?.name ?? "—")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#191c1d]">Receive Vehicle</h1>
            <p className="pt-1 text-sm text-[#64748b]">
              Intake a booked appointment or a walk-in / on-site vehicle.
            </p>
          </div>
          <button type="button" onClick={() => void createCard()} disabled={submitting} className={primaryBtn}>
            <Plus className="size-[13.5px]" />
            {submitting ? "Creating..." : "Create Job Card"}
          </button>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5 flex flex-col gap-6">
            <section className={card}>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-[#f3f4f6] p-1">
                {(["appointment", "walkin"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md py-2 text-xs font-semibold capitalize transition-colors",
                      mode === m ? "bg-white text-foreground shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    {m === "appointment" ? "Booked Appointment" : "Walk-in / On-site"}
                  </button>
                ))}
              </div>

              {mode === "appointment" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Confirmed Appointment</label>
                    <div className="relative">
                      <select
                        value={appointmentId}
                        onChange={(e) => selectAppointment(e.target.value)}
                        className={cn(inputBase, "appearance-none pr-8")}
                      >
                        <option value="">Select a confirmed booking…</option>
                        {confirmedAppointments.map((a) => {
                          const v = vehicles.find((x) => x.id === a.vehicleId);
                          return (
                            <option key={a.id} value={a.id}>
                              {a.date} {a.time} — {v ? `${v.make} ${v.model} (${v.regNo})` : "Vehicle"}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                    </div>
                  </div>
                  {appointment && (
                    <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-secondary p-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                        <CalendarDays className="size-4 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-foreground">
                          {appointment.date} • {appointment.time}
                        </p>
                        <p className="truncate text-xs text-[#64748b]">
                          {appointmentServices.length > 0 ? appointmentServices.join(", ") : appointment.notes || "Custom request"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className={fieldLabel}>Customer</label>
                      <button
                        type="button"
                        onClick={() => setNewCustomerOpen((o) => !o)}
                        className={cn("text-xs font-semibold", newCustomerOpen ? "text-[#64748b]" : "text-primary hover:underline")}
                      >
                        {newCustomerOpen ? "Pick existing" : "+ New customer"}
                      </button>
                    </div>
                    {newCustomerOpen ? (
                      <form onSubmit={(e) => void handleNewCustomer(e)} className="flex flex-col gap-2 rounded border border-[#e2e8f0] bg-[#fafbfc] p-3">
                        <input
                          value={newCustomerForm.name}
                          onChange={(e) => setNewCustomerForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Full name"
                          className={inputBase}
                        />
                        <input
                          value={newCustomerForm.phone}
                          onChange={(e) => setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="Phone (e.g. +880 1XXX-XXXXXX)"
                          className={inputBase}
                        />
                        <input
                          value={newCustomerForm.email}
                          onChange={(e) => setNewCustomerForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="Email (optional)"
                          className={inputBase}
                        />
                        <button type="submit" className={primaryBtn}>
                          <UserRound className="size-3.5" />
                          Register Customer
                        </button>
                      </form>
                    ) : (
                      <div className="relative">
                        <select
                          value={walkinCustomerId}
                          onChange={(e) => selectCustomer(e.target.value)}
                          className={cn(inputBase, "appearance-none pr-8")}
                        >
                          <option value="">Select existing customer…</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} — {c.phone}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                      </div>
                    )}
                  </div>

                  {resolvedCustomerId && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className={fieldLabel}>Vehicle</label>
                          <button
                            type="button"
                            onClick={() => setNewVehicleOpen((o) => !o)}
                            className={cn("text-xs font-semibold", newVehicleOpen ? "text-[#64748b]" : "text-primary hover:underline")}
                          >
                            {newVehicleOpen ? "Pick existing" : "+ Register vehicle"}
                          </button>
                        </div>
                        {newVehicleOpen ? (
                          <div className="rounded border border-[#e2e8f0] bg-[#fafbfc] p-3">
                            <VehicleForm submitLabel="Register Vehicle" onSubmit={handleNewVehicle} />
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={walkinVehicleId}
                              onChange={(e) => selectVehicle(e.target.value)}
                              className={cn(inputBase, "appearance-none pr-8")}
                            >
                              <option value="">Select vehicle…</option>
                              {vehiclesOfCustomer.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.year} {v.make} {v.model} — {v.regNo}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {resolvedVehicle && (
                <div className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-secondary p-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#eef1f4]">
                    <VehicleImage src={resolvedVehicle.image} alt={resolvedVehicle.model} fill className="object-contain p-1" />
                  </div>
                  <div className="min-w-0">
                    <p className="overflow-hidden text-ellipsis text-sm font-semibold text-foreground whitespace-nowrap">
                      {resolvedVehicle.year} {resolvedVehicle.make} {resolvedVehicle.model}
                    </p>
                    <p className="truncate text-xs text-[#64748b]">
                      {cap(resolvedVehicle.fuelType)} • {resolvedVehicle.regNo} • {resolvedVehicle.mileage.toLocaleString()} mi
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Customer</h3>
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-base font-bold text-primary">
                  {initials}
                </span>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-[#191c1d]">{customer?.name ?? "—"}</span>
                  <span className="text-[11px] font-medium text-[#64748b] capitalize">
                    {customer ? cap(customer.status) : "Select a customer"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Mail className="size-3.5 shrink-0" />
                  {customer?.email ?? "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Phone className="size-3.5 shrink-0" />
                  {customer?.phone ?? "—"}
                </p>
              </div>
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Intake Specifications</h3>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Mileage</label>
                    <div className="relative">
                      <Gauge className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="text"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className={cn(inputBase, "pl-[34px] pr-9")}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#64748b]">mi</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Fuel Level</label>
                    <input
                      type="text"
                      value={fuelLevel}
                      onChange={(e) => setFuelLevel(e.target.value)}
                      placeholder="75"
                      className={cn(inputBase, "pr-9")}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                  <div>
                    <span className="text-sm font-medium text-[#191c1d]">Keys Received</span>
                    <p className="text-xs text-[#64748b]">Vehicle key physically handed over</p>
                  </div>
                  <Switch aria-label="Keys received" checked={keysReceived} onCheckedChange={setKeysReceived} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Accessories left in vehicle</label>
                  <input
                    type="text"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    placeholder="e.g., Dashcam, tools in trunk..."
                    className={inputBase}
                  />
                </div>
              </div>
            </section>
          </div>

          <section className="col-span-7 flex flex-col gap-6">
            <section className={card}>
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>
                  Services ({selectedServiceIds.length} selected)
                </h3>
                {selectedServiceIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedServiceIds([])}
                    className="text-xs font-semibold text-[#64748b] hover:text-[#ba1a1a]"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {services.length === 0 ? (
                  <p className="col-span-2 text-sm text-[#64748b]">No services in the catalog yet.</p>
                ) : (
                  services.map((s: Service) => {
                    const active = selectedServiceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          "flex items-center justify-between rounded border px-3 py-2 text-left text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-[#e5e7eb] bg-white text-[#191c1d] hover:border-primary/50",
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className={cn("flex size-4 shrink-0 items-center justify-center rounded border", active ? "border-primary bg-primary text-white" : "border-[#c2c6d5]")}>
                            {active && <Check className="size-3" />}
                          </span>
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="ml-2 shrink-0 text-[10px] text-[#64748b]">${s.basePrice.toFixed(0)}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Job Card Details</h3>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Reported Problems / Customer Concerns</label>
                <textarea
                  value={issues}
                  onChange={(e) => setIssues(e.target.value)}
                  placeholder={appointment ? "Prefilled from the booking — edit if needed." : "Describe the issue the customer reported..."}
                  className={cn(inputBase, "min-h-24 resize-none")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Priority Level</label>
                  <div className="grid grid-cols-3 gap-1.5 rounded bg-[#edeeef] p-5">
                    {priorities.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPriority(level)}
                        className={cn(
                          "rounded py-[7px] text-xs font-semibold capitalize",
                          priority === level
                            ? "bg-white text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                            : "text-[#64748b]",
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Expected Completion</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className={inputBase}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#f3f4f6] p-3">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  <span className="text-xs font-medium text-[#191c1d]">Station</span>
                </div>
                <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#191c1d]">Main Bay / Station 04</span>
              </div>
            </section>

            <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] pt-4">
              <button type="button" className={outlineBtn} onClick={() => router.push("/advisor/job-cards/assign")}>
                Cancel
              </button>
              <button type="button" onClick={() => void createCard()} disabled={submitting} className={primaryBtn}>
                <Plus className="size-[13.5px]" />
                {submitting ? "Creating..." : "Create Job Card"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}