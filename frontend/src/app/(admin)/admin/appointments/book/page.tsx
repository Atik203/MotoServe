"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addVehicle, fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchTasks, createTaskCard } from "@/store/slices/tasksSlice";
import { addAppointment } from "@/store/slices/appointmentsSlice";
import { AddVehicleCard, VehicleCard } from "@/components/roles/owner/VehicleCard";
import { MonthCalendar } from "@/components/roles/owner/MonthCalendar";
import { ServicePicker } from "@/components/roles/shared/ServicePicker";
import { Button } from "@/components/ui/button";
import { DetailLoading } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const STATIONS = [
  "Main Bay / Station 01",
  "Main Bay / Station 02",
  "Main Bay / Station 03",
  "Station 04",
  "Station 05",
  "Quick Lube Bay",
  "Diagnostics Center",
];

const PRIORITIES = [
  { key: "low", label: "Low", color: "border-slate-300 text-slate-600 bg-slate-50" },
  { key: "medium", label: "Medium", color: "border-blue-300 text-blue-700 bg-blue-50" },
  { key: "high", label: "High", color: "border-amber-300 text-amber-700 bg-amber-50" },
  { key: "urgent", label: "Urgent", color: "border-rose-300 text-rose-700 bg-rose-50" },
] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold tracking-[0.35px] text-foreground uppercase">{children}</h2>
  );
}

export default function AdminBookAppointmentPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Store selectors
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const vehiclesStatus = useAppSelector((s) => s.vehicles.status);
  const services = useAppSelector((s) => s.services.items);
  const customers = useAppSelector((s) => s.customers.items);
  const employees = useAppSelector((s) => s.employees.items);
  const tasks = useAppSelector((s) => s.tasks.items);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  // Admin Direct Controls
  const [bookingStatus, setBookingStatus] = useState<"confirmed" | "pending">("confirmed");
  const [selectedStation, setSelectedStation] = useState(STATIONS[0]);
  const [selectedMechanicIds, setSelectedMechanicIds] = useState<string[]>([]);
  const [mechanicSearch, setMechanicSearch] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [createDirectJob, setCreateDirectJob] = useState(true);

  // Quick Register Vehicle Modal
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [newVehicleMake, setNewVehicleMake] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehicleYear, setNewVehicleYear] = useState("2023");
  const [newVehicleReg, setNewVehicleReg] = useState("");
  const [newVehicleFuel, setNewVehicleFuel] = useState<"gasoline" | "diesel" | "hybrid" | "electric">("gasoline");
  const [newVehicleMileage, setNewVehicleMileage] = useState("25000");
  const [addingVehicleBusy, setAddingVehicleBusy] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchVehicles());
    dispatch(fetchServices());
    dispatch(fetchEmployees());
    dispatch(fetchTasks());
  }, [dispatch]);

  // Available mechanics (active only)
  const mechanics = useMemo(
    () => employees.filter((e) => e.role === "mechanic" && e.status === "active"),
    [employees],
  );

  // Filtered mechanics for search
  const filteredMechanics = useMemo(() => {
    const q = mechanicSearch.trim().toLowerCase();
    if (!q) return mechanics;
    return mechanics.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.station && m.station.toLowerCase().includes(q)) ||
        (m.specialization && m.specialization.toLowerCase().includes(q)),
    );
  }, [mechanics, mechanicSearch]);

  // Customer resolution
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.nid && c.nid.toLowerCase().includes(q)),
    );
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  // Vehicles belonging to the chosen customer
  const customerVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    return vehicles.filter((v) => v.ownerId === selectedCustomerId);
  }, [vehicles, selectedCustomerId]);

  const effectiveVehicleId =
    selectedVehicleId || (customerVehicles.length === 1 ? customerVehicles[0].id : "");

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === effectiveVehicleId) ?? null,
    [vehicles, effectiveVehicleId],
  );

  // Pricing calculations
  const serviceCost = useMemo(
    () =>
      services
        .filter((s) => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.basePrice, 0),
    [services, selectedServices],
  );
  const tax = Math.round(serviceCost * 0.085 * 100) / 100;
  const total = Math.round((serviceCost + tax) * 100) / 100;

  const selectedServiceNames = useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)).map((s) => s.name),
    [services, selectedServices],
  );

  const summaryDate = useMemo(() => {
    if (!selectedDate) return "Select date";
    return `${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${selectedTime}`;
  }, [selectedDate, selectedTime]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleMechanic = (id: string) => {
    setSelectedMechanicIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleQuickAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }
    if (!newVehicleMake || !newVehicleModel || !newVehicleReg) {
      toast.error("Make, Model and Registration Number are required");
      return;
    }
    setAddingVehicleBusy(true);
    try {
      const created = await dispatch(
        addVehicle({
          ownerId: selectedCustomerId,
          make: newVehicleMake,
          model: newVehicleModel,
          year: parseInt(newVehicleYear, 10) || new Date().getFullYear(),
          regNo: newVehicleReg.toUpperCase(),
          fuelType: newVehicleFuel,
          mileage: parseInt(newVehicleMileage, 10) || 0,
          image: "/images/cars/car-1.png",
        }),
      ).unwrap();
      toast.success("Vehicle registered successfully");
      setSelectedVehicleId(created.id);
      setNewVehicleOpen(false);
      setNewVehicleMake("");
      setNewVehicleModel("");
      setNewVehicleReg("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to register vehicle");
    } finally {
      setAddingVehicleBusy(false);
    }
  };

  const handleBook = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!effectiveVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }
    if (selectedServices.length === 0 && !customRequest.trim()) {
      toast.error("Please choose at least one service or add custom instructions");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select an appointment date");
      return;
    }

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    // Compile mechanic notes
    const assignedMechanicNames = employees
      .filter((e) => selectedMechanicIds.includes(e.id))
      .map((e) => e.name);
    const mechanicNotes =
      assignedMechanicNames.length > 0
        ? `[Assigned Mechanics: ${assignedMechanicNames.join(", ")} | Bay: ${selectedStation}]`
        : "";
    const combinedNotes = [customRequest.trim(), mechanicNotes].filter(Boolean).join(" ");

    setSubmitting(true);
    try {
      // 1. Create Appointment
      const appt = await dispatch(
        addAppointment({
          ownerId: selectedCustomerId,
          vehicleId: effectiveVehicleId,
          serviceIds: selectedServices,
          date: dateStr,
          time: selectedTime,
          notes: combinedNotes || undefined,
          status: bookingStatus,
        }),
      ).unwrap();

      // 2. If Admin checked direct job card creation and status is confirmed:
      if (createDirectJob && bookingStatus === "confirmed") {
        try {
          const taskRes = await dispatch(
            createTaskCard({
              vehicleId: effectiveVehicleId,
              customerId: selectedCustomerId,
              appointmentId: appt.id,
              serviceIds: selectedServices,
              station: selectedStation,
              priority: taskPriority,
              mileage: selectedVehicle?.mileage,
              issues: customRequest.trim() || selectedServiceNames.join(" • ") || "Scheduled Service",
              mechanicId: selectedMechanicIds[0],
              mechanicIds: selectedMechanicIds,
              expectedDate: `${dateStr} ${selectedTime}`,
            }),
          ).unwrap();

          toast.success("Appointment confirmed & active Job Card initiated!");
          router.push(`/advisor/tasks/${taskRes.id}`);
          return;
        } catch {
          // If task creation had a minor issue, appointment was still booked
          toast.warning("Appointment booked, but auto-job initiation encountered an issue");
        }
      } else {
        toast.success(`Appointment scheduled successfully as ${bookingStatus.toUpperCase()}`);
      }

      router.push("/admin/appointments");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading =
    (vehiclesStatus === "idle" || vehiclesStatus === "loading") &&
    vehicles.length === 0 &&
    services.length === 0;

  if (isLoading) {
    return <DetailLoading label="Loading appointment workspace..." />;
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
          <div>
            <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
              <span>›</span>
              <Link href="/admin/appointments" className="hover:text-foreground">
                Appointments
              </Link>
              <span>›</span>
              <span className="text-[#004492]">Book & Schedule</span>
            </nav>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Schedule Workshop Appointment
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-xs font-bold text-[#004492]">
                <ShieldCheck className="size-3.5" />
                Admin Authority Mode
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Directly confirm appointments, assign certified mechanics, allocate workshop bays, or initiate immediate repair intakes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-md border-[#e2e8f0] bg-white text-xs font-semibold shadow-xs hover:bg-[#f3f4f5]"
            >
              <Link href="/admin/appointments">
                <ArrowLeft className="size-3.5" />
                Back to Appointments
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch(fetchCustomers());
                dispatch(fetchVehicles());
                dispatch(fetchServices());
                dispatch(fetchEmployees());
                toast.success("Catalog refreshed");
              }}
              className="gap-1.5 rounded-md border-[#e2e8f0] bg-white text-xs font-semibold shadow-xs hover:bg-[#f3f4f5]"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* 12-Column Responsive Form Layout */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column (Customer, Vehicle, Services) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            {/* 1. Customer Selection */}
            <Card className="rounded-xl border-[#e2e8f0] bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle>1. Customer Account</SectionTitle>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId("");
                        setSelectedVehicleId("");
                      }}
                      className="text-xs font-semibold text-[#004492] hover:underline"
                    >
                      Change Customer
                    </button>
                  )}
                </div>

                {!selectedCustomer ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search customer by name, phone, email, or NID..."
                        className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-[#004492] focus:bg-white"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0]">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No registered customer found matching &ldquo;{customerSearch}&rdquo;.
                        </div>
                      ) : (
                        filteredCustomers.map((c) => {
                          const cVehicles = vehicles.filter((v) => v.ownerId === c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setSelectedVehicleId("");
                              }}
                              className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[#eff6ff]"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold text-[#004492]">
                                  {c.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-foreground">{c.name}</span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {c.phone || c.email || "No direct contact"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#f3f4f5] px-2 py-0.5 text-[11px] font-semibold text-[#424753]">
                                  {cVehicles.length} {cVehicles.length === 1 ? "Vehicle" : "Vehicles"}
                                </span>
                                <span className="text-xs font-semibold text-[#004492]">Select →</span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-sm">
                        {selectedCustomer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{selectedCustomer.name}</span>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-[#424753]">
                          {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                          {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                          {selectedCustomer.nid && <span>🆔 {selectedCustomer.nid}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase">
                      Verified Owner
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Vehicle Selection (Active for Selected Customer) */}
            <Card className="rounded-xl border-[#e2e8f0] bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <SectionTitle>2. Select Vehicle</SectionTitle>
                  {selectedCustomerId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewVehicleOpen(true)}
                      className="h-7 gap-1 text-[11px] font-semibold text-[#004492] border-[#004492]/30 hover:bg-[#eff6ff]"
                    >
                      <Plus className="size-3" />
                      Register Vehicle
                    </Button>
                  )}
                </div>

                {!selectedCustomerId ? (
                  <div className="rounded-lg border border-dashed border-[#e2e8f0] p-6 text-center text-xs text-muted-foreground">
                    Please select a customer account first to view and select registered vehicles.
                  </div>
                ) : customerVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#e2e8f0] p-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      No vehicles registered yet for {selectedCustomer?.name}.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setNewVehicleOpen(true)}
                      className="gap-1.5 bg-[#004492] text-xs font-semibold text-white"
                    >
                      <Plus className="size-3.5" />
                      Register New Vehicle
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {customerVehicles.map((v) => (
                      <VehicleCard
                        key={v.id}
                        vehicle={v}
                        selected={v.id === effectiveVehicleId}
                        onSelect={() => setSelectedVehicleId(v.id)}
                      />
                    ))}
                    <AddVehicleCard onClick={() => setNewVehicleOpen(true)} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Choose Services (Reusing ServicePicker) */}
            <Card className="rounded-xl border-[#e2e8f0] bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-5">
                <SectionTitle>3. Choose Services</SectionTitle>

                <ServicePicker
                  services={services}
                  selectedIds={selectedServices}
                  onToggle={toggleService}
                  maxHeight="max-h-80"
                  showTotal
                />

                {/* Custom Service Request & Reported Notes */}
                {customOpen ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[#004492]/40 bg-[#eff6ff] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-[0.35px] text-foreground uppercase">
                        Custom Service Request & Workshop Notes
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomOpen(false);
                          setCustomRequest("");
                        }}
                        className="text-xs font-semibold text-[#ba1a1a] hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <Textarea
                      value={customRequest}
                      onChange={(e) => setCustomRequest(e.target.value)}
                      placeholder="Describe custom issues, reported customer noises, specific parts or inspection notes..."
                      className="min-h-[90px] rounded-lg text-xs"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCustomOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c2c6d5] bg-[#f8f9fa] py-3 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#004492]/50 hover:text-[#004492]"
                  >
                    <Plus className="size-4" />
                    Add Custom Request or Customer Notes
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Schedule, Admin Powers, Summary) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-6">
            {/* 4. Workshop Schedule */}
            <Card className="rounded-xl border-[#e2e8f0] bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-5">
                <SectionTitle>4. Workshop Schedule</SectionTitle>
                <MonthCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />

                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#e2e8f0]">
                  <Label className="text-xs font-semibold text-foreground">Time Slot</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                          selectedTime === t
                            ? "border-[#004492] bg-[#eff6ff] text-[#004492] font-semibold"
                            : "border-[#e2e8f0] text-muted-foreground hover:border-[#004492]/50",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Admin Authorization & Mechanic Assignment (Admin Special Authority) */}
            <Card className="rounded-xl border-[#004492]/30 bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="border-b border-[#e2e8f0] bg-[#eff6ff]/70 px-5 py-3 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-[#004492]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#004492]">
                    Admin Authority & Dispatch
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#004492] bg-white px-2 py-0.5 rounded border border-[#004492]/20">
                  Full Authority
                </span>
              </div>

              <CardContent className="flex flex-col gap-4 p-5">
                {/* Direct Confirmation Toggle */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Direct Booking Status
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingStatus("confirmed")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-bold transition-colors",
                        bookingStatus === "confirmed"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs"
                          : "border-[#e2e8f0] text-muted-foreground hover:border-emerald-500/40",
                      )}
                    >
                      <Check className="size-3.5" />
                      Directly Confirmed
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingStatus("pending")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-bold transition-colors",
                        bookingStatus === "pending"
                          ? "border-amber-500 bg-amber-50 text-amber-700 shadow-xs"
                          : "border-[#e2e8f0] text-muted-foreground hover:border-amber-500/40",
                      )}
                    >
                      <Clock className="size-3.5" />
                      Pending Approval
                    </button>
                  </div>
                </div>

                {/* Station Bay Allocation */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">Workshop Bay / Station</Label>
                  <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-xs text-foreground outline-none focus:border-[#004492]"
                  >
                    {STATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mechanic Assignment */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#004492]" />
                      Assign Mechanic(s)
                    </Label>
                    <span className="text-[11px] font-semibold text-[#004492]">
                      {selectedMechanicIds.length} assigned
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={mechanicSearch}
                      onChange={(e) => setMechanicSearch(e.target.value)}
                      placeholder="Filter mechanics by name or bay..."
                      className="h-8 w-full rounded-md border border-[#e2e8f0] bg-[#f8f9fa] pl-8 pr-2 text-xs text-foreground outline-none focus:border-[#004492] focus:bg-white"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto rounded-lg border border-[#e2e8f0] p-1.5 divide-y divide-[#f1f5f9] bg-[#f8f9fa]">
                    {filteredMechanics.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No active mechanics available.
                      </div>
                    ) : (
                      filteredMechanics.map((m) => {
                        const isSelected = selectedMechanicIds.includes(m.id);
                        const activeLoad = tasks.filter(
                          (t) =>
                            (t.mechanicIds?.includes(m.id) || t.mechanicId === m.id) &&
                            t.status !== "completed",
                        ).length;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMechanic(m.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md p-2 text-left text-xs transition-colors",
                              isSelected
                                ? "bg-[#eff6ff] border border-[#004492]"
                                : "hover:bg-white",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white",
                                  isSelected ? "bg-[#004492]" : "bg-[#64748b]",
                                )}
                              >
                                {m.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground leading-tight">{m.name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {m.specialization || m.station || "General Mechanic"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                  activeLoad === 0
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-800",
                                )}
                              >
                                {activeLoad === 0 ? "Idle" : `${activeLoad} active`}
                              </span>
                              <div
                                className={cn(
                                  "size-4 rounded border flex items-center justify-center text-white",
                                  isSelected
                                    ? "bg-[#004492] border-[#004492]"
                                    : "border-slate-300 bg-white",
                                )}
                              >
                                {isSelected && <Check className="size-3" />}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-foreground">Service Priority</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setTaskPriority(p.key)}
                        className={cn(
                          "rounded border py-1.5 text-center text-xs font-bold transition-colors",
                          taskPriority === p.key
                            ? p.color + " shadow-xs font-black ring-1 ring-primary/40"
                            : "border-[#e2e8f0] text-muted-foreground hover:bg-slate-50",
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Job Card Creation Checkbox */}
                <label className="flex items-start gap-2 rounded-lg border border-[#004492]/20 bg-[#eff6ff]/50 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createDirectJob}
                    onChange={(e) => setCreateDirectJob(e.target.checked)}
                    className="mt-0.5 size-4 rounded accent-[#004492]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      Directly Create Job Card & Start Intake
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                      Creates the confirmed appointment AND immediately dispatches a workshop Job Card to the assigned mechanic(s).
                    </span>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* 6. Executive Booking Summary */}
            <Card className="rounded-xl border-[#e2e8f0] bg-white shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-3.5 p-5">
                <SectionTitle>5. Executive Summary</SectionTitle>

                <div className="flex flex-col gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-bold text-foreground">{selectedCustomer?.name || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-bold text-foreground">
                      {selectedVehicle
                        ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} [${selectedVehicle.regNo}]`
                        : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-bold text-[#004492]">{summaryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workshop Bay:</span>
                    <span className="font-semibold text-foreground">{selectedStation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Staff:</span>
                    <span className="font-semibold text-foreground">
                      {selectedMechanicIds.length === 0
                        ? "Unassigned (Queue)"
                        : `${selectedMechanicIds.length} mechanic(s)`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#e2e8f0]">
                    <span className="text-muted-foreground">Status:</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        bookingStatus === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {bookingStatus}
                    </span>
                  </div>
                </div>

                {/* Services Breakdown */}
                {selectedServices.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-[#e2e8f0] pt-2 text-xs">
                    <span className="font-semibold text-muted-foreground uppercase text-[10px]">
                      Selected Packages ({selectedServices.length})
                    </span>
                    {services
                      .filter((s) => selectedServices.includes(s.id))
                      .map((s) => (
                        <div key={s.id} className="flex justify-between py-0.5">
                          <span className="text-foreground truncate max-w-[220px]">{s.name}</span>
                          <span className="font-semibold text-foreground">${s.basePrice.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Price Totals */}
                <div className="flex flex-col gap-1 border-t border-[#e2e8f0] pt-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Labor & Services</span>
                    <span>${serviceCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (8.5%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#e2e8f0] pt-2 text-sm font-black text-foreground">
                    <span>Estimated Total</span>
                    <span className="text-base text-[#004492]">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    disabled={submitting || !selectedCustomerId || !effectiveVehicleId}
                    onClick={() => void handleBook()}
                    className="h-11 w-full gap-2 rounded-lg bg-[#004492] text-xs font-bold text-white shadow-sm hover:bg-[#004492]/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      "Scheduling Appointment..."
                    ) : createDirectJob && bookingStatus === "confirmed" ? (
                      <>
                        <Wrench className="size-4" />
                        Confirm & Dispatch Job Card
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="size-4" />
                        Confirm & Schedule Appointment
                      </>
                    )}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-9 w-full rounded-lg border-[#e2e8f0] text-xs font-semibold text-muted-foreground hover:bg-[#f3f4f5]"
                  >
                    <Link href="/admin/appointments">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Quick Add Vehicle Modal */}
      <Dialog open={newVehicleOpen} onOpenChange={setNewVehicleOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Register Vehicle for Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Quickly add vehicle credentials for {selectedCustomer?.name || "this customer"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAddVehicle} className="flex flex-col gap-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-foreground">Make *</Label>
                <Input
                  value={newVehicleMake}
                  onChange={(e) => setNewVehicleMake(e.target.value)}
                  placeholder="e.g. Ford, Toyota"
                  required
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-foreground">Model *</Label>
                <Input
                  value={newVehicleModel}
                  onChange={(e) => setNewVehicleModel(e.target.value)}
                  placeholder="e.g. F-150, Camry"
                  required
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-foreground">Year</Label>
                <Input
                  type="number"
                  value={newVehicleYear}
                  onChange={(e) => setNewVehicleYear(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-foreground">Registration No *</Label>
                <Input
                  value={newVehicleReg}
                  onChange={(e) => setNewVehicleReg(e.target.value)}
                  placeholder="e.g. ABC-1234"
                  required
                  className="h-8 text-xs uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-foreground">Fuel Type</Label>
                <select
                  value={newVehicleFuel}
                  onChange={(e) =>
                    setNewVehicleFuel(e.target.value as "gasoline" | "diesel" | "hybrid" | "electric")
                  }
                  className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs outline-none"
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-semibold text-foreground">Mileage (mi)</Label>
                <Input
                  type="number"
                  value={newVehicleMileage}
                  onChange={(e) => setNewVehicleMileage(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewVehicleOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addingVehicleBusy}
                className="bg-[#004492] text-xs text-white"
              >
                {addingVehicleBusy ? "Adding..." : "Register Vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
