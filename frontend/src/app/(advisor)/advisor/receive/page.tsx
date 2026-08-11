"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import demoData from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import type { Customer, JobCard, Vehicle } from "@/types";

const sectionTitle = "text-[12px] font-semibold uppercase tracking-[0.6px] text-[#64748b]";
const fieldLabel = "text-[12px] font-semibold tracking-[0.24px] text-[#424753]";
const inputBase =
  "w-full rounded-[4px] border border-[#e2e8f0] bg-[#f8f9fa] px-[12px] py-[9px] text-[14px] text-[#191c1d] placeholder:text-[#9ca3af] outline-none";
const card = "flex flex-col gap-[16px] rounded-[8px] border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const outlineBtn =
  "rounded-[8px] border border-[#e5e7eb] bg-white px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] text-[#191c1d] shadow-[0_1px_1px_rgba(0,0,0,0.05)]";
const primaryBtn =
  "flex items-center gap-[8px] rounded-[8px] bg-primary px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]";

const priorities = ["low", "medium", "high"] as const;

export default function ReceiveVehiclePage() {
  const [job, setJob] = useState<JobCard | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [keysReceived, setKeysReceived] = useState(true);
  const [priority, setPriority] = useState<(typeof priorities)[number]>("medium");

  useEffect(() => {
    (async () => {
      const [jobs, vehicles, customers] = await Promise.all([
        demoData.load("jobs"),
        demoData.load("vehicles"),
        demoData.load("customers"),
      ]);
      const active = jobs.find((j) => j.id === "JC-1045");
      setJob(active ?? null);
      setVehicle(vehicles.find((v) => v.id === active?.vehicleId) ?? null);
      setCustomer(customers.find((c) => c.id === active?.customerId) ?? null);
    })();
  }, []);

  const initials =
    customer?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2) ?? "JD";

  return (
    <div className="min-h-screen bg-background p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[4px]">
            <h1 className="text-[24px] font-semibold text-[#191c1d]">Receive Vehicle</h1>
            <p className="text-[14px] text-[#64748b]">Create Job Card #{job?.id ?? "JC-1045"}</p>
          </div>
          <div className="flex gap-[8px]">
            <button type="button" className={outlineBtn}>
              Save Draft
            </button>
            <button type="button" className={primaryBtn}>
              Create Job Card
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-5 flex flex-col gap-[24px]">
            <section className={card}>
              <div className="relative h-[96px] w-[128px]">
                <Image
                  src={vehicle?.image ?? "/images/cars/ford-f150.png"}
                  alt={`${vehicle?.make ?? "Ford"} ${vehicle?.model ?? "F-150"}`}
                  width={128}
                  height={96}
                  className="h-full w-full rounded-[4px] object-cover"
                />
                <span className="absolute bottom-[6px] left-[6px] rounded-[2px] bg-[rgba(46,49,50,0.8)] px-8 py-2 text-[10px] font-semibold tracking-[0.5px] text-[#f0f1f2]">
                  {vehicle?.regNo ?? "A9C-1234"}
                </span>
              </div>
              <div className="flex items-center gap-[10px]">
                <h2 className="text-[20px] font-semibold text-[#191c1d]">
                  {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "2023 Ford F-150"}
                </h2>
                <span className="rounded-[12px] bg-[rgba(0,82,204,0.1)] px-[10px] py-[3px] text-[12px] font-medium whitespace-nowrap text-primary">
                  XLT Fleet
                </span>
              </div>
              <p className="text-[14px] text-[#64748b]">VIN: 1FTFW1ED...</p>
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Customer Details</h3>
              <div className="flex items-center gap-[12px]">
                <span className="flex size-[48px] shrink-0 items-center justify-center rounded-[12px] bg-[#ffb05f] text-[16px] font-bold text-[#754300]">
                  {initials}
                </span>
                <span className="text-[16px] font-semibold text-[#191c1d]">
                  {customer?.name ?? "John Doe"}
                </span>
              </div>
              <div className="flex flex-col gap-[8px]">
                <p className="flex items-center gap-[8px] text-[14px] text-[#64748b]">
                  <Mail className="size-[14px] shrink-0" />
                  {customer?.email ?? "john.doe@example.com"}
                </p>
                <p className="flex items-center gap-[8px] text-[14px] text-[#64748b]">
                  <Phone className="size-[14px] shrink-0" />
                  {customer?.phone ?? "+1 (555) 234-8876"}
                </p>
              </div>
            </section>

            <section className={card}>
              <h3 className={sectionTitle}>Intake Specifications</h3>
              <div className="flex flex-col gap-[16px]">
                <div className="flex flex-col gap-[6px]">
                  <label className={fieldLabel}>Mileage</label>
                  <div className="relative">
                    <Gauge className="pointer-events-none absolute top-1/2 left-[10px] size-[16px] -translate-y-1/2 text-[#64748b]" />
                    <input
                      type="text"
                      defaultValue="45,210"
                      className={cn(inputBase, "pl-[34px] pr-[40px]")}
                    />
                    <span className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-[14px] text-[#64748b]">
                      mi
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label className={fieldLabel}>Fuel Level</label>
                  <div className="relative">
                    <input type="text" defaultValue="75" className={cn(inputBase, "pr-[40px]")} />
                    <span className="pointer-events-none absolute top-1/2 right-[12px] -translate-y-1/2 text-[14px] text-[#64748b]">
                      %
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-[16px]">
                  <span className="text-[14px] font-medium text-[#191c1d]">Keys Received</span>
                  <Switch
                    aria-label="Keys received"
                    checked={keysReceived}
                    onCheckedChange={setKeysReceived}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
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
                  className="rounded-[4px] bg-primary/10 px-[12px] py-[6px] text-[12px] font-semibold text-primary"
                >
                  Add
                </button>
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                {[0, 1].map((tile) => (
                  <div
                    key={tile}
                    className="group relative h-[77.5px] w-full overflow-hidden rounded-[4px]"
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
                    className="flex h-[77.5px] w-full items-center justify-center rounded-[4px] border border-dashed border-[#c2c6d5]"
                  >
                    <Camera className="size-[18px] text-[#c2c6d5]" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="col-span-7 flex flex-col gap-[24px] rounded-[8px] border border-[#e5e7eb] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="flex flex-col gap-[6px]">
                <label className={fieldLabel}>Service Requested</label>
                <div className="relative">
                  <select
                    defaultValue="Routine Maintenance"
                    className={cn(inputBase, "appearance-none pr-[32px]")}
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
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-[10px] size-[16px] -translate-y-1/2 text-[#64748b]" />
                </div>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className={fieldLabel}>Expected Completion</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute top-1/2 left-[10px] size-[16px] -translate-y-1/2 text-[#64748b]" />
                  <input type="text" placeholder="mm/dd/yyyy" className={cn(inputBase, "pl-[34px]")} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className={fieldLabel}>Priority Level</label>
              <div className="grid grid-cols-3 gap-[6px] rounded-[4px] bg-[#edeeef] p-5">
                {priorities.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={cn(
                      "rounded-[4px] py-[7px] text-[12px] font-semibold capitalize",
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

            <div className="flex flex-col gap-[6px]">
              <label className={fieldLabel}>Reported Problems</label>
              <textarea
                defaultValue="Squeaking noise from front left wheel when turning."
                className={cn(inputBase, "min-h-[96px] resize-none")}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className={fieldLabel}>Inspection Notes (Internal)</label>
              <textarea
                placeholder="Add internal notes for the workshop team..."
                className={cn(inputBase, "min-h-[80px] resize-none")}
              />
            </div>

            <div className="flex items-center justify-end gap-[8px] border-t border-[#e5e7eb] pt-[16px]">
              <button type="button" className={outlineBtn}>
                Save Draft
              </button>
              <button type="button" className={primaryBtn}>
                <Plus className="size-[13.5px]" />
                Create Job Card
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
