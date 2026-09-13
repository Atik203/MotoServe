"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Clock,
  DollarSign,
  Download,
  FileBarChart,
  FileCheck,
  PackagePlus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/reportsSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchAppointments, updateAppointment } from "@/store/slices/appointmentsSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { buildKpis } from "@/lib/kpis";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DashboardLoading } from "@/components/ui/loading";

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
  const tasks = useAppSelector((s) => s.tasks.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const appointments = useAppSelector((s) => s.appointments.items);
  const customers = useAppSelector((s) => s.customers.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchReports());
    dispatch(fetchTasks());
    dispatch(fetchInvoices());
    dispatch(fetchAppointments());
    dispatch(fetchCustomers());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const refreshAll = () => {
    dispatch(fetchReports());
    dispatch(fetchTasks());
    dispatch(fetchInvoices());
    dispatch(fetchAppointments());
    dispatch(fetchCustomers());
    dispatch(fetchVehicles());
    toast.success("Dashboard metrics refreshed");
  };

  const kpis = useMemo(
    () => buildKpis("admin", { reports, tasks, invoices }),
    [reports, tasks, invoices],
  );

  const pendingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "pending").slice(0, 3),
    [appointments],
  );

  const inServiceTasks = useMemo(
    () => tasks.filter((t) => ["received", "inspecting", "repairing", "testing"].includes(t.status)).slice(0, 4),
    [tasks],
  );

  const handleQuickConfirmAppointment = async (id: string) => {
    setActionBusyId(id);
    try {
      await dispatch(updateAppointment({ id, data: { status: "confirmed" } })).unwrap();
      toast.success("Appointment confirmed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setActionBusyId(null);
    }
  };

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
    return <DashboardLoading label="Loading admin dashboard" />;
  }

  const donut = reports.serviceDistribution;
  const donutColors = ["#0052cc", "#ffc107", "#3b82f6", "#10b981", "#8b5cf6"];
  const totalPct = donut.reduce((s, d) => s + d.pct, 0) || 1;
  const gradientStops =
    donut.length > 0 && totalPct > 0
      ? donut.reduce<{ acc: number; stops: string[] }>(
          (state, d, i) => {
            const from = (state.acc / totalPct) * 100;
            const acc = state.acc + d.pct;
            const to = (acc / totalPct) * 100;
            state.stops.push(`${donutColors[i % donutColors.length]} ${from}% ${to}%`);
            return { acc, stops: state.stops };
          },
          { acc: 0, stops: [] },
        ).stops.join(", ")
      : `${donutColors[0]} 0% 100%`;

  const exportReport = () => {
    const lines: string[][] = [["Metric", "Value"]];
    lines.push(["Total Revenue", String(reports.totalRevenue)]);
    lines.push(["Active Tasks", String(reports.activeTasks)]);
    lines.push(["Registered Customers", String(reports.registeredCustomers)]);
    lines.push(["Active Employees", String(reports.activeEmployees)]);
    lines.push([], ["Month", "Revenue"]);
    reports.revenueByMonth.forEach((r) => lines.push([r.month, String(r.revenue)]));
    const csv = lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `motoserve-dashboard-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dashboard metrics exported");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f5] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Controls */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-[#424753]">
            <span className="text-muted-foreground">Dashboard</span>
            <span>›</span>
            <span className="text-foreground">Overview</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Workshop Executive Overview</h1>
              <p className="text-xs text-muted-foreground pt-0.5">
                Real-time operational status, revenue velocity, bay utilization, and staffing metrics.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3.5 text-xs font-semibold tracking-[0.24px] text-[#424753] shadow-xs">
                <Calendar className="size-3.5 text-[#004492]" />
                Fiscal Year {new Date().getFullYear()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-semibold text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-secondary"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={exportReport}
                className="gap-1.5 rounded-md bg-[#004492] px-4 py-2 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
              >
                <Download className="size-3.5" />
                Export Metrics
              </Button>
            </div>
          </div>
        </div>

        {/* Responsive KPI Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {kpis.map((kpi) => {
            const Icon = kpiIcon[kpi.icon] ?? Users;
            return (
              <div
                key={kpi.id}
                className="flex h-28 flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <div className="flex w-full items-start justify-between">
                  <span className="text-[11px] font-semibold text-[#424753] line-clamp-1">{kpi.label}</span>
                  <Icon className="size-4 text-[#004492]" />
                </div>
                <div className="flex items-end justify-between gap-1">
                  <span className="text-xl font-bold text-foreground">{kpi.value}</span>
                  <span
                    className={cn(
                      "rounded-lg px-1.5 py-0.2 text-[10px] font-semibold",
                      kpi.trend === "up" && "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
                      kpi.trend === "down" && "bg-[rgba(255,193,7,0.12)] text-[#b45309]",
                      kpi.trend === "flat" && "bg-[#f3f4f5] text-muted-foreground",
                    )}
                  >
                    {kpi.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Urgent Action Row: Pending Approvals & Active Bay Work */}
        {pendingAppointments.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-[#fffbeb] p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-[#92400e] uppercase tracking-wide">
                  Action Required: {pendingAppointments.length} Customer Appointment{pendingAppointments.length === 1 ? "" : "s"} Awaiting Confirmation
                </span>
              </div>
              <Link
                href="/admin/appointments"
                className="text-xs font-bold text-[#004492] hover:underline flex items-center gap-1"
              >
                Manage All Appointments
                <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              {pendingAppointments.map((appt) => {
                const customer = customers.find((c) => c.id === appt.ownerId) ?? appt.owner;
                const vehicle = vehicles.find((v) => v.id === appt.vehicleId);
                return (
                  <div
                    key={appt.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white p-3 border border-amber-200/80 shadow-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                        <Clock className="size-3 text-[#004492]" />
                        <span>{appt.date}</span>
                        <span className="text-muted-foreground">· {appt.time}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#424753] truncate mt-0.5">
                        {customer?.name || "Customer"} — {vehicle ? `${vehicle.year} ${vehicle.make}` : "Vehicle"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={actionBusyId === appt.id}
                      onClick={() => void handleQuickConfirmAppointment(appt.id)}
                      className="h-7 px-2.5 rounded text-[11px] font-semibold bg-[#15803d] text-white hover:bg-[#15803d]/90 shrink-0"
                    >
                      <CalendarCheck className="size-3 mr-1" />
                      Confirm
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-12 items-start gap-6">
          {/* Left Column (8 cols) */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
            {/* Monthly Revenue Trend Line Chart */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Monthly Revenue Velocity</h2>
                  <p className="text-xs text-muted-foreground">Realized income trend across workshop billing cycles.</p>
                </div>
                <span className="rounded bg-[#eff6ff] px-2.5 py-1 text-xs font-bold text-[#004492] border border-[#bfdbfe]">
                  YTD: ${(reports.totalRevenue || 0).toLocaleString()}
                </span>
              </div>
              {chart && (
                <div className="relative h-[260px] w-full rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8f9fa] p-4">
                  <svg viewBox={`0 0 560 180`} className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,68,146,0.12)" />
                        <stop offset="100%" stopColor="rgba(0,68,146,0)" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <line key={f} x1="0" x2="560" y1={180 * f} y2={180 * f} stroke="#e2e8f0" strokeDasharray="4 4" />
                    ))}
                    <polygon points={`0,180 ${chart.points} 560,180`} fill="url(#revFill)" />
                    <polyline points={chart.points} fill="none" stroke="#004492" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute inset-x-4 bottom-2 flex justify-between">
                    {chart.data.map((d) => (
                      <span key={d.month} className="text-[11px] font-medium text-muted-foreground">
                        {d.month}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* In-Bay Active Operations & Mechanic Workload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Active Workshop Tasks */}
              <section className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <h2 className="text-base font-bold text-foreground">Active Bay Intakes</h2>
                  <Link href="/admin/reports" className="text-xs font-semibold text-[#004492] hover:underline">
                    View All
                  </Link>
                </div>
                <div className="flex flex-col gap-2.5">
                  {inServiceTasks.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">No vehicles currently in service.</p>
                  ) : (
                    inServiceTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border border-[#e2e8f0] p-3 transition-colors hover:bg-[#f8f9fa]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground">
                            {task.vehicle ? `${task.vehicle.year} ${task.vehicle.make} ${task.vehicle.model}` : "Vehicle"}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">{task.id}</p>
                        </div>
                        <span className="rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[10px] font-bold text-[#004492] uppercase border border-[#bfdbfe]">
                          {task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Mechanic Productivity & Workload */}
              <section className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <h2 className="text-base font-bold text-foreground">Staff Technician Workload</h2>
                  <Link href="/admin/employees" className="text-xs font-semibold text-[#004492] hover:underline">
                    Roster
                  </Link>
                </div>
                <div className="flex flex-col gap-2.5">
                  {reports.workloadByMechanic.slice(0, 4).map((m) => (
                    <div
                      key={m.mechanic}
                      className="flex items-center justify-between rounded-lg border border-[#e2e8f0] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)] text-xs font-bold text-[#004492] uppercase">
                          {m.mechanic.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{m.mechanic}</p>
                          <p className="text-[10px] text-muted-foreground">{m.role || "Technician"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {m.active} Active
                        </span>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {m.completed} Done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            {/* Service Distribution Donut */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-bold text-foreground">Service Demand Share</h2>
              <div className="relative mx-auto size-[170px]">
                <div
                  className="flex size-32 items-center justify-center rounded-full transition-all"
                  style={{
                    background: `conic-gradient(${gradientStops})`,
                    mask: "radial-gradient(circle, transparent 56%, black 57%)",
                    WebkitMask: "radial-gradient(circle, transparent 56%, black 57%)",
                  }}
                >
                  <div className="flex flex-col items-center bg-white px-3">
                    <span className="text-xl font-black text-foreground">
                      {(reports.tasksByStatus ?? []).reduce((sum, t) => sum + t.count, 0)}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Tasks</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {donut.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: donutColors[i % donutColors.length] }}
                    />
                    <span className="text-[11px] font-medium text-[#424753] truncate">
                      {d.name} ({d.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions Shortcuts */}
            <section className="flex flex-col gap-3 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-bold text-foreground">Management Shortcuts</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Book Appt", icon: CalendarPlus, href: "/admin/appointments" },
                  { label: "New Service", icon: PackagePlus, href: "/admin/services/new" },
                  { label: "Add Employee", icon: UserPlus, href: "/admin/employees" },
                  { label: "Customers", icon: ShieldCheck, href: "/admin/verifications" },
                  { label: "Financials", icon: FileBarChart, href: "/admin/reports" },
                  { label: "Catalog", icon: Settings2, href: "/admin/services" },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] py-3.5 transition-colors hover:border-[#004492]/50 hover:bg-[#eff6ff]"
                  >
                    <a.icon className="size-4 text-[#004492]" />
                    <span className="text-xs font-semibold text-foreground">{a.label}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recent Activity Log */}
            <section className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
                <Link href="/admin/activity" className="text-xs font-semibold text-[#004492] hover:underline">
                  View All
                </Link>
              </div>
              <div className="flex flex-col gap-4 border-l-2 border-[#bfdbfe] pl-4">
                {reports.activityLog.slice(0, 5).map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-[#004492]" />
                    <p className="text-xs font-bold text-foreground leading-tight">{item.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
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
