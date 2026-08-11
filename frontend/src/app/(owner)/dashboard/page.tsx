"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowUpRight, Bell, Calendar, Car, Check, ChevronRight, FileCheck, Gauge, MoreVertical, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { buildKpis } from "@/lib/kpis";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";

const TIMELINE = ["Received", "Inspecting", "Repairing", "Testing", "Ready"];

const kpiIcons: Record<string, typeof Calendar> = {
  calendar: Calendar,
  wrench: Wrench,
  car: Car,
  wallet: FileCheck,
  bell: Bell,
};

export default function OwnerDashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchJobs());
  }, [dispatch]);

  const kpis = useMemo(() => buildKpis("owner", { jobs, vehicles }), [jobs, vehicles]);

  const activeJob = jobs.find((j) => j.status !== "ready" && j.status !== "completed");
  const activeVehicle = vehicles[0];
  const firstName = user?.name.split(" ")[0] ?? "John";

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[32px]">
        <div>
          <h1 className="text-[36px] font-bold tracking-[-0.72px] text-foreground">Welcome back, {firstName}!</h1>
          <p className="text-[16px] text-[#414754]">Here is the latest overview of your fleet operations.</p>
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-12 flex gap-[16px]">
            {kpis.map((kpi) => {
              const Icon = kpiIcons[kpi.icon] ?? Calendar;
              return (
                <div key={kpi.id} className="flex h-[128px] w-[174px] flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                  <div className="flex w-full items-start justify-between">
                    <span className="text-[12px] font-semibold tracking-[0.6px] text-[#414754] uppercase">
                      {kpi.label.split(" ").slice(0, -1).join(" ")}
                      <br />
                      {kpi.label.split(" ").slice(-1)}
                    </span>
                    <Icon className="size-[26px] text-muted-foreground" />
                  </div>
                  <div>
                    <p className={cn("text-[24px] font-semibold tracking-[-0.24px] text-foreground", kpi.id === "kpi-305" && "truncate text-[14px] leading-[20px]")}>
                      {kpi.value}
                    </p>
                    <p className={cn("flex items-center gap-[4px] text-[11px] font-medium", kpi.trend === "up" && "text-[#4caf50]", kpi.trend === "down" && "text-[#ba1a1a]")}>
                      {kpi.trend === "up" && <ArrowUpRight className="size-[11.7px]" />}
                      {kpi.trend === "down" && <span className="size-[12.8px]">!</span>}
                      {kpi.delta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Active Service</h2>
                {activeJob && <StatusBadge status={activeJob.status as never} />}
              </div>

              {activeJob && activeVehicle ? (
                <>
                  <div className="flex items-center rounded-[8px] border border-[#e2e8f0] bg-secondary p-[17px]">
                    <Image src={activeVehicle.image} alt={activeVehicle.model} width={64} height={64} className="rounded-[6px] object-cover" />
                    <div className="flex-1 pl-[16px]">
                      <p className="text-[12px] font-semibold tracking-[0.24px] text-foreground">
                        {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
                      </p>
                      <p className="text-[14px] text-[#414754]">
                        Plate: {activeVehicle.regNo} • {activeJob.services.map((s) => s.name).join(", ")}
                      </p>
                    </div>
                    <div className="pl-[16px] text-right">
                      <p className="text-[11px] font-medium text-[#414754]">Service Advisor</p>
                      <p className="flex items-center justify-end gap-[4px] text-[12px] font-semibold tracking-[0.24px] text-foreground">
                        <Gauge className="size-[10.7px]" />
                        {activeJob.advisor?.name ?? "Sarah Jenkins"}
                      </p>
                    </div>
                  </div>

                  <div className="relative py-[16px]">
                    <div className="absolute top-[32px] right-[32px] left-[32px] h-[2px] bg-[#e2e8f0]" />
                    <div className="absolute top-[32px] left-[5.65%] h-[2px] bg-primary" style={{ width: "45%" }} />
                    <div className="flex h-[54px] items-start justify-between">
                      {TIMELINE.map((step, i) => {
                        const state = i < 2 ? "done" : i === 2 ? "active" : "pending";
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <span
                              className={cn(
                                "flex size-[32px] items-center justify-center rounded-full",
                                state === "done" && "bg-primary shadow-[0_0_0_4px_white,0_1px_2px_0px_rgba(0,0,0,0.05)]",
                                state === "active" && "border-2 border-primary bg-white shadow-[0_0_0_4px_white]",
                                state === "pending" && "border border-[#e2e8f0] bg-secondary",
                              )}
                            >
                              {state === "done" ? (
                                <Check className="size-[10.9px] text-white" />
                              ) : state === "active" ? (
                                <span className="size-[8px] rounded-full bg-primary" />
                              ) : (
                                <span className="size-[6px] rounded-full bg-[#e2e8f0]" />
                              )}
                            </span>
                            <span className={cn("mt-[8px] text-[11px]", state === "active" ? "font-bold text-primary" : "font-semibold text-[#414754]")}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-[8px] border border-[#e2e8f0] bg-secondary px-[17px] py-[9px]">
                    <span className="text-[14px] text-[#414754]">
                      Estimate <span className="font-semibold text-foreground">#ES-3301</span> awaiting your approval
                    </span>
                    <Link href="/dashboard/estimates/ES-3301" className="flex items-center gap-[4px] text-[12px] font-semibold tracking-[0.24px] text-primary">
                      Review <ChevronRight className="size-[12px]" />
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-[14px] text-muted-foreground">No active service right now.</p>
              )}
            </section>

            <section className="flex flex-col gap-[16px]">
              <h2 className="text-[20px] font-semibold text-foreground">My Fleet</h2>
              <div className="flex gap-[16px]">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex-1 overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="relative h-[128px] bg-secondary">
                      <Image src={vehicle.image} alt={vehicle.model} fill className="object-cover" />
                      <span className="absolute top-[8px] right-[8px] rounded-[6px] border border-[#e2e8f0] bg-white/90 px-[8px] py-[3px] text-[11px] font-medium text-foreground backdrop-blur-[4px]">
                        {vehicle.regNo}
                      </span>
                    </div>
                    <div className="flex flex-col gap-[8px] p-[16px]">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[12px] font-semibold tracking-[0.24px] text-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="flex items-center gap-[4px] text-[11px] font-medium text-[#414754]">
                            <Gauge className="size-[11.7px]" />
                            {vehicle.mileage.toLocaleString()} mi
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-[8px]">
                        <Link href="/dashboard/history" className="rounded-[8px] border border-[#e2e8f0] px-[12px] py-[9px] text-[11px] font-semibold text-foreground hover:bg-muted">
                          History
                        </Link>
                        <Link href="/dashboard/appointments/book" className="rounded-[8px] bg-[rgba(216,226,255,0.2)] px-[12px] py-[9px] text-[11px] font-semibold text-primary hover:bg-[rgba(216,226,255,0.35)]">
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-[12px]">
                <h2 className="text-[12px] font-semibold tracking-[0.24px] text-foreground">Recent Updates</h2>
                <span className="text-[11px] font-medium text-primary">Mark all read</span>
              </div>
              {[
                { icon: FileCheck, tint: "bg-[rgba(0,91,191,0.1)]", title: "Estimate Received", body: "New estimate for Ford F-150 brake pad replacement is ready for review.", time: "10 mins ago", row: true },
                { icon: Check, tint: "bg-[rgba(76,175,80,0.1)]", title: "Repair Completed", body: "Toyota Camry routine maintenance has been completed successfully.", time: "2 hours ago", row: false },
              ].map((n) => (
                <div key={n.title} className={cn("flex gap-[8px] rounded-[8px] p-[8px]", n.row && "bg-[rgba(216,226,255,0.1)]")}>
                  <span className={cn("flex size-[32px] shrink-0 items-center justify-center rounded-full", n.tint)}>
                    <n.icon className="size-[14px] text-muted-foreground" />
                  </span>
                  <div>
                    <p className="text-[11px] font-medium text-foreground">{n.title}</p>
                    <p className="text-[12px] leading-[18px] text-[#414754]">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground">{n.time}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-[16px] rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-[12px]">
                <h2 className="text-[12px] font-semibold tracking-[0.24px] text-foreground">Upcoming Appointments</h2>
                <span className="text-[11px] font-medium text-primary">View All</span>
              </div>
              <div className="flex items-center justify-between rounded-[8px] border border-[#e2e8f0] p-[9px]">
                <div className="flex min-w-[50px] flex-col items-center rounded-[4px] border border-[#e2e8f0] bg-secondary px-[9px] py-[5px]">
                  <span className="text-[10px] font-medium text-[#ba1a1a] uppercase">Aug</span>
                  <span className="text-[20px] font-semibold text-foreground">14</span>
                </div>
                <div className="flex-1 pl-[16px]">
                  <p className="text-[11px] font-medium text-foreground">Brake Service</p>
                  <p className="text-[12px] text-[#414754]">Ford F-150 • 10:30 AM</p>
                </div>
                <MoreVertical className="size-[16px] text-muted-foreground" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
