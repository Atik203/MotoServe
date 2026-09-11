"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Headset,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteEmployee, fetchEmployees, updateEmployee } from "@/store/slices/employeesSlice";
import { fetchFileUrl } from "@/store/slices/filesSlice";
import type { Employee } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableLoading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 8;

type Tab = "all" | "mechanic" | "advisor";

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const [broken, setBroken] = useState(false);

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!employee.avatar || broken) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-[#eff6ff] text-xs font-bold text-primary">
        {initials || "EM"}
      </span>
    );
  }

  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0]">
      <Image
        src={employee.avatar}
        alt={employee.name}
        fill
        unoptimized
        className="object-cover"
        onError={() => setBroken(true)}
      />
    </span>
  );
}

export default function EmployeeManagementPage() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.employees.items);
  const employeesStatus = useAppSelector((s) => s.employees.status);

  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ mode: "view" | "edit"; employee: Employee } | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (employees.length === 0) dispatch(fetchEmployees());
  }, [dispatch, employees.length]);

  const refresh = () => {
    dispatch(fetchEmployees());
    toast.success("Employee roster refreshed");
  };

  const mechanics = employees.filter((e) => e.role === "mechanic");
  const advisors = employees.filter((e) => e.role === "advisor");

  const rows = employees.filter((e) => {
    const matchTab = tab === "all" || e.role === tab;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      (e.specialization && e.specialization.toLowerCase().includes(q)) ||
      (e.station && e.station.toLowerCase().includes(q));
    return matchTab && matchStatus && matchSearch;
  });

  const activeCount = employees.filter((e) => e.status === "active").length;
  const activeMechanics = mechanics.filter((e) => e.status === "active").length;
  const activeAdvisors = advisors.filter((e) => e.status === "active").length;

  const kpis = [
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users,
      delta: { text: `${activeCount} active`, className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" },
    },
    {
      label: "Active Mechanics",
      value: activeMechanics,
      icon: Wrench,
      sub: `${mechanics.length - activeMechanics} inactive`,
    },
    {
      label: "Service Advisors",
      value: activeAdvisors,
      icon: Headset,
      sub: `${advisors.length - activeAdvisors} inactive`,
    },
  ];

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);

  const roleLabel = (e: Employee) => (e.role === "advisor" ? "Service Advisor" : "Mechanic");

  const handleToggleStatus = async (emp: Employee) => {
    setTogglingId(emp.id);
    const newStatus: "active" | "inactive" = emp.status === "active" ? "inactive" : "active";
    try {
      await dispatch(
        updateEmployee({
          id: emp.id,
          data: { status: newStatus },
        }),
      ).unwrap();
      toast.success(`${emp.name} marked ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (data: {
    name: string;
    phone: string;
    station?: string;
    specialization?: string;
    status: "active" | "inactive";
  }) => {
    if (!dialog) return;
    setSaving(true);
    try {
      await dispatch(
        updateEmployee({
          id: dialog.employee.id,
          data: {
            name: data.name,
            phone: data.phone,
            station: data.station ?? undefined,
            specialization: data.specialization ?? undefined,
            status: data.status,
          },
        }),
      ).unwrap();
      toast.success("Employee profile updated");
      setDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await dispatch(deleteEmployee(deleting.id)).unwrap();
      toast.success(`${deleting.name} deactivated`);
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if ((employeesStatus === "idle" || employeesStatus === "loading") && employees.length === 0) {
    return <TableLoading label="Loading employees roster" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium text-[#424753]">
            <Link href="/admin/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <span className="mx-1.5 text-[#cbd5e1]">›</span>
            <span className="font-semibold text-primary">Employees</span>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Employee Management</h1>
              <p className="text-xs text-muted-foreground pt-0.5">
                Manage workshop advisors, technicians, stations, and profile credentials.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-semibold text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-secondary"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-1.5 rounded-md bg-[#004492] px-4 py-2 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
              >
                <Link href="/admin/employees/advisors/new">
                  <Plus className="size-3.5" />
                  Add Advisor
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-1.5 rounded-md bg-[#004492] px-4 py-2 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
              >
                <Link href="/admin/employees/mechanics/new">
                  <Plus className="size-3.5" />
                  Add Mechanic
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-32 flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">{kpi.label}</span>
                <kpi.icon className="size-5 text-[#004492]" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold tracking-[-0.72px] text-foreground">{kpi.value}</span>
                {kpi.delta ? (
                  <span className={cn("flex items-center gap-1 rounded-xl px-2 py-0.5 text-xs font-semibold", kpi.delta.className)}>
                    <TrendingUp className="size-3" />
                    {kpi.delta.text}
                  </span>
                ) : (
                  <span className="pb-1 text-xs text-muted-foreground">{kpi.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Controls & Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] p-4">
            {/* Dynamic Role Tabs with counts */}
            <div className="flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-[#f3f4f5] p-1">
              {(
                [
                  { key: "all", label: "All Employees", count: employees.length },
                  { key: "mechanic", label: "Mechanics", count: mechanics.length },
                  { key: "advisor", label: "Advisors", count: advisors.length },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-[0.24px] transition-colors",
                    tab === t.key
                      ? "bg-white text-primary shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                      : "text-[#424753] hover:text-foreground",
                  )}
                >
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      tab === t.key ? "bg-[#eff6ff] text-primary" : "bg-[#e5e7eb] text-[#64748b]",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Status & Search Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
                >
                  <option value="all">All ({employees.length})</option>
                  <option value="active">Active ({activeCount})</option>
                  <option value="inactive">Inactive ({employees.length - activeCount})</option>
                </select>
              </div>

              <div className="relative w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, ID, phone..."
                  className="h-9 rounded-md border-[#e2e8f0] bg-white pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:border-primary"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8f9fa] border-b border-[#e2e8f0]">
                <TableHead className="px-5 py-3.5 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Employee</TableHead>
                <TableHead className="px-5 py-3.5 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Contact</TableHead>
                <TableHead className="px-5 py-3.5 text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Role & Station</TableHead>
                <TableHead className="px-5 py-3.5 text-center text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Status</TableHead>
                <TableHead className="px-5 py-3.5 text-right text-xs font-semibold tracking-[0.6px] text-[#424753] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((employee) => (
                <TableRow key={employee.id} className="border-t border-[#e2e8f0] transition-colors hover:bg-[#f8f9fa]">
                  <TableCell className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar employee={employee} />
                      <div>
                        <p className={cn("text-xs font-bold text-foreground", employee.status !== "active" && "text-muted-foreground")}>
                          {employee.name}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">{employee.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5 text-xs">
                      <a href={`mailto:${employee.email}`} className="flex items-center gap-1 text-foreground hover:text-primary hover:underline">
                        <Mail className="size-3 text-muted-foreground" />
                        <span>{employee.email}</span>
                      </a>
                      <a href={`tel:${employee.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                        <Phone className="size-3" />
                        <span>{employee.phone}</span>
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground">{roleLabel(employee)}</span>
                      {employee.station ? (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Wrench className="size-2.5 text-[#004492]" />
                          {employee.station}
                        </span>
                      ) : employee.specialization ? (
                        <span className="text-[11px] text-muted-foreground">{employee.specialization}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-center">
                    <div className="inline-flex items-center gap-2">
                      <Switch
                        checked={employee.status === "active"}
                        disabled={togglingId === employee.id}
                        onCheckedChange={() => void handleToggleStatus(employee)}
                        aria-label={`Toggle active status for ${employee.name}`}
                      />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          employee.status === "active" ? "text-[#4caf50]" : "text-muted-foreground",
                        )}
                      >
                        {employee.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setDialog({ mode: "view", employee })}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#eff6ff] hover:text-[#004492]"
                        aria-label={`View ${employee.name}`}
                        title="View details"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ mode: "edit", employee })}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-[#eff6ff] hover:text-[#004492]"
                        aria-label={`Edit ${employee.name}`}
                        title="Edit profile"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(employee)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Deactivate ${employee.name}`}
                        title="Deactivate employee"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pageRows.length === 0 && (
                <TableRow className="border-t border-[#e2e8f0]">
                  <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                    No employees match your search or filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Bar */}
          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-5 py-3.5 text-xs font-medium text-[#424753]">
            <p>
              Showing {rows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded border border-[#e2e8f0] bg-white p-2 text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {pageNumbers.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPage(label)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded text-xs font-semibold tracking-[0.24px] transition-colors",
                    safePage === label
                      ? "bg-[#004492] text-white shadow-sm"
                      : "border border-[#e2e8f0] bg-white text-[#424753] hover:bg-secondary",
                  )}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                className="rounded border border-[#e2e8f0] bg-white p-2 text-[#424753] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View & Edit Profile Dialog */}
      <EmployeeDialog
        key={dialog ? `${dialog.employee.id}-${dialog.mode}` : "closed"}
        dialog={dialog}
        saving={saving}
        onClose={() => setDialog(null)}
        onSave={handleSave}
      />

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Deactivate {deleting?.name}?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              The employee account will be set to inactive and will no longer be assigned to workshop stations or tasks.
              This can be undone at any time by toggling their status back to active.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="rounded-lg text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={saving} className="rounded-lg text-xs">
              {saving ? "Deactivating..." : "Deactivate Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeeDialog({
  dialog,
  saving,
  onClose,
  onSave,
}: {
  dialog: { mode: "view" | "edit"; employee: Employee } | null;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { name: string; phone: string; station?: string; specialization?: string; status: "active" | "inactive" }) => void;
}) {
  const dispatch = useAppDispatch();
  const urls = useAppSelector((s) => s.files.urls);

  const [name, setName] = useState(dialog?.employee.name ?? "");
  const [phone, setPhone] = useState(dialog?.employee.phone ?? "");
  const [station, setStation] = useState(dialog?.employee.station ?? "");
  const [specialization, setSpecialization] = useState(dialog?.employee.specialization ?? "");
  const [status, setStatus] = useState<"active" | "inactive">(dialog?.employee.status ?? "active");

  const mode = dialog?.mode ?? "view";
  const employee = dialog?.employee;

  useEffect(() => {
    if (employee?.documents) {
      for (const doc of employee.documents) {
        if (doc.key?.startsWith("MotoServe/") && !urls[doc.key]) {
          void dispatch(fetchFileUrl(doc.key)).catch(() => {});
        }
      }
    }
  }, [dispatch, employee?.documents, urls]);

  const rawDocs = employee?.documents ?? [];
  const resolvedDocs = rawDocs
    .map((d) => ({
      name: d.name,
      kind: d.kind,
      url: urls[d.key] || d.url || (d.key?.startsWith("http") || d.key?.startsWith("data:") ? d.key : ""),
    }))
    .filter((d) => Boolean(d.url));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      station: station.trim() || undefined,
      specialization: specialization.trim() || undefined,
      status,
    });
  };

  return (
    <Dialog open={dialog !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {employee && <EmployeeAvatar employee={employee} />}
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {mode === "view" ? employee?.name : `Edit ${employee?.name}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {employee?.role === "advisor" ? "Service Advisor" : "Mechanic"} • {employee?.id.toUpperCase()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={mode === "view"}
                className="h-9 rounded-md border-[#e2e8f0] bg-white text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={mode === "view"}
                className="h-9 rounded-md border-[#e2e8f0] bg-white text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Email</Label>
              <Input
                value={employee?.email ?? ""}
                readOnly
                className="h-9 rounded-md border-[#e2e8f0] bg-[#f8f9fa] text-xs text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">National ID (NID)</Label>
              <Input
                value={employee?.nid || "—"}
                readOnly
                className="h-9 rounded-md border-[#e2e8f0] bg-[#f8f9fa] text-xs text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                disabled={mode === "view"}
                className="h-9 w-full rounded-md border border-[#e2e8f0] bg-white px-3 text-xs text-foreground outline-none focus:border-primary disabled:bg-[#f8f9fa]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-foreground">Workshop Station</Label>
              <Input
                value={station}
                onChange={(e) => setStation(e.target.value)}
                readOnly={mode === "view"}
                placeholder="e.g. Main Bay / Station 01"
                className="h-9 rounded-md border-[#e2e8f0] bg-white text-xs"
              />
            </div>
            {employee?.role === "mechanic" && (
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-foreground">Specialization</Label>
                <Input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  readOnly={mode === "view"}
                  placeholder="e.g. Diagnostics & Hybrid Powertrains"
                  className="h-9 rounded-md border-[#e2e8f0] bg-white text-xs"
                />
              </div>
            )}
          </div>

          {/* Attached Documents Gallery in View Mode */}
          {mode === "view" && (
            <div className="flex flex-col gap-2.5 border-t border-[#e2e8f0] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="size-4 text-[#004492]" />
                  Verification & Attached Documents
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {resolvedDocs.length} document{resolvedDocs.length === 1 ? "" : "s"}
                </span>
              </div>

              {resolvedDocs.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {resolvedDocs.map((doc, idx) => {
                    const isImg =
                      doc.url.startsWith("data:image/") ||
                      /\.(jpg|jpeg|png|webp)($|\?)/i.test(doc.url) ||
                      /\.(jpg|jpeg|png|webp)$/i.test(doc.name);
                    return (
                      <div
                        key={`${doc.name}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] p-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border border-[#e2e8f0] bg-white">
                            {isImg ? (
                              <Image src={doc.url} alt={doc.name} fill unoptimized className="object-cover" />
                            ) : (
                              <FileText className="size-4 text-[#004492]" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-foreground truncate">{doc.name}</p>
                            <span className="text-[10px] text-muted-foreground">{doc.kind || "Document"}</span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1 text-muted-foreground hover:bg-white hover:text-primary transition-colors shrink-0"
                          title="Open document"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#e2e8f0] bg-[#f8f9fa] py-4 text-center text-xs text-muted-foreground">
                  No verification documents attached to this profile.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-md text-xs">
              {mode === "view" ? "Close" : "Cancel"}
            </Button>
            {mode === "edit" && (
              <Button type="submit" disabled={saving} className="rounded-md bg-[#004492] text-xs text-white">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
