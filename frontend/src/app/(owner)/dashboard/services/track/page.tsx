"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Download, FileCheck, MapPin, MessageSquare, Phone, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { downloadInvoicePdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

export default function ServiceTrackingPage() {
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const estimates = useAppSelector((s) => s.estimates.items);
  const invoices = useAppSelector((s) => s.invoices.items);

  useEffect(() => {
    if (jobs.length === 0) dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
    if (estimates.length === 0) dispatch(fetchEstimates());
    if (invoices.length === 0) dispatch(fetchInvoices());
  }, [dispatch, jobs.length, vehicles.length, estimates.length, invoices.length]);

  const activeJobs = jobs.filter((j) => !["completed", "ready"].includes(j.status));
  const job = activeJobs[0] ?? jobs[0];
  const vehicle = vehicles.find((v) => v.id === job?.vehicleId);

  if (!job || !vehicle) {
    return <div className="bg-background min-h-screen p-8 text-muted-foreground">No active service found.</div>;
  }

  const doneCount = job.progress.filter((p) => p.done).length;
  const pct = Math.round((doneCount / job.progress.length) * 100);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <Link href="/dashboard/vehicles" className="flex items-center gap-1 text-[11px] font-medium text-[#424753] hover:text-primary">
              <ArrowLeft className="size-[10.7px]" />
              Back to Vehicles
            </Link>
            <div className="flex items-center gap-4 pt-1">
              <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <span className="rounded-xl border border-border bg-[#edeeef] px-[9px] py-[5px] text-xs font-semibold tracking-[0.24px] text-[#424753]">
                {vehicle.regNo}
              </span>
            </div>
            <p className="text-sm text-[#424753]">Job Card #{job.id} • Est. Completion: Today, 4:30 PM</p>
          </div>
          <span className="flex items-center gap-2 rounded-xl border border-[rgba(0,82,204,0.2)] bg-[rgba(0,82,204,0.1)] px-[13px] py-[7px] text-xs font-semibold tracking-[0.24px] text-primary">
            <span className="size-2 rounded-full bg-primary" />
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Service Timeline</h2>
              <div className="relative px-4 pt-4 pb-8">
                <div className="absolute top-8 right-8 left-8 h-0.5 bg-[#f3f4f5]" />
                <div className="absolute top-8 left-8 h-0.5 bg-[#4caf50]" style={{ width: `${Math.max(20, (doneCount / job.progress.length) * 100)}%` }} />
                <div className="flex items-start justify-between">
                  {job.progress.map((step, i) => {
                    const isDone = step.done;
                    const isActive = !isDone && (i === 0 || job.progress[i - 1].done);
                    return (
                      <div key={step.step} className="flex w-[89px] flex-col items-center">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
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
                            <Clock className="size-3 text-[#424753]" />
                          )}
                        </span>
                        <p className={cn("pt-2 text-xs tracking-[0.24px]", isActive ? "font-bold text-primary" : isDone ? "font-semibold text-foreground" : "font-semibold text-[#424753]")}>
                          {step.label.replace("Vehicle ", "").replace("Initial ", "")}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">{step.timestamp ?? "Upcoming"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="flex gap-6">
              <section className="flex h-[278px] flex-1 flex-col items-center justify-center rounded-lg border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h3 className="w-full px-6 text-xs font-semibold tracking-[0.24px] text-[#424753]">Current Phase Progress</h3>
                <div className="relative mt-4 flex size-[160px] items-center justify-center">
                  <div
                    className="size-[160px] rounded-full"
                    style={{
                      background: `conic-gradient(#0052cc ${pct}%, #e1e3e4 ${pct}% 100%)`,
                      mask: "radial-gradient(circle, transparent 62%, black 63%)",
                      WebkitMask: "radial-gradient(circle, transparent 62%, black 63%)",
                    }}
                  />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-semibold tracking-[-0.24px] text-foreground">{pct}%</span>
                    <span className="text-[11px] font-medium text-muted-foreground">Complete</span>
                  </div>
                </div>
                <p className="pt-4 text-sm">
                  Time Remaining: <span className="font-medium text-primary">1h 30m</span>
                </p>
              </section>

              <section className="flex-1 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h3 className="pb-4 text-xs font-semibold tracking-[0.24px] text-[#424753]">Assigned Team</h3>
                <div className="flex flex-col gap-6 py-3">
                  {[
                    { name: job.advisor?.name ?? "Service Advisor", role: "Service Advisor" },
                    { name: job.mechanic?.name ?? "Not assigned", role: "Lead Mechanic" },
                  ].map((member) => (
                    <div key={member.role} className="flex items-center gap-4 rounded border border-[#e1e3e4] bg-background p-[13px]">
                      <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-sm font-semibold text-primary shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold tracking-[0.24px] text-foreground">{member.name}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{member.role}</p>
                      </div>
                      <MessageSquare className="size-[16.7px] text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="flex flex-col gap-6 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Updates</h2>
                <span className="text-xs font-semibold tracking-[0.24px] text-primary">View All</span>
              </div>
              <div className="flex flex-col border-l-2 border-[#edeeef]">
                {[
                  { text: "Brake pads replaced", time: "1:45 PM", color: "#0052cc" },
                  { text: "Oil filter changed", time: "1:15 PM", color: "#4caf50" },
                  { text: "Inspection approved by owner", time: "11:30 AM", color: "#e1e3e4" },
                ].map((u) => (
                  <div key={u.text} className="relative flex flex-col gap-1 pb-6 pl-6">
                    <span className="absolute top-1 left-[-9px] size-4 rounded-xl border-2 border-white" style={{ backgroundColor: u.color }} />
                    <p className="text-sm text-foreground">{u.text}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{u.time}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                <Link href="/dashboard/chat" className="flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                  <MessageSquare className="size-[16.7px]" />
                  Chat with Advisor
                </Link>
                {(() => {
                  const estimate = estimates.find((e) => e.jobId === job.id);
                  return estimate ? (
                    <Link href={`/dashboard/estimates/${estimate.id}`} className="flex items-center justify-center gap-2 rounded border border-[#c2c6d5] bg-[#f8f9fa] px-[17px] py-[13px] text-xs font-semibold tracking-[0.24px] text-foreground">
                      <FileCheck className="size-[13.3px]" />
                      View Estimate
                    </Link>
                  ) : null;
                })()}
                {(() => {
                  const invoice = invoices.find((i) => i.jobId === job.id);
                  return invoice ? (
                    <button
                      type="button"
                      onClick={() => {
                        downloadInvoicePdf(invoice, vehicle);
                        toast.success("Invoice PDF downloaded");
                      }}
                      className="flex items-center justify-center gap-2 rounded border border-[#c2c6d5] bg-[#f8f9fa] px-[17px] py-[13px] text-xs font-semibold tracking-[0.24px] text-foreground"
                    >
                      <Download className="size-[13.3px]" />
                      Download Invoice
                    </button>
                  ) : null;
                })()}
                <div className="h-[17px] py-2">
                  <div className="h-px w-full bg-[#e2e8f0]" />
                </div>
                <button type="button" className="flex items-center justify-center gap-2 rounded bg-[#edeeef] px-4 py-3 text-xs font-semibold tracking-[0.24px] text-[#424753]">
                  <Phone className="size-[15px]" />
                  Call Workshop
                </button>
              </div>
              <div className="flex gap-3 rounded border border-border bg-[#f8f9fa] px-[17px] pt-[25px] pb-[17px]">
                <MapPin className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold tracking-[0.24px] text-foreground">MotoServe Main Hub</p>
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
