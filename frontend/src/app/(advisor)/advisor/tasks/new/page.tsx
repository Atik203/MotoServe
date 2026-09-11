"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  Clock,
  History,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTask } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { FormLoading } from "@/components/ui/loading";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";

const priorities = [
  { key: "low", label: "Low", active: "border-[#0052cc] bg-primary/10 text-primary" },
  { key: "medium", label: "Medium", active: "border-[#ffc107] bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
  { key: "high", label: "High", active: "border-[#0052cc] bg-primary/10 text-primary" },
] as const;

const WORKLOAD_LIMIT = 5;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const inputBase =
  "h-10 w-full rounded border border-[#e2e8f0] bg-[#f8f9fa] px-3 text-sm text-[#191c1d] placeholder:text-[#9ca3af] outline-none";
const selectBase = cn(inputBase, "appearance-none pr-8");

export default function CreateTaskPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const vehiclesStatus = useAppSelector((s) => s.vehicles.status);
  const customers = useAppSelector((s) => s.customers.items);
  const services = useAppSelector((s) => s.services.items);
  const employees = useAppSelector((s) => s.employees.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const user = useAppSelector((s) => s.auth.user);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [issues, setIssues] = useState("");
  const [station, setStation] = useState(user?.station ?? "");
  const [priority, setPriority] = useState<(typeof priorities)[number]["key"]>("medium");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [expectedDate, setExpectedDate] = useState("");
  const [expectedTime, setExpectedTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stationPrefilled, setStationPrefilled] = useState(false);

  // Multi-mechanic selection state
  const [selectedMechanicIds, setSelectedMechanicIds] = useState<string[]>([]);
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  if (!stationPrefilled && user?.station) {
    setStation(user.station);
    setStationPrefilled(true);
  }

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchServices());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const customerVehicles = vehicles.filter((v) => v.ownerId === customerId);
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

  const mechanics = useMemo(
    () => employees.filter((e) => e.role === "mechanic"),
    [employees],
  );

  const workloadOf = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (t.status !== "completed" && t.status !== "ready") {
        if (t.mechanicIds && t.mechanicIds.length > 0) {
          for (const mId of t.mechanicIds) {
            counts.set(mId, (counts.get(mId) ?? 0) + 1);
          }
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

  const toggleMechanic = (id: string) => {
    setSelectedMechanicIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
  };

  const removeMechanic = (id: string) => {
    setSelectedMechanicIds((prev) => prev.filter((mId) => mId !== id));
  };

  const toggleService = (id: string) =>
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !vehicleId) {
      toast.error("Select a customer and vehicle first");
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
          vehicleId,
          customerId,
          issues: issues.trim(),
          priority,
          station: station.trim() || user?.station || undefined,
          serviceIds,
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
      toast.success(`Task #${res.id} created successfully${mechanicText}`);
      router.push("/advisor/tasks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
      setSubmitting(false);
    }
  };

  if ((vehiclesStatus === "idle" || vehiclesStatus === "loading") && vehicles.length === 0) {
    return <FormLoading label="Loading task form" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-[11px] text-muted-foreground">Dashboard › Work Orders › Create Task</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Create Task</h1>
        </div>

        <div className="flex items-start gap-6">
          <section className="flex w-[417px] shrink-0 flex-col gap-[25px] rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl font-semibold text-foreground">Vehicle &amp; Customer Summary</h2>

            <div>
              <h3 className="flex items-center gap-2 border-b border-[#e5e7eb] pb-4 text-xl font-semibold text-foreground">
                <Car className="size-5 text-primary" />
                Vehicle Details
              </h3>

              <div className="relative mt-4 h-32 overflow-hidden rounded bg-[#e1e3e4]">
                {vehicle ? (
                  <VehicleImage
                    src={vehicle.image || "/images/cars/ford-f150.png"}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Car className="size-8 text-[#9ca3af]" />
                  </div>
                )}
                {vehicle && (
                  <span className="absolute right-2 bottom-2 rounded-sm bg-white/90 px-[9px] py-0.75 text-[11px] font-semibold text-foreground backdrop-blur-[2px]">
                    {vehicle.regNo}
                  </span>
                )}
              </div>

              <div className="mt-[25px] grid grid-cols-2 gap-x-[16px] gap-y-[25px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#64748b]">Make & Model</span>
                  <span className="text-sm font-medium text-[#191c1d]">
                    {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Select a vehicle"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#64748b]">Mileage</span>
                  <span className="text-sm font-medium text-[#191c1d]">
                    {vehicle ? `${vehicle.mileage.toLocaleString()} mi` : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#64748b]">Fuel Type</span>
                  <span className="text-sm font-medium text-[#191c1d] capitalize">
                    {vehicle?.fuelType ?? "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#64748b]">Registration</span>
                  <span className="text-sm font-medium text-[#191c1d]">{vehicle?.regNo ?? "—"}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 border-b border-[#e5e7eb] pb-4 text-xl font-semibold text-foreground">
                <User className="size-5 text-primary" />
                Customer Info
              </h3>

              <div className="flex flex-col gap-3.5 pt-4">
                <div className="flex items-center gap-2.5">
                  <User className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-[#191c1d]">{customer?.name ?? "Select a customer"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-[#191c1d]">{customer?.phone ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium text-[#191c1d]">{customer?.email ?? "—"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => router.push(`/advisor/tasks?customer=${customerId}`)}
                disabled={!customerId}
                className="flex w-full items-center justify-center gap-2 rounded border border-[#727784] py-2.5 text-xs font-semibold text-primary disabled:opacity-40"
              >
                <History className="size-3.5" />
                View Service History
              </button>
            </div>
          </section>

          <form
            onSubmit={submit}
            className="flex min-w-0 flex-1 flex-col gap-[25px] rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Customer *</Label>
                <div className="relative">
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setVehicleId("");
                    }}
                    className={selectBase}
                  >
                    <option value="" disabled>
                      Select customer...
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#64748b]" />
                </div>
              </div>

              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Vehicle *</Label>
                <div className="relative">
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    disabled={!customerId}
                    className={selectBase}
                  >
                    <option value="" disabled>
                      {customerId ? "Select vehicle..." : "Select a customer first"}
                    </option>
                    {(customerId ? customerVehicles : vehicles).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.year} {v.make} {v.model} · {v.regNo}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#64748b]" />
                </div>
              </div>

              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Station</Label>
                <Input
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                  className={cn(inputBase, "bg-white")}
                  placeholder="e.g. Bay 04 / Express Lane"
                />
              </div>

              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Service Advisor</Label>
                <Input
                  value={user?.name ?? "Assigned automatically"}
                  readOnly
                  className={cn(inputBase, "bg-[#f3f4f5] text-[#6b7280]")}
                />
              </div>

              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Expected Completion Date
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className={cn(inputBase, "bg-white pr-8")}
                  />
                  <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Expected Completion Time
                </Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={expectedTime}
                    onChange={(e) => setExpectedTime(e.target.value)}
                    className={cn(inputBase, "bg-white pr-8")}
                  />
                  <Clock className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="col-span-2 flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Services to Perform *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((s) => {
                    const selected = serviceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded border px-3 py-2 text-left transition-colors",
                          selected
                            ? "border-primary bg-[#eff6ff]"
                            : "border-[#e2e8f0] bg-[#f8f9fa] hover:border-primary/40",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#191c1d]">{s.name}</span>
                          <span className="block text-xs text-[#64748b]">
                            ${s.basePrice.toFixed(2)} · {s.durationMins}min
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                            selected ? "border-primary bg-primary text-white" : "border-[#cbd5e1] text-transparent",
                          )}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Mechanic Assignment Section */}
              <div className="col-span-2 flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-[#fcfcfd] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <Label className="text-xs font-semibold tracking-[0.24px] text-[#191c1d]">
                      Assign Mechanics (Optional)
                    </Label>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {selectedMechanicIds.length === 0
                        ? "None assigned"
                        : `${selectedMechanicIds.length} selected`}
                    </span>
                  </div>

                  <div className="relative w-48">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#727784]" />
                    <Input
                      value={mechanicSearch}
                      onChange={(e) => setMechanicSearch(e.target.value)}
                      placeholder="Search mechanics..."
                      className="h-8 rounded border-[#e5e7eb] bg-white pl-8 text-xs"
                    />
                  </div>
                </div>

                {/* Selected Mechanics Chips */}
                {selectedMechanics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 border-b border-[#e5e7eb]">
                    <span className="text-[11px] font-medium text-[#64748b]">Assigned:</span>
                    {selectedMechanics.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd5e1] bg-white py-0.5 pr-1 pl-2 text-xs font-medium text-[#191c1d] shadow-xs"
                      >
                        <span className="size-1.5 rounded-full bg-primary" />
                        {m.name}
                        <button
                          type="button"
                          onClick={() => removeMechanic(m.id)}
                          className="flex size-4 items-center justify-center rounded-full hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#ba1a1a]"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Mechanic Cards Grid */}
                <div className="grid max-h-56 grid-cols-2 gap-2.5 overflow-y-auto pr-1">
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
                          "relative flex items-center justify-between gap-3 rounded-lg border p-2.5 text-left transition-all",
                          isSelected
                            ? "border-primary bg-[#eff6ff] shadow-xs"
                            : "border-[#e5e7eb] bg-white hover:border-primary/40",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar className="size-8 shrink-0 rounded-lg">
                            <AvatarImage src={m.avatar} alt={m.name} className="rounded-lg object-cover" />
                            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                              {initials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-col">
                            <span className="block truncate text-xs font-semibold text-[#191c1d]">
                              {m.name}
                            </span>
                            <span className="block truncate text-[10px] text-[#64748b]">
                              {m.specialization ?? "General Mechanic"}
                              {m.station ? ` • ${m.station}` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              isFull
                                ? "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]"
                                : workload >= 2
                                  ? "bg-[rgba(255,193,7,0.15)] text-[#8b5000]"
                                  : "bg-[rgba(76,175,80,0.1)] text-[#2e7d32]",
                            )}
                          >
                            {workload}/{WORKLOAD_LIMIT} tasks
                          </span>
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-[#cbd5e1] bg-white text-transparent",
                            )}
                          >
                            <Check className="size-2.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Assignment Notes */}
                {selectedMechanicIds.length > 0 && (
                  <div className="pt-2 border-t border-[#e5e7eb]">
                    <Label className="text-[11px] font-medium text-[#64748b]">
                      Assignment Notes / Instructions for Mechanics
                    </Label>
                    <Input
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="e.g. Please check brake pads first and notify advisor..."
                      className="mt-1 h-8 rounded border-[#e5e7eb] bg-white text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="col-span-2 flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Priority</Label>
                <div className="flex gap-2">
                  {priorities.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriority(p.key)}
                      className={cn(
                        "rounded-full border border-[#d1d5db] bg-white px-4 py-1.5 text-xs font-semibold text-[#424753]",
                        priority === p.key && p.active,
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Reported Issues / Work Requested *
                </Label>
                <textarea
                  value={issues}
                  onChange={(e) => setIssues(e.target.value)}
                  placeholder="Describe the reported problems or requested work..."
                  className={cn(inputBase, "h-28 resize-none py-2.5")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t border-[#e5e7eb] pt-[25px]">
              <button
                type="button"
                onClick={() => router.push("/advisor/tasks")}
                className="rounded border border-[#727784] px-4 py-[9px] text-xs font-semibold text-[#424753]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded bg-primary px-4 py-[9px] text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] disabled:opacity-50"
              >
                <Plus className="size-[13.5px]" />
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
