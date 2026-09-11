"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  RefreshCw,
  RotateCcw,
  Search,
  Star,
  Users,
  Wrench,
  X,
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
const TABLE_PAGE = 5;
const DONUT_COLORS = ["#004492", "#ffb05f", "#783100", "#388e3c", "#e1e3e4"];

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
  const validData = data.filter((d) => d.pct > 0);
  const total = validData.reduce((s, d) => s + d.pct, 0) || 1;
  const R = 40;
  const C = 2 * Math.PI * R;
  const segments = validData.reduce<{ name: string; color: string; start: number; end: number }[]>(
    (acc, d, i) => {
      const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
      return [...acc, { name: d.name, color: DONUT_COLORS[i % DONUT_COLORS.length], start, end: start + d.pct / total }];
    },
    [],
  );

  if (validData.length === 0) {
    return (
      <div className="relative mx-auto flex size-[120px] items-center justify-center rounded-full border border-dashed border-border text-center text-xs text-muted-foreground">
        No data
      </div>
    );
  }

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
  if (max <= 0 || data.length === 0) {
    return <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">No revenue in selected period</div>;
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
      <div className="flex justify-between pt-2 text-[11px] font-medium text-muted-foreground overflow-x-auto">
        {data.map((d) => (
          <span key={d.month} className="truncate px-1 text-center">{d.month}</span>
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

  // Filter States
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "yearly" | "all" | "custom">("monthly");
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const [station, setStation] = useState<string>("all");
  const [vehicleType, setVehicleType] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");

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

  // Derived Filter Options from Real Data
  const availableStations = (() => {
    const fromTasks = tasks.map((t) => t.station?.trim()).filter((s): s is string => Boolean(s && s.length > 0));
    const defaults = ["Main Bay / Station 01", "Station 02", "Station 03", "Station 04", "Diagnostics Bay"];
    return Array.from(new Set([...fromTasks, ...defaults])).sort();
  })();

  const availableFuelTypes = (() => {
    const fuels = vehicles.map((v) => v.fuelType).filter(Boolean);
    const defaults = ["gasoline", "diesel", "hybrid", "electric"];
    return Array.from(new Set([...fuels, ...defaults])).sort();
  })();

  const availableMakes = (() => {
    return Array.from(new Set(vehicles.map((v) => v.make).filter(Boolean))).sort();
  })();

  const availableServices = (() => {
    return Array.from(new Set(services.map((s) => s.name).filter(Boolean))).sort();
  })();

  const availableMechanics = employees.filter((e) => e.role === "mechanic").map((e) => e.name).sort();

  // Active filters helper
  const isFilterActive =
    range !== "monthly" ||
    station !== "all" ||
    vehicleType !== "all" ||
    serviceFilter !== "all" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    mechanicFilter !== "all" ||
    search.trim() !== "";

  const handleResetFilters = () => {
    setRange("monthly");
    setStation("all");
    setVehicleType("all");
    setServiceFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setMechanicFilter("all");
    setSearch("");
    setPage(0);
    toast.info("Filters reset to default");
  };

  // Date Range Checker
  const isInDateRange = (dateStr?: string | Date | null): boolean => {
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return false;

    if (range === "all") return true;
    if (range === "daily") {
      const today = new Date(now).toDateString();
      return new Date(time).toDateString() === today;
    }
    if (range === "weekly") {
      return now - time <= 7 * 86400000;
    }
    if (range === "monthly") {
      return now - time <= 30 * 86400000;
    }
    if (range === "yearly") {
      return now - time <= 365 * 86400000;
    }
    if (range === "custom") {
      const start = customStart ? new Date(`${customStart}T00:00:00`).getTime() : -Infinity;
      const end = customEnd ? new Date(`${customEnd}T23:59:59`).getTime() : Infinity;
      return time >= start && time <= end;
    }
    return true;
  };

  // Filter Tasks dynamically
  const filteredTasks = tasks.filter((t) => {
    if (!isInDateRange(t.createdAt)) return false;

    if (station !== "all" && t.station !== station) return false;

    const v = t.vehicle ?? vehicles.find((veh) => veh.id === t.vehicleId);
    if (vehicleType !== "all") {
      if (vehicleType.startsWith("fuel:")) {
        const f = vehicleType.replace("fuel:", "").toLowerCase();
        if (v?.fuelType?.toLowerCase() !== f) return false;
      } else if (vehicleType.startsWith("make:")) {
        const m = vehicleType.replace("make:", "").toLowerCase();
        if (v?.make?.toLowerCase() !== m) return false;
      }
    }

    if (serviceFilter !== "all") {
      if (serviceFilter.startsWith("cat:")) {
        const cat = serviceFilter.replace("cat:", "").toLowerCase();
        const matchCat = t.services.some((sv) => {
          const sInfo = services.find((s) => s.name.toLowerCase() === sv.name.toLowerCase());
          return sInfo?.category?.toLowerCase() === cat;
        });
        if (!matchCat) return false;
      } else {
        const matchName = t.services.some((sv) => sv.name.toLowerCase() === serviceFilter.toLowerCase());
        if (!matchName) return false;
      }
    }

    if (statusFilter !== "all" && t.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (mechanicFilter !== "all") {
      const matchesMech =
        t.mechanic?.name === mechanicFilter ||
        t.mechanics?.some((m) => m.name === mechanicFilter) ||
        employees.find((e) => e.id === t.mechanicId)?.name === mechanicFilter;
      if (!matchesMech) return false;
    }

    return true;
  });

  // Filter Invoices dynamically
  const filteredInvoices = invoices.filter((inv) => {
    const task = tasks.find((t) => t.id === inv.taskId);
    const v = task?.vehicle ?? vehicles.find((veh) => veh.id === inv.vehicleId);

    if (!isInDateRange(inv.issuedAt)) return false;

    if (station !== "all" && task?.station !== station) return false;

    if (vehicleType !== "all") {
      if (vehicleType.startsWith("fuel:")) {
        const f = vehicleType.replace("fuel:", "").toLowerCase();
        if (v?.fuelType?.toLowerCase() !== f) return false;
      } else if (vehicleType.startsWith("make:")) {
        const m = vehicleType.replace("make:", "").toLowerCase();
        if (v?.make?.toLowerCase() !== m) return false;
      }
    }

    if (serviceFilter !== "all") {
      const taskServices = task?.services ?? [];
      if (serviceFilter.startsWith("cat:")) {
        const cat = serviceFilter.replace("cat:", "").toLowerCase();
        const matchCat = taskServices.some((sv) => {
          const sInfo = services.find((s) => s.name.toLowerCase() === sv.name.toLowerCase());
          return sInfo?.category?.toLowerCase() === cat;
        });
        if (!matchCat) return false;
      } else {
        const matchName =
          taskServices.some((sv) => sv.name.toLowerCase() === serviceFilter.toLowerCase()) ||
          inv.items?.some((it) => it.description.toLowerCase().includes(serviceFilter.toLowerCase()));
        if (!matchName) return false;
      }
    }

    if (statusFilter !== "all" && task && task.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (paymentFilter === "paid" && inv.status !== "paid") return false;
    if (paymentFilter === "pending" && inv.status === "paid") return false;

    if (mechanicFilter !== "all") {
      const matchesMech =
        task?.mechanic?.name === mechanicFilter ||
        task?.mechanics?.some((m) => m.name === mechanicFilter) ||
        employees.find((e) => e.id === task?.mechanicId)?.name === mechanicFilter;
      if (!matchesMech) return false;
    }

    return true;
  });

  // Dynamic Financial Aggregates
  const filteredPaidInvoices = filteredInvoices.filter((i) => i.status === "paid");
  const totalRevenue = filteredPaidInvoices.reduce((s, i) => s + i.total, 0);
  const pendingRevenue = filteredInvoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const laborTotal = filteredInvoices.reduce((s, i) => s + i.laborTotal, 0);
  const partsTotal = filteredInvoices.reduce((s, i) => s + i.partsTotal, 0);
  const taxTotal = filteredInvoices.reduce((s, i) => s + i.tax, 0);

  // Period / Month Comparison
  const todayStr = new Date(now).toDateString();
  const yesterdayStr = new Date(now - 86400000).toDateString();
  const todayIncome = filteredPaidInvoices
    .filter((i) => i.payment?.paidAt && new Date(i.payment.paidAt).toDateString() === todayStr)
    .reduce((s, i) => s + i.total, 0);
  const yesterdayIncome = filteredPaidInvoices
    .filter((i) => i.payment?.paidAt && new Date(i.payment.paidAt).toDateString() === yesterdayStr)
    .reduce((s, i) => s + i.total, 0);
  const todayDelta = pct(todayIncome, yesterdayIncome);

  const completedTasksCount = filteredTasks.filter((t) => t.status === "completed").length;
  const pendingTasksCount = filteredTasks.filter((t) => !["completed", "ready"].includes(t.status)).length;
  const receivedToday = filteredTasks.filter((t) => new Date(t.createdAt).toDateString() === todayStr).length;

  // Revenue Trend Chart Points
  const lineData = (() => {
    if (range === "daily") {
      const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
      const bucket = new Map<string, number>();
      hours.forEach((h) => bucket.set(h, 0));
      for (const inv of filteredPaidInvoices) {
        const d = new Date(inv.payment?.paidAt ?? inv.issuedAt);
        const closest = hours.reduce((prev, curr) => (Math.abs(Number(curr.slice(0, 2)) - d.getHours()) < Math.abs(Number(prev.slice(0, 2)) - d.getHours()) ? curr : prev), hours[0]);
        bucket.set(closest, (bucket.get(closest) ?? 0) + inv.total);
      }
      return [...bucket.entries()].map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
    }

    if (range === "weekly") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const bucket = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        bucket.set(`${days[d.getDay()]} ${d.getDate()}`, 0);
      }
      for (const inv of filteredPaidInvoices) {
        const d = new Date(inv.payment?.paidAt ?? inv.issuedAt);
        const key = `${days[d.getDay()]} ${d.getDate()}`;
        if (bucket.has(key)) {
          bucket.set(key, (bucket.get(key) ?? 0) + inv.total);
        }
      }
      return [...bucket.entries()].map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
    }

    if (range === "monthly") {
      const bucket = new Map<string, number>();
      ["W1", "W2", "W3", "W4"].forEach((w) => bucket.set(w, 0));
      for (const inv of filteredPaidInvoices) {
        const d = new Date(inv.payment?.paidAt ?? inv.issuedAt);
        const weekNum = Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
        const key = `W${weekNum}`;
        bucket.set(key, (bucket.get(key) ?? 0) + inv.total);
      }
      return [...bucket.entries()].map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
    }

    // yearly / all / custom
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const bucket = new Map<string, number>();
    months.forEach((m) => bucket.set(m, 0));
    for (const inv of filteredPaidInvoices) {
      const d = new Date(inv.payment?.paidAt ?? inv.issuedAt);
      const mName = months[d.getMonth()];
      bucket.set(mName, (bucket.get(mName) ?? 0) + inv.total);
    }
    return [...bucket.entries()].map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));
  })();

  // Operational Secondary Metrics
  const avgServiceMin = (() => {
    const completed = filteredTasks.filter((t) => t.status === "completed");
    if (completed.length === 0) return 0;
    const totalMin = completed.reduce((s, j) => {
      const mins = j.services
        .map((sv) => services.find((x) => x.name.toLowerCase() === sv.name.toLowerCase())?.durationMins ?? 0)
        .reduce((a, b) => a + b, 0);
      return s + mins;
    }, 0);
    return Math.round(totalMin / completed.length);
  })();

  const avgServiceTime = avgServiceMin > 0 ? `${(avgServiceMin / 60).toFixed(1)}h` : "—";

  const filteredRatings = ratings.filter((r) => filteredTasks.some((t) => t.id === r.taskId));

  const avgRating = (() => {
    if (filteredRatings.length > 0) {
      return (filteredRatings.reduce((s, r) => s + r.score, 0) / filteredRatings.length).toFixed(1);
    }
    return ratings.length > 0 ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : "5.0";
  })();

  const activeMechanicCount = mechanicFilter !== "all"
    ? 1
    : employees.filter((e) => e.role === "mechanic" && e.status === "active").length;

  const activeAdvisorCount = employees.filter((e) => e.role === "advisor" && e.status === "active").length;

  // Dynamic Service Distribution (Donut)
  const serviceDistribution = (() => {
    const counts = new Map<string, number>();
    for (const t of filteredTasks) {
      for (const sv of t.services) {
        counts.set(sv.name, (counts.get(sv.name) ?? 0) + 1);
      }
    }
    const totalCount = [...counts.values()].reduce((a, b) => a + b, 0);
    if (totalCount > 0) {
      return [...counts.entries()]
        .map(([name, count]) => ({
          name,
          pct: Math.round((count / totalCount) * 100),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 4);
    }
    return reports?.serviceDistribution ?? [];
  })();

  // Mechanic Rankings
  const ranking = (() => {
    const mechList = mechanicFilter !== "all"
      ? employees.filter((e) => e.role === "mechanic" && e.name === mechanicFilter)
      : employees.filter((e) => e.role === "mechanic");

    return mechList
      .map((m) => {
        const mTasks = filteredTasks.filter(
          (t) => t.mechanicId === m.id || t.mechanic?.name === m.name || t.mechanics?.some((x) => x.name === m.name)
        );
        const completed = mTasks.filter((t) => t.status === "completed").length;
        const active = mTasks.filter((t) => !["completed", "ready"].includes(t.status)).length;
        const util = Math.min(100, Math.round((active / MAX_ACTIVE_TASKS) * 100));
        const rated = mTasks
          .map((t) => ratings.find((r) => r.taskId === t.id))
          .filter((r): r is NonNullable<typeof r> => Boolean(r));
        const mRating = rated.length > 0 ? (rated.reduce((s, r) => s + r.score, 0) / rated.length).toFixed(1) : "5.0";

        return {
          mechanic: m.name,
          role: m.specialization ?? "General Service Tech",
          active,
          completed,
          util,
          rating: mRating,
        };
      })
      .sort((a, b) => b.completed - a.completed);
  })();

  // Service History Table Rows
  const historyRows = filteredInvoices
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

  const historyFilteredRows = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return historyRows;
    return historyRows.filter((r) => {
      const v = r.vehicle ? `${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model} ${r.vehicle.regNo}`.toLowerCase() : "";
      const sDesc = r.inv.items?.map((it) => it.description).join(" ").toLowerCase() ?? "";
      return (
        r.inv.id.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        v.includes(q) ||
        sDesc.includes(q)
      );
    });
  })();

  const historyPageRows = historyFilteredRows.slice(page * TABLE_PAGE, (page + 1) * TABLE_PAGE);
  const historyCount = Math.max(1, Math.ceil(historyFilteredRows.length / TABLE_PAGE));

  const refresh = () => {
    dispatch(fetchReports());
    dispatch(fetchInvoices());
    dispatch(fetchTasks());
    toast.success("Reports refreshed");
  };

  const handleGenerateReportPdf = () => {
    if (!reports) return;

    const reportPayload: ReportsData = {
      ...reports,
      totalRevenue,
      activeTasks: pendingTasksCount,
      activeEmployees: activeMechanicCount + activeAdvisorCount,
      incomeSummary: {
        totalRevenue,
        pendingRevenue,
        laborRevenue: laborTotal,
        partsRevenue: partsTotal,
        taxRevenue: taxTotal,
        paidCount: filteredPaidInvoices.length,
        unpaidCount: filteredInvoices.length - filteredPaidInvoices.length,
      },
      serviceHistory: historyFilteredRows.map((r) => ({
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
      serviceDistribution: serviceDistribution.length > 0 ? serviceDistribution : reports.serviceDistribution,
      revenueByMonth: lineData.map((d) => ({ month: d.month, revenue: d.revenue })),
      workloadByMechanic: ranking.map((m) => ({
        mechanic: m.mechanic,
        role: m.role,
        active: m.active,
        completed: m.completed,
      })),
      performanceSummary: {
        completedTasks: completedTasksCount,
        avgRating: Number(avgRating),
        totalRatingsCount: filteredRatings.length,
      },
    };

    const appliedFilters: string[] = [];
    if (range !== "all") appliedFilters.push(`Timeframe: ${range.toUpperCase()}`);
    if (station !== "all") appliedFilters.push(`Station: ${station}`);
    if (vehicleType !== "all") appliedFilters.push(`Vehicle: ${vehicleType.replace(/^(fuel|make):/, "").toUpperCase()}`);
    if (serviceFilter !== "all") appliedFilters.push(`Service: ${serviceFilter.replace(/^cat:/, "").toUpperCase()}`);
    if (statusFilter !== "all") appliedFilters.push(`Status: ${statusFilter.toUpperCase()}`);
    if (mechanicFilter !== "all") appliedFilters.push(`Mechanic: ${mechanicFilter}`);

    const filterSubtitle = appliedFilters.length > 0 ? appliedFilters.join(" • ") : "Comprehensive Workshop Analytics";

    downloadAdminReportPdf(reportPayload, {
      generatedBy: user?.name ?? "Administrator",
      range: filterSubtitle,
    });
    toast.success("Admin Report PDF generated and downloaded");
  };

  if (!reports || employees.length === 0) {
    return <TableLoading label="Loading reports" />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f5]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-8 pt-8 pb-16">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.24px] text-[#424753]">
              <span>Dashboard</span>
              <span>›</span>
              <span>Reports</span>
              <span>›</span>
              <span className="text-foreground">Workload & Revenue</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">Dynamic workload, financial performance, and workshop analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-[17px] py-[9px] text-sm font-medium text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateReportPdf}
              className="gap-2 rounded-md bg-[#004492] px-5 py-[9px] text-sm font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
            >
              <FileDown className="size-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Dynamic Filter Controls Bar */}
        <div className="flex flex-col gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Range Selector */}
              <div className="flex items-center rounded-md bg-[#f3f4f5] p-[4px]">
                {(["daily", "weekly", "monthly", "yearly", "all"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRange(r);
                      setPage(0);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all",
                      range === r
                        ? "bg-white text-[#004492] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                        : "text-[#424753] hover:text-foreground"
                    )}
                  >
                    {r === "daily" ? "Today" : r === "weekly" ? "Week" : r === "monthly" ? "Month" : r === "yearly" ? "Year" : "All Time"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setRange("custom");
                    setPage(0);
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                    range === "custom"
                      ? "bg-white text-[#004492] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                      : "text-[#424753] hover:text-foreground"
                  )}
                >
                  <Calendar className="size-3.5" />
                  Custom
                </button>
              </div>

              <div className="hidden h-7 w-px bg-[#e2e8f0] md:block" />

              {/* Station / Bay Dropdown */}
              <div className="relative">
                <select
                  value={station}
                  onChange={(e) => {
                    setStation(e.target.value);
                    setPage(0);
                  }}
                  className="h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#004492] focus:border-[#004492]"
                >
                  <option value="all">All Stations & Bays</option>
                  {availableStations.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Vehicle Type Dropdown */}
              <div className="relative">
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value);
                    setPage(0);
                  }}
                  className="h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#004492] focus:border-[#004492]"
                >
                  <option value="all">All Vehicle Types</option>
                  <optgroup label="Fuel Type">
                    {availableFuelTypes.map((fuel) => (
                      <option key={fuel} value={`fuel:${fuel}`}>
                        Fuel: {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
                      </option>
                    ))}
                  </optgroup>
                  {availableMakes.length > 0 && (
                    <optgroup label="Make">
                      {availableMakes.map((m) => (
                        <option key={m} value={`make:${m.toLowerCase()}`}>
                          Make: {m}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* Service Type Dropdown */}
              <div className="relative">
                <select
                  value={serviceFilter}
                  onChange={(e) => {
                    setServiceFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-9 cursor-pointer rounded-md border border-[#e2e8f0] bg-white px-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#004492] focus:border-[#004492]"
                >
                  <option value="all">All Services & Packages</option>
                  <optgroup label="Category">
                    <option value="cat:maintenance">Category: Maintenance</option>
                    <option value="cat:repairs">Category: Repairs</option>
                    <option value="cat:inspections">Category: Inspections</option>
                  </optgroup>
                  {availableServices.length > 0 && (
                    <optgroup label="Specific Services">
                      {availableServices.map((srv) => (
                        <option key={srv} value={srv}>
                          {srv}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {/* More Filters Toggle Button */}
              <button
                type="button"
                onClick={() => setMoreFilters((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                  moreFilters || statusFilter !== "all" || paymentFilter !== "all" || mechanicFilter !== "all"
                    ? "border-[#004492] bg-[#eff6ff] text-[#004492]"
                    : "border-[#e2e8f0] bg-white text-[#424753] hover:text-foreground"
                )}
              >
                <Filter className="size-3.5" />
                <span>Filters</span>
                {(statusFilter !== "all" || paymentFilter !== "all" || mechanicFilter !== "all") && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-[#004492] text-[10px] font-bold text-white">
                    {(statusFilter !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0) + (mechanicFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Reset Filters CTA */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 transition-colors hover:text-rose-700"
              >
                <RotateCcw className="size-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Custom Date Inputs (if Custom is chosen) */}
          {range === "custom" && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[#e2e8f0] pt-3 text-xs">
              <span className="font-semibold text-[#424753]">Custom Date Interval:</span>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground">From:</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs text-foreground outline-none focus:border-[#004492]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground">To:</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs text-foreground outline-none focus:border-[#004492]"
                />
              </div>
            </div>
          )}

          {/* Expanded Advanced Filters */}
          {moreFilters && (
            <div className="flex flex-wrap items-center gap-4 border-t border-[#e2e8f0] pt-3">
              <span className="text-xs font-semibold tracking-[0.55px] text-[#424753] uppercase">Advanced Filters:</span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs text-foreground outline-none focus:border-[#004492]"
                >
                  {["All Statuses", "Received", "Inspecting", "Repairing", "Testing", "Ready", "Completed"].map((s) => (
                    <option key={s} value={s === "All Statuses" ? "all" : s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Payment:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs text-foreground outline-none focus:border-[#004492]"
                >
                  <option value="all">All Invoices</option>
                  <option value="paid">Paid Only</option>
                  <option value="pending">Pending Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Mechanic:</span>
                <select
                  value={mechanicFilter}
                  onChange={(e) => {
                    setMechanicFilter(e.target.value);
                    setPage(0);
                  }}
                  className="h-8 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs text-foreground outline-none focus:border-[#004492]"
                >
                  <option value="all">All Mechanics</option>
                  {availableMechanics.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {isFilterActive && (
            <div className="flex flex-wrap items-center gap-2 border-t border-[#e2e8f0] pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground">Active criteria:</span>
              {range !== "monthly" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Range: {range}
                  <X className="size-3 cursor-pointer" onClick={() => setRange("monthly")} />
                </span>
              )}
              {station !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Station: {station}
                  <X className="size-3 cursor-pointer" onClick={() => setStation("all")} />
                </span>
              )}
              {vehicleType !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Vehicle: {vehicleType.replace(/^(fuel|make):/, "")}
                  <X className="size-3 cursor-pointer" onClick={() => setVehicleType("all")} />
                </span>
              )}
              {serviceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Service: {serviceFilter.replace(/^cat:/, "")}
                  <X className="size-3 cursor-pointer" onClick={() => setServiceFilter("all")} />
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Status: {statusFilter}
                  <X className="size-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                </span>
              )}
              {paymentFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Payment: {paymentFilter}
                  <X className="size-3 cursor-pointer" onClick={() => setPaymentFilter("all")} />
                </span>
              )}
              {mechanicFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Mechanic: {mechanicFilter}
                  <X className="size-3 cursor-pointer" onClick={() => setMechanicFilter("all")} />
                </span>
              )}
              {search.trim() !== "" && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eff6ff] px-2 py-0.5 text-[11px] font-medium text-[#004492]">
                  Search: &quot;{search}&quot;
                  <X className="size-3 cursor-pointer" onClick={() => setSearch("")} />
                </span>
              )}
              <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                Matches: {filteredInvoices.length} invoices · {filteredTasks.length} tasks
              </span>
            </div>
          )}
        </div>

        {/* Primary KPI Summary Cards */}
        <div className="flex items-start gap-4 overflow-x-auto pb-1">
          <div className="relative flex w-[210px] shrink-0 flex-col justify-between overflow-hidden rounded-[12px] bg-[#004492] p-4 shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="absolute -top-4 -right-4 size-28 rounded-full bg-[rgba(255,255,255,0.08)]" />
            <div className="absolute -top-8 -right-10 size-36 rounded-full bg-[rgba(255,255,255,0.05)]" />
            <div className="relative flex flex-col gap-1">
              <span className="text-sm font-medium text-[#acc7ff]">Total Paid Revenue</span>
              <span className="text-[28px] font-bold leading-9 text-white">{money(totalRevenue)}</span>
            </div>
            <div className="relative flex items-center justify-between pt-4">
              <span className="flex items-center gap-1 rounded-sm bg-[rgba(76,175,80,0.2)] px-2 py-0.5 text-xs font-semibold text-white">
                <ArrowUpRight className="size-3" />
                {filteredPaidInvoices.length} paid
              </span>
              <span className="text-xs text-[#acc7ff]">{money(pendingRevenue)} pending</span>
            </div>
          </div>

          {[
            {
              label: "Labor Revenue",
              value: money(laborTotal),
              delta: null,
              deltaLabel: "technician labor",
              icon: <Wrench className="size-4" />,
            },
            {
              label: "Today's Income",
              value: money(todayIncome),
              delta: todayDelta,
              deltaLabel: "vs yesterday",
              icon: <Calendar className="size-4" />,
            },
            {
              label: "Completed Tasks",
              value: String(completedTasksCount),
              delta: null,
              deltaLabel: "in filter scope",
              icon: <BarChart3 className="size-4" />,
            },
            {
              label: "Pending Tasks",
              value: String(pendingTasksCount),
              delta: null,
              deltaLabel: `${receivedToday} today`,
              icon: <Clock className="size-4" />,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="flex w-[180px] shrink-0 flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
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

        {/* Operational Secondary KPIs */}
        <div className="flex items-center gap-4 overflow-x-auto pb-1">
          {[
            { label: "Avg Service Duration", value: avgServiceTime, tile: "bg-[rgba(0,68,146,0.1)]", color: "text-[#004492]", icon: <Clock className="size-[18px]" /> },
            { label: "Customer Satisfaction", value: `${avgRating} / 5.0`, tile: "bg-[rgba(255,193,7,0.1)]", color: "text-[#8b5000]", icon: <Star className="size-[18px]" /> },
            { label: "Active Mechanics", value: `${activeMechanicCount} On Bay`, tile: "bg-[rgba(139,80,0,0.1)]", color: "text-[#8b5000]", icon: <Users className="size-[18px]" /> },
            { label: "Active Advisors", value: `${activeAdvisorCount} On Duty`, tile: "bg-[rgba(76,175,80,0.1)]", color: "text-[#4caf50]", icon: <Headset className="size-[18px]" /> },
          ].map((s) => (
            <div key={s.label} className="flex min-w-[220px] flex-1 items-center gap-4 rounded-[12px] border border-[#e2e8f0] bg-white px-[17px] py-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <span className={cn("flex size-10 items-center justify-center rounded-md", s.tile, s.color)}>{s.icon}</span>
              <div>
                <p className="text-xs font-medium text-[#424753]">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Trend & Revenue by Service */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] lg:col-span-2">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Revenue Trend</h2>
                <p className="text-xs text-muted-foreground">Dynamic billing cadence for active timeframe</p>
              </div>
              <span className="rounded-md bg-[#f3f4f5] px-2.5 py-1 text-xs font-semibold capitalize text-[#004492]">
                {range} view
              </span>
            </div>
            <LineChart data={lineData} />
          </div>

          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-semibold text-foreground">Revenue by Service</h2>
              <span className="text-xs font-medium text-muted-foreground">{filteredTasks.length} tasks</span>
            </div>
            <Donut data={serviceDistribution} />
            <div className="grid grid-cols-1 gap-y-2.5 pt-4 sm:grid-cols-2">
              {serviceDistribution.slice(0, 4).map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="flex-1 truncate text-[#424753]">{d.name}</span>
                  <span className="font-semibold text-foreground">{d.pct}%</span>
                </div>
              ))}
              {serviceDistribution.length === 0 && (
                <p className="col-span-2 py-4 text-center text-xs text-muted-foreground">No matching services in active filter.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Service History Table */}
        <div className="rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-6 pt-5 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Service History</h2>
              <p className="text-xs text-muted-foreground">Showing filtered service transactions & invoice logs</p>
            </div>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search invoice, vehicle, client..."
                className="h-9 w-64 rounded-md border border-[#e2e8f0] bg-white pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-[#004492]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
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
                      <span className="font-medium">{customer}</span>
                      {vehicle ? <span className="text-xs text-muted-foreground block">{vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.regNo})</span> : null}
                    </td>
                    <td className="max-w-[220px] truncate px-6 py-3.5 text-sm text-[#424753]">
                      {inv.items[0]?.description ?? task?.services.map((s: { name: string }) => s.name).join(", ") ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-[#424753]">
                      {task?.mechanic?.name ?? (task?.mechanics && task.mechanics.length > 0 ? task.mechanics.map((m: { name: string }) => m.name).join(", ") : "—")}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold text-foreground">{money(inv.total)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-xl px-[9px] py-[5px] text-[11px] font-medium",
                          inv.status === "paid" ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" : "bg-[rgba(255,193,7,0.1)] text-[#8b5000]"
                        )}
                      >
                        {inv.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        type="button"
                        aria-label={`Download ${inv.id}`}
                        onClick={() => {
                          downloadInvoicePdf(inv, vehicle);
                          toast.success(`Invoice ${inv.id} downloaded`);
                        }}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[#eff6ff] hover:text-[#004492]"
                      >
                        <Download className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {historyPageRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-muted-foreground">
                      No invoices match the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-6 py-3 text-xs font-medium text-[#424753]">
            <span>
              Showing {historyFilteredRows.length === 0 ? 0 : page * TABLE_PAGE + 1} to {Math.min((page + 1) * TABLE_PAGE, historyFilteredRows.length)} of {historyFilteredRows.length} entries
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
                    page === i ? "border-[#004492] bg-[#004492] font-semibold text-white" : "border-[#e2e8f0] bg-white text-[#424753] hover:bg-secondary"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= Math.ceil(historyFilteredRows.length / TABLE_PAGE) - 1}
                onClick={() => setPage((p) => Math.min(Math.ceil(historyFilteredRows.length / TABLE_PAGE) - 1, p + 1))}
                className="rounded border border-[#e2e8f0] bg-white px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Financial Breakdown & Mechanic Performance Rankings */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* Revenue Breakdown */}
          <div className="flex flex-col gap-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Revenue Breakdown</h2>
              <p className="text-xs text-muted-foreground">Itemized financial allocation in active scope</p>
            </div>
            <div className="flex flex-col gap-3 text-sm">
              {[
                { label: "Labor Charges", value: money(laborTotal), tint: "bg-[rgba(0,68,146,0.1)] text-[#004492]" },
                { label: "Parts & Materials", value: money(partsTotal), tint: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]" },
                { label: "Applicable Tax (8.5%)", value: money(taxTotal), tint: "bg-[#e1e3e4] text-[#424753]" },
                { label: "Outstanding Receivables", value: money(pendingRevenue), tint: "bg-[rgba(244,67,54,0.1)] text-[#f44336]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className={cn("flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold", row.tint)}>{row.label}</span>
                  <span className="font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-[#e2e8f0] pt-3">
              <span className="text-sm font-medium text-[#424753]">Net Realized Income</span>
              <span className="text-xl font-bold text-[#004492]">{money(totalRevenue)}</span>
            </div>
          </div>

          {/* Top Performing Mechanics */}
          <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)] lg:col-span-2">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Top Performing Mechanics</h2>
                <p className="text-xs text-muted-foreground">Individual completion rates and workload utilization</p>
              </div>
              <Link href="/admin/employees" className="text-xs font-semibold text-[#004492] hover:underline">
                View All Staff
              </Link>
            </div>
            <div className="overflow-x-auto">
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
                      <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No mechanics match the current filter scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}