"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Car,
  Check,
  Clock,
  ExternalLink,
  Fuel,
  Gauge,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  UserCheck,
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
import { createTaskCard, fetchTasks } from "@/store/slices/tasksSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchVehicles, addVehicle } from "@/store/slices/vehiclesSlice";
import { fetchCustomers, createCustomer } from "@/store/slices/customersSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchAppointments } from "@/store/slices/appointmentsSlice";
import { fetchStations } from "@/store/slices/stationsSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { ServicePicker } from "@/components/roles/shared/ServicePicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DetailLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Appointment, Customer, Vehicle } from "@/types";

const PRIORITIES = [
  { key: "low", label: "Low", color: "border-slate-300 text-slate-600 bg-slate-50" },
  { key: "medium", label: "Medium", color: "border-blue-300 text-blue-700 bg-blue-50" },
  { key: "high", label: "High", color: "border-amber-300 text-amber-700 bg-amber-50" },
] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold tracking-[0.35px] text-foreground uppercase">{children}</h2>
  );
}

function CreateTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const urlAppointmentId = searchParams.get("appointment") || searchParams.get("appointmentId");

  const vehicles = useAppSelector((s) => s.vehicles.items);
  const vehiclesStatus = useAppSelector((s) => s.vehicles.status);
  const customers = useAppSelector((s) => s.customers.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const services = useAppSelector((s) => s.services.items);
  const employees = useAppSelector((s) => s.employees.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const user = useAppSelector((s) => s.auth.user);
  const stations = useAppSelector((s) => s.stations.items);

  // Mode: Booked Appointment vs Walk-In
  const [mode, setMode] = useState<"appointment" | "walkin">(urlAppointmentId ? "appointment" : "appointment");
  const [appointmentId, setAppointmentId] = useState(urlAppointmentId ?? "");

  // Walk-In state
  const [walkinCustomerId, setWalkinCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [walkinVehicleId, setWalkinVehicleId] = useState("");

  // New Customer Modal
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", email: "" });
  const [customerBusy, setCustomerBusy] = useState(false);

  // New Vehicle Modal
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehicleYear, setNewVehicleYear] = useState("2023");
  const [newVehicleReg, setNewVehicleReg] = useState("");
  const [newVehicleFuel, setNewVehicleFuel] = useState<"gasoline" | "diesel" | "hybrid" | "electric">("gasoline");
  const [newVehicleMileage, setNewVehicleMileage] = useState("25000");
  const [vehicleBusy, setVehicleBusy] = useState(false);

  // Intake physical condition fields
  const [keysReceived, setKeysReceived] = useState(true);
  const [mileage, setMileage] = useState("25000");
  const [fuelLevel, setFuelLevel] = useState("1/2");
  const [accessories, setAccessories] = useState("");

  // Task details
  const [issues, setIssues] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [expectedTime, setExpectedTime] = useState("05:00 PM");
  const [station, setStation] = useState("");

  // Mechanic assignment
  const [selectedMechanicIds, setSelectedMechanicIds] = useState<string[]>([]);
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
    dispatch(fetchServices());
    dispatch(fetchEmployees());
    dispatch(fetchTasks());
    dispatch(fetchAppointments());
    dispatch(fetchStations());
  }, [dispatch]);

  useEffect(() => {
    if (!station && stations.length > 0) {
      setStation(stations[0].name);
    }
  }, [stations, station]);

  // When url appointment is loaded, pre-populate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlAppointmentId && appointments.length > 0) {
        const appt = appointments.find((a) => a.id === urlAppointmentId);
        if (appt) {
          setAppointmentId(appt.id);
          setServiceIds(appt.serviceIds);
          if (appt.notes) setIssues(appt.notes);
          const v = vehicles.find((x) => x.id === appt.vehicleId);
          if (v) setMileage(String(v.mileage || 25000));
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [urlAppointmentId, appointments, vehicles]);

  // Confirmed appointments
  const confirmedAppointments = useMemo(
    () => appointments.filter((a) => a.status === "confirmed" || a.id === appointmentId),
    [appointments, appointmentId],
  );

  const selectedAppointment: Appointment | null = appointmentId
    ? (appointments.find((a) => a.id === appointmentId) ?? null)
    : null;

  const resolvedCustomerId = mode === "appointment"
    ? (selectedAppointment?.ownerId ?? "")
    : walkinCustomerId;

  const resolvedVehicleId = mode === "appointment"
    ? (selectedAppointment?.vehicleId ?? "")
    : walkinVehicleId;

  const selectedCustomer: Customer | null = customers.find((c) => c.id === resolvedCustomerId) ?? null;
  const selectedVehicle: Vehicle | null = vehicles.find((v) => v.id === resolvedVehicleId) ?? null;
  const customerVehicles = vehicles.filter((v) => v.ownerId === resolvedCustomerId);

  // Mechanics
  const mechanics = useMemo(() => employees.filter((e) => e.role === "mechanic" && e.status === "active"), [employees]);

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

  const toggleMechanic = (id: string) => {
    setSelectedMechanicIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id],
    );
  };

  const toggleService = (id: string) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const selectAppointment = (id: string) => {
    setAppointmentId(id);
    const a = appointments.find((x) => x.id === id);
    if (a) {
      setServiceIds(a.serviceIds);
      if (a.notes) setIssues(a.notes);
      const v = vehicles.find((x) => x.id === a.vehicleId);
      if (v) setMileage(String(v.mileage || 25000));
    }
  };

  // Pricing calculations
  const serviceCost = useMemo(
    () =>
      services
        .filter((s) => serviceIds.includes(s.id))
        .reduce((sum, s) => sum + s.basePrice, 0),
    [services, serviceIds],
  );
  const tax = Math.round(serviceCost * 0.085 * 100) / 100;
  const total = Math.round((serviceCost + tax) * 100) / 100;

  // New Customer handler
  const handleNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    setCustomerBusy(true);
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
      toast.success(`Client ${created.name} registered`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register customer");
    } finally {
      setCustomerBusy(false);
    }
  };

  // New Vehicle handler
  const handleNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedCustomerId) {
      toast.error("Select customer account first");
      return;
    }
    setVehicleBusy(true);
    try {
      const created = await dispatch(
        addVehicle({
          ownerId: resolvedCustomerId,
          make: newVehicleMake,
          model: newVehicleModel,
          year: parseInt(newVehicleYear, 10) || new Date().getFullYear(),
          regNo: newVehicleReg.toUpperCase(),
          fuelType: newVehicleFuel,
          mileage: parseInt(newVehicleMileage, 10) || 0,
          image: "/images/cars/car-1.png",
        }),
      ).unwrap();
      setWalkinVehicleId(created.id);
      setNewVehicleOpen(false);
      setNewVehicleMake("");
      setNewVehicleModel("");
      setNewVehicleReg("");
      toast.success("Vehicle registered for customer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register vehicle");
    } finally {
      setVehicleBusy(false);
    }
  };

  const submit = async () => {
    if (!resolvedVehicleId || !resolvedCustomerId) {
      toast.error("Please select or register a vehicle and customer");
      return;
    }
    if (!issues.trim()) {
      toast.error("Please provide customer concerns or intake reason");
      return;
    }

    setSubmitting(true);
    try {
      const fuelMap: Record<string, number> = { Empty: 5, "1/4": 25, "1/2": 50, "3/4": 75, Full: 100 };

      const res = await dispatch(
        createTaskCard({
          vehicleId: resolvedVehicleId,
          customerId: resolvedCustomerId,
          appointmentId: mode === "appointment" ? appointmentId || undefined : undefined,
          issues: issues.trim(),
          priority,
          station: station.trim() || stations[0]?.name || "",
          serviceIds,
          mileage: Number(mileage.replace(/[^0-9]/g, "")) || undefined,
          fuelLevel: fuelMap[fuelLevel] ?? 50,
          keysReceived,
          accessories: accessories.trim() || undefined,
          expectedDate: expectedDate ? `${expectedDate} ${expectedTime}` : undefined,
          mechanicId: selectedMechanicIds[0] || undefined,
          mechanicIds: selectedMechanicIds,
          assignmentNotes: assignmentNotes.trim() || undefined,
        }),
      ).unwrap();

      toast.success(`Workshop Task Card #${res.id} created successfully!`);
      router.push(`/advisor/tasks/${res.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task card");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = (vehiclesStatus === "idle" || vehiclesStatus === "loading") && vehicles.length === 0;

  if (loading) {
    return <DetailLoading label="Loading workshop intake workstation..." />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Link href="/advisor" className="hover:text-foreground">
                Advisor
              </Link>
              <span>›</span>
              <Link href="/advisor/tasks" className="hover:text-foreground">
                Workshop Tasks
              </Link>
              <span>›</span>
              <span className="text-[#0052cc]">Create Task Card</span>
            </nav>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Initiate Vehicle Intake & Task Card
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0052cc] border border-blue-200">
                <Wrench className="size-3.5" />
                Service Reception
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Record physical check-in parameters, customer reported concerns, catalog services, and assign workshop bays.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-md border-border bg-white text-xs font-semibold shadow-xs hover:bg-[#f3f4f5]"
            >
              <Link href="/advisor/receive">
                <ArrowLeft className="size-3.5" />
                Reception Desk
              </Link>
            </Button>
          </div>
        </div>

        {/* 12-Column Responsive Layout */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column (7 cols): Intake Source, Vehicle, Check-in, Services */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            {/* 1. Intake Source & Customer */}
            <Card className="rounded-xl border-border bg-white shadow-xs">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle>1. Intake Source & Customer</SectionTitle>
                  <div className="flex rounded-lg border border-border bg-[#f8f9fa] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMode("appointment")}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                        mode === "appointment" ? "bg-white text-[#0052cc] shadow-xs" : "text-muted-foreground",
                      )}
                    >
                      Booked Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("walkin")}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                        mode === "walkin" ? "bg-white text-[#0052cc] shadow-xs" : "text-muted-foreground",
                      )}
                    >
                      Walk-in Intake
                    </button>
                  </div>
                </div>

                {mode === "appointment" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold">Select Confirmed Appointment</Label>
                      <select
                        value={appointmentId}
                        onChange={(e) => selectAppointment(e.target.value)}
                        className="h-10 rounded-lg border border-border bg-white px-3 text-xs outline-none focus:border-[#0052cc]"
                      >
                        <option value="">-- Choose Booked Appointment --</option>
                        {confirmedAppointments.map((a) => {
                          const v = vehicles.find((x) => x.id === a.vehicleId);
                          const c = customers.find((x) => x.id === a.ownerId);
                          return (
                            <option key={a.id} value={a.id}>
                              #{a.id} — {a.date} ({a.time}) • {c?.name ?? "Customer"} • {v ? `${v.make} ${v.model} [${v.regNo}]` : "Vehicle"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {selectedAppointment && (
                      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs">
                        <div>
                          <p className="font-bold text-[#0052cc]">
                            Booking #{selectedAppointment.id} on {selectedAppointment.date} at {selectedAppointment.time}
                          </p>
                          <p className="text-muted-foreground mt-0.5">{selectedAppointment.notes || "Standard check-in"}</p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-bold text-[#0052cc] text-[10px] uppercase">
                          Confirmed
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Select Walk-in Client</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewCustomerOpen(true)}
                        className="h-7 text-[11px] font-semibold text-[#0052cc] border-[#0052cc]/30 hover:bg-blue-50"
                      >
                        <Plus className="size-3" />
                        + New Customer
                      </Button>
                    </div>

                    <select
                      value={walkinCustomerId}
                      onChange={(e) => {
                        setWalkinCustomerId(e.target.value);
                        setWalkinVehicleId("");
                      }}
                      className="h-10 rounded-lg border border-border bg-white px-3 text-xs outline-none focus:border-[#0052cc]"
                    >
                      <option value="">-- Select Registered Client --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Vehicle Selection & Physical Inspection Checklist */}
            <Card className="rounded-xl border-border bg-white shadow-xs">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle>2. Vehicle & Physical Inspection</SectionTitle>
                  {resolvedCustomerId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewVehicleOpen(true)}
                      className="h-7 text-[11px] font-semibold text-[#0052cc] border-[#0052cc]/30 hover:bg-blue-50"
                    >
                      <Plus className="size-3" />
                      Register Vehicle
                    </Button>
                  )}
                </div>

                {mode === "walkin" && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Client Vehicle</Label>
                    <select
                      value={walkinVehicleId}
                      onChange={(e) => setWalkinVehicleId(e.target.value)}
                      disabled={!walkinCustomerId}
                      className="h-10 rounded-lg border border-border bg-white px-3 text-xs outline-none focus:border-[#0052cc] disabled:opacity-50"
                    >
                      <option value="">
                        {walkinCustomerId ? "-- Choose Customer Vehicle --" : "-- Select Customer First --"}
                      </option>
                      {customerVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.year} {v.make} {v.model} ({v.regNo})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selected Vehicle Profile */}
                {selectedVehicle ? (
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-slate-50/50 p-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <VehicleImage
                        src={selectedVehicle.image || "/images/cars/car-1.png"}
                        alt={selectedVehicle.model}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider">
                          {selectedVehicle.regNo}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {selectedVehicle.fuelType} • {selectedVehicle.transmission || "Auto"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                    Select an appointment or client account to inspect vehicle.
                  </div>
                )}

                {/* Physical Intake Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Gauge className="size-3.5 text-slate-500" />
                      Intake Mileage
                    </Label>
                    <Input
                      type="number"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="e.g. 24500"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Fuel className="size-3.5 text-slate-500" />
                      Fuel Level
                    </Label>
                    <select
                      value={fuelLevel}
                      onChange={(e) => setFuelLevel(e.target.value)}
                      className="h-9 rounded-md border border-border bg-white px-2.5 text-xs"
                    >
                      <option value="Empty">Empty (Reserve)</option>
                      <option value="1/4">1/4 Tank</option>
                      <option value="1/2">1/2 Tank</option>
                      <option value="3/4">3/4 Tank</option>
                      <option value="Full">Full Tank</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 justify-center">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <KeyRound className="size-3.5 text-slate-500" />
                      Keys Custody
                    </Label>
                    <label className="flex items-center gap-2 rounded-md border border-border bg-white px-2.5 h-9 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={keysReceived}
                        onChange={(e) => setKeysReceived(e.target.checked)}
                        className="rounded accent-[#0052cc] size-4"
                      />
                      <span>In Custody</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Personal Items / Condition Notes</Label>
                  <Input
                    value={accessories}
                    onChange={(e) => setAccessories(e.target.value)}
                    placeholder="e.g. Dashcam, toll transponder left in vehicle, scratch on rear bumper..."
                    className="h-9 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Services & Customer Concerns */}
            <Card className="rounded-xl border-border bg-white shadow-xs">
              <CardContent className="flex flex-col gap-4 p-5">
                <SectionTitle>3. Requested Services & Diagnostic Scope</SectionTitle>

                <ServicePicker
                  services={services}
                  selectedIds={serviceIds}
                  onToggle={toggleService}
                  maxHeight="max-h-72"
                  showTotal
                />

                <div className="flex flex-col gap-1.5 border-t border-border pt-4">
                  <Label className="text-xs font-semibold">Customer Concerns & Reported Symptoms *</Label>
                  <Textarea
                    value={issues}
                    onChange={(e) => setIssues(e.target.value)}
                    rows={3}
                    placeholder="Describe customer complaint, squeaks, warning lights, or requested inspection scopes..."
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (5 cols): Workshop Bay, Technicians, Summary */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
            {/* 4. Workshop Bay & Priority */}
            <Card className="rounded-xl border-border bg-white shadow-xs">
              <CardContent className="flex flex-col gap-4 p-5">
                <SectionTitle>4. Bay Allocation & Priority</SectionTitle>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Workshop Bay</Label>
                    <select
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="h-9 rounded-md border border-border bg-white px-2.5 text-xs"
                    >
                      {stations.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Service Priority</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriority(p.key)}
                          className={cn(
                            "rounded border py-1.5 text-center text-xs font-bold transition-all",
                            priority === p.key
                              ? p.color + " ring-1 ring-primary/40 font-black"
                              : "border-border text-muted-foreground hover:bg-slate-50",
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Target Delivery Date</Label>
                    <Input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Target Time</Label>
                    <Input
                      type="time"
                      value={expectedTime}
                      onChange={(e) => setExpectedTime(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Lead Technician Assignment */}
            <Card className="rounded-xl border-blue-200 bg-white shadow-xs">
              <div className="border-b border-border bg-blue-50/70 px-5 py-3 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[#0052cc]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0052cc]">
                    Assign Technician(s)
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#0052cc]">
                  {selectedMechanicIds.length} chosen
                </span>
              </div>

              <CardContent className="flex flex-col gap-3.5 p-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={mechanicSearch}
                    onChange={(e) => setMechanicSearch(e.target.value)}
                    placeholder="Filter certified technicians..."
                    className="h-8 w-full rounded-md border border-border bg-[#f8f9fa] pl-8 pr-2 text-xs outline-none focus:border-[#0052cc] focus:bg-white"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-1 divide-y divide-slate-100 bg-[#f8f9fa]">
                  {filteredMechanics.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No technicians available matching search.
                    </div>
                  ) : (
                    filteredMechanics.map((m) => {
                      const isSelected = selectedMechanicIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMechanic(m.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition-colors",
                            isSelected ? "bg-blue-50 border border-[#0052cc]" : "hover:bg-white",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white",
                                isSelected ? "bg-[#0052cc]" : "bg-slate-500",
                              )}
                            >
                              {m.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{m.name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {m.specialization || "General Mechanic"}
                              </span>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "size-4 rounded border flex items-center justify-center text-white",
                              isSelected ? "bg-[#0052cc] border-[#0052cc]" : "border-slate-300 bg-white",
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Technician Instructions / Bay Notes</Label>
                  <Input
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="e.g. Inspect front left rotor first before pads..."
                    className="h-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 6. Sticky Intake Summary Card */}
            <Card className="rounded-xl border-border bg-white shadow-xs">
              <CardContent className="flex flex-col gap-3.5 p-5">
                <SectionTitle>6. Task Card Summary</SectionTitle>

                <div className="flex flex-col gap-2 rounded-lg border border-border bg-[#f8f9fa] p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-bold text-foreground">{selectedCustomer?.name || "Unselected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-bold text-foreground">
                      {selectedVehicle
                        ? `${selectedVehicle.year} ${selectedVehicle.make} [${selectedVehicle.regNo}]`
                        : "Unselected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Odometer:</span>
                    <span className="font-semibold text-foreground">{mileage ? `${mileage} mi` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Station:</span>
                    <span className="font-semibold text-foreground">{station}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Technicians:</span>
                    <span className="font-semibold text-foreground">
                      {selectedMechanicIds.length > 0 ? `${selectedMechanicIds.length} assigned` : "Awaiting Bay"}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Labor & Catalog:</span>
                    <span>${serviceCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Tax (8.5%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1.5 mt-0.5">
                    <span>Initial Estimate:</span>
                    <span className="text-base text-[#0052cc]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="mt-2 w-full gap-2 rounded-xl bg-[#0052cc] text-xs font-bold text-white shadow-xs hover:bg-[#0047b3] disabled:opacity-50 h-11"
                >
                  <Sparkles className="size-4" />
                  {submitting ? "Dispatching..." : "Dispatch Task Card & Start Service"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleNewCustomer}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register Walk-in Client</DialogTitle>
              <DialogDescription className="text-xs">
                Enter contact details to create a verified vehicle owner profile.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Michael Scott"
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Phone Number *</Label>
                <Input
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  placeholder="e.g. +1 555-0199"
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Email Address (Optional)</Label>
                <Input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. michael@example.com"
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setNewCustomerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={customerBusy} className="bg-[#0052cc] text-white hover:bg-[#0047b3]">
                {customerBusy ? "Saving..." : "Save Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Vehicle Modal */}
      <Dialog open={newVehicleOpen} onOpenChange={setNewVehicleOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <form onSubmit={handleNewVehicle}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register Vehicle to Client</DialogTitle>
              <DialogDescription className="text-xs">
                Add an automobile profile to client {selectedCustomer?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Make *</Label>
                  <Input
                    value={newVehicleMake}
                    onChange={(e) => setNewVehicleMake(e.target.value)}
                    required
                    placeholder="e.g. Ford, Toyota"
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Model *</Label>
                  <Input
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    required
                    placeholder="e.g. F-150, Camry"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Year *</Label>
                  <Input
                    type="number"
                    value={newVehicleYear}
                    onChange={(e) => setNewVehicleYear(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">License Plate *</Label>
                  <Input
                    value={newVehicleReg}
                    onChange={(e) => setNewVehicleReg(e.target.value)}
                    required
                    placeholder="e.g. A9C-1234"
                    className="h-9 text-xs uppercase"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Fuel Type</Label>
                  <select
                    value={newVehicleFuel}
                    onChange={(e) =>
                      setNewVehicleFuel(e.target.value as "gasoline" | "diesel" | "hybrid" | "electric")
                    }
                    className="h-9 rounded-md border border-border bg-white px-2.5 text-xs"
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Mileage</Label>
                  <Input
                    type="number"
                    value={newVehicleMileage}
                    onChange={(e) => setNewVehicleMileage(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setNewVehicleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={vehicleBusy} className="bg-[#0052cc] text-white hover:bg-[#0047b3]">
                {vehicleBusy ? "Saving..." : "Save Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CreateTaskPage() {
  return (
    <Suspense fallback={<DetailLoading label="Loading task creator..." />}>
      <CreateTaskContent />
    </Suspense>
  );
}
