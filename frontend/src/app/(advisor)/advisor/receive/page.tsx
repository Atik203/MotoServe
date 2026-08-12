"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  Gauge,
  Mail,
  Phone,
  Plus,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs, createJobCard } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { cn } from "@/lib/utils";
import type { Customer, JobCard, Vehicle } from "@/types";

const sectionTitle = "text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]";
const fieldLabel = "text-xs font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "w-full rounded border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-[9px] text-sm text-[#191c1d] placeholder:text-[#9ca3af] outline-none";
const card = "flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const outlineBtn =
  "rounded-lg border border-[#e5e7eb] bg-white px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const primaryBtn =
  "flex items-center gap-2 rounded-lg bg-primary px-4 py-[9px] text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]";

const priorities = ["low", "medium", "high"] as const;

export default function ReceiveVehiclePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);
  const [keysReceived, setKeysReceived] = useState(true);
  const [priority, setPriority] = useState<(typeof priorities)[number]>("medium");
  const [problems, setProblems] = useState("Squeaking noise from front left wheel when turning.");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const job: JobCard | null = jobs.find((j) => j.id === "JC-1045") ?? jobs[0] ?? null;
  const vehicle: Vehicle | null = vehicles.find((v) => v.id === job?.vehicleId) ?? null;
  const customer: Customer | null = customers.find((c) => c.id === job?.customerId) ?? null;

  const createCard = async () => {
    if (!job) {
      toast.error("No vehicle intake loaded — open a job card first");
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(
        createJobCard({
          vehicleId: job.vehicleId,
          customerId: job.customerId,
          issues: problems.trim(),
          priority,
          station: "Main Bay / Station 04",
        }),
      ).unwrap();
      toast.success("Job card created");
      router.push("/advisor/job-cards");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job card");
    } finally {
      setSubmitting(false);
    }
  };

  const initials =
    customer?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) ?? "JD";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-[#191c1d]">Receive Vehicle</h1>
            <p className="text-sm text-[#64748b]">Create Job Card #{job?.id ?? "JC-1045"}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className={outlineBtn}>
              Save Draft
            </button>
            <button type="button" onClick={() => void createCard()} disabled={submitting} className={primaryBtn}>
              Create Job Card
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-5 flex flex-col gap-6">
            <section className={card}>
              <div className="relative h-24 w-32">
                <Image
                  src={vehicle?.image ?? "/images/cars/ford-f150.png"}
                  alt={`${vehicle?.make ?? "Ford"} ${vehicle?.model ?? "F-150"}`}
                  width={128}
                  height={96}
                  className="h-full w-full rounded object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-[rgba(46,49,50,0.8)] px-8 py-2 text-[10px] font-semibold tracking-[0.5px] text-[#f0f1f2]">
                  {vehicle?.regNo ?? "A9C-1234"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-semibold text-[#191c1d]">
                  {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "2023 Ford F-150"}
                </h2>
                <span className="rounded-xl bg-[rgba(0,82,204,0.1)] px-2.5 py-0.75 text-xs font-medium whitespace-nowrap text-primary">
                  XLT Fleet
                </span>
              </div>
              <p className="text-sm text-[#64748b]">VIN: 1FTFW1ED...</p>
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Customer Details</h3>
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#ffb05f] text-base font-bold text-[#754300]">
                  {initials}
                </span>
                <span className="text-base font-semibold text-[#191c1d]">
                  {customer?.name ?? "John Doe"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Mail className="size-3.5 shrink-0" />
                  {customer?.email ?? "john.doe@example.com"}
                </p>
                <p className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Phone className="size-3.5 shrink-0" />
                  {customer?.phone ?? "+1 (555) 234-8876"}
                </p>
              </div>
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Intake Specifications</h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Mileage</label>
                  <div className="relative">
                    <Gauge className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                    <input
                      type="text"
                      defaultValue="45,210"
                      className={cn(inputBase, "pl-[34px] pr-10")}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#64748b]">
                      mi
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Fuel Level</label>
                  <div className="relative">
                    <input type="text" defaultValue="75" className={cn(inputBase, "pr-10")} />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#64748b]">
                      %
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                  <span className="text-sm font-medium text-[#191c1d]">Keys Received</span>
                  <Switch
                    aria-label="Keys received"
                    checked={keysReceived}
                    onCheckedChange={setKeysReceived}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel}>Accessories left in vehicle</label>
                  <input
                    type="text"
                    placeholder="e.g., Dashcam, tools in bed..."
                    className={inputBase}
                  />
                </div>
              </div>
            </section>

            <section className={card}>
              <div className="flex items-center justify-between">
                <h3 className={sectionTitle}>Walkaround Photos</h3>
                <button
                  type="button"
                  className="rounded bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                >
                  Add
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[0, 1].map((tile) => (
                  <div
                    key={tile}
                    className="group relative h-[77.5px] w-full overflow-hidden rounded"
                  >
                    <Image
                      src="/images/cars/ford-f150.png"
                      alt="Walkaround photo"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 hidden items-center justify-center bg-black/30 group-hover:flex">
                      <Camera className="size-[18px] text-white" />
                    </div>
                  </div>
                ))}
                {[0, 1].map((tile) => (
                  <div
                    key={tile}
                    className="flex h-[77.5px] w-full items-center justify-center rounded border border-dashed border-[#c2c6d5]"
                  >
                    <Camera className="size-[18px] text-[#c2c6d5]" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="col-span-7 flex flex-col gap-6 rounded-lg border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Service Requested</label>
                <div className="relative">
                  <select
                    defaultValue="Routine Maintenance"
                    className={cn(inputBase, "appearance-none pr-8")}
                  >
                    <option>Routine Maintenance</option>
                    <option>Oil Change</option>
                    <option>Brake Service</option>
                    <option>Tire Rotation</option>
                    <option>Multi-Point Inspection</option>
                    <option>AC Recharge</option>
                    <option>Brake Pad Replacement</option>
                    <option>Full Synthetic Oil Change</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel}>Expected Completion</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#64748b]" />
                  <input type="text" placeholder="mm/dd/yyyy" className={cn(inputBase, "pl-[34px]")} />
                </div>
              </div>
            </div>

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
              <label className={fieldLabel}>Reported Problems</label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                className={cn(inputBase, "min-h-24 resize-none")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={fieldLabel}>Inspection Notes (Internal)</label>
              <textarea
                placeholder="Add internal notes for the workshop team..."
                className={cn(inputBase, "min-h-20 resize-none")}
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] pt-4">
              <button type="button" className={outlineBtn}>
                Save Draft
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
