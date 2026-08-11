"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Download,
  FileBarChart,
  PackagePlus,
  Settings2,
  UserPlus,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchKpis } from "@/store/slices/uiSlice";
import demoData from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const kpiIcon: Record<string, typeof Users> = {
  "dollar-sign": FileBarChart,
  wallet: Calendar,
  car: Users,
  "file-check": PackagePlus,
  users: Users,
  wrench: Settings2,
};

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchKpis("admin"));
  }, [dispatch]);

  const kpis = useAppSelector((s) => s.ui.kpis);

  const [reports, setReports] = useState<Awaited<ReturnType<typeof demoData.load<"reports">>> | null>(null);
  useEffect(() => {
    demoData.load("reports").then(setReports);
  }, []);

  const chart = useMemo(() => {
    if (!reports) return null;
    const data = reports.revenueByMonth;
    const max = Math.max(...data.map((d) => d.revenue));
    const w = 560;
    const h = 180;
    const step = w / (data.length - 1);
    const points = data.map((d, i) => `${(i * step).toFixed(1)},${(h - (d.revenue / max) * (h - 20) - 10).toFixed(1)}`);
    return { data, points: points.join(" "), max };
  }, [reports]);

  if (!reports) {
    return (
      <div className="bg-background min-h-screen p-[32px]">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const donut = reports.serviceDistribution;
  const donutColors = ["#0052cc", "#ffc107", "#3b82f6", "#10b981"];
  const totalPct = donut.reduce((s, d) => s + d.pct, 0);
  const gradientStops = donut.reduce<{ acc: number; stops: string[] }>(
    (state, d, i) => {
      const from = (state.acc / totalPct) * 100;
      const acc = state.acc + d.pct;
      const to = (acc / totalPct) * 100;
      state.stops.push(`${donutColors[i]} ${from}% ${to}%`);
      return { acc, stops: state.stops };
    },
    { acc: 0, stops: [] },
  ).stops.join(", ");

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Overview</h1>
            <p className="text-[14px] text-muted-foreground">Real-time metrics and operational status.</p>
          </div>
          <div className="flex gap-[8px]">
            <Button variant="outline" size="sm" className="gap-[4px] rounded-[4px] border-[#e2e8f0] px-[17px] py-[9px] text-[12px] font-semibold tracking-[0.24px]">
              <Calendar className="size-[13.5px]" />
              Last 30 Days
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Report exported (demo)")}
              className="gap-[4px] rounded-[4px] px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <Download className="size-[12px]" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-[16px]">
          {kpis.map((kpi) => {
            const Icon = kpiIcon[kpi.icon] ?? Users;
            return (
              <div
                key={kpi.id}
                className="flex h-[104px] w-[142.66px] flex-col justify-between rounded-[8px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-[11px] font-medium whitespace-nowrap text-muted-foreground">{kpi.label}</span>
                  <Icon className="size-[15px] text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between gap-[4px]">
                  <span className="text-[20px] font-bold text-foreground">{kpi.value}</span>
                  <span
                    className={cn(
                      "rounded-[12px] px-[8px] py-[2px] text-[11px] font-medium",
                      kpi.trend === "up" && "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
                      kpi.trend === "down" && "bg-[rgba(255,193,7,0.1)] text-warning",
                      kpi.trend === "flat" && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {kpi.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Monthly Revenue Trends</h2>
                <button className="rounded-[2px] p-[4px] text-muted-foreground hover:text-foreground" aria-label="Chart options">
                  ⋯
                </button>
              </div>
              {chart && (
                <div className="relative h-[280px] w-full rounded-[4px] border border-dashed border-[#e2e8f0] bg-background p-[16px]">
                  <svg viewBox={`0 0 560 180`} className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,82,204,0.05)" />
                        <stop offset="100%" stopColor="rgba(0,82,204,0)" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <line key={f} x1="0" x2="560" y1={180 * f} y2={180 * f} stroke="#e2e8f0" strokeDasharray="4 4" />
                    ))}
                    <polygon points={`0,180 ${chart.points} 560,180`} fill="url(#revFill)" />
                    <polyline points={chart.points} fill="none" stroke="#0052cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute inset-x-[16px] bottom-[8px] flex justify-between">
                    {chart.data.map((d) => (
                      <span key={d.month} className="text-[11px] text-muted-foreground">{d.month}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="flex gap-[24px]">
              <section className="flex min-w-0 flex-1 flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h2 className="text-[20px] font-semibold text-foreground">Mechanic Workload</h2>
                <div className="flex flex-col gap-[16px]">
                  {reports.workloadByMechanic
                    .filter((m) => m.role)
                    .map((m) => (
                      <div key={m.mechanic} className="flex items-center justify-between rounded-[4px] border border-[#e2e8f0] p-[17px]">
                        <div className="flex items-center gap-[16px]">
                          <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-secondary text-[12px] font-bold text-muted-foreground uppercase">
                            {m.mechanic.split(" ").map((n) => n[0]).join("")}
                          </span>
                          <div>
                            <p className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{m.mechanic}</p>
                            <p className="text-[11px] font-medium text-muted-foreground">{m.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-[8px]">
                          <span className="flex flex-col items-end rounded-[12px] bg-[rgba(255,193,7,0.1)] px-[8px] py-[4px] text-[11px] font-medium text-warning">
                            {m.active}
                            <span>Active</span>
                          </span>
                          <span className="flex flex-col items-end rounded-[12px] bg-[rgba(76,175,80,0.1)] px-[8px] py-[4px] text-[11px] font-medium text-[#4caf50]">
                            {m.done}
                            <span>Done</span>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section className="flex min-w-0 flex-1 flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h2 className="text-[20px] font-semibold text-foreground">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-[8px]">
                  {[
                    { label: "Add Service", icon: PackagePlus, href: "/admin/services/new" },
                    { label: "Add Employee", icon: UserPlus, href: "/admin/employees" },
                    { label: "Generate Report", icon: FileBarChart, href: "/admin/reports" },
                    { label: "Manage Pricing", icon: Settings2, href: "/admin/services" },
                  ].map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => toast.info(`${a.label} — coming with the backend`)}
                      className="flex flex-col items-center justify-center gap-[8px] rounded-[4px] border border-[#e2e8f0] bg-background py-[25px] transition-colors hover:border-primary/50"
                    >
                      <a.icon className="size-[20px] text-muted-foreground" />
                      <span className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{a.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Service Distribution</h2>
              <div className="relative mx-auto size-[181px]">
                <div
                  className="flex size-[128px] items-center justify-center rounded-[12px]"
                  style={{ background: `conic-gradient(${gradientStops})`, mask: "radial-gradient(circle, transparent 56%, black 57%)", WebkitMask: "radial-gradient(circle, transparent 56%, black 57%)" }}
                >
                  <div className="flex flex-col items-center bg-white px-[12px]">
                    <span className="text-[20px] font-bold text-foreground">128</span>
                    <span className="text-[11px] font-medium text-muted-foreground">Total</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[4px]">
                {donut.map((d, i) => (
                  <div key={d.name} className="flex h-[28px] items-center gap-[8px]">
                    <span className="size-[12px] shrink-0 rounded-full" style={{ backgroundColor: donutColors[i] }} />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {d.name} ({d.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-semibold text-foreground">Recent Activity</h2>
                <span className="text-[11px] font-medium text-primary">View All</span>
              </div>
              <div className="flex flex-col gap-[24px] border-l-2 border-border pb-[8px] pl-[16px]">
                {reports.activityLog.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute top-[4px] -left-[22px] size-[8px] rounded-full bg-primary" />
                    <p className="text-[13px] font-semibold text-foreground">{item.action}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{item.time}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
