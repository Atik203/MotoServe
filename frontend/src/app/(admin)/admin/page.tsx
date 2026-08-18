"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Calendar,
  DollarSign,
  Download,
  FileBarChart,
  FileCheck,
  PackagePlus,
  Settings2,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/reportsSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { buildKpis } from "@/lib/kpis";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const kpiIcon: Record<string, typeof Users> = {
  "dollar-sign": DollarSign,
  wallet: Wallet,
  car: FileBarChart,
  "file-check": FileCheck,
  users: Users,
  wrench: Wrench,
};

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector((s) => s.reports.data);
  const jobs = useAppSelector((s) => s.jobs.items);
  const invoices = useAppSelector((s) => s.invoices.items);

  useEffect(() => {
    dispatch(fetchReports());
    dispatch(fetchJobs());
    dispatch(fetchInvoices());
  }, [dispatch]);

  const kpis = useMemo(
    () => buildKpis("admin", { reports, jobs, invoices }),
    [reports, jobs, invoices],
  );

  const chart = useMemo(() => {
    if (!reports || reports.revenueByMonth.length === 0) return null;
    const data = reports.revenueByMonth;
    const max = Math.max(...data.map((d) => d.revenue));
    if (max <= 0) return null;
    const w = 560;
    const h = 180;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const points = data.map((d, i) => `${(i * step).toFixed(1)},${(h - (d.revenue / max) * (h - 20) - 10).toFixed(1)}`);
    return { data, points: points.join(" "), max };
  }, [reports]);

  if (!reports) {
    return (
      <div className="bg-background min-h-screen p-8">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const donut = reports.serviceDistribution;
  const donutColors = ["#0052cc", "#ffc107", "#3b82f6", "#10b981"];
  const totalPct = donut.reduce((s, d) => s + d.pct, 0) || 1;
  const gradientStops = donut.length > 0 && totalPct > 0
    ? donut.reduce<{ acc: number; stops: string[] }>(
        (state, d, i) => {
          const from = (state.acc / totalPct) * 100;
          const acc = state.acc + d.pct;
          const to = (acc / totalPct) * 100;
          state.stops.push(`${donutColors[i]} ${from}% ${to}%`);
          return { acc, stops: state.stops };
        },
        { acc: 0, stops: [] },
      ).stops.join(", ")
    : `${donutColors[0]} 0% 100%`;

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground">Real-time metrics and operational status.</p>
          </div>
          <div className="flex gap-2">
            <span className="flex h-9 items-center gap-1.5 rounded border border-[#e2e8f0] bg-white px-[17px] text-xs font-semibold tracking-[0.24px] text-[#424753]">
              <Calendar className="size-[13.5px] text-muted-foreground" />
              {new Date().getFullYear()}
            </span>
            <Button
              size="sm"
              onClick={() => {
                if (!reports) return;
                const lines: string[][] = [["Metric", "Value"]];
                lines.push(["Total Revenue", String(reports.totalRevenue)]);
                lines.push(["Active Jobs", String(reports.activeJobs)]);
                lines.push(["Registered Customers", String(reports.registeredCustomers)]);
                lines.push(["Active Employees", String(reports.activeEmployees)]);
                lines.push([], ["Month", "Revenue"]);
                reports.revenueByMonth.forEach((r) => lines.push([r.month, String(r.revenue)]));
                const csv = lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = "motoserve-dashboard.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Report exported");
              }}
              className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <Download className="size-3" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {kpis.map((kpi) => {
            const Icon = kpiIcon[kpi.icon] ?? Users;
            return (
              <div
                key={kpi.id}
                className="flex h-[104px] w-[142.66px] flex-col justify-between rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-[11px] font-medium whitespace-nowrap text-muted-foreground">{kpi.label}</span>
                  <Icon className="size-[15px] text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between gap-1">
                  <span className="text-xl font-bold text-foreground">{kpi.value}</span>
                  <span
                    className={cn(
                      "rounded-xl px-2 py-0.5 text-[11px] font-medium",
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

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Monthly Revenue Trends</h2>
                <button className="rounded-sm p-1 text-muted-foreground hover:text-foreground" aria-label="Chart options">
                  ⋯
                </button>
              </div>
              {chart && (
                <div className="relative h-[280px] w-full rounded border border-dashed border-[#e2e8f0] bg-background p-4">
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
                  <div className="absolute inset-x-[16px] bottom-2 flex justify-between">
                    {chart.data.map((d) => (
                      <span key={d.month} className="text-[11px] text-muted-foreground">{d.month}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="flex gap-6">
              <section className="flex min-w-0 flex-1 flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h2 className="text-xl font-semibold text-foreground">Mechanic Workload</h2>
                <div className="flex flex-col gap-4">
                  {reports.workloadByMechanic
                    .filter((m) => m.role)
                    .map((m) => (
                      <div key={m.mechanic} className="flex items-center justify-between rounded border border-[#e2e8f0] p-[17px]">
                        <div className="flex items-center gap-4">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-muted-foreground uppercase">
                            {m.mechanic.split(" ").map((n) => n[0]).join("")}
                          </span>
                          <div>
                            <p className="text-xs font-semibold tracking-[0.24px] text-foreground">{m.mechanic}</p>
                            <p className="text-[11px] font-medium text-muted-foreground">{m.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="flex flex-col items-end rounded-xl bg-[rgba(255,193,7,0.1)] px-2 py-1 text-[11px] font-medium text-warning">
                            {m.active}
                            <span>Active</span>
                          </span>
                          <span className="flex flex-col items-end rounded-xl bg-[rgba(76,175,80,0.1)] px-2 py-1 text-[11px] font-medium text-[#4caf50]">
                            {m.completed}
                            <span>Done</span>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section className="flex min-w-0 flex-1 flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Add Service", icon: PackagePlus, href: "/admin/services/new" },
                    { label: "Add Employee", icon: UserPlus, href: "/admin/employees" },
                    { label: "Generate Report", icon: FileBarChart, href: "/admin/reports" },
                    { label: "Manage Services", icon: Settings2, href: "/admin/services" },
                  ].map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="flex flex-col items-center justify-center gap-2 rounded border border-[#e2e8f0] bg-background py-[25px] transition-colors hover:border-primary/50"
                    >
                      <a.icon className="size-5 text-muted-foreground" />
                      <span className="text-xs font-semibold tracking-[0.24px] text-foreground">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Service Distribution</h2>
              <div className="relative mx-auto size-[181px]">
                <div
                  className="flex size-32 items-center justify-center rounded-xl"
                  style={{ background: `conic-gradient(${gradientStops})`, mask: "radial-gradient(circle, transparent 56%, black 57%)", WebkitMask: "radial-gradient(circle, transparent 56%, black 57%)" }}
                >
                  <div className="flex flex-col items-center bg-white px-3">
                    <span className="text-xl font-bold text-foreground">
                      {reports.jobsByStatus.reduce((sum, j) => sum + j.count, 0)}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">Jobs</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {donut.map((d, i) => (
                  <div key={d.name} className="flex h-7 items-center gap-2">
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: donutColors[i] }} />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {d.name} ({d.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
                <span className="text-[11px] font-medium text-primary">View All</span>
              </div>
              <div className="flex flex-col gap-6 border-l-2 border-border pb-2 pl-4">
                {reports.activityLog.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute top-1 -left-[22px] size-2 rounded-full bg-primary" />
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
