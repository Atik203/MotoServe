"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Download,
  Star,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/reportsSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminReportsPage() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector((s) => s.reports.data);

  useEffect(() => {
    if (!reports) dispatch(fetchReports());
  }, [dispatch, reports]);

  const chart = useMemo(() => {
    if (!reports || reports.revenueByMonth.length === 0) return null;
    const data = reports.revenueByMonth;
    const max = Math.max(...data.map((d) => d.revenue));
    if (max <= 0) return null;
    const w = 560;
    const h = 180;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const points = data.map((d, i) => `${(i * step).toFixed(1)},${(h - (d.revenue / max) * (h - 20) - 10).toFixed(1)}`);
    return { data, points: points.join(" ") };
  }, [reports]);

  if (!reports) {
    return (
      <div className="bg-background min-h-screen p-8">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  const maxStatusCount = Math.max(...reports.jobsByStatus.map((s) => s.count));

  const kpis = [
    { label: "Total Revenue", value: `$${reports.totalRevenue.toLocaleString()}`, delta: "Paid invoices only", positive: true, icon: Wallet },
    { label: "Active Jobs", value: String(reports.activeJobs), delta: "In workshop", positive: true, icon: Wrench },
    { label: "Registered Customers", value: String(reports.registeredCustomers), delta: "All time", positive: true, icon: Users },
    { label: "Active Employees", value: String(reports.activeEmployees), delta: "On staff", positive: true, icon: Star },
  ];

  const exportCsv = () => {
    const lines: string[][] = [["Metric", "Value"]];
    kpis.forEach((k) => lines.push([k.label, k.value]));
    lines.push([], ["Month", "Revenue"]);
    reports.revenueByMonth.forEach((r) => lines.push([r.month, String(r.revenue)]));
    lines.push([], ["Status", "Count"]);
    reports.jobsByStatus.forEach((j) => lines.push([j.status, String(j.count)]));
    const csv = lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "motoserve-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Financial and operational insights across the workshop.</p>
          </div>
          <div className="flex gap-2">
            <span className="flex h-9 items-center gap-1.5 rounded border border-[#e2e8f0] bg-white px-[17px] text-xs font-semibold tracking-[0.24px] text-[#424753]">
              <CalendarDays className="size-[13.5px] text-muted-foreground" />
              {new Date().getFullYear()}
            </span>
            <Button
              size="sm"
              onClick={exportCsv}
              className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <Download className="size-3" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-[104px] flex-col justify-between rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex w-full items-start justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="size-[15px] text-muted-foreground" />
              </div>
              <div className="flex w-full items-end justify-between gap-1">
                <span className="text-[28px] leading-8 font-bold tracking-[-0.56px] text-foreground">{kpi.value}</span>
                <span
                  className={cn(
                    "rounded-xl px-2 py-0.5 text-[11px] font-medium",
                    kpi.positive ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" : "bg-[rgba(255,193,7,0.1)] text-warning",
                  )}
                >
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Revenue Trends</h2>
              {chart && (
                <div>
                  <svg viewBox="0 0 560 180" className="h-[200px] w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,82,204,0.08)" />
                        <stop offset="100%" stopColor="rgba(0,82,204,0)" />
                      </linearGradient>
                    </defs>
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <line key={f} x1="0" x2="560" y1={180 * f} y2={180 * f} stroke="#e2e8f0" strokeDasharray="4 4" />
                    ))}
                    <polygon points={`0,180 ${chart.points} 560,180`} fill="url(#revenueFill)" />
                    <polyline
                      points={chart.points}
                      fill="none"
                      stroke="#0052cc"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="mt-2 flex justify-between px-1">
                    {chart.data.map((d) => (
                      <span key={d.month} className="text-[11px] text-muted-foreground">
                        {d.month}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Activity Log</h2>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                    <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                      User
                    </TableHead>
                    <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                      Action
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                      Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.activityLog.map((entry) => (
                    <TableRow key={entry.id} className="border-t border-border">
                      <TableCell className="px-4 py-4 text-sm font-medium text-foreground">{entry.user}</TableCell>
                      <TableCell className="px-4 py-4 text-sm text-foreground">{entry.action}</TableCell>
                      <TableCell className="px-4 py-4 text-right text-xs font-medium text-muted-foreground">
                        {entry.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Jobs by Status</h2>
              <div className="flex flex-col gap-4">
                {reports.jobsByStatus.map((status) => (
                  <div key={status.status} className="flex items-center gap-3">
                    <span className="w-[84px] shrink-0 text-sm font-medium text-foreground capitalize">{status.status}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-xl bg-[#eff6ff]">
                      <div
                        className="h-full rounded-xl bg-primary"
                        style={{ width: `${maxStatusCount > 0 ? (status.count / maxStatusCount) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                      {status.count}
                    </span>
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
