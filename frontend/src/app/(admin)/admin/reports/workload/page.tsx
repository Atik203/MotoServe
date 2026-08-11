"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Download, Gauge, Users, Wrench } from "lucide-react";
import demoData from "@/lib/demo-data";
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

type Reports = Awaited<ReturnType<typeof demoData.load<"reports">>>;
type Employees = Awaited<ReturnType<typeof demoData.load<"employees">>>;

export default function WorkloadReportsPage() {
  const [reports, setReports] = useState<Reports | null>(null);
  const [employees, setEmployees] = useState<Employees | null>(null);

  useEffect(() => {
    demoData.load("reports").then(setReports);
    demoData.load("employees").then(setEmployees);
  }, []);

  if (!reports || !employees) {
    return (
      <div className="bg-background min-h-screen p-[32px]">
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
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-semibold tracking-[-0.24px] text-foreground">Workload Reports</h1>
            <p className="text-[14px] text-muted-foreground">Mechanic utilization and job distribution.</p>
          </div>
          <Button
            size="sm"
            onClick={() => toast.success("Report exported (demo)")}
            className="gap-[4px] rounded-[4px] px-[16px] py-[9px] text-[12px] font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
          >
            <Download className="size-[12px]" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <section className="col-span-8 flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-[20px] font-semibold text-foreground">Mechanic Workload</h2>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                  <TableHead className="px-[16px] py-[12px] text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Mechanic
                  </TableHead>
                  <TableHead className="px-[16px] py-[12px] text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Role
                  </TableHead>
                  <TableHead className="px-[16px] py-[12px] text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Active Jobs
                  </TableHead>
                  <TableHead className="px-[16px] py-[12px] text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Completed
                  </TableHead>
                  <TableHead className="px-[16px] py-[12px] text-center text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Avg Hours
                  </TableHead>
                  <TableHead className="px-[16px] py-[12px] text-right text-[11px] font-medium tracking-[0.55px] text-[#424753] uppercase">
                    Utilization
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mechanics.map((m, i) => (
                  <TableRow key={m.mechanic} className="border-t border-border">
                    <TableCell className="px-[16px] py-[17px]">
                      <div className="flex items-center gap-[12px]">
                        <span className="flex size-[32px] items-center justify-center rounded-[12px] bg-[rgba(0,68,146,0.2)] text-[12px] font-bold text-[#004492]">
                          {m.mechanic.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                        <span className="text-[14px] font-medium text-foreground">{m.mechanic}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-[16px] py-[17px] text-[14px] text-muted-foreground">{m.role}</TableCell>
                    <TableCell className="px-[16px] py-[17px] text-center text-[14px] font-semibold text-foreground">
                      {m.active}
                    </TableCell>
                    <TableCell className="px-[16px] py-[17px] text-center text-[14px] text-foreground">{m.completed}</TableCell>
                    <TableCell className="px-[16px] py-[17px] text-center text-[14px] text-foreground">
                      {m.avgHoursPerJob}h
                    </TableCell>
                    <TableCell className="px-[16px] py-[17px]">
                      <div className="flex items-center justify-end gap-[8px]">
                        <div className="h-[8px] w-[80px] overflow-hidden rounded-[12px] bg-[#e1e3e4]">
                          <div
                            className="h-full rounded-[12px] bg-[#4caf50]"
                            style={{ width: `${utilizations[i]}%` }}
                          />
                        </div>
                        <span className="w-[36px] text-right text-[12px] text-muted-foreground">{utilizations[i]}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="col-span-4 flex flex-col gap-[16px] rounded-[8px] border border-[#e2e8f0] bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <h2 className="text-[20px] font-semibold text-foreground">Summary</h2>
            <div className="flex flex-col gap-[14px]">
              {summary.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-[8px] text-[14px] text-muted-foreground">
                    <s.icon className="size-[15px]" />
                    {s.label}
                  </span>
                  <span className="text-[18px] font-bold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-[10px] border-t border-[#e2e8f0] pt-[16px]">
              <span className="flex items-center gap-[8px] text-[14px] text-muted-foreground">
                <Clock className="size-[15px]" />
                Peak Hours
              </span>
              <div className="flex flex-wrap gap-[8px]">
                {PEAK_HOURS.map((hours) => (
                  <span
                    key={hours}
                    className="rounded-[12px] bg-[rgba(255,193,7,0.1)] px-[10px] py-[4px] text-[11px] font-medium text-warning"
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
