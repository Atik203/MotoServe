"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Clock,
  Eye,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchServices, updateService, deleteService } from "@/store/slices/servicesSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableLoading } from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
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
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Service, ServiceCategory } from "@/types";

const PAGE_SIZE = 8;
const LABOR_RATE_PER_HOUR = 45;

const CATEGORIES: { label: string; value: ServiceCategory | "all" }[] = [
  { label: "All Services", value: "all" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Repairs", value: "repairs" },
  { label: "Inspections", value: "inspections" },
];

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const formatDuration = (mins: number) =>
  mins < 60 ? `${mins}m` : mins % 60 === 0 ? `${mins / 60}h` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

const formatCategory = (category: Service["category"]) =>
  category.charAt(0).toUpperCase() + category.slice(1);

const categoryBadgeStyles: Record<string, string> = {
  maintenance: "bg-[#eff6ff] text-[#004492] border-[#bfdbfe]",
  repairs: "bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]",
  inspections: "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]",
};

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const services = useAppSelector((s) => s.services.items);
  const servicesStatus = useAppSelector((s) => s.services.status);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc" | "duration-asc" | "duration-desc">("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(0);

  // Modals
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [previewService, setPreviewService] = useState<Service | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (services.length === 0) dispatch(fetchServices());
  }, [dispatch, services.length]);

  const refresh = () => {
    dispatch(fetchServices());
    toast.success("Services catalog refreshed");
  };

  const handleToggleActive = async (service: Service) => {
    setTogglingId(service.id);
    const newActive = !service.active;
    try {
      await dispatch(updateService({ id: service.id, data: { active: newActive } })).unwrap();
      toast.success(`Service "${service.name}" marked ${newActive ? "active" : "inactive"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update service status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await dispatch(deleteService(deleting.id)).unwrap();
      toast.success(`Service "${deleting.name}" deleted from catalog`);
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setDeletingBusy(false);
    }
  };

  if (servicesStatus === "loading" && services.length === 0) {
    return <TableLoading label="Loading services catalog" />;
  }

  // Aggregate Metrics
  const total = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = total - activeCount;
  const avgPrice = total > 0 ? services.reduce((s, x) => s + x.basePrice, 0) / total : 0;
  const avgDuration = total > 0 ? services.reduce((s, x) => s + x.durationMins, 0) / total : 0;

  // Filter & Sort
  const filtered = services.filter((s) => {
    const matchCat = category === "all" || s.category.toLowerCase() === category.toLowerCase();
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? s.active : !s.active);
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      String(s.basePrice).includes(q);
    return matchCat && matchStatus && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "price-asc") return a.basePrice - b.basePrice;
    if (sortBy === "price-desc") return b.basePrice - a.basePrice;
    if (sortBy === "duration-asc") return a.durationMins - b.durationMins;
    if (sortBy === "duration-desc") return b.durationMins - a.durationMins;
    return 0;
  });

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const rows = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#f3f4f5]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-8 pt-8 pb-16">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.24px] text-[#424753]">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <span>›</span>
              <span>Catalog</span>
              <span>›</span>
              <span className="text-foreground">Services</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Service Management</h1>
            <p className="text-sm text-muted-foreground">
              Configure workshop offerings, labor pricing, bay durations, and portal availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="gap-1.5 rounded-md border-[#e2e8f0] bg-white px-4 py-2 text-sm font-medium text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              asChild
              size="sm"
              className="gap-2 rounded-md bg-[#004492] px-5 py-2 text-sm font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#004492]/90"
            >
              <Link href="/admin/services/new">
                <Plus className="size-4" />
                New Service
              </Link>
            </Button>
          </div>
        </div>

        {/* Aggregate KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-[0.3px]">Total Services</span>
              <Wrench className="size-4 text-[#004492]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-foreground">{total}</span>
            <span className="text-[11px] text-muted-foreground">in active catalog</span>
          </div>

          <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-[0.3px]">Active</span>
              <span className="size-2 rounded-full bg-[#4caf50]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-[#4caf50]">{activeCount}</span>
            <span className="text-[11px] text-muted-foreground">bookable online</span>
          </div>

          <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-[0.3px]">Inactive</span>
              <span className="size-2 rounded-full bg-[#9ca3af]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-[#64748b]">{inactiveCount}</span>
            <span className="text-[11px] text-muted-foreground">archived/hidden</span>
          </div>

          <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-[0.3px]">Avg Base Price</span>
              <Tag className="size-4 text-[#004492]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-foreground">{money(avgPrice)}</span>
            <span className="text-[11px] text-muted-foreground">excluding parts</span>
          </div>

          <div className="flex flex-col justify-between rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between text-[#424753]">
              <span className="text-xs font-semibold uppercase tracking-[0.3px]">Avg Duration</span>
              <Clock className="size-4 text-[#004492]" />
            </div>
            <span className="pt-2 text-3xl font-bold text-foreground">{formatDuration(Math.round(avgDuration))}</span>
            <span className="text-[11px] text-muted-foreground">technician bay time</span>
          </div>
        </div>

        {/* Filter, Search & View Controls */}
        <div className="flex flex-col gap-3 rounded-[12px] border border-[#e2e8f0] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((c) => {
                const count = c.value === "all" ? services.length : services.filter((s) => s.category.toLowerCase() === c.value).length;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setCategory(c.value);
                      setPage(0);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                      category === c.value
                        ? "bg-[#004492] text-white shadow-sm"
                        : "border border-[#e2e8f0] bg-white text-[#424753] hover:border-[#004492]/40 hover:text-[#004492]"
                    )}
                  >
                    <span>{c.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px]",
                        category === c.value ? "bg-white/20 text-white" : "bg-[#f3f4f5] text-[#64748b]"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md bg-[#f3f4f5] p-[3px]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={cn(
                  "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                  viewMode === "grid" ? "bg-white text-[#004492] shadow-sm" : "text-[#64748b] hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                className={cn(
                  "flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition-colors",
                  viewMode === "table" ? "bg-white text-[#004492] shadow-sm" : "text-[#64748b] hover:text-foreground"
                )}
              >
                <List className="size-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Secondary Controls: Search, Status, Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3">
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search services by name, keywords, or price..."
                className="h-9 w-full rounded-md border border-[#e2e8f0] bg-white pl-9 pr-8 text-xs text-foreground outline-none transition-colors focus:border-[#004492]"
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

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | "active" | "inactive");
                    setPage(0);
                  }}
                  className="h-9 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-[#004492]"
                >
                  <option value="all">All ({total})</option>
                  <option value="active">Active Only ({activeCount})</option>
                  <option value="inactive">Inactive Only ({inactiveCount})</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown className="size-3.5" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-foreground outline-none transition-colors focus:border-[#004492]"
                >
                  <option value="name-asc">Name (A - Z)</option>
                  <option value="name-desc">Name (Z - A)</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="duration-asc">Duration: Shortest First</option>
                  <option value="duration-desc">Duration: Longest First</option>
                </select>
              </div>

              {/* Reset Filters */}
              {(search || category !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setStatusFilter("all");
                    setPage(0);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs font-medium text-[#424753]">
          <span>
            Showing <strong className="text-foreground">{rows.length}</strong> of{" "}
            <strong className="text-foreground">{sorted.length}</strong> services
            {filtered.length !== total && ` (filtered from ${total} total)`}
          </span>
        </div>

        {/* Content View: Grid or Table */}
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[#e2e8f0] bg-white py-20 text-center shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#eff6ff] text-[#004492]">
              <Wrench className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No services found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || category !== "all" || statusFilter !== "all"
                ? "Try adjusting your search criteria or clearing filters."
                : "Your catalog is empty. Create your first service offering."}
            </p>
            {(search || category !== "all" || statusFilter !== "all") ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setStatusFilter("all");
                }}
                className="mt-4 gap-1.5 rounded-md text-xs"
              >
                Clear Filters
              </Button>
            ) : (
              <Button asChild size="sm" className="mt-4 gap-1.5 rounded-md bg-[#004492] text-xs text-white">
                <Link href="/admin/services/new">
                  <Plus className="size-3.5" />
                  Add New Service
                </Link>
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((service) => {
              const laborEst = (service.durationMins / 60) * LABOR_RATE_PER_HOUR;
              const totalEst = service.basePrice + laborEst;
              const imgUrl = service.marketing?.image ?? null;

              return (
                <div
                  key={service.id}
                  className={cn(
                    "group relative flex flex-col justify-between overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:shadow-md",
                    service.active ? "border-[#e2e8f0]" : "border-[#e2e8f0] opacity-75"
                  )}
                >
                  {/* Top Thumbnail & Badges */}
                  <div className="relative h-36 w-full overflow-hidden bg-[#f3f4f5]">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={service.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eff6ff] to-[#e2e8f0]">
                        <Wrench className="size-10 text-[#004492]/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Category badge */}
                    <span
                      className={cn(
                        "absolute top-3 left-3 rounded-md border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase shadow-sm",
                        categoryBadgeStyles[service.category] ?? "bg-white text-[#424753] border-border"
                      )}
                    >
                      {formatCategory(service.category)}
                    </span>

                    {/* Duration badge */}
                    <span className="absolute top-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <Clock className="size-3" />
                      {formatDuration(service.durationMins)}
                    </span>

                    {/* Price banner */}
                    <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between text-white">
                      <div>
                        <span className="text-[10px] font-medium text-white/80 uppercase">Base Price</span>
                        <p className="text-xl font-bold leading-tight">{money(service.basePrice)}</p>
                      </div>
                      <span className="text-[11px] text-white/90">Est. Total {money(totalEst)}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn("text-base font-bold text-foreground line-clamp-1", !service.active && "line-through text-muted-foreground")}>
                        {service.name}
                      </h3>
                    </div>

                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {service.description || "Comprehensive service offering covering professional workshop inspection and maintenance."}
                    </p>

                    {/* Marketing tags */}
                    {service.marketing?.tags && service.marketing.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {service.marketing.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 rounded bg-[#f3f4f5] px-1.5 py-0.5 text-[10px] font-medium text-[#424753]">
                            <Sparkles className="size-2.5 text-[#004492]" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#fafafa] px-4 py-2.5">
                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.active}
                        disabled={togglingId === service.id}
                        onCheckedChange={() => void handleToggleActive(service)}
                        aria-label={`Toggle active for ${service.name}`}
                      />
                      <span className={cn("text-[11px] font-semibold", service.active ? "text-[#4caf50]" : "text-muted-foreground")}>
                        {service.active ? "Active" : "Hidden"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Quick view ${service.name}`}
                        onClick={() => setPreviewService(service)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-[#004492] hover:shadow-sm"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        aria-label={`Edit ${service.name}`}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-white hover:text-[#004492] hover:shadow-sm"
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${service.name}`}
                        onClick={() => setDeleting(service)}
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Table>
              <TableHeader>
                <tr className="bg-[#f8f9fa] text-[11px] font-semibold tracking-[0.55px] text-[#424753] uppercase border-b border-[#e2e8f0]">
                  <th className="px-6 py-3.5">Service Offering</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Base Price</th>
                  <th className="px-6 py-3.5 text-right">Duration</th>
                  <th className="px-6 py-3.5 text-right">Est. Total</th>
                  <th className="px-6 py-3.5 text-center">Catalog Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </TableHeader>
              <TableBody>
                {rows.map((service) => {
                  const laborEst = (service.durationMins / 60) * LABOR_RATE_PER_HOUR;
                  const totalEst = service.basePrice + laborEst;

                  return (
                    <TableRow key={service.id} className="border-t border-[#e2e8f0] transition-colors hover:bg-[#f8f9fa]">
                      <TableCell className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,68,146,0.1)] text-[#004492]">
                            <Wrench className="size-4" />
                          </span>
                          <div>
                            <p className={cn("text-sm font-semibold text-foreground", !service.active && "line-through text-muted-foreground")}>
                              {service.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[340px]">
                              {service.description || "Standard workshop service"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                            categoryBadgeStyles[service.category] ?? "bg-white text-[#424753]"
                          )}
                        >
                          {formatCategory(service.category)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right text-sm font-semibold text-foreground">
                        {money(service.basePrice)}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right text-sm text-[#424753]">
                        {formatDuration(service.durationMins)}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right text-sm font-bold text-[#004492]">
                        {money(totalEst)}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Switch
                            checked={service.active}
                            disabled={togglingId === service.id}
                            onCheckedChange={() => void handleToggleActive(service)}
                            aria-label={`Toggle active for ${service.name}`}
                          />
                          <span className={cn("text-xs font-semibold", service.active ? "text-[#4caf50]" : "text-muted-foreground")}>
                            {service.active ? "Active" : "Hidden"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`View ${service.name}`}
                            onClick={() => setPreviewService(service)}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[#eff6ff] hover:text-[#004492]"
                          >
                            <Eye className="size-4" />
                          </button>
                          <Link
                            href={`/admin/services/${service.id}/edit`}
                            aria-label={`Edit ${service.name}`}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[#eff6ff] hover:text-[#004492]"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <button
                            type="button"
                            aria-label={`Delete ${service.name}`}
                            onClick={() => setDeleting(service)}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Bar */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-3 text-xs font-medium text-[#424753] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <span>
              Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length} services
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-[#e2e8f0] bg-white px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(pageCount, 6) }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className={cn(
                    "size-7 rounded border text-xs font-semibold transition-colors",
                    page === i
                      ? "border-[#004492] bg-[#004492] text-white"
                      : "border-[#e2e8f0] bg-white text-[#424753] hover:bg-secondary"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded border border-[#e2e8f0] bg-white px-3 py-1.5 transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Detail Preview Modal */}
      <Dialog open={previewService !== null} onOpenChange={(open) => !open && setPreviewService(null)}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <span
                className={cn(
                  "rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase",
                  categoryBadgeStyles[previewService?.category ?? ""] ?? "bg-white text-foreground"
                )}
              >
                {previewService ? formatCategory(previewService.category) : ""}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  previewService?.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {previewService?.active ? "Active in Catalog" : "Inactive / Hidden"}
              </span>
            </div>
            <DialogTitle className="pt-2 text-xl font-bold text-foreground">{previewService?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Customer portal preview & breakdown of service parameters.
            </DialogDescription>
          </DialogHeader>

          {previewService && (
            <div className="flex flex-col gap-4 py-2">
              {/* Thumbnail if present */}
              {previewService.marketing?.image && (
                <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border">
                  <Image
                    src={previewService.marketing.image}
                    alt={previewService.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-[#424753] leading-relaxed">
                {previewService.description || "No specific description entered for this service offering."}
              </p>

              {/* Financial & Time Breakdown Card */}
              <div className="rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] p-4 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-[#e2e8f0]">
                  <span className="text-muted-foreground">Base Service Rate:</span>
                  <span className="font-semibold text-foreground">{money(previewService.basePrice)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#e2e8f0]">
                  <span className="text-muted-foreground">Est. Workshop Time:</span>
                  <span className="font-semibold text-foreground">{formatDuration(previewService.durationMins)} ({previewService.durationMins} mins)</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#e2e8f0]">
                  <span className="text-muted-foreground">Est. Labor Component (@ $45/hr):</span>
                  <span className="font-semibold text-foreground">{money((previewService.durationMins / 60) * LABOR_RATE_PER_HOUR)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-sm font-bold">
                  <span className="text-[#004492]">Customer Total Estimate:</span>
                  <span className="text-lg text-[#004492]">
                    {money(previewService.basePrice + (previewService.durationMins / 60) * LABOR_RATE_PER_HOUR)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewService(null)}
              className="rounded-md text-xs"
            >
              Close
            </Button>
            {previewService && (
              <Button asChild size="sm" className="rounded-md bg-[#004492] text-xs text-white">
                <Link href={`/admin/services/${previewService.id}/edit`}>
                  <Pencil className="mr-1.5 size-3" />
                  Edit Service
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Confirmation Modal */}
      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Delete service?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">{deleting?.name}</strong> will be permanently removed from the catalog. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)} className="rounded-lg text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deletingBusy}
              onClick={handleDelete}
              className="rounded-lg bg-rose-600 text-xs text-white hover:bg-rose-700"
            >
              {deletingBusy ? "Deleting..." : "Delete Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
