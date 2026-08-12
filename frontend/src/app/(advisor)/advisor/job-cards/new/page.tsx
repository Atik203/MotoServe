"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, ChevronDown, Clock, History, Mail, Phone, Plus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createJobCard } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";

const priorities = [
  { key: "low", label: "Low", active: "border-[#0052cc] bg-primary/10 text-primary" },
  { key: "medium", label: "Medium", active: "border-[#ffc107] bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
  { key: "high", label: "High", active: "border-[#0052cc] bg-primary/10 text-primary" },
] as const;

const inputBase =
  "h-10 w-full rounded border border-[#e2e8f0] bg-[#f8f9fa] px-3 text-sm text-[#191c1d] placeholder:text-[#9ca3af] outline-none";
const selectBase = cn(inputBase, "appearance-none pr-8");

export default function CreateJobCardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [issues, setIssues] = useState("");
  const [station, setStation] = useState("Main Bay / Station 04");
  const [priority, setPriority] = useState<(typeof priorities)[number]["key"]>("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const customerVehicles = vehicles.filter((v) => v.ownerId === customerId);
  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;

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
    setSubmitting(true);
    try {
      const res = await dispatch(
        createJobCard({ vehicleId, customerId, issues: issues.trim(), priority, station }),
      ).unwrap();
      toast.success(`Job card ${res.id} created`);
      router.push("/advisor");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job card");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-[11px] text-muted-foreground">Dashboard › Work Orders › Create Job Card</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Create Job Card</h1>
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
                  <Image
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
                className="flex w-full items-center justify-center gap-2 rounded border border-[#727784] py-2.5 text-xs font-semibold text-primary"
              >
                <User className="size-3.5" />
                View Customer Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded border border-[#727784] py-2.5 text-xs font-semibold text-primary"
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
                />
              </div>
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Service Advisor</Label>
                <Input value="Assigned automatically" readOnly className={cn(inputBase, "bg-[#f3f4f5] text-[#6b7280]")} />
              </div>
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Expected Completion Date
                </Label>
                <div className="relative">
                  <Input placeholder="mm/dd/yyyy" className={cn(inputBase, "bg-[#f3f4f5]")} />
                  <CalendarDays className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Estimated Completion Time
                </Label>
                <div className="relative">
                  <Input placeholder="--:--:--" className={cn(inputBase, "bg-[#f3f4f5]")} />
                  <Clock className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
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
                onClick={() => router.push("/advisor")}
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
                {submitting ? "Creating..." : "Create Job Card"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
