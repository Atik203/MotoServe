"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Clock, Download, Gauge, Users, Wrench } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReports } from "@/store/slices/reportsSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_ACTIVE_JOBS = 5;
const PEAK_HOURS = ["10:00 AM - 2:00 PM"];

export default function WorkloadReportsPage() {
  const dispatch = useAppDispatch();
  const reports = useAppSelector((s) => s.reports.data);
  const employees = useAppSelector((s) => s.employees.items);

  useEffect(() => {
    if (!reports) dispatch(fetchReports());
    if (employees.length === 0) dispatch(fetchEmployees());
  }, [dispatch, reports, employees.length]);

  if (!reports || employees.length === 0) {
    return (
      <div className="bg-background min-h-screen p-8">
        <p className="text-muted-foreground">Loading workload reports...</p>
      </div>
    );
  }

  const mechanics = reports.workloadByMechanic;
  const totalMechanics = employees.filter((e) => e.role === "mechanic").length;
  const activeNow = mechanics.reduce((sum, m) => sum + m.active, 0);
  const utilizations = mechanics.map((m) => Math.round((m.active / MAX_ACTIVE_JOBS) * 100));
  const avgUtilization = Math.round(utilizations.reduce((sum, v) => sum + v, 0) / utilizations.length);

  const summary = [
    { label: "Total Mechanics", value: totalMechanics, icon: Users },
    { label: "Active Now", value: activeNow, icon: Wrench },
    { label: "Avg Utilization", value: `${avgUtilization}%`, icon: Gauge },
  ];

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Workload Reports</h1>
            <p className="text-sm text-muted-foreground">Mechanic utilization and job distribution.</p>
          </div>
          <Button
            size="sm"
            onClick={() => toast.success("Report exported (demo)")}
            className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Download className="size-3" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <section className="col-span-8 flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl font-semibold text-foreground">Mechanic Workload</h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                  <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Mechanic
                  </TableHead>
                  <TableHead className="px-4 py-3 text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Role
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Active Jobs
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Completed
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Avg Hours
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Utilization
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mechanics.map((m, i) => (
                  <TableRow key={m.mechanic} className="border-t border-border">
                    <TableCell className="px-4 py-[17px]">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-[rgba(0,68,146,0.2)] text-xs font-bold text-[#004492]">
                          {m.mechanic.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                        <span className="text-sm font-medium text-foreground">{m.mechanic}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-[17px] text-sm text-muted-foreground">{m.role}</TableCell>
                    <TableCell className="px-4 py-[17px] text-center text-sm font-semibold text-foreground">
                      {m.active}
                    </TableCell>
                    <TableCell className="px-4 py-[17px] text-center text-sm text-foreground">{m.completed}</TableCell>
                    <TableCell className="px-4 py-[17px] text-center text-sm text-foreground">
                      {m.avgHoursPerJob ? `${m.avgHoursPerJob}h` : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-[17px]">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-xl bg-[#e1e3e4]">
                          <div
                            className="h-full rounded-xl bg-[#4caf50]"
                            style={{ width: `${utilizations[i]}%` }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs text-muted-foreground">{utilizations[i]}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="col-span-4 flex flex-col gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-xl font-semibold text-foreground">Summary</h2>
            <div className="flex flex-col gap-3.5">
              {summary.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <s.icon className="size-[15px]" />
                    {s.label}
                  </span>
                  <span className="text-lg font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 border-t border-[#e2e8f0] pt-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-[15px]" />
                Peak Hours
              </span>
              <div className="flex flex-wrap gap-2">
                {PEAK_HOURS.map((hours) => (
                  <span
                    key={hours}
                    className="rounded-xl bg-[rgba(255,193,7,0.1)] px-2.5 py-1 text-[11px] font-medium text-warning"
                  >
                    {hours}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
