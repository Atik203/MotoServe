"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Headset,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import type { Employee } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EXISTING_AVATARS = new Set(["/images/avatars/alex-turner.png"]);

type Tab = "all" | "mechanic" | "advisor";

const PAGE_LABELS: (number | "…")[] = [1, 2, 3, "…", 15];

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const [broken, setBroken] = useState(!EXISTING_AVATARS.has(employee.avatar));
  if (broken) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(120,49,0,0.2)] bg-[rgba(158,67,0,0.3)] text-xs font-bold tracking-[0.24px] text-[#783100] uppercase">
        {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </span>
    );
  }
  return (
    <span className="block size-10 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0]">
      <Image
        src={employee.avatar}
        alt={employee.name}
        width={40}
        height={40}
        className="size-full object-cover"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

export default function EmployeeManagementPage() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.employees.items);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (employees.length === 0) dispatch(fetchEmployees());
  }, [dispatch, employees.length]);

  const mechanics = employees.filter((e) => e.role === "mechanic");
  const advisors = employees.filter((e) => e.role === "advisor");

  const rows = employees.filter((e) => {
    const matchTab = tab === "all" || e.role === tab;
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toUpperCase().includes(search.toUpperCase());
    return matchTab && matchSearch;
  });

  const kpis = [
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users,
      delta: { text: "+4 this month", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" },
    },
    {
      label: "Active Mechanics",
      value: mechanics.length,
      icon: Wrench,
      sub: "92% Utilization",
    },
    {
      label: "Service Advisors",
      value: advisors.length,
      icon: Headset,
      delta: { text: "2 on leave", className: "bg-[rgba(255,193,7,0.1)] text-[#ffc107]" },
    },
  ];

  const roleLabel = (e: Employee) => (e.role === "advisor" ? "Service Advisor" : "Mechanic");

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium text-[#424753]">
            Dashboard
            <span className="mx-1.5 text-[#cbd5e1]">›</span>
            <span className="font-semibold text-primary">Employees</span>
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-[-0.24px] text-foreground">Employee Management</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Employees list exported (demo)")}
                className="gap-1 rounded px-[17px] py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
              >
                <Download className="size-3" />
                Export
              </Button>
              <Button asChild size="sm" className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <Link href="/admin/employees/advisors/new">
                  <Plus className="size-3" />
                  Advisor
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1 rounded px-4 py-[9px] text-xs font-semibold tracking-[0.24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <Link href="/admin/employees/mechanics/new">
                  <Plus className="size-3" />
                  Mechanic
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex h-32 flex-col justify-between rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">{kpi.label}</span>
                <kpi.icon className="size-[18px] text-muted-foreground" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold tracking-[-0.72px] text-foreground">{kpi.value}</span>
                {kpi.delta ? (
                  <span className={cn("flex items-center gap-1 rounded-xl p-1 text-[11px] font-medium", kpi.delta.className)}>
                    <TrendingUp className="size-[11px]" />
                    {kpi.delta.text}
                  </span>
                ) : (
                  <span className="pb-1 text-sm text-[#424753]">{kpi.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 pt-4 pb-[17px]">
            <div className="flex items-center rounded border border-[#e2e8f0] bg-[#f3f4f5] p-[5px]">
              {(
                [
                  { key: "all", label: "All Employees" },
                  { key: "mechanic", label: "Mechanics" },
                  { key: "advisor", label: "Advisors" },
                ] as { key: Tab; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "rounded-md px-4 py-[9px] text-xs font-semibold tracking-[0.24px] transition-colors",
                    tab === t.key
                      ? "border border-[#e2e8f0] bg-white text-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                      : "text-[#424753] hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute top-1/2 left-2 size-[15px] -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, ID..."
                  className="h-[38px] rounded pl-[33px] text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => toast.info("Filters — coming with the backend")}
                className="rounded border border-[#e2e8f0] bg-white p-[9px] text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Filter employees"
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-background hover:bg-background">
                <TableHead className="w-12 px-4 py-4">
                  <Checkbox aria-label="Select all" />
                </TableHead>
                <TableHead className="px-4 py-4 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Employee</TableHead>
                <TableHead className="px-4 py-4 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Contact</TableHead>
                <TableHead className="px-4 py-4 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Role</TableHead>
                <TableHead className="px-4 py-4 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Status</TableHead>
                <TableHead className="px-4 py-4 text-right text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((employee) => (
                <TableRow key={employee.id} className="border-t border-border transition-colors hover:bg-background">
                  <TableCell className="px-4 py-[17px]">
                    <Checkbox aria-label={`Select ${employee.name}`} />
                  </TableCell>
                  <TableCell className="px-4 py-[17px]">
                    <div className="flex items-center gap-4">
                      <EmployeeAvatar employee={employee} />
                      <div>
                        <p className="text-xs font-semibold tracking-[0.24px] text-foreground">{employee.name}</p>
                        <p className="text-[11px] font-medium text-[#424753]">{employee.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-[17px]">
                    <p className="text-sm text-foreground">{employee.email}</p>
                    <p className="text-[11px] font-medium text-[#424753]">{employee.phone}</p>
                  </TableCell>
                  <TableCell className="px-4 py-[17px]">
                    <p className="text-sm text-foreground">{roleLabel(employee)}</p>
                    {employee.specialization && <p className="text-[11px] font-medium text-[#424753]">{employee.specialization}</p>}
                  </TableCell>
                  <TableCell className="px-4 py-[17px]">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl border px-[9px] py-[5px] text-[11px] font-medium",
                        employee.status === "active"
                          ? "border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] text-[#4caf50]"
                          : "border-[#e2e8f0] bg-secondary text-muted-foreground",
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", employee.status === "active" ? "bg-[#4caf50]" : "bg-muted-foreground")} />
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-[17px]">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => toast.info(`View ${employee.name} — coming with the backend`)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#f3f4f5] hover:text-foreground"
                        aria-label={`View ${employee.name}`}
                      >
                        <Eye className="size-[15px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.info(`Edit ${employee.name} — coming with the backend`)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#f3f4f5] hover:text-foreground"
                        aria-label={`Edit ${employee.name}`}
                      >
                        <Pencil className="size-[15px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.info(`Delete ${employee.name} — coming with the backend`)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#f3f4f5] hover:text-destructive"
                        aria-label={`Delete ${employee.name}`}
                      >
                        <Trash2 className="size-[15px]" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-4 pt-[17px] pb-4">
            <p className="text-[11px] font-medium text-[#424753]">
              Showing 1 to {rows.length} of {employees.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-[#e2e8f0] bg-white p-[9px] text-[#424753] transition-colors hover:text-foreground"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3" />
              </button>
              {PAGE_LABELS.map((label, i) =>
                label === "…" ? (
                  <span key={`${label}-${i}`} className="px-1 text-base text-[#424753]">
                    …
                  </span>
                ) : (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPage(label)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded text-xs font-semibold tracking-[0.24px]",
                      page === label
                        ? "bg-primary text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                        : "border border-[#e2e8f0] bg-white text-[#191c1d] transition-colors hover:text-primary",
                    )}
                  >
                    {label}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(15, p + 1))}
                className="rounded border border-[#e2e8f0] bg-white p-[9px] text-[#424753] transition-colors hover:text-foreground"
                aria-label="Next page"
              >
                <ChevronRight className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
