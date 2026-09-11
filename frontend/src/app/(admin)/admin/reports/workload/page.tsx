"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Download,
  FileDown,
  Filter,
  Headset,
  MoreVertical,
  RefreshCw,
  Search,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/reportsSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchRatings } from "@/store/slices/ratingsSlice";
import { fetchServices } from "@/store/slices/servicesSlice";
import { Button } from "@/components/ui/button";
import { TableLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { downloadAdminReportPdf, downloadInvoicePdf } from "@/lib/pdf";
import type { ReportsData } from "@/types";

const MAX_ACTIVE_TASKS = 5;
const TABLE_PAGE = 4;
const DONUT_COLORS = ["#004492", "#ffb05f", "#783100", "#e1e3e4"];

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const pct = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 1000) / 10);

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function Donut({ data }: { data: { name: string; pct: number }[] }) {
  const total = data.reduce((s, d) => s + d.pct, 0) || 1;
  const R = 40;
  const C = 2 * Math.PI * R;
  const segments = data.reduce<{ name: string; color: string; start: number; end: number }[]>(
    (acc, d, i) => {
      const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
      return [...acc, { name: d.name, color: DONUT_COLORS[i % DONUT_COLORS.length], start, end: start + d.pct / total }];
    },
    [],
  );
  return (
    <div className="relative mx-auto size-[120px]">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e1e3e4" strokeWidth="14" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${(s.end - s.start) * C} ${C}`}
            strokeDashoffset={-s.start * C}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">100%</span>
        <span className="text-[10px] font-medium text-muted-foreground">services</span>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { month: string; revenue: number }[] }) {
  const w = 560;
  const h = 180;
  const max = Math.max(...data.map((d) => d.revenue));
  if (max <= 0) {
    return <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">No revenue data yet</div>;
  }
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((d, i) => `${(i * step).toFixed(1)},${(h - (d.revenue / max) * (h - 24) - 8).toFixed(1)}`);
  const area = `0,${h} ${points.join(" ")} ${w},${h}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[180px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#004492" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#004492" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
        ))}
        <polygon points={area} fill="url(#revFill)" />
        <polyline points={points.join(" ")} fill="none" stroke="#004492" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const [x, y] = p.split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke="#004492" strokeWidth="2.5" />;
        })}
      </svg>
      <div className="flex justify-between pt-2 text-[11px] font-medium text-muted-foreground">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  );
}

export default function WorkloadReportsPage() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector((s) => s.reports.data);
  const employees = useAppSelector((s) => s.employees.items);
  const invoices = useAppSelector((s) => s.invoices.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const ratings = useAppSelector((s) => s.ratings.items);
  const services = useAppSelector((s) => s.services.items);
  const user = useAppSelector((s) => s.auth.user);

  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [moreFilters, setMoreFilters] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!reports) dispatch(fetchReports());
    if (employees.length === 0) dispatch(fetchEmployees());
    dispatch(fetchInvoices());
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchRatings());
    if (services.length === 0) dispatch(fetchServices());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const monthlySeries = reports?.revenueByMonth ?? [];
  const lastMonth = monthlySeries.at(-1)?.revenue ?? 0;
  const prevMonth = monthlySeries.at(-2)?.revenue ?? 0;
  const lastMonthDelta = pct(lastMonth, prevMonth);

  const today = new Date(now).toDateString();
  const yesterday = new Date(now - 86400000).toDateString();
  const todayIncome = paidInvoices
    .filter((i) => i.payment?.paidAt && new Date(i.payment.paidAt).toDateString() === today)
    .reduce((s, i) => s + i.total, 0);
  const yesterdayIncome = paidInvoices
    .filter((i) => i.payment?.paidAt && new Date(i.payment.paidAt).toDateString() === yesterday)
    .reduce((s, i) => s + i.total, 0);
  const todayDelta = pct(todayIncome, yesterdayIncome);
  const receivedToday = tasks.filter((t) => new Date(t.createdAt).toDateString() === today).length;

  const completedTasks = reports?.tasksByStatus.find((t) => t.status === "completed")?.count ?? 0;
  const pendingTasks = reports?.activeTasks ?? 0;
  const totalRevenue = reports?.totalRevenue ?? 0;

  const lineData = (() => {
    if (range === "monthly") return monthlySeries;
    const days = range === "daily" ? 7 : 30;
    const bucket = new Map<string, number>();
    for (const inv of paidInvoices) {
      if (!inv.payment?.paidAt) continue;
      const d = new Date(inv.payment.paidAt);
      if (now - d.getTime() > days * 86400000) continue;
      const key =
        range === "daily"
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6) / 7)}`;
      bucket.set(key, (bucket.get(key) ?? 0) + inv.total);
    }
    return [...bucket.entries()]
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }))
      .sort((a, b) => (range === "daily" ? new Date(a.month).getTime() - new Date(b.month).getTime() : a.month.localeCompare(b.month)));
  })();

  if (!reports || employees.length === 0) {
    return <TableLoading label="Loading reports" />;
  }

  const mechanics = reports.workloadByMechanic;
  const advisors = employees.filter((e) => e.role === "advisor" && e.status === "active").length;
  const activeMechanics = employees.filter((e) => e.role === "mechanic" && e.status === "active").length;
  const utilizations = mechanics.map((m) => Math.round((m.active / MAX_ACTIVE_TASKS) * 100));

  const avgServiceMin = (() => {
    const completed = tasks.filter((t) => t.status === "completed");
    if (completed.length === 0) return 0;
    const totalMin = completed.reduce((s, j) => {
      const mins = j.services
        .map((sv) => services.find((x) => x.name === sv.name)?.durationMins ?? 0)
        .reduce((a, b) => a + b, 0);
      return s + mins;
    }, 0);
    return Math.round(totalMin / completed.length);
  })();
  const avgServiceTime = avgServiceMin > 0 ? `${(avgServiceMin / 60).toFixed(1)}h` : "—";

  const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : "—";

  const ranking = mechanics
    .map((m, i) => {
      const mechanicId = employees.find((e) => e.name === m.mechanic)?.id;
      const mechanicTasks = mechanicId ? tasks.filter((t) => t.mechanicId === mechanicId) : [];
      const rated = mechanicTasks
        .map((t) => ratings.find((r) => r.taskId === t.id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r));
      return {
        ...m,
        util: utilizations[i] ?? 0,
        rating: rated.length > 0 ? (rated.reduce((s, r) => s + r.score, 0) / rated.length).toFixed(1) : "—",
      };
    })
    .sort((a, b) => b.completed - a.completed);

  const historyRows = invoices
    .map((inv) => {
      const task = tasks.find((t) => t.id === inv.taskId);
      return {
        inv,
        task,
        vehicle: task?.vehicle ?? vehicles.find((v) => v.id === inv.vehicleId),
        customer: task?.customer?.name ?? "Vehicle Owner",
      };
    })
    .sort((a, b) => new Date(b.inv.issuedAt).getTime() - new Date(a.inv.issuedAt).getTime());

  const historyPageRows = historyRows
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.inv.id.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        (r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}`.toLowerCase().includes(q) : false) ||
        (r.inv.items[0]?.description.toLowerCase().includes(q) ?? false)
      );
    })
    .slice(page * TABLE_PAGE, (page + 1) * TABLE_PAGE);
  const historyCount = Math.max(1, Math.ceil(historyRows.length / TABLE_PAGE));

  const laborTotal = invoices.reduce((s, i) => s + i.laborTotal, 0);
  const partsTotal = invoices.reduce((s, i) => s + i.partsTotal, 0);
  const taxTotal = invoices.reduce((s, i) => s + i.tax, 0);

  const refresh = () => {
    dispatch(fetchReports());
    dispatch(fetchInvoices());
    toast.success("Reports refreshed");
  };

  const handleGenerateReportPdf = () => {
    if (!reports) return;

    const reportPayload: ReportsData = {
      ...reports,
      incomeSummary: reports.incomeSummary ?? {
        totalRevenue: reports.totalRevenue ?? 0,
        pendingRevenue: invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0),
        laborRevenue: laborTotal,
        partsRevenue: partsTotal,
        taxRevenue: taxTotal,
        paidCount: paidInvoices.length,
        unpaidCount: invoices.length - paidInvoices.length,
      },
      serviceHistory: reports.serviceHistory && reports.serviceHistory.length > 0
        ? reports.serviceHistory
        : historyRows.map((r) => ({
            id: r.inv.id,
            taskId: r.inv.taskId,
            date: r.inv.issuedAt,
            customer: r.customer,
            vehicle: r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model}` : "Vehicle",
            regNo: r.vehicle?.regNo ?? "—",
            service: r.inv.items[0]?.description ?? r.task?.services.map((s: { name: string }) => s.name).join(", ") ?? "Vehicle Service",
            mechanic: r.task?.mechanic?.name ?? (r.task?.mechanics && r.task.mechanics.length > 0 ? r.task.mechanics.map((m: { name: string }) => m.name).join(", ") : "Unassigned"),
            status: r.inv.status,
            total: r.inv.total,
          })),
      performanceSummary: reports.performanceSummary ?? {
        completedTasks: completedTasks,
        avgRating: ratings.length > 0 ? Number((ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)) : 5.0,
        totalRatingsCount: ratings.length,
      },
    };

    downloadAdminReportPdf(reportPayload, {
      generatedBy: user?.name ?? "Administrator",
      range: range === "daily" ? "Daily" : range === "weekly" ? "Weekly" : "Monthly",
    });
    toast.success("Admin Report PDF downloaded");
  };

  return (
    <div className="bg-[#f3f4f5] min-h-screen">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-8 pt-8 pb-16">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.24px] text-[#424753]">
              <span>Dashboard</span>
              <span>›</span>
              <span>Reports</span>
              <span>›</span>
              <span className="text-foreground">Workload</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">Workload, revenue and mechanic performance analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-[17px] py-[9px] text-sm font-medium text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleGenerateReportPdf} className="gap-2 rounded-md bg-[#004492] px-5 py-[9px] text-sm font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90">
              <FileDown className="size-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <div className="flex items-center rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-md bg-[#f3f4f5] p-[5px]">
              {(["daily", "weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    range === r ? "bg-white text-[#004492] shadow-[0_1px_1px_rgba(0,0,0,0.05)]" : "text-[#424753] hover:text-foreground",
                  )}
                >
                  {r === "weekly" ? "Week" : r === "monthly" ? "Month" : "Today"}
                </button>
              ))}
              <span className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-[#424753]">
                <Calendar className="size-3.5" />
                Custom
              </span>
            </div>
            <div className="h-8 w-px bg-[#e2e8f0]" />
            <div className="flex items-center gap-3">
              {["All Branches", "All Vehicle Types", "All Services"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-normal text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  {label}
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMoreFilters((v) => !v)}
                className="flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium text-[#424753] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <Filter className="size-3.5" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {moreFilters && (
          <div className="flex items-center gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <span className="text-xs font-semibold tracking-[0.55px] text-[#424753] uppercase">Advanced filters</span>
            <select className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm text-foreground outline-none">
              {["All Statuses", "Received", "Inspecting", "Repairing", "Testing", "Ready", "Completed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className="h-9 rounded-md border border-[#e2e8f0] bg-white px-3 text-sm text-foreground outline-none">
              <option>All Mechanics</option>
              {mechanics.map((m) => (
                <option key={m.mechanic}>{m.mechanic}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => toast.success("Filters applied — see table below")}
              className="rounded-md bg-[#004492] px-4 py-2 text-sm font-semibold text-white"
            >
              Apply
            </button>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="relative flex w-[174px] shrink-0 flex-col justify-between overflow-hidden rounded-[12px] bg-[#004492] p-4 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="absolute -top-4 -right-4 size-28 rounded-full bg-[rgba(255,255,255,0.08)]" />
            <div className="absolute -top-8 -right-10 size-36 rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="relative flex flex-col gap-1">
              <span className="text-sm font-medium text-[#acc7ff]">Total Revenue (YTD)</span>
              <span className="text-[30px] font-bold leading-9 text-white">{money(totalRevenue)}</span>
            </div>
            <div className="relative flex items-center justify-between pt-4">
              <span className="flex items-center gap-1 rounded-sm bg-[rgba(76,175,80,0.2)] px-2 py-0.5 text-sm font-medium text-white">
                <ArrowUpRight className="size-3" />
                YTD
              </span>
              <span className="text-xs text-[#acc7ff]">paid invoices</span>
            </div>
          </div>

          {[
            { label: "Monthly Revenue", value: money(lastMonth), delta: lastMonthDelta, deltaLabel: "vs last month", icon: <BarChart3 className="size-4" /> },
            { label: "Today's Income", value: money(todayIncome), delta: todayDelta, deltaLabel: "vs yesterday", icon: <Calendar className="size-4" /> },
            { label: "Completed Tasks", value: String(completedTasks), delta: null, deltaLabel: "this month", icon: <Wrench className="size-4" /> },
            { label: "Pending Tasks", value: String(pendingTasks), delta: null, deltaLabel: `${receivedToday} since morning`, icon: <Clock className="size-4" /> },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="flex w-[174px] shrink-0 flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#424753]">{kpi.label}</span>
                <span className="text-muted-foreground">{kpi.icon}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
              <div className="flex items-center gap-2 pt-2 text-sm">
                {kpi.delta !== null ? (
                  <span className={cn("flex items-center gap-0.5 font-medium", kpi.delta >= 0 ? "text-[#4caf50]" : "text-[#f44336]")}>
                    {kpi.delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(kpi.delta)}%
                  </span>
                ) : null}
                <span className="text-xs text-[#64748b]">{kpi.deltaLabel}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {[
            { label: "Avg Service Time", value: avgServiceTime, tile: "bg-[rgba(0,68,146,0.1)]", color: "text-[#004492]", icon: <Clock className="size-[18px]" /> },
            { label: "Avg Customer Rating", value: `${avgRating} /5`, tile: "bg-[rgba(255,193,7,0.1)]", color: "text-[#8b5000]", icon: <Star className="size-[18px]" /> },
            { label: "Active Mechanics", value: `${activeMechanics} On Shift`, tile: "bg-[rgba(139,80,0,0.1)]", color: "text-[#8b5000]", icon: <Users className="size-[18px]" /> },
            { label: "Active Advisors", value: `${advisors} On Shift`, tile: "bg-[rgba(76,175,80,0.1)]", color: "text-[#4caf50]", icon: <Headset className="size-[18px]" /> },
          ].map((s) => (
            <div key={s.label} className="flex flex-1 items-center gap-4 rounded-[12px] border border-[#e2e8f0] bg-white px-[17px] py-[9px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <span className={cn("flex size-10 items-center justify-center rounded-md", s.tile, s.color)}>{s.icon}</span>
              <div>
                <p className="text-xs font-medium text-[#424753]">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 items-start gap-4">
          <div className="col-span-2 rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-semibold text-foreground">Revenue Trend</h2>
              <div className="flex items-center rounded-md bg-[#f3f4f5] p-[3px]">
                {(["daily", "weekly", "monthly"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
                      range === r ? "bg-[#004492] text-white" : "text-[#424753] hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <LineChart data={lineData} />
          </div>

          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-semibold text-foreground">Revenue by Service</h2>
              <button type="button" aria-label="More options" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="size-4" />
              </button>
            </div>
            <Donut data={reports.serviceDistribution} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4">
              {reports.serviceDistribution.slice(0, 4).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="flex-1 truncate text-[#424753]">{d.name}</span>
                  <span className="font-semibold text-foreground">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Service History</h2>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search invoice..."
                className="h-9 w-60 rounded-md border border-[#e2e8f0] bg-white pl-9 pr-3 text-sm text-foreground outline-none focus:border-[#004492]"
              />
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8f9fa] text-[11px] font-semibold tracking-[0.55px] text-[#424753] uppercase">
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Customer / Vehicle</th>
                <th className="px-6 py-3.5">Service Type</th>
                <th className="px-6 py-3.5">Mechanic</th>
                <th className="px-6 py-3.5 text-right">Total</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyPageRows.map(({ inv, task, vehicle, customer }) => (
                <tr key={inv.id} className="border-t border-[#e2e8f0] transition-colors hover:bg-[#f8f9fa]">
                  <td className="px-6 py-3.5 text-sm font-semibold text-[#004492]">{inv.id}</td>
                  <td className="px-6 py-3.5 text-sm text-foreground">
                    {new Date(inv.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground">
                    {customer}
                    {vehicle ? <span className="text-muted-foreground"> · {vehicle.year} {vehicle.make} {vehicle.model}</span> : null}
                  </td>
                  <td className="max-w-[220px] truncate px-6 py-3.5 text-sm text-[#424753]">
                    {inv.items[0]?.description ?? task?.services.map((s: { name: string }) => s.name).join(", ") ?? "—"}
                  </td>
                  <td className="px-6 py-3.5 text-sm text-[#424753]">{task?.mechanic?.name ?? "—"}</td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-foreground">{money(inv.total)}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-xl px-[9px] py-[5px] text-[11px] font-medium",
                        inv.status === "paid" ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" : "bg-[rgba(255,193,7,0.1)] text-[#8b5000]",
                      )}
                    >
                      {inv.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <button
                      type="button"
                      aria-label={`Download ${inv.id}`}
                      onClick={() => { downloadInvoicePdf(inv, vehicle); toast.success(`Invoice ${inv.id} downloaded`); }}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-[#f3f4f5] hover:text-foreground"
                    >
                      <Download className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {historyPageRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-sm text-muted-foreground">No invoices match your search.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-6 py-3 text-xs font-medium text-[#424753]">
            <span>
              Showing {historyRows.length === 0 ? 0 : page * TABLE_PAGE + 1} to {Math.min((page + 1) * TABLE_PAGE, historyRows.length)} of {historyRows.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-[#e2e8f0] bg-white px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(historyCount, 5) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={cn(
                    "size-7 rounded border text-sm transition-colors",
                    page === i ? "border-[#004492] bg-[#004492] font-semibold text-white" : "border-[#e2e8f0] bg-white text-[#424753] hover:bg-secondary",
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= Math.ceil(historyRows.length / TABLE_PAGE) - 1}
                onClick={() => setPage((p) => Math.min(Math.ceil(historyRows.length / TABLE_PAGE) - 1, p + 1))}
                className="rounded border border-[#e2e8f0] bg-white px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 items-start gap-4">
          <div className="flex flex-col gap-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-lg font-semibold text-foreground">Revenue Breakdown</h2>
            <div className="flex flex-col gap-3 text-sm">
              {[
                { label: "Labor", value: money(laborTotal), tint: "bg-[rgba(0,68,146,0.1)] text-[#004492]" },
                { label: "Parts", value: money(partsTotal), tint: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
                { label: "Tax", value: money(taxTotal), tint: "bg-[#e1e3e4] text-[#424753]" },
                { label: "Discounts", value: "-$0", tint: "bg-[rgba(244,67,54,0.1)] text-[#f44336]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className={cn("flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold", row.tint)}>{row.label}</span>
                  <span className="font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-[#e2e8f0] pt-3">
              <span className="text-sm font-medium text-[#424753]">Net Income</span>
              <span className="text-xl font-bold text-[#004492]">{money(totalRevenue)}</span>
            </div>
          </div>

          <div className="col-span-2 rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-semibold text-foreground">Top Performing Mechanics</h2>
              <span className="text-xs font-semibold text-[#004492]">View All</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[11px] font-semibold tracking-[0.55px] text-[#424753] uppercase">
                  <th className="pb-3">Mechanic</th>
                  <th className="pb-3 text-center">Tasks Completed</th>
                  <th className="pb-3">Workload %</th>
                  <th className="pb-3 text-center">Avg Rating</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((m, i) => (
                  <tr key={m.mechanic} className="border-b border-[#e2e8f0] last:border-0">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.2)] text-xs font-bold text-[#004492]">
                          {initials(m.mechanic)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{m.mechanic}</p>
                          <p className="text-[11px] text-muted-foreground">{m.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-center text-sm font-semibold text-foreground">{m.completed}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-36 overflow-hidden rounded-xl bg-[#e1e3e4]">
                          <div
                            className={cn("h-full rounded-xl", i === 0 ? "bg-[#4caf50]" : i === 1 ? "bg-[#004492]" : "bg-[#ffc107]")}
                            style={{ width: `${Math.min(m.util, 100)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold text-muted-foreground">{m.util}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-center text-sm font-semibold text-foreground">{m.rating}</td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No mechanics assigned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}