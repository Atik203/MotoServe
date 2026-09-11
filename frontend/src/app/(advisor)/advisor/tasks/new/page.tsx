"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  Clock,
  Gauge,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTask } from "@/store/slices/tasksSlice";
import { fetchVehicles, addVehicle } from "@/store/slices/vehiclesSlice";
import { fetchCustomers, createCustomer } from "@/store/slices/customersSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { VehicleForm, type VehicleFormData } from "@/components/roles/owner/VehicleForm";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { ServicePicker } from "@/components/roles/shared/ServicePicker";
import { FormLoading } from "@/components/ui/loading";
import type { Appointment, Customer, Vehicle } from "@/types";

const priorities = [
  { key: "low", label: "Low", activeClass: "bg-[#eff6ff] border-primary text-primary" },
  { key: "medium", label: "Medium", activeClass: "bg-[rgba(255,193,7,0.12)] border-[#ffc107] text-[#8b5000]" },
  { key: "high", label: "High", activeClass: "bg-[rgba(186,26,26,0.08)] border-[#ba1a1a] text-[#ba1a1a]" },
] as const;

const WORKLOAD_LIMIT = 5;

const fieldLabel = "text-xs font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "h-9 w-full rounded border border-[#e2e8f0] bg-[#f8f9fa] px-3 text-sm text-[#191c1d] placeholder:text-[#9ca3af] outline-none focus:border-primary/60";
const selectBase = cn(inputBase, "appearance-none pr-8");
const card = "rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]";
const primaryBtn =
  "flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-[9px] text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-60";

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export default function CreateTaskPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const vehiclesStatus = useAppSelector((s) => s.vehicles.status);
  const customers = useAppSelector((s) => s.customers.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const services = useAppSelector((s) => s.services.items);
  const employees = useAppSelector((s) => s.employees.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const user = useAppSelector((s) => s.auth.user);

  // Mode: booked appointment or walk-in
  const [mode, setMode] = useState<"appointment" | "walkin">("appointment");

  // Appointment mode
  const [appointmentId, setAppointmentId] = useState(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("appointment") ?? "" : ""),
  );

  // Walk-in mode
  const [walkinCustomerId, setWalkinCustomerId] = useState("");
  const [walkinVehicleId, setWalkinVehicleId] = useState("");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", email: "" });

  // Intake fields
  const [keysReceived, setKeysReceived] = useState(true);
  const [mileage, setMileage] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [accessories, setAccessories] = useState("");

  // Task details
  const [issues, setIssues] = useState("");
  const [priority, setPriority] = useState<(typeof priorities)[number]["key"]>("medium");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("");
  const [station, setStation] = useState(user?.station ?? "");
  const [stationPrefilled, setStationPrefilled] = useState(false);

  // Multi-mechanic
  const [selectedMechanicIds, setSelectedMechanicIds] = useState<string[]>([]);
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  if (!stationPrefilled && user?.station) {
    setStation(user.station);
    setStationPrefilled(true);
  }

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchAppointments());
    dispatch(fetchServices());
    dispatch(fetchEmployees());
  }, [dispatch]);

  // --- Resolved entities ---
  const confirmedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "confirmed"),
    [appointments],
  );

  const appointment: Appointment | null = appointmentId
    ? (appointments.find((a) => a.id === appointmentId) ?? null)
    : null;

  const resolvedCustomerId = mode === "appointment"
    ? (appointment?.ownerId ?? "")
    : walkinCustomerId;

  const resolvedVehicleId = mode === "appointment"
    ? (appointment?.vehicleId ?? "")
    : walkinVehicleId;

  const customer: Customer | null = customers.find((c) => c.id === resolvedCustomerId) ?? null;
  const resolvedVehicle: Vehicle | null = vehicles.find((v) => v.id === resolvedVehicleId) ?? null;
  const vehiclesOfCustomer = vehicles.filter((v) => v.ownerId === resolvedCustomerId);

  // Pre-fill services from appointment
  const appointmentServices = useMemo(
    () => appointment ? services.filter((s) => appointment.serviceIds.includes(s.id)) : [],
    [appointment, services],
  );

  const selectAppointment = (id: string) => {
    setAppointmentId(id);
    const a = appointments.find((x) => x.id === id);
    if (a) {
      setServiceIds(a.serviceIds);
      setIssues(
        [a.notes, ...services.filter((s) => a.serviceIds.includes(s.id)).map((s) => s.name)]
          .filter(Boolean)
          .join(" • "),
      );
      const v = vehicles.find((x) => x.id === a.vehicleId);
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
    if (!resolvedCustomerId) throw new Error("Pick or register a customer first");
    const vehicle = await dispatch(addVehicle({ ...data, ownerId: resolvedCustomerId })).unwrap();
    setWalkinVehicleId(vehicle.id);
    setNewVehicleOpen(false);
    toast.success("Vehicle registered for customer");
  };

  // Mechanics
  const mechanics = useMemo(() => employees.filter((e) => e.role === "mechanic"), [employees]);

  const workloadOf = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== "completed" && t.status !== "ready") {
        if (t.mechanicIds && t.mechanicIds.length > 0) {
          for (const mId of t.mechanicIds) counts.set(mId, (counts.get(mId) ?? 0) + 1);
        } else if (t.mechanicId) {
          counts.set(t.mechanicId, (counts.get(t.mechanicId) ?? 0) + 1);
        }
      }
    }
    return (id: string) => counts.get(id) ?? 0;
  }, [tasks]);

  const filteredMechanics = useMemo(() => {
    const q = mechanicSearch.trim().toLowerCase();
    if (!q) return mechanics;
    return mechanics.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.specialization ?? "").toLowerCase().includes(q) ||
        (m.station ?? "").toLowerCase().includes(q),
    );
  }, [mechanics, mechanicSearch]);

  const selectedMechanics = useMemo(
    () => mechanics.filter((m) => selectedMechanicIds.includes(m.id)),
    [mechanics, selectedMechanicIds],
  );

  const toggleMechanic = (id: string) =>
    setSelectedMechanicIds((prev) => prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]);

  const removeMechanic = (id: string) =>
    setSelectedMechanicIds((prev) => prev.filter((mId) => mId !== id));

  const toggleService = (id: string) =>
    setServiceIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const submit = async () => {
    if (!resolvedVehicleId || !resolvedCustomerId) {
      toast.error("Select or register a vehicle and its owner first");
      return;
    }
    if (!issues.trim()) {
      toast.error("Please describe the reported issues");
      return;
    }
    if (serviceIds.length === 0) {
      toast.error("Select at least one service to perform");
      return;
    }
    setSubmitting(true);
    try {
      const res = await dispatch(
        createTask({
          vehicleId: resolvedVehicleId,
          customerId: resolvedCustomerId,
          issues: issues.trim(),
          priority,
          station: station.trim() || user?.station || undefined,
          serviceIds,
          mileage: Number(mileage.replace(/[^0-9]/g, "")) || undefined,
          fuelLevel: fuelLevel ? Number(fuelLevel) : undefined,
          keysReceived,
          accessories: accessories.trim() || undefined,
          appointmentId: appointment?.id,
          expectedDate: expectedDate ? (expectedTime ? `${expectedDate} ${expectedTime}` : expectedDate) : undefined,
          mechanicIds: selectedMechanicIds.length > 0 ? selectedMechanicIds : undefined,
          mechanicId: selectedMechanicIds[0] ?? undefined,
          assignmentNotes: assignmentNotes.trim() || undefined,
        }),
      ).unwrap();

      const mechanicText =
        selectedMechanicIds.length > 0
          ? ` with ${selectedMechanicIds.length} mechanic${selectedMechanicIds.length > 1 ? "s" : ""} assigned`
          : "";
      toast.success(`Task ${res.id} created${mechanicText}`);
      router.push("/advisor/receive");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
      setSubmitting(false);
    }
  };

  const customerInitials = customer ? initials(customer.name) : "?";

  if (
    (vehiclesStatus === "idle" || vehiclesStatus === "loading") &&
    vehicles.length === 0 &&
    customers.length === 0
  ) {
    return <FormLoading label="Loading task form" />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-[#64748b]">Dashboard › Work Orders › Create Task</p>
            <h1 className="text-3xl font-bold tracking-[-0.5px] text-[#191c1d]">Create Task</h1>
            <p className="pt-1 text-sm text-[#64748b]">Log a booked appointment or walk-in vehicle for service.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/advisor/receive")}
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-[9px] text-xs font-semibold text-[#424753] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className={primaryBtn}
            >
              <Plus className="size-3.5" />
              {submitting ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          {/* LEFT: Intake / Source */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* Mode switcher */}
            <div className={card}>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#f3f4f6] p-1 mb-4">
                {(["appointment", "walkin"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md py-2 text-xs font-semibold transition-colors",
                      mode === m ? "bg-white text-[#191c1d] shadow-sm" : "text-[#64748b]",
                    )}
                  >
                    {m === "appointment" ? "Booked Appointment" : "Walk-in / On-site"}
                  </button>
                ))}
              </div>

              {mode === "appointment" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Confirmed Appointment</label>
                    <div className="relative">
                      <select
                        value={appointmentId}
                        onChange={(e) => selectAppointment(e.target.value)}
                        className={selectBase}
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
                    <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-3 text-xs text-[#64748b]">
                      <p className="font-semibold text-[#191c1d]">{appointment.date} · {appointment.time}</p>
                      {appointmentServices.length > 0 && (
                        <p className="mt-1">{appointmentServices.map((s) => s.name).join(", ")}</p>
                      )}
                      {appointment.notes && <p className="mt-1 italic">{appointment.notes}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Customer */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className={fieldLabel}>Customer</label>
                      <button
                        type="button"
                        onClick={() => setNewCustomerOpen((o) => !o)}
                        className={cn("text-xs font-semibold", newCustomerOpen ? "text-[#64748b]" : "text-primary hover:underline")}
                      >
                        {newCustomerOpen ? "Pick existing" : "+ New"}
                      </button>
                    </div>
                    {newCustomerOpen ? (
                      <form onSubmit={(e) => void handleNewCustomer(e)} className="flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-[#fafbfc] p-3">
                        <input value={newCustomerForm.name} onChange={(e) => setNewCustomerForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className={inputBase} />
                        <input value={newCustomerForm.phone} onChange={(e) => setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" className={inputBase} />
                        <input value={newCustomerForm.email} onChange={(e) => setNewCustomerForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email (optional)" className={inputBase} />
                        <button type="submit" className={primaryBtn}>
                          <UserRound className="size-3.5" />
                          Register Customer
                        </button>
                      </form>
                    ) : (
                      <div className="relative">
                        <select value={walkinCustomerId} onChange={(e) => selectCustomer(e.target.value)} className={selectBase}>
                          <option value="">Select customer…</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                      </div>
                    )}
                  </div>

                  {/* Vehicle */}
                  {resolvedCustomerId && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className={fieldLabel}>Vehicle</label>
                        <button
                          type="button"
                          onClick={() => setNewVehicleOpen((o) => !o)}
                          className={cn("text-xs font-semibold", newVehicleOpen ? "text-[#64748b]" : "text-primary hover:underline")}
                        >
                          {newVehicleOpen ? "Pick existing" : "+ Register"}
                        </button>
                      </div>
                      {newVehicleOpen ? (
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] p-3">
                          <VehicleForm submitLabel="Register Vehicle" onSubmit={handleNewVehicle} />
                        </div>
                      ) : (
                        <div className="relative">
                          <select value={walkinVehicleId} onChange={(e) => selectVehicle(e.target.value)} className={selectBase}>
                            <option value="">Select vehicle…</option>
                            {vehiclesOfCustomer.map((v) => (
                              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model} — {v.regNo}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer info */}
            <div className={card}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">Customer</h3>
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-sm font-bold text-primary">
                  {customerInitials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#191c1d]">{customer?.name ?? "—"}</p>
                  <p className="text-xs capitalize text-[#64748b]">{customer ? customer.status : "No customer selected"}</p>
                </div>
              </div>
              {customer && (
                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="flex items-center gap-2 text-xs text-[#64748b]">
                    <Mail className="size-3 shrink-0" />{customer.email ?? "—"}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-[#64748b]">
                    <Phone className="size-3 shrink-0" />{customer.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Vehicle preview */}
            {resolvedVehicle && (
              <div className={card}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">Vehicle</h3>
                <div className="relative mb-3 h-28 overflow-hidden rounded-lg bg-[#eef1f4]">
                  <VehicleImage
                    src={resolvedVehicle.image}
                    alt={resolvedVehicle.model}
                    fill
                    className="object-contain p-2"
                  />
                  <span className="absolute right-2 bottom-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#191c1d] backdrop-blur-sm">
                    {resolvedVehicle.regNo}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-[#64748b]">Make & Model</p>
                    <p className="text-xs font-semibold text-[#191c1d]">{resolvedVehicle.year} {resolvedVehicle.make} {resolvedVehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Fuel Type</p>
                    <p className="text-xs font-semibold capitalize text-[#191c1d]">{resolvedVehicle.fuelType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Mileage</p>
                    <p className="text-xs font-semibold text-[#191c1d]">{resolvedVehicle.mileage.toLocaleString()} mi</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#64748b]">Reg. No</p>
                    <p className="text-xs font-semibold text-[#191c1d]">{resolvedVehicle.regNo}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Intake specs */}
            <div className={card}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">Intake Specs</h3>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={fieldLabel}>Mileage</label>
                    <div className="relative">
                      <Gauge className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="text"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className={cn(inputBase, "pl-7 pr-7")}
                        placeholder="0"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-[#64748b]">mi</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={fieldLabel}>Fuel Level %</label>
                    <input
                      type="text"
                      value={fuelLevel}
                      onChange={(e) => setFuelLevel(e.target.value)}
                      placeholder="75"
                      className={inputBase}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#f3f4f6] px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-[#191c1d]">Keys Received</p>
                    <p className="text-[10px] text-[#64748b]">Vehicle key handed over</p>
                  </div>
                  <Switch checked={keysReceived} onCheckedChange={setKeysReceived} aria-label="Keys received" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={fieldLabel}>Accessories in vehicle</label>
                  <input
                    type="text"
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    placeholder="e.g. Dashcam, tools in trunk..."
                    className={inputBase}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Task Details */}
          <div className="col-span-8 flex flex-col gap-4">
            {/* Services */}
            <div className={card}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">
                Services to Perform *
              </h3>
              <ServicePicker
                services={services}
                selectedIds={serviceIds}
                onToggle={toggleService}
                maxHeight="max-h-80"
                showTotal
              />
            </div>

            {/* Reported Issues */}
            <div className={card}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">Task Details</h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Reported Problems / Customer Concerns *</label>
                  <textarea
                    value={issues}
                    onChange={(e) => setIssues(e.target.value)}
                    placeholder={appointment ? "Prefilled from booking — edit if needed." : "Describe the reported issues..."}
                    className={cn(inputBase, "h-24 resize-none py-2.5")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Priority</label>
                    <div className="flex gap-2">
                      {priorities.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriority(p.key)}
                          className={cn(
                            "flex-1 rounded-lg border py-2 text-xs font-semibold transition-all",
                            priority === p.key
                              ? p.activeClass
                              : "border-[#e5e7eb] bg-white text-[#64748b] hover:border-[#c2c6d5]",
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Station</label>
                    <div className="relative">
                      <Wrench className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="text"
                        value={station}
                        onChange={(e) => setStation(e.target.value)}
                        placeholder="e.g. Bay 04"
                        className={cn(inputBase, "pl-8")}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Expected Completion Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className={cn(inputBase, "pr-8")}
                      />
                      <CalendarDays className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#64748b]" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel}>Expected Time</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={expectedTime}
                        onChange={(e) => setExpectedTime(e.target.value)}
                        className={cn(inputBase, "pr-8")}
                      />
                      <Clock className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#64748b]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Multi-mechanic assignment */}
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">Assign Mechanics</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {selectedMechanicIds.length === 0 ? "Optional" : `${selectedMechanicIds.length} selected`}
                  </span>
                </div>
                <div className="relative w-44">
                  <Search className="absolute top-1/2 left-2.5 size-3 -translate-y-1/2 text-[#9ca3af]" />
                  <Input
                    value={mechanicSearch}
                    onChange={(e) => setMechanicSearch(e.target.value)}
                    placeholder="Search mechanics..."
                    className="h-8 rounded border-[#e5e7eb] bg-white pl-7 text-xs"
                  />
                </div>
              </div>

              {selectedMechanics.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5 rounded-lg border border-primary/20 bg-[#eff6ff] px-3 py-2">
                  <span className="self-center text-[11px] font-semibold text-primary">Assigned:</span>
                  {selectedMechanics.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1.5 pl-2 text-[11px] font-medium text-primary"
                    >
                      {m.name}
                      <button
                        type="button"
                        onClick={() => removeMechanic(m.id)}
                        className="flex size-3.5 items-center justify-center rounded-full hover:bg-primary/20"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto">
                {filteredMechanics.map((m) => {
                  const isSelected = selectedMechanicIds.includes(m.id);
                  const workload = workloadOf(m.id);
                  const isFull = workload >= WORKLOAD_LIMIT;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMechanic(m.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                        isSelected
                          ? "border-primary bg-[#eff6ff]"
                          : "border-[#e5e7eb] bg-white hover:border-primary/40",
                      )}
                    >
                      <Avatar className="size-7 shrink-0 rounded-lg">
                        <AvatarImage src={m.avatar} alt={m.name} className="rounded-lg object-cover" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-[#191c1d]">{m.name}</p>
                        <p className={cn(
                          "text-[10px] font-medium",
                          isFull ? "text-[#ba1a1a]" : workload >= 3 ? "text-[#8b5000]" : "text-[#2e7d32]",
                        )}>
                          {workload}/{WORKLOAD_LIMIT}
                        </p>
                      </div>
                      <span className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isSelected ? "border-primary bg-primary text-white" : "border-[#cbd5e1]",
                      )}>
                        {isSelected && <Check className="size-2.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedMechanicIds.length > 0 && (
                <div className="mt-3 border-t border-[#e5e7eb] pt-3">
                  <Label className="text-[11px] text-[#64748b]">Notes for mechanics</Label>
                  <Input
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="e.g. Check brake pads first..."
                    className="mt-1 h-8 rounded border-[#e5e7eb] text-xs"
                  />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#e5e7eb] pt-2">
              <button
                type="button"
                onClick={() => router.push("/advisor/receive")}
                className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-[9px] text-xs font-semibold text-[#424753]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
                className={primaryBtn}
              >
                <Plus className="size-3.5" />
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
