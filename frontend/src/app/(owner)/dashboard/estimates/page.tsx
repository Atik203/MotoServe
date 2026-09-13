"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  FileX,
  Hourglass,
  LayoutGrid,
  List,
  ReceiptText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { TableLoading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, { className: string; icon: typeof Hourglass }> = {
  pending: { className: "bg-amber-50 text-amber-800 border border-amber-200", icon: Hourglass },
  approved: { className: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: FileCheck },
  rejected: { className: "bg-rose-50 text-rose-700 border border-rose-200", icon: FileX },
};

export default function MyEstimatesPage() {
  const dispatch = useAppDispatch();
  const estimates = useAppSelector((s) => s.estimates.items);
  const estimatesStatus = useAppSelector((s) => s.estimates.status);
  const tasks = useAppSelector((s) => s.tasks.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    if (estimates.length === 0) dispatch(fetchEstimates());
    if (tasks.length === 0) dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, estimates.length, tasks.length, vehicles.length]);

  const refreshAll = () => {
    dispatch(fetchEstimates());
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    toast.success("Estimates refreshed");
  };

  const vehicleForEstimate = useCallback(
    (estimate: (typeof estimates)[number]) => {
      const taskCard = estimate.taskCard;
      const taskId = estimate.taskId;
      const task = tasks.find((t) => t.id === taskId);
      return taskCard?.vehicle ?? (task ? vehicles.find((v) => v.id === task.vehicleId) : undefined);
    },
    [tasks, vehicles]
  );

  const metrics = useMemo(() => {
    const pending = estimates.filter((e) => e.status === "pending");
    const approved = estimates.filter((e) => e.status === "approved");
    const rejected = estimates.filter((e) => e.status === "rejected");
    const pendingTotal = pending.reduce((acc, curr) => acc + curr.total, 0);

    return {
      total: estimates.length,
      pendingCount: pending.length,
      pendingTotal,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
    };
  }, [estimates]);

  const filteredEstimates = useMemo(() => {
    return estimates.filter((estimate) => {
      const v = vehicleForEstimate(estimate);
      const q = search.trim().toLowerCase();

      const itemsText = estimate.items.map((i) => i.description).join(" ").toLowerCase();
      const matchesSearch =
        !q ||
        estimate.id.toLowerCase().includes(q) ||
        (estimate.taskId && estimate.taskId.toLowerCase().includes(q)) ||
        itemsText.includes(q) ||
        (estimate.summary && estimate.summary.toLowerCase().includes(q)) ||
        (v && (v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.regNo.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (statusFilter !== "all" && estimate.status !== statusFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [estimates, vehicleForEstimate, search, statusFilter]);

  if ((estimatesStatus === "idle" || estimatesStatus === "loading") && estimates.length === 0) {
    return <TableLoading label="Loading estimates" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-foreground">Repair Estimates</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Repair Estimates</h1>
              <p className="pt-1 text-sm text-muted-foreground">
                Review, approve, or reject cost estimates prepared by your service advisors.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAll}
                className="gap-1.5 rounded-xl border-border bg-white text-xs font-semibold text-foreground shadow-xs hover:bg-secondary cursor-pointer"
              >
                <RefreshCw className="size-3.5 text-primary" />
                Refresh
              </Button>
              <Link
                href="/dashboard/appointments/book"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <CalendarPlus className="size-4" />
                Book Service
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-amber-200 bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Hourglass className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Awaiting Approval</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{metrics.pendingCount}</p>
                {metrics.pendingTotal > 0 && (
                  <span className="text-xs font-semibold text-amber-700">
                    (${metrics.pendingTotal.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Approved</p>
              <p className="text-2xl font-bold text-foreground">{metrics.approvedCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FileX className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Rejected</p>
              <p className="text-2xl font-bold text-foreground">{metrics.rejectedCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <ReceiptText className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total Estimates</p>
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
            </div>
          </div>
        </div>

        {/* Toolbar with Search, Status Pills, and Table/Grid toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by estimate ID, vehicle, parts, scope..."
                className="h-9 rounded-xl border-border bg-[#f8f9fa] pl-9 text-xs focus:bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-primary text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                All ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "pending"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Awaiting Approval ({metrics.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "approved"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Approved ({metrics.approvedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("rejected")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  statusFilter === "rejected"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Rejected ({metrics.rejectedCount})
              </button>
            </div>
          </div>

          {/* View Mode Switcher (Table default vs Grid) */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-[#f8f9fa] p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Table View"
            >
              <List className="size-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
          </div>
        </div>

        {/* Content View: Table (Default) or Grid */}
        {filteredEstimates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <ReceiptText className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No estimates found</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {search
                ? "Try searching for a different estimate reference, vehicle, or service keyword."
                : "Estimates sent by your service advisor will appear here for review and one-click authorization."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View (Default) */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[130px] text-xs font-bold text-muted-foreground">ESTIMATE ID</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">VEHICLE</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">SCOPE & ITEMS</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">TOTAL AMOUNT</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((estimate) => {
                  const vehicle = vehicleForEstimate(estimate);
                  const Style = statusStyle[estimate.status] ?? statusStyle.pending;

                  return (
                    <TableRow key={estimate.id} className="border-border hover:bg-[#f8f9fa]/60 transition-colors">
                      {/* Estimate ID */}
                      <TableCell className="align-middle">
                        <span className="font-mono text-xs font-bold text-primary">{estimate.id}</span>
                        {estimate.taskId && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Task #{estimate.taskId}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(estimate.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                            {vehicle && (
                              <VehicleImage
                                src={vehicle.image}
                                alt={`${vehicle.make} ${vehicle.model}`}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                            </p>
                            <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider mt-0.5">
                              {vehicle?.regNo ?? "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Scope & Items */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <p className="text-xs font-medium text-foreground line-clamp-1">
                            {estimate.summary || "Inspection findings and replacement parts"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {estimate.items.length} line {estimate.items.length === 1 ? "item" : "items"}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {estimate.items.slice(0, 2).map((i) => i.description).join(", ")}
                              {estimate.items.length > 2 ? ` +${estimate.items.length - 2} more` : ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="align-middle">
                        <p className="text-sm font-bold text-primary">
                          ${estimate.total.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">incl. taxes & fees</p>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", Style.className)}>
                          <Style.icon className="size-3" />
                          {estimate.status}
                        </span>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="align-middle text-right">
                        <Link
                          href={`/dashboard/estimates/${estimate.id}`}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs",
                            estimate.status === "pending"
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "bg-primary text-white hover:bg-primary/90",
                          )}
                        >
                          {estimate.status === "pending" ? "Review & Decide" : "View Details"}
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEstimates.map((estimate) => {
              const vehicle = vehicleForEstimate(estimate);
              const Style = statusStyle[estimate.status] ?? statusStyle.pending;

              return (
                <div
                  key={estimate.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-xs transition-all hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border">
                        {vehicle && (
                          <VehicleImage
                            src={vehicle.image}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[#2a3042]">
                            {vehicle?.regNo}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">{estimate.id}</span>
                        </div>
                      </div>
                    </div>

                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", Style.className)}>
                      <Style.icon className="size-3.5" />
                      {estimate.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-xl bg-[#f8f9fa] p-3.5">
                    {estimate.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.description}</span>
                        <span className="font-semibold text-foreground">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {estimate.items.length > 3 && (
                      <p className="text-[11px] text-muted-foreground">+{estimate.items.length - 3} more items</p>
                    )}
                    <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                      <span className="text-xs font-bold text-foreground">Estimated Total</span>
                      <span className="text-base font-bold text-primary">${estimate.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/estimates/${estimate.id}`}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors shadow-2xs",
                      estimate.status === "pending"
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-primary text-white hover:bg-primary/90",
                    )}
                  >
                    {estimate.status === "pending" ? "Review & Decide" : "View Details"}
                    <ReceiptText className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
