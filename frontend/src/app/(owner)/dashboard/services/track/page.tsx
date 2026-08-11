"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Check, Clock, Download, FileCheck, MapPin, MessageSquare, Phone, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { cn } from "@/lib/utils";

export default function ServiceTrackingPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    if (jobs.length === 0) dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, jobs.length, vehicles.length]);

  const job = jobs.find((j) => j.id === "JC-1045");
  const vehicle = vehicles.find((v) => v.id === job?.vehicleId);

  if (!job || !vehicle) {
    return <div className="bg-background min-h-screen p-[32px] text-muted-foreground">Loading tracking...</div>;
  }

  const doneCount = job.progress.filter((p) => p.done).length;
  const pct = Math.round((doneCount / job.progress.length) * 100);

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-end justify-between">
          <div>
            <Link href="/dashboard/vehicles" className="flex items-center gap-[4px] text-[11px] font-medium text-[#424753] hover:text-primary">
              <ArrowLeft className="size-[10.7px]" />
              Back to Vehicles
            </Link>
            <div className="flex items-center gap-[16px] pt-[4px]">
              <h1 className="text-[36px] font-bold tracking-[-0.72px] text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <span className="rounded-[12px] border border-border bg-[#edeeef] px-[9px] py-[5px] text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                {vehicle.regNo}
              </span>
            </div>
            <p className="text-[14px] text-[#424753]">Est. Completion: Today, 4:30 PM</p>
          </div>
          <span className="flex items-center gap-[8px] rounded-[12px] border border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] px-[13px] py-[7px] text-[12px] font-semibold tracking-[0.24px] text-primary">
            <span className="size-[8px] rounded-full bg-primary" />
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[24px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Service Timeline</h2>
              <div className="relative px-[16px] pt-[16px] pb-[32px]">
                <div className="absolute top-[32px] right-[32px] left-[32px] h-[2px] bg-[#f3f4f5]" />
                <div className="absolute top-[32px] left-[32px] h-[2px] bg-[#4caf50]" style={{ width: `${Math.max(20, (doneCount / job.progress.length) * 100)}%` }} />
                <div className="flex items-start justify-between">
                  {job.progress.map((step, i) => {
                    const isDone = step.done;
                    const isActive = !isDone && (i === 0 || job.progress[i - 1].done);
                    return (
                      <div key={step.step} className="flex w-[89px] flex-col items-center">
                        <span
                          className={cn(
                            "flex size-[32px] items-center justify-center rounded-[12px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
                            isDone && "bg-[#4caf50]",
                            isActive && "bg-primary",
                            !isDone && !isActive && "border-2 border-[#e1e3e4] bg-[#edeeef]",
                          )}
                        >
                          {isDone ? (
                            <Check className="size-[12.2px] text-white" />
                          ) : isActive ? (
                            <Wrench className="size-[13.5px] text-white" />
                          ) : (
                            <Clock className="size-[12px] text-[#424753]" />
                          )}
                        </span>
                        <p className={cn("pt-[8px] text-[12px] tracking-[0.24px]", isActive ? "font-bold text-primary" : isDone ? "font-semibold text-foreground" : "font-semibold text-[#424753]")}>
                          {step.label.replace("Vehicle ", "").replace("Initial ", "")}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">{step.timestamp ?? "Upcoming"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="flex gap-[24px]">
              <section className="flex h-[278px] flex-1 flex-col items-center justify-center rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h3 className="w-full px-[24px] text-[12px] font-semibold tracking-[0.24px] text-[#424753]">Current Phase Progress</h3>
                <div className="relative mt-[16px] flex size-[160px] items-center justify-center">
                  <div
                    className="size-[160px] rounded-full"
                    style={{
                      background: `conic-gradient(#0052cc ${pct}%, #e1e3e4 ${pct}% 100%)`,
                      mask: "radial-gradient(circle, transparent 62%, black 63%)",
                      WebkitMask: "radial-gradient(circle, transparent 62%, black 63%)",
                    }}
                  />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">{pct}%</span>
                    <span className="text-[11px] font-medium text-muted-foreground">Complete</span>
                  </div>
                </div>
                <p className="pt-[16px] text-[14px]">
                  Time Remaining: <span className="font-medium text-primary">1h 30m</span>
                </p>
              </section>

              <section className="flex-1 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h3 className="pb-[16px] text-[12px] font-semibold tracking-[0.24px] text-[#424753]">Assigned Team</h3>
                <div className="flex flex-col gap-[24px] py-[12px]">
                  {[
                    { name: "Sarah Jenkins", role: "Service Advisor" },
                    { name: "Mike Ross", role: "Lead Mechanic" },
                  ].map((member) => (
                    <div key={member.name} className="flex items-center gap-[16px] rounded-[4px] border border-[#e1e3e4] bg-background p-[13px]">
                      <span className="flex size-[48px] items-center justify-center rounded-[12px] bg-primary-soft text-[14px] font-semibold text-primary shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{member.name}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{member.role}</p>
                      </div>
                      <MessageSquare className="size-[16.7px] text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="flex flex-col gap-[24px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Recent Updates</h2>
                <span className="text-[12px] font-semibold tracking-[0.24px] text-primary">View All</span>
              </div>
              <div className="flex flex-col border-l-2 border-[#edeeef]">
                {[
                  { text: "Brake pads replaced", time: "1:45 PM", color: "#0052cc" },
                  { text: "Oil filter changed", time: "1:15 PM", color: "#4caf50" },
                  { text: "Inspection approved by owner", time: "11:30 AM", color: "#e1e3e4" },
                ].map((u) => (
                  <div key={u.text} className="relative flex flex-col gap-[4px] pb-[24px] pl-[24px]">
                    <span className="absolute top-[4px] left-[-9px] size-[16px] rounded-[12px] border-2 border-white" style={{ backgroundColor: u.color }} />
                    <p className="text-[14px] text-foreground">{u.text}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{u.time}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Quick Actions</h2>
              <div className="flex flex-col gap-[12px]">
                <Link href="/dashboard/chat" className="flex items-center justify-center gap-[8px] rounded-[4px] bg-primary px-[16px] py-[12px] text-[12px] font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                  <MessageSquare className="size-[16.7px]" />
                  Chat with Advisor
                </Link>
                <Link href="/dashboard/estimates/ES-3301" className="flex items-center justify-center gap-[8px] rounded-[4px] border border-[#c2c6d5] bg-[#f8f9fa] px-[17px] py-[13px] text-[12px] font-semibold tracking-[0.24px] text-foreground">
                  <FileCheck className="size-[13.3px]" />
                  View Estimate
                </Link>
                <button type="button" className="flex items-center justify-center gap-[8px] rounded-[4px] border border-[#c2c6d5] bg-[#f8f9fa] px-[17px] py-[13px] text-[12px] font-semibold tracking-[0.24px] text-foreground">
                  <Download className="size-[13.3px]" />
                  Download Invoice
                </button>
                <div className="h-[17px] py-[8px]">
                  <div className="h-px w-full bg-[#e2e8f0]" />
                </div>
                <button type="button" className="flex items-center justify-center gap-[8px] rounded-[4px] bg-[#edeeef] px-[16px] py-[12px] text-[12px] font-semibold tracking-[0.24px] text-[#424753]">
                  <Phone className="size-[15px]" />
                  Call Workshop
                </button>
              </div>
              <div className="flex gap-[12px] rounded-[4px] border border-border bg-[#f8f9fa] px-[17px] pt-[25px] pb-[17px]">
                <MapPin className="size-[20px] shrink-0 text-primary" />
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.24px] text-foreground">MotoServe Main Hub</p>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    123 Industrial Pkwy
                    <br />
                    Open until 6:00 PM
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
