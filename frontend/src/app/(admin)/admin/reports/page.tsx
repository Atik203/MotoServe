"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeDollarSign,
  Calendar,
  Clock,
  Download,
  FileBarChart,
  Star,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import demoData from "@/lib/demo-data";
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

const kpis = [
  { label: "Total Revenue", value: "$24,850", delta: "+12.4%", positive: true, icon: Wallet },
  { label: "Active Jobs", value: "18", delta: "+3 today", positive: true, icon: Wrench },
  { label: "Avg. Job Time", value: "1.9h", delta: "+0.2h", positive: false, icon: Clock },
  { label: "Customer Satisfaction", value: "4.8", delta: "+0.3", positive: true, icon: Star },
];

const quickActions = [
  { label: "Generate Report", icon: FileBarChart },
  { label: "Manage Services", icon: Wrench },
  { label: "Employees", icon: Users },
  { label: "Pricing", icon: BadgeDollarSign },
];

export default function AdminReportsPage() {
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
    return { data, points: points.join(" ") };
  }, [reports]);

  if (!reports) {
    return (
      <div className="bg-background min-h-screen p-[32px]">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  const maxStatusCount = Math.max(...reports.jobsByStatus.map((s) => s.count));

  return (
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Reports & Analytics</h1>
            <p className="text-[14px] text-muted-foreground">Financial and operational insights across the workshop.</p>
          </div>
          <div className="flex gap-[8px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Date range selection coming with the backend")}
              className="gap-[4px] rounded-[4px] border-[#e2e8f0] px-[17px] py-[9px] text-[12px] font-semibold tracking-[0.24px]"
            >
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

        <div className="grid grid-cols-4 gap-[24px]">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-[104px] flex-col justify-between rounded-[8px] border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex w-full items-start justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">{kpi.label}</span>
                <kpi.icon className="size-[15px] text-muted-foreground" />
              </div>
              <div className="flex w-full items-end justify-between gap-[4px]">
                <span className="text-[28px] leading-[32px] font-bold tracking-[-0.56px] text-foreground">{kpi.value}</span>
                <span
                  className={cn(
                    "rounded-[12px] px-[8px] py-[2px] text-[11px] font-medium",
                    kpi.positive ? "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" : "bg-[rgba(255,193,7,0.1)] text-warning",
                  )}
                >
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Revenue Trends</h2>
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
                  <div className="mt-[8px] flex justify-between px-[4px]">
                    {chart.data.map((d) => (
                      <span key={d.month} className="text-[11px] text-muted-foreground">
                        {d.month}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Activity Log</h2>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                    <TableHead className="px-[16px] py-[12px] text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                      User
                    </TableHead>
                    <TableHead className="px-[16px] py-[12px] text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                      Action
                    </TableHead>
                    <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                      Time
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.activityLog.map((entry) => (
                    <TableRow key={entry.id} className="border-t border-border">
                      <TableCell className="px-[16px] py-[16px] text-[14px] font-medium text-foreground">{entry.user}</TableCell>
                      <TableCell className="px-[16px] py-[16px] text-[14px] text-foreground">{entry.action}</TableCell>
                      <TableCell className="px-[16px] py-[16px] text-right text-[12px] font-medium text-muted-foreground">
                        {entry.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Jobs by Status</h2>
              <div className="flex flex-col gap-[16px]">
                {reports.jobsByStatus.map((status) => (
                  <div key={status.status} className="flex items-center gap-[12px]">
                    <span className="w-[84px] shrink-0 text-[14px] font-medium text-foreground capitalize">{status.status}</span>
                    <div className="h-[8px] flex-1 overflow-hidden rounded-[12px] bg-[#eff6ff]">
                      <div
                        className="h-full rounded-[12px] bg-primary"
                        style={{ width: `${(status.count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-[20px] shrink-0 text-right text-[12px] font-semibold text-muted-foreground">
                      {status.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-[8px]">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => toast.info(`${action.label} — coming with the backend`)}
                    className="flex flex-col items-center justify-center gap-[8px] rounded-[4px] border border-[#e2e8f0] bg-[#f8f9fa] py-[25px] transition-colors hover:border-primary/50"
                  >
                    <action.icon className="size-[20px] text-muted-foreground" />
                    <span className="text-[12px] font-semibold tracking-[0.24px] text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
