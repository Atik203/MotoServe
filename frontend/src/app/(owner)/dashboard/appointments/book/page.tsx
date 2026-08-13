"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HelpCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles, selectVehicle } from "@/store/slices/vehiclesSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { addAppointment } from "@/store/slices/appointmentsSlice";
import { AddVehicleCard, VehicleCard } from "@/components/roles/owner/VehicleCard";
import { ServiceCard } from "@/components/roles/owner/ServiceCard";
import { MonthCalendar } from "@/components/roles/owner/MonthCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { ServiceCategory } from "@/types";

const FILTERS: { label: string; value: ServiceCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Repairs", value: "repairs" },
  { label: "Inspections", value: "inspections" },
];

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

const TIMELINE_STEPS = ["Pending", "Confirmed", "In Progress", "Quality Check", "Ready", "Service Completed"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold tracking-[0.35px] text-foreground uppercase">{children}</h2>
  );
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const vehicles = useAppSelector((s) => s.vehicles.items);
  const services = useAppSelector((s) => s.services.items);
  const selectedVehicleId = useAppSelector((s) => s.vehicles.selectedVehicleId);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [filter, setFilter] = useState<ServiceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [customRequest, setCustomRequest] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  const [branchOn, setBranchOn] = useState(true);
  const [advisorOn, setAdvisorOn] = useState(true);
  const [pickupOn, setPickupOn] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchServices());
  }, [dispatch]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchFilter = filter === "all" || s.category === filter;
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [services, filter, search]);

  const serviceCost = useMemo(
    () =>
      services
        .filter((s) => selectedServices.includes(s.id))
        .reduce((sum, s) => sum + s.basePrice, 0),
    [services, selectedServices],
  );
  const tax = Math.round(serviceCost * 0.08 * 100) / 100;
  const total = serviceCost + tax;

  const selectedServiceNames = useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)).map((s) => s.name),
    [services, selectedServices],
  );

  const summaryDate = useMemo(() => {
    if (!selectedDate) return "Select a date";
    const time = selectedTime;
    return `${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${time}`;
  }, [selectedDate, selectedTime]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleBook = async () => {
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Please choose at least one service");
      return;
    }
    if (!selectedDate) {
      toast.error("Please pick a date");
      return;
    }
    try {
      await dispatch(
        addAppointment({
          vehicleId: selectedVehicleId,
          serviceIds: selectedServices,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          notes: customRequest.trim() || undefined,
        }),
      ).unwrap();
      toast.success("Appointment booked successfully");
      router.push("/dashboard/appointments/confirmation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    }
  };

  const handleAddVehicle = () => {
    toast.info("Register a new vehicle from My Vehicles");
    router.push("/dashboard/vehicles");
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Dashboard</span>
            <span className="font-medium text-muted-foreground">›</span>
            <span className="font-semibold text-foreground">Book Appointment</span>
          </nav>
          <Button variant="outline" size="sm" className="h-[38px] gap-2 rounded-md px-[17px] text-sm font-medium">
            <HelpCircle className="size-3.5" />
            Appointment Help
          </Button>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-7 flex flex-col gap-6">
            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-[21px]">
                <SectionTitle>Select Vehicle</SectionTitle>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {vehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      selected={v.id === selectedVehicleId}
                      onSelect={() => dispatch(selectVehicle(v.id))}
                    />
                  ))}
                  <AddVehicleCard onClick={handleAddVehicle} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-[21px]">
                <SectionTitle>Choose Services</SectionTitle>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search services..."
                    className="h-[38px] rounded-lg pl-[37px]"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilter(f.value)}
                      className={cn(
                        "rounded-full px-[13px] py-[7px] text-xs font-medium transition-colors",
                        filter === f.value
                          ? "bg-primary-soft text-primary ring-1 ring-primary"
                          : "border border-input bg-white text-[#4b5563] hover:border-primary/50",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                  {filteredServices.map((s) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      selected={selectedServices.includes(s.id)}
                      onToggle={() => toggleService(s.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-[21px]">
                <SectionTitle>Custom Service Request</SectionTitle>
                <Input
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="Enter other service or issue..."
                  className="h-[38px] rounded-lg"
                />
              </CardContent>
            </Card>
          </div>

          <div className="col-span-5 flex flex-col gap-6 lg:sticky lg:top-22">
            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-[21px]">
                <SectionTitle>Schedule</SectionTitle>
                <MonthCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "rounded-lg border px-2 py-[7px] text-xs font-medium transition-colors",
                        selectedTime === t
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-3 p-[21px]">
                <SectionTitle>Estimated Cost</SectionTitle>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Inspection Fee:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Cost:</span>
                    <span>${serviceCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Estimated Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-[21px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Workshop Branch</span>
                  <Switch checked={branchOn} onCheckedChange={setBranchOn} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Service Advisor</span>
                  <Switch checked={advisorOn} onCheckedChange={setAdvisorOn} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Vehicle Pickup</span>
                  <Switch checked={pickupOn} onCheckedChange={setPickupOn} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-2.5 p-[21px]">
                <SectionTitle>Booking Summary</SectionTitle>
                <div className="text-sm">
                  <span className="text-muted-foreground">Services: </span>
                  <span className="font-medium text-foreground">
                    {selectedServiceNames.length > 0 ? selectedServiceNames.join(", ") : "None selected"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Date &amp; Time: </span>
                  <span className="font-medium text-foreground">{summaryDate}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Branch: </span>
                  <span className="font-medium text-foreground">Main Street</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Advisor: </span>
                  <span className="font-medium text-foreground">Sarah Jenkins</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
              <CardContent className="flex flex-col gap-4 p-[21px]">
                <SectionTitle>Workflow Timeline</SectionTitle>
                <div className="flex items-center">
                  {TIMELINE_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex size-3.5 items-center justify-center rounded-full border-2",
                            i === 0 ? "border-primary bg-primary" : "border-border bg-white",
                          )}
                        >
                          {i === 0 && <span className="size-1 rounded-full bg-white" />}
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 text-[10px] whitespace-nowrap",
                            i === 0 ? "font-semibold text-primary" : "text-muted-foreground",
                          )}
                        >
                          {step}
                        </span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={cn("mx-1.5 h-0.5 flex-1", i === 0 ? "bg-primary" : "bg-border")} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleBook} className="rounded-lg">
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
