"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Car, Clock, History, Mail, Phone, Plus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const vehicleDetails = [
  { label: "Make & Model", value: "2023 Ford F-150" },
  { label: "Mileage", value: "24,500 mi" },
  { label: "Service Type", value: "Periodic Maintenance" },
  { label: "Appointment", value: "Today, 10:00 AM" },
];

const customerRows = [
  { icon: User, value: "John Doe" },
  { icon: Phone, value: "+1 555-0198" },
  { icon: Mail, value: "john.doe@example.com" },
];

const priorities = [
  { key: "low", label: "Low", active: "border-[#0052cc] bg-primary/10 text-primary" },
  { key: "medium", label: "Medium", active: "border-[#ffc107] bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
  { key: "high", label: "High", active: "border-[#0052cc] bg-primary/10 text-primary" },
];

export default function CreateJobCardPage() {
  const router = useRouter();
  const [priority, setPriority] = useState("medium");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Job card created");
    router.push("/advisor");
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
              <h3 className="flex items-center gap-2 border-b border-[#e5e7eb] pb-9 text-xl font-semibold text-foreground">
                <Car className="size-5 text-primary" />
                Vehicle Details
              </h3>

              <div className="relative h-32 overflow-hidden rounded bg-[#e1e3e4]">
                <Image
                  src="/images/cars/ford-f150.png"
                  alt="2023 Ford F-150"
                  fill
                  className="object-cover"
                />
                <span className="absolute right-2 bottom-2 rounded-sm bg-white/90 px-[9px] py-0.75 text-[11px] font-semibold text-foreground backdrop-blur-[2px]">
                  A9C-1234
                </span>
              </div>

              <div className="mt-[25px] grid grid-cols-2 gap-x-[16px] gap-y-[25px]">
                {vehicleDetails.map((item) => (
                  <div key={item.label} className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#64748b]">{item.label}</span>
                    <span className="text-sm font-medium text-[#191c1d]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 border-b border-[#e5e7eb] pb-4 text-xl font-semibold text-foreground">
                <User className="size-5 text-primary" />
                Customer Info
              </h3>

              <div className="flex flex-col gap-3.5 pt-4">
                {customerRows.map((row) => (
                  <div key={row.value} className="flex items-center gap-2.5">
                    <row.icon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-[#191c1d]">{row.value}</span>
                  </div>
                ))}
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
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Job Card Number</Label>
                <Input defaultValue="JC-1088" readOnly className="h-[38px] rounded border-[#6b7280] bg-[#f3f4f5]" />
              </div>
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">Service Advisor</Label>
                <Input defaultValue="Sarah Jenkins" readOnly className="h-[38px] rounded border-[#6b7280] bg-[#f3f4f5]" />
              </div>
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Expected Completion Date
                </Label>
                <div className="relative">
                  <Input placeholder="mm/dd/yyyy" className="h-[38px] rounded border-[#6b7280] bg-[#f3f4f5]" />
                  <CalendarDays className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="flex flex-col gap-[8.5px]">
                <Label className="text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  Estimated Completion Time
                </Label>
                <div className="relative">
                  <Input placeholder="--:--:--" className="h-[38px] rounded border-[#6b7280] bg-[#f3f4f5]" />
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
            </div>

            <div className="flex justify-end gap-4 border-t border-[#e5e7eb] pt-[25px]">
              <button
                type="button"
                className="rounded border border-[#727784] px-4 py-[9px] text-xs font-semibold text-[#424753]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => toast.info("Draft saved (demo)")}
                className="rounded border border-primary px-4 py-[9px] text-xs font-semibold text-primary"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded bg-primary px-4 py-[9px] text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <Plus className="size-[13.5px]" />
                Create Job Card
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
