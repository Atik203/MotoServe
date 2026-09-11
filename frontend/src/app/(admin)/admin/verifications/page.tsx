"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomers, verifyCustomer } from "@/store/slices/customersSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableLoading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/types";

const PAGE_SIZE = 8;

const statusPill: Record<string, string> = {
  pending: "bg-[rgba(255,193,7,0.12)] border-[rgba(255,193,7,0.3)] text-[#b45309]",
  approved: "bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]",
  rejected: "bg-[#fff1f2] border-[#fecdd3] text-[#e11d48]",
  inactive: "bg-secondary border-[#e2e8f0] text-muted-foreground",
};

export default function CustomerManagementPage() {
  const dispatch = useAppDispatch();
  const customers = useAppSelector((s) => s.customers.items);
  const customersStatus = useAppSelector((s) => s.customers.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [quickView, setQuickView] = useState<Customer | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCustomers());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const refresh = () => {
    dispatch(fetchCustomers());
    toast.success("Customer list refreshed");
  };

  const counts = useMemo(
    () => ({
      pending: customers.filter((c) => c.status === "pending").length,
      approved: customers.filter((c) => c.status === "approved").length,
      rejected: customers.filter((c) => c.status === "rejected").length,
      total: customers.length,
    }),
    [customers],
  );

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.nid && c.nid.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q);
      const matchFilter = filter === "all" || c.status === filter;
      return matchSearch && matchFilter;
    });
  }, [customers, search, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(pageCount, 6) }, (_, i) => i + 1);

  const setStatus = async (id: string, decision: "approved" | "rejected") => {
    setActionBusyId(id);
    try {
      await dispatch(verifyCustomer({ id, decision })).unwrap();
      toast.success(decision === "approved" ? "Customer account approved" : "Customer account rejected");
      if (quickView?.id === id) {
        setQuickView((prev) => (prev ? { ...prev, status: decision } : null));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionBusyId(null);
    }
  };

  const kpis = [
    {
      label: "Total Registered",
      value: counts.total,
      icon: Users,
      sub: "Active customer accounts",
    },
    {
      label: "Pending Verification",
      value: counts.pending,
      icon: ShieldAlert,
      sub: counts.pending > 0 ? "Requires review" : "All caught up",
      color: "text-[#b45309]",
    },
    {
      label: "Verified Owners",
      value: counts.approved,
      icon: UserCheck,
      sub: "Full portal access",
      color: "text-[#15803d]",
    },
    {
      label: "Rejected / Suspended",
      value: counts.rejected,
      icon: UserX,
      sub: "Needs updated documents",
      color: "text-[#64748b]",
    },
  ];

  if ((customersStatus === "idle" || customersStatus === "loading") && customers.length === 0) {
    return <TableLoading label="Loading customer directory" />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f5] p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-[#424753]">
            <Link href="/admin/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span>Operations</span>
            <span>›</span>
            <span className="text-foreground">Customer Management</span>
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.72px] text-foreground">Customer Management</h1>
              <p className="text-xs text-muted-foreground pt-0.5">
                Review vehicle owners, identity verifications, registered vehicles, and account approvals.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-semibold text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-secondary"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-32 flex-col justify-between rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#424753]">{kpi.label}</span>
                <kpi.icon className={cn("size-5", kpi.color || "text-[#004492]")} />
              </div>
              <div className="flex items-end justify-between">
                <span className={cn("text-4xl font-bold tracking-[-0.72px]", kpi.color || "text-foreground")}>
                  {kpi.value}
                </span>
                <span className="pb-1 text-xs text-muted-foreground">{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar & Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] p-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All Customers", count: counts.total },
                  { key: "pending", label: "Pending Verification", count: counts.pending },
                  { key: "approved", label: "Approved", count: counts.approved },
                  { key: "rejected", label: "Rejected", count: counts.rejected },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setFilter(t.key);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    filter === t.key
                      ? "bg-[#004492] text-white shadow-sm"
                      : "border border-[#e2e8f0] bg-white text-[#424753] hover:border-[#004492]/40 hover:text-[#004492]",
                  )}
                >
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      filter === t.key ? "bg-white/20 text-white" : "bg-[#f3f4f5] text-[#64748b]",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, phone, NID..."
                className="h-9 rounded-md border-[#e2e8f0] bg-white pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:border-[#004492]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f8f9fa] border-b border-[#e2e8f0]">
                <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Customer Owner</TableHead>
                <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Contact Information</TableHead>
                <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">National ID & Vehicles</TableHead>
                <TableHead className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#424753]">Registration</TableHead>
                <TableHead className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#424753]">Status</TableHead>
                <TableHead className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#424753]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((customer) => {
                const customerVehicles = vehicles.filter((v) => v.ownerId === customer.id);
                const initials = customer.name
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <TableRow key={customer.id} className="border-t border-[#e2e8f0] transition-colors hover:bg-[#f8f9fa]">
                    <TableCell className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-[#eff6ff] text-xs font-bold text-primary">
                          {initials || "CU"}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{customer.name}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">{customer.id.toUpperCase()}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <a href={`mailto:${customer.email}`} className="flex items-center gap-1 text-foreground hover:text-primary hover:underline">
                          <Mail className="size-3 text-muted-foreground" />
                          <span>{customer.email}</span>
                        </a>
                        <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                          <Phone className="size-3" />
                          <span>{customer.phone}</span>
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1">
                          <ShieldCheck className="size-3 text-[#004492]" />
                          NID: {customer.nid || "Not Provided"}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Car className="size-3" />
                          {customerVehicles.length} registered vehicle{customerVehicles.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-xs text-muted-foreground">
                      {customer.joinedAt
                        ? new Date(customer.joinedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase",
                          statusPill[customer.status] || "bg-secondary text-muted-foreground",
                        )}
                      >
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickView(customer)}
                          className="h-8 px-2 text-xs font-semibold text-[#424753] hover:text-[#004492]"
                          title="Quick View"
                        >
                          <Eye className="size-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold text-[#004492] hover:bg-[#eff6ff]"
                        >
                          <Link href={`/admin/verifications/${customer.id}`}>
                            Review
                            <ExternalLink className="size-3 ml-1" />
                          </Link>
                        </Button>
                        {customer.status !== "approved" && (
                          <Button
                            size="sm"
                            disabled={actionBusyId === customer.id}
                            onClick={() => void setStatus(customer.id, "approved")}
                            className="h-8 rounded-md bg-[#15803d] px-2.5 text-xs font-semibold text-white hover:bg-[#15803d]/90"
                          >
                            Approve
                          </Button>
                        )}
                        {customer.status !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionBusyId === customer.id}
                            onClick={() => void setStatus(customer.id, "rejected")}
                            className="h-8 rounded-md border-rose-200 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow className="border-t border-[#e2e8f0]">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                    No customers match your search or filter criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Bar */}
          <div className="flex items-center justify-between border-t border-[#e2e8f0] px-5 py-3.5 text-xs font-medium text-[#424753]">
            <p>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} customers
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

      {/* Customer Quick Profile Dialog */}
      <Dialog open={quickView !== null} onOpenChange={(open) => !open && setQuickView(null)}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase",
                  quickView ? statusPill[quickView.status] : "",
                )}
              >
                {quickView?.status}
              </span>
              <span className="font-mono text-xs text-muted-foreground">#{quickView?.id.toUpperCase()}</span>
            </div>
            <DialogTitle className="text-lg font-bold text-foreground pt-2">{quickView?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Customer profile and account verification overview.
            </DialogDescription>
          </DialogHeader>

          {quickView && (
            <div className="flex flex-col gap-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Phone</span>
                  <span className="font-semibold text-foreground">{quickView.phone || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Email</span>
                  <span className="font-semibold text-foreground">{quickView.email}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">National ID</span>
                  <span className="font-semibold text-foreground">{quickView.nid || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Registered Date</span>
                  <span className="font-semibold text-foreground">
                    {quickView.joinedAt ? new Date(quickView.joinedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div className="rounded-lg border border-[#e2e8f0] p-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Registered Vehicles</span>
                {(() => {
                  const custVehicles = vehicles.filter((v) => v.ownerId === quickView.id);
                  if (custVehicles.length === 0) {
                    return <p className="mt-1 text-muted-foreground">No vehicles registered yet.</p>;
                  }
                  return (
                    <div className="mt-2 flex flex-col gap-2">
                      {custVehicles.map((v) => (
                        <div key={v.id} className="flex items-center justify-between border-b border-[#e2e8f0] pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-foreground">
                              {v.year} {v.make} {v.model}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground">{v.regNo}</p>
                          </div>
                          <span className="rounded bg-[#f3f4f5] px-2 py-0.5 text-[10px] font-semibold text-[#424753] capitalize">
                            {v.fuelType}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setQuickView(null)} className="text-xs">
              Close
            </Button>
            {quickView && (
              <Button asChild className="bg-[#004492] text-xs text-white">
                <Link href={`/admin/verifications/${quickView.id}`}>
                  Full Verification Review
                  <ExternalLink className="size-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
