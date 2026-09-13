"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  FilePlus2,
  Grid,
  List,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableLoading } from "@/components/ui/loading";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StatusTab = "all" | "pending" | "approved" | "rejected";

function AdvisorEstimatesContent() {
  const dispatch = useAppDispatch();

  const estimates = useAppSelector((s) => s.estimates.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const customers = useAppSelector((s) => s.customers.items);

  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  useEffect(() => {
    dispatch(fetchEstimates());
    dispatch(fetchTasks());
    dispatch(fetchVehicles());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = estimates.length;
    const pending = estimates.filter((e) => (e.status || "pending").toLowerCase() === "pending").length;
    const approved = estimates.filter((e) => (e.status || "").toLowerCase() === "approved").length;
    const totalValue = estimates.reduce((sum, e) => sum + (e.total || 0), 0);
    return { total, pending, approved, totalValue };
  }, [estimates]);

  const filteredEstimates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return estimates.filter((est) => {
      const st = (est.status || "pending").toLowerCase();
      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (!q) return true;

      const targetTaskId = est.taskId || est.taskCardId || "";
      const task = tasks.find((t) => t.id === targetTaskId);
      const vehicle =
        task?.vehicle ||
        (task?.vehicleId ? vehicles.find((v) => v.id === task.vehicleId) : null) ||
        est.taskCard?.vehicle;
      const customer =
        task?.customer ||
        (est.customerId ? customers.find((c) => c.id === est.customerId) : null) ||
        est.taskCard?.customer;

      const matchesId = est.id.toLowerCase().includes(q);
      const matchesTask = targetTaskId.toLowerCase().includes(q);
      const matchesCustomer = customer?.name?.toLowerCase().includes(q);
      const matchesReg = vehicle?.regNo?.toLowerCase().includes(q);
      const matchesModel = `${vehicle?.make || ""} ${vehicle?.model || ""}`.toLowerCase().includes(q);

      return matchesId || matchesTask || matchesCustomer || matchesReg || matchesModel;
    });
  }, [estimates, statusFilter, searchQuery, tasks, vehicles, customers]);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#727784]">
            <Link href="/advisor" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-foreground">Estimates</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">
                Cost Estimates
              </h1>
              <p className="mt-0.5 text-xs text-[#64748b]">
                Manage preliminary work quotations, parts assessments, and track client approvals.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/advisor/estimates/new">
                <Button className="h-10 gap-2 rounded-lg text-sm font-semibold shadow-xs">
                  <FilePlus2 className="size-4" />
                  Create Estimate
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748b]">
              <span>Total Estimates</span>
              <FileCheck2 className="size-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-[#191c1d]">{stats.total}</span>
            <span className="text-[11px] text-[#64748b]">Created across all jobs</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800">
              <span>Awaiting Decision</span>
              <Clock className="size-4 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-amber-900">{stats.pending}</span>
            <span className="text-[11px] text-amber-700">Pending customer response</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
              <span>Approved Quotes</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-900">{stats.approved}</span>
            <span className="text-[11px] text-emerald-700">Customer authorized</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748b]">
              <span>Total Value Quoted</span>
              <DollarSign className="size-4 text-primary" />
            </div>
            <span className="text-2xl font-bold text-primary">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-[#64748b]">Gross proposal volume</span>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#e5e7eb] bg-white p-1 shadow-xs">
            {(["all", "pending", "approved", "rejected"] as StatusTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors",
                  statusFilter === tab
                    ? "bg-primary text-white shadow-xs"
                    : "text-[#424753] hover:bg-[#f3f4f5]"
                )}
              >
                {tab === "all" ? "All Proposals" : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#727784]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, plate, customer..."
                className="h-9 w-64 rounded-lg border-[#e5e7eb] bg-white pl-[30px] text-[13px]"
              />
            </div>

            {/* View Switcher */}
            <div className="flex items-center rounded-lg border border-[#e5e7eb] bg-white p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md text-xs",
                  viewMode === "table"
                    ? "bg-primary text-white"
                    : "text-[#424753] hover:bg-[#f3f4f5]"
                )}
                title="Table View (Default)"
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md text-xs",
                  viewMode === "cards"
                    ? "bg-primary text-white"
                    : "text-[#424753] hover:bg-[#f3f4f5]"
                )}
                title="Cards View"
              >
                <Grid className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === "table" ? (
          <section className="w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <Table>
              <TableHeader>
                <tr className="border-b border-[#e5e7eb] bg-[#f8fafc] text-left">
                  <TableHead className="py-3 pr-4 pl-4 text-xs font-bold text-[#424753]">Quote ID</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-xs font-bold text-[#424753]">Vehicle & Plate</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-xs font-bold text-[#424753]">Customer</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-xs font-bold text-[#424753]">Task Card</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-xs font-bold text-[#424753]">Items</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-xs font-bold text-[#424753]">Status</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-right text-xs font-bold text-[#424753]">Amount</TableHead>
                  <TableHead className="py-3 pr-4 pl-4 text-right text-xs font-bold text-[#424753]">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((est) => {
                  const targetTaskId = est.taskId || est.taskCardId;
                  const task = tasks.find((t) => t.id === targetTaskId);
                  const vehicle =
                    task?.vehicle ||
                    (task?.vehicleId ? vehicles.find((v) => v.id === task.vehicleId) : null) ||
                    est.taskCard?.vehicle;
                  const customer =
                    task?.customer ||
                    (est.customerId ? customers.find((c) => c.id === est.customerId) : null) ||
                    est.taskCard?.customer;
                  const st = (est.status || "pending").toLowerCase();

                  return (
                    <TableRow key={est.id} className="border-[#e5e7eb] hover:bg-[#f8fafc]">
                      {/* Quote ID */}
                      <TableCell className="py-4 pr-4 pl-4 font-mono text-xs font-bold">
                        <Link href={`/advisor/estimates/${est.id}`} className="text-primary hover:underline">
                          #{est.id}
                        </Link>
                      </TableCell>

                      {/* Vehicle & Plate */}
                      <TableCell className="py-4 pr-4 pl-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8fafc]">
                            <VehicleImage
                              src={vehicle?.image || "/images/cars/car-1.png"}
                              alt={vehicle?.model || "Vehicle"}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#191c1d]">
                              {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                            </p>
                            <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1e293b]">
                              {vehicle?.regNo || "NO PLATE"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="py-4 pr-4 pl-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7 border border-[#e5e7eb]">
                            {customer?.avatar && <AvatarImage src={customer.avatar} alt={customer.name} />}
                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                              {customer?.name ? customer.name.slice(0, 2).toUpperCase() : "CU"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold text-[#191c1d]">{customer?.name || "Client"}</p>
                            <p className="text-[11px] text-[#64748b]">{customer?.phone || "No phone"}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Task Card */}
                      <TableCell className="py-4 pr-4 pl-4 font-mono text-xs">
                        {targetTaskId ? (
                          <Link href={`/advisor/tasks/${targetTaskId}`} className="font-semibold text-primary hover:underline">
                            #{targetTaskId}
                          </Link>
                        ) : (
                          <span className="text-[#64748b]">—</span>
                        )}
                      </TableCell>

                      {/* Items Count */}
                      <TableCell className="py-4 pr-4 pl-4 text-xs font-medium text-[#424753]">
                        {(est.items ?? []).length} items
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4 pr-4 pl-4">
                        {st === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            Approved
                          </span>
                        )}
                        {st === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            <Clock className="size-3" />
                            Pending
                          </span>
                        )}
                        {st === "rejected" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <XCircle className="size-3" />
                            Declined
                          </span>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-4 pr-4 pl-4 text-right font-mono text-xs font-bold text-[#191c1d]">
                        ${(est.total || 0).toFixed(2)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-4 pr-4 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/advisor/estimates/${est.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-md border-[#e5e7eb] px-2.5 text-xs font-semibold text-primary hover:bg-[#eff6ff]"
                            >
                              Details
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredEstimates.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FileCheck2 className="size-8 text-[#9ca3af]" />
                <p className="text-sm font-semibold text-foreground">No estimates found</p>
                <p className="text-xs text-[#727784]">Try changing your search query or status filter.</p>
              </div>
            )}
          </section>
        ) : (
          /* Cards View Grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEstimates.map((est) => {
              const targetTaskId = est.taskId || est.taskCardId;
              const task = tasks.find((t) => t.id === targetTaskId);
              const vehicle =
                task?.vehicle ||
                (task?.vehicleId ? vehicles.find((v) => v.id === task.vehicleId) : null) ||
                est.taskCard?.vehicle;
              const customer =
                task?.customer ||
                (est.customerId ? customers.find((c) => c.id === est.customerId) : null) ||
                est.taskCard?.customer;
              const st = (est.status || "pending").toLowerCase();

              return (
                <div
                  key={est.id}
                  className="flex flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-[#f1f3f5] pb-3">
                      <Link href={`/advisor/estimates/${est.id}`} className="font-mono text-xs font-bold text-primary hover:underline">
                        #{est.id}
                      </Link>
                      {st === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          Approved
                        </span>
                      )}
                      {st === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
                      {st === "rejected" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <XCircle className="size-3" />
                          Declined
                        </span>
                      )}
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8fafc]">
                        <VehicleImage
                          src={vehicle?.image || "/images/cars/car-1.png"}
                          alt={vehicle?.model || "Vehicle"}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#191c1d]">
                          {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle"}
                        </p>
                        <span className="mt-0.5 inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#1e293b]">
                          {vehicle?.regNo || "NO PLATE"}
                        </span>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-xs text-[#64748b]">
                      <User className="size-3.5 text-primary" />
                      <span className="font-semibold text-[#191c1d]">{customer?.name || "Client"}</span>
                      {customer?.phone && <span>· {customer.phone}</span>}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#f1f3f5] pt-3">
                    <div>
                      <p className="text-[10px] text-[#64748b]">Total Quoted</p>
                      <p className="font-mono text-base font-bold text-primary">
                        ${(est.total || 0).toFixed(2)}
                      </p>
                    </div>

                    <Link href={`/advisor/estimates/${est.id}`}>
                      <Button size="sm" className="h-8 rounded-lg text-xs font-semibold">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdvisorEstimatesPage() {
  return (
    <Suspense fallback={<TableLoading label="Loading cost estimates..." />}>
      <AdvisorEstimatesContent />
    </Suspense>
  );
}
