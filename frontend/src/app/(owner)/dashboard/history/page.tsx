"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  History as HistoryIcon,
  List,
  RotateCcw,
  Search,
  Star,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { archiveTask, bulkArchiveTasks, fetchArchivedTasks, fetchTasks, restoreTask } from "@/store/slices/tasksSlice";
import { deleteTaskRating, fetchRatings, rateTask } from "@/store/slices/ratingsSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { cn } from "@/lib/utils";
import { downloadInvoicePdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { TableLoading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import type { Invoice, TaskCard, Vehicle } from "@/types";

interface HistoryEntry {
  id: string;
  task: TaskCard;
  vehicle: Vehicle;
  invoice: Invoice | null;
  title: string;
  serviceNames: string;
  advisor: string;
  date: string;
  status: TaskCard["status"];
  rated: boolean;
  rating?: number;
  review?: string;
  ratedAt?: string;
  archived: boolean;
  rateable: boolean;
}

function Stars({
  rating,
  size = "h-[19px] w-5",
  onSelect,
}: {
  rating: number;
  size?: string;
  onSelect?: (value: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const star = (
          <Star
            key={i}
            className={cn(
              size,
              i <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : i - rating >= 1
                  ? "text-[#e1e3e4]"
                  : "fill-amber-400/50 text-amber-400",
            )}
          />
        );
        if (onSelect) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              {star}
            </button>
          );
        }
        return (
          <span key={i} className="inline-flex">
            {star}
          </span>
        );
      })}
    </div>
  );
}

export default function ServiceHistoryPage() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((s) => s.invoices.items);
  const invoicesStatus = useAppSelector((s) => s.invoices.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const tasks = useAppSelector((s) => s.tasks.items);
  const archivedTasks = useAppSelector((s) => s.tasks.archivedItems);
  const ratings = useAppSelector((s) => s.ratings.items);

  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "rated" | "unrated">("all");
  const [taskFilter, setTaskFilter] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<"all" | "archived">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleteFor, setDeleteFor] = useState<HistoryEntry | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);
  const [ratingFor, setRatingFor] = useState<HistoryEntry | null>(null);
  const [score, setScore] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchVehicles());
    dispatch(fetchTasks());
    dispatch(fetchArchivedTasks());
    dispatch(fetchRatings());
  }, [dispatch]);

  const allTasks = useMemo(() => [...tasks, ...archivedTasks], [tasks, archivedTasks]);

  const entries = useMemo<HistoryEntry[]>(() => {
    const vehiclesById = new Map(vehicles.map((v) => [v.id, v]));
    return allTasks
      .map((task) => {
        const vehicle = task.vehicle ?? vehiclesById.get(task.vehicleId);
        if (!vehicle) return null;
        const invoice = invoices.find((i) => i.taskId === task.id) ?? null;
        const rating = ratings.find((r) => r.taskId === task.id);
        const serviceNames = task.services.map((s) => s.name).join(", ");
        return {
          id: task.id,
          task,
          vehicle,
          invoice,
          title: task.services[0]?.name ?? "Vehicle Service",
          serviceNames,
          advisor: task.advisor?.name ?? "—",
          date: new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: task.status,
          rated: Boolean(rating),
          rating: rating?.score,
          review: rating?.review,
          ratedAt: rating?.date ? new Date(rating.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          archived: Boolean(task.ownerArchivedAt),
          rateable: task.status === "completed" || task.status === "ready",
        } as HistoryEntry;
      })
      .filter((e): e is HistoryEntry => e !== null)
      .sort((a, b) => new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime());
  }, [allTasks, vehicles, invoices, ratings]);

  const years = useMemo(() => {
    const set = new Set(entries.map((e) => new Date(e.task.createdAt).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [entries]);

  const visibleEntries = useMemo(
    () => entries.filter((e) => (view === "archived" ? e.archived : !e.archived)),
    [entries, view],
  );

  const archivedCount = useMemo(() => entries.filter((e) => e.archived).length, [entries]);

  // Overall metrics
  const metrics = useMemo(() => {
    const totalServices = entries.length;
    const totalPaid = entries
      .filter((e) => e.invoice?.status === "paid")
      .reduce((acc, curr) => acc + (curr.invoice?.total ?? 0), 0);
    const ratedCount = entries.filter((e) => e.rated).length;
    return {
      totalServices,
      totalPaid,
      ratedCount,
      archivedCount,
    };
  }, [entries, archivedCount]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = visibleEntries.filter((e) => {
      const matchSearch =
        q === "" ||
        e.serviceNames.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.vehicle.regNo.toLowerCase().includes(q) ||
        e.advisor.toLowerCase().includes(q) ||
        (e.invoice?.id.toLowerCase().includes(q) ?? false);
      const matchVehicle = vehicleFilter === "All" || `${e.vehicle.make} ${e.vehicle.model}` === vehicleFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "paid" ? e.invoice?.status === "paid" : e.invoice?.status !== "paid");
      const matchYear = yearFilter === "all" || new Date(e.task.createdAt).getFullYear() === Number(yearFilter);
      const matchRating =
        ratingFilter === "all" || (ratingFilter === "rated" ? e.rated : !e.rated);
      const matchTask = taskFilter === "all" || e.status === taskFilter;
      return matchSearch && matchVehicle && matchStatus && matchYear && matchRating && matchTask;
    });
    return list.sort((a, b) =>
      sort === "newest"
        ? new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime()
        : new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime(),
    );
  }, [visibleEntries, search, vehicleFilter, statusFilter, yearFilter, ratingFilter, taskFilter, sort]);

  const hasActiveFilters =
    search !== "" ||
    vehicleFilter !== "All" ||
    statusFilter !== "all" ||
    yearFilter !== "all" ||
    ratingFilter !== "all" ||
    taskFilter !== "all" ||
    sort !== "newest";

  const clearFilters = () => {
    setSearch("");
    setVehicleFilter("All");
    setStatusFilter("all");
    setYearFilter("all");
    setRatingFilter("all");
    setTaskFilter("all");
    setSort("newest");
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const rateableVisible = filtered.filter((e) => !e.archived && e.rateable).map((e) => e.id);
    if (selected.length === rateableVisible.length) {
      setSelected([]);
    } else {
      setSelected(rateableVisible);
    }
  };

  const archiveSingle = async (entry: HistoryEntry) => {
    try {
      await dispatch(archiveTask(entry.task.id)).unwrap();
      toast.success(`Service #${entry.task.id} archived`);
    } catch {
      toast.error("Failed to archive");
    }
  };

  const restoreSingle = async (entry: HistoryEntry) => {
    try {
      await dispatch(restoreTask(entry.task.id)).unwrap();
      toast.success(`Service #${entry.task.id} restored`);
    } catch {
      toast.error("Failed to restore");
    }
  };

  const runBulkArchive = async () => {
    if (selected.length === 0) return;
    setArchiving(true);
    try {
      const res = await dispatch(bulkArchiveTasks(selected)).unwrap();
      toast.success(`Archived ${res.archived} services`);
      setSelected([]);
      setConfirmBulk(false);
    } catch {
      toast.error("Failed to archive selected");
    } finally {
      setArchiving(false);
    }
  };

  const openRate = (entry: HistoryEntry) => {
    setRatingFor(entry);
    setScore(entry.rating ?? 5);
    setReview(entry.review ?? "");
  };

  const submitRating = async () => {
    if (!ratingFor) return;
    setSubmitting(true);
    try {
      await dispatch(
        rateTask({
          taskId: ratingFor.task.id,
          score,
          review: review.trim(),
          serviceName: ratingFor.title,
        }),
      ).unwrap();
      toast.success("Review submitted — thank you!");
      setRatingFor(null);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteFor) return;
    setDeletingReview(true);
    try {
      await dispatch(deleteTaskRating(deleteFor.task.id)).unwrap();
      toast.success("Review deleted");
      setDeleteFor(null);
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setDeletingReview(false);
    }
  };

  if ((invoicesStatus === "idle" || invoicesStatus === "loading") && invoices.length === 0) {
    return <TableLoading label="Loading service history" />;
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
            <span className="text-foreground">Service History</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Service History</h1>
              <p className="pt-1 text-sm text-muted-foreground">
                Review past maintenance records, download invoice receipts, and leave advisor ratings.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/dashboard/appointments/book"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-colors"
              >
                <Wrench className="size-4" />
                Book New Service
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
              <HistoryIcon className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total Services</p>
              <p className="text-2xl font-bold text-foreground">{metrics.totalServices}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Total Spent</p>
              <p className="text-2xl font-bold text-foreground">${metrics.totalPaid.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Star className="size-5 fill-amber-400 text-amber-400" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Rated Services</p>
              <p className="text-2xl font-bold text-foreground">{metrics.ratedCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-xs">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Archive className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Archived</p>
              <p className="text-2xl font-bold text-foreground">{metrics.archivedCount}</p>
            </div>
          </div>
        </div>

        {/* View Tabs: All vs Archived */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setView("all");
              setSelected([]);
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer",
              view === "all"
                ? "bg-primary text-white shadow-2xs"
                : "border border-border bg-white text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            All History ({entries.length - archivedCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setView("archived");
              setSelected([]);
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all cursor-pointer",
              view === "archived"
                ? "bg-primary text-white shadow-2xs"
                : "border border-border bg-white text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            Archived Records ({archivedCount})
          </button>
        </div>

        {/* Bulk action bar */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-blue-50/70 px-4 py-3 shadow-xs">
            <p className="text-sm font-semibold text-foreground">
              {selected.length} {selected.length === 1 ? "entry" : "entries"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected([])}
                className="gap-1 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <X className="size-3.5" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmBulk(true)}
                className="gap-2 rounded-xl bg-primary text-xs font-semibold text-white shadow-2xs cursor-pointer"
              >
                <Archive className="size-3.5" />
                Archive Selected
              </Button>
            </div>
          </div>
        )}

        {/* Search & Filter Bar with Table/Timeline Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
            <div className="relative w-72">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicle, invoice, or service..."
                className="h-9 rounded-xl border-border bg-[#f8f9fa] pl-9 text-xs focus:bg-white"
              />
            </div>

            {/* Status Select */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-border bg-[#f8f9fa] pl-3 pr-8 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="paid">Status: Paid</option>
                <option value="unpaid">Status: Unpaid</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Vehicle Select */}
            <div className="relative">
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-border bg-[#f8f9fa] pl-3 pr-8 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="All">Vehicle: All</option>
                {[...new Set(entries.map((e) => `${e.vehicle.make} ${e.vehicle.model}`))].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Rating Select */}
            <div className="relative">
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as typeof ratingFilter)}
                className="h-9 appearance-none rounded-xl border border-border bg-[#f8f9fa] pl-3 pr-8 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">Rating: All</option>
                <option value="rated">Rating: Rated</option>
                <option value="unrated">Rating: Unrated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Year Select */}
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="h-9 appearance-none rounded-xl border border-border bg-[#f8f9fa] pl-3 pr-8 text-xs font-medium text-foreground outline-none cursor-pointer"
              >
                <option value="all">Year: All</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year: {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <X className="size-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* View Mode Switcher (Table default vs Timeline) */}
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
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                viewMode === "timeline"
                  ? "bg-white text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Timeline View"
            >
              <HistoryIcon className="size-3.5" />
              Timeline
            </button>
          </div>
        </div>

        {/* Content Views */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <HistoryIcon className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {view === "archived" ? "No archived records." : "No service history entries found."}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {search
                ? "Try adjusting your search or active filters."
                : "Completed maintenance and repair milestones will be saved here."}
            </p>
          </div>
        ) : viewMode === "table" ? (
          /* Table View (Default) */
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <Table>
              <TableHeader className="bg-[#f8f9fa]">
                <TableRow className="border-border hover:bg-transparent">
                  {view === "all" && (
                    <TableHead className="w-[40px] text-center">
                      <Checkbox
                        checked={selected.length > 0 && selected.length === filtered.filter((e) => !e.archived && e.rateable).length}
                        onCheckedChange={() => toggleSelectAll()}
                        aria-label="Select all entries"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[120px] text-xs font-bold text-muted-foreground">DATE & JOB</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">VEHICLE</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">SERVICE DETAILS</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">ADVISOR</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">INVOICE & COST</TableHead>
                  <TableHead className="text-xs font-bold text-muted-foreground">RATING</TableHead>
                  <TableHead className="text-right text-xs font-bold text-muted-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id} className={cn("border-border hover:bg-[#f8f9fa]/60 transition-colors", entry.archived && "opacity-75")}>
                    {/* Checkbox */}
                    {view === "all" && (
                      <TableCell className="align-middle text-center">
                        {!entry.archived && entry.rateable ? (
                          <Checkbox
                            checked={selected.includes(entry.id)}
                            onCheckedChange={() => toggleSelect(entry.id)}
                            aria-label={`Select ${entry.title}`}
                          />
                        ) : null}
                      </TableCell>
                    )}

                    {/* Date & Job */}
                    <TableCell className="align-middle">
                      <p className="text-xs font-bold text-foreground">{entry.date}</p>
                      <span className="font-mono text-[10px] text-primary font-semibold">#{entry.task.id}</span>
                    </TableCell>

                    {/* Vehicle */}
                    <TableCell className="align-middle">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary border border-border">
                          <VehicleImage
                            src={entry.vehicle.image}
                            alt={entry.vehicle.model}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {entry.vehicle.year} {entry.vehicle.make} {entry.vehicle.model}
                          </p>
                          <span className="inline-flex items-center rounded border border-[#c2c6d5] bg-[#edf0f8] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#2a3042] tracking-wider mt-0.5">
                            {entry.vehicle.regNo}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Service Details */}
                    <TableCell className="align-middle">
                      <p className="text-xs font-bold text-foreground">{entry.title}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs mt-0.5">
                        {entry.serviceNames}
                      </p>
                    </TableCell>

                    {/* Advisor */}
                    <TableCell className="align-middle">
                      <p className="text-xs font-semibold text-foreground">{entry.advisor}</p>
                    </TableCell>

                    {/* Invoice & Cost */}
                    <TableCell className="align-middle">
                      {entry.invoice ? (
                        <div>
                          <p className="text-xs font-bold text-foreground">${entry.invoice.total.toFixed(2)}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.2 text-[10px] font-semibold capitalize",
                                entry.invoice.status === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200",
                              )}
                            >
                              {entry.invoice.status}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">{entry.invoice.id}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Rating */}
                    <TableCell className="align-middle">
                      {entry.rated ? (
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => openRate(entry)}
                            className="flex items-center gap-1 text-left cursor-pointer hover:opacity-80"
                            title="Edit review"
                          >
                            <Stars rating={entry.rating ?? 0} size="size-3.5" />
                            <span className="text-xs font-bold text-foreground ml-1">{entry.rating}</span>
                          </button>
                          {entry.review && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-xs italic">
                              &ldquo;{entry.review}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : entry.rateable && !entry.archived ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRate(entry)}
                          className="h-7 rounded-lg border-border text-[11px] font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <Star className="size-3 mr-1" />
                          Rate
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {entry.invoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              downloadInvoicePdf(entry.invoice!, entry.vehicle);
                              toast.success("Invoice PDF downloaded");
                            }}
                            className="h-7 rounded-lg border-border px-2 text-xs font-semibold cursor-pointer"
                            title="Download Invoice PDF"
                          >
                            <Download className="size-3" />
                          </Button>
                        )}
                        <Link
                          href={`/dashboard/services/${entry.task.id}`}
                          className="inline-flex h-7 items-center rounded-lg bg-secondary px-2.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          Details
                        </Link>
                        {entry.archived ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void restoreSingle(entry)}
                            className="h-7 rounded-lg px-2 text-xs text-primary hover:bg-primary/10 cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw className="size-3" />
                          </Button>
                        ) : (
                          entry.rateable && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void archiveSingle(entry)}
                              className="h-7 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Archive"
                            >
                              <Archive className="size-3" />
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Timeline View */
          <div className="flex w-full max-w-4xl flex-col gap-8 border-l-2 border-border pl-8 pt-2">
            {filtered.map((entry) => (
              <div key={entry.id} className={cn("relative", entry.archived && "opacity-75")}>
                <span
                  className={cn(
                    "absolute -left-[45px] top-0 flex size-8 items-center justify-center rounded-xl border-2 bg-white p-0.5 shadow-xs",
                    entry.rated ? "border-border" : "border-primary",
                  )}
                >
                  <Wrench className={cn("size-3.5", entry.rated ? "text-muted-foreground" : "text-primary")} />
                </span>

                <div className="flex flex-col md:flex-row items-start overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
                  <div className="relative h-44 md:h-auto md:w-56 w-full shrink-0 bg-secondary p-4">
                    <VehicleImage
                      src={entry.vehicle.image}
                      alt={entry.vehicle.model}
                      fill
                      className="object-cover opacity-90"
                    />
                    <span className="absolute top-2 right-2 rounded-lg border border-border bg-white/90 px-2 py-1 text-[11px] font-bold text-foreground backdrop-blur-xs">
                      {entry.vehicle.make} {entry.vehicle.model}
                    </span>
                    {!entry.archived && entry.rateable && view === "all" && (
                      <span className="absolute top-2 left-2 rounded-lg bg-white/90 p-1 backdrop-blur-xs" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(entry.id)}
                          onCheckedChange={() => toggleSelect(entry.id)}
                          aria-label={`Select ${entry.title}`}
                        />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 w-full gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-foreground">{entry.title}</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Plate: <span className="font-mono font-bold text-foreground">{entry.vehicle.regNo}</span> • Task:{" "}
                            <span className="font-mono text-primary font-bold">#{entry.task.id}</span>
                            {entry.invoice && (
                              <> • Inv: <span className="font-mono font-semibold">{entry.invoice.id}</span> (${entry.invoice.total.toFixed(2)})</>
                            )}
                          </p>
                          {entry.serviceNames && (
                            <p className="pt-1 text-xs text-muted-foreground line-clamp-1">{entry.serviceNames}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.status} />
                          {entry.invoice && (
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", entry.invoice.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                              {entry.invoice.status === "paid" ? "Paid" : "Unpaid"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          {entry.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserRound className="size-3.5" />
                          {entry.advisor}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between border-t border-border pt-3 gap-3">
                      {entry.rated ? (
                        <div>
                          <button type="button" onClick={() => openRate(entry)} aria-label="Edit rating" className="flex items-center gap-1 cursor-pointer">
                            <Stars rating={entry.rating ?? 0} size="size-3.5" />
                            <span className="text-xs font-bold text-foreground ml-1">{entry.rating} / 5</span>
                          </button>
                          {entry.review && <p className="pt-1 text-xs text-muted-foreground italic max-w-sm truncate">&ldquo;{entry.review}&rdquo;</p>}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">Rating</p>
                          {entry.rateable && !entry.archived ? (
                            <Button size="sm" variant="outline" onClick={() => openRate(entry)} className="mt-1 h-7 rounded-lg text-xs font-semibold">
                              <Star className="size-3 mr-1" />
                              Rate Service
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {entry.invoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              downloadInvoicePdf(entry.invoice!, entry.vehicle);
                              toast.success("Invoice PDF downloaded");
                            }}
                            className="gap-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            <Download className="size-3" />
                            Invoice
                          </Button>
                        )}
                        <Link
                          href={`/dashboard/services/${entry.task.id}`}
                          className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          View Details
                        </Link>
                        {entry.archived ? (
                          <Button size="sm" variant="outline" onClick={() => void restoreSingle(entry)} className="gap-1.5 rounded-xl text-xs font-semibold">
                            <RotateCcw className="size-3" />
                            Restore
                          </Button>
                        ) : (
                          entry.rateable && (
                            <Button size="sm" variant="ghost" onClick={() => void archiveSingle(entry)} className="gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground">
                              <Archive className="size-3" />
                              Archive
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={ratingFor !== null} onOpenChange={(open) => !open && setRatingFor(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {ratingFor?.rated ? "Edit Your Review" : "Rate Your Service"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {ratingFor ? `${ratingFor.title} on ${ratingFor.vehicle.year} ${ratingFor.vehicle.make} ${ratingFor.vehicle.model}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-[#f8f9fa] p-4">
              <p className="text-xs font-semibold text-muted-foreground">Tap stars to rate</p>
              <Stars rating={score} size="size-7" onSelect={setScore} />
              <p className="text-xs font-bold text-primary">{score} out of 5 stars</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Feedback (Optional)</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with the advisor and repair work..."
                rows={3}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRatingFor(null)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={submitRating} disabled={submitting} className="rounded-xl bg-primary text-xs font-semibold text-white shadow-2xs">
              {submitting ? "Saving..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Dialog */}
      <Dialog open={deleteFor !== null} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Delete Review</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove your rating for this service?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteFor(null)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReview} disabled={deletingReview} className="rounded-xl text-xs font-semibold">
              {deletingReview ? "Deleting..." : "Delete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Archive Confirm Dialog */}
      <Dialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Archive Selected Services</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Archive {selected.length} service records? You can view or restore them anytime under the Archived tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmBulk(false)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={runBulkArchive} disabled={archiving} className="rounded-xl bg-primary text-xs font-semibold text-white shadow-2xs">
              {archiving ? "Archiving..." : "Archive Selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
