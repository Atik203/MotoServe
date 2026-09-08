"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ChevronDown, Download, Search, Star, UserRound, Wrench, Archive, RotateCcw, Trash2, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInvoices } from "@/store/slices/invoicesSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { archiveJob, bulkArchiveJobs, fetchArchivedJobs, fetchJobs, restoreJob } from "@/store/slices/jobsSlice";
import { deleteRating, fetchRatings, rateJob } from "@/store/slices/ratingsSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { VehicleImage } from "@/components/roles/owner/VehicleImage";
import { cn } from "@/lib/utils";
import { downloadInvoicePdf } from "@/lib/pdf";
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
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import type { Invoice, JobCard, Vehicle } from "@/types";

interface HistoryEntry {
  id: string;
  job: JobCard;
  vehicle: Vehicle;
  invoice: Invoice | null;
  title: string;
  serviceNames: string;
  advisor: string;
  date: string;
  status: JobCard["status"];
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
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(i)}
          className={cn(!onSelect && "cursor-default")}
        >
          <Star
            className={cn(
              size,
              i <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : i - rating >= 1
                  ? "text-[#e1e3e4]"
                  : "fill-amber-400/50 text-amber-400",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ServiceHistoryPage() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector((s) => s.invoices.items);
  const invoicesStatus = useAppSelector((s) => s.invoices.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const jobs = useAppSelector((s) => s.jobs.items);
  const archivedJobs = useAppSelector((s) => s.jobs.archivedItems);
  const ratings = useAppSelector((s) => s.ratings.items);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "rated" | "unrated">("all");
  const [jobFilter, setJobFilter] = useState("all");
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
    dispatch(fetchJobs());
    dispatch(fetchArchivedJobs());
    dispatch(fetchRatings());
  }, [dispatch]);

  const allJobs = useMemo(() => [...jobs, ...archivedJobs], [jobs, archivedJobs]);

  const entries = useMemo<HistoryEntry[]>(() => {
    const vehiclesById = new Map(vehicles.map((v) => [v.id, v]));
    return allJobs
      .map((job) => {
        const vehicle = job.vehicle ?? vehiclesById.get(job.vehicleId);
        if (!vehicle) return null;
        const invoice = invoices.find((i) => i.jobId === job.id) ?? null;
        const rating = ratings.find((r) => r.jobId === job.id);
        const serviceNames = job.services.map((s) => s.name).join(", ");
        return {
          id: job.id,
          job,
          vehicle,
          invoice,
          title: job.services[0]?.name ?? "Vehicle Service",
          serviceNames,
          advisor: job.advisor?.name ?? "—",
          date: new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: job.status,
          rated: Boolean(rating),
          rating: rating?.score,
          review: rating?.review,
          ratedAt: rating?.date ? new Date(rating.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          archived: Boolean(job.ownerArchivedAt),
          rateable: job.status === "completed" || job.status === "ready",
        } as HistoryEntry;
      })
      .filter((e): e is HistoryEntry => e !== null)
      .sort((a, b) => new Date(b.job.createdAt).getTime() - new Date(a.job.createdAt).getTime());
  }, [allJobs, vehicles, invoices, ratings]);

  const years = useMemo(() => {
    const set = new Set(entries.map((e) => new Date(e.job.createdAt).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [entries]);

  const visibleEntries = useMemo(
    () => entries.filter((e) => (view === "archived" ? e.archived : !e.archived)),
    [entries, view],
  );

  const archivedCount = useMemo(() => entries.filter((e) => e.archived).length, [entries]);

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
      const matchYear = yearFilter === "all" || new Date(e.job.createdAt).getFullYear() === Number(yearFilter);
      const matchRating =
        ratingFilter === "all" || (ratingFilter === "rated" ? e.rated : !e.rated);
      const matchJob = jobFilter === "all" || e.status === jobFilter;
      return matchSearch && matchVehicle && matchStatus && matchYear && matchRating && matchJob;
    });
    return list.sort((a, b) =>
      sort === "newest"
        ? new Date(b.job.createdAt).getTime() - new Date(a.job.createdAt).getTime()
        : new Date(a.job.createdAt).getTime() - new Date(b.job.createdAt).getTime(),
    );
  }, [visibleEntries, search, vehicleFilter, statusFilter, yearFilter, ratingFilter, jobFilter, sort]);

  const hasActiveFilters =
    search.trim() !== "" ||
    vehicleFilter !== "All" ||
    statusFilter !== "all" ||
    yearFilter !== "all" ||
    ratingFilter !== "all" ||
    jobFilter !== "all" ||
    sort !== "newest";

  const clearFilters = () => {
    setSearch("");
    setVehicleFilter("All");
    setStatusFilter("all");
    setYearFilter("all");
    setRatingFilter("all");
    setJobFilter("all");
    setSort("newest");
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    const ids = filtered.filter((e) => !e.archived && e.rateable).map((e) => e.id);
    setSelected((prev) => (prev.length === ids.length && ids.length > 0 ? [] : ids));
  };

  const confirmBulkArchive = async () => {
    if (selected.length === 0) return;
    setArchiving(true);
    try {
      await dispatch(bulkArchiveJobs(selected)).unwrap();
      toast.success(`${selected.length} ${selected.length === 1 ? "entry" : "entries"} archived`);
      setSelected([]);
      setConfirmBulk(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive");
    } finally {
      setArchiving(false);
    }
  };

  const archiveSingle = async (entry: HistoryEntry) => {
    try {
      await dispatch(archiveJob(entry.job.id)).unwrap();
      toast.success("Entry archived — find it under Archived");
      setSelected((prev) => prev.filter((s) => s !== entry.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive");
    }
  };

  const restoreSingle = async (entry: HistoryEntry) => {
    try {
      await dispatch(restoreJob(entry.job.id)).unwrap();
      toast.success("Entry restored to history");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    }
  };

  const confirmDeleteReview = async () => {
    if (!deleteFor) return;
    setDeletingReview(true);
    try {
      await dispatch(deleteRating(deleteFor.job.id)).unwrap();
      toast.success("Review removed");
      setDeleteFor(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove review");
    } finally {
      setDeletingReview(false);
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
        rateJob({
          jobId: ratingFor.job.id,
          score,
          review: review.trim(),
          serviceName: ratingFor.title,
        }),
      ).unwrap();
      toast.success(ratingFor.rated ? "Review updated" : "Thanks for rating!");
      await dispatch(fetchRatings());
      setRatingFor(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  if ((invoicesStatus === "idle" || invoicesStatus === "loading") && invoices.length === 0) {
    return <TableLoading label="Loading service history" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-[#424753]">
            Dashboard › <span className="font-medium text-foreground">Service History</span>
          </p>
          <div className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Service History</h1>
              <p className="text-base text-[#424753]">Review past services, invoices, and provide feedback.</p>
            </div>
            <Link href="/dashboard/appointments/book" className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <Wrench className="size-3.5" />
              Book New Service
            </Link>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setView("all"); setSelected([]); }}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold tracking-[0.24px] transition-colors",
                view === "all" ? "bg-primary text-white" : "border border-border bg-white text-[#424753] hover:text-foreground",
              )}
            >
              All History ({entries.length - archivedCount})
            </button>
            <button
              type="button"
              onClick={() => { setView("archived"); setSelected([]); }}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold tracking-[0.24px] transition-colors",
                view === "archived" ? "bg-primary text-white" : "border border-border bg-white text-[#424753] hover:text-foreground",
              )}
            >
              Archived ({archivedCount})
            </button>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary-soft px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {selected.length} {selected.length === 1 ? "entry" : "entries"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected([])} className="gap-1 rounded-lg text-xs font-semibold">
                <X className="size-3.5" />
                Clear
              </Button>
              <Button size="sm" onClick={() => setConfirmBulk(true)} className="gap-2 rounded-lg text-xs font-semibold">
                <Archive className="size-3.5" />
                Archive selected
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#e2e8f0] bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
          <div className="relative w-96">
            <Search className="absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vehicle, Invoice, or Service..."
              className="h-[38px] rounded-xl border-[#c2c6d5] bg-[#f8f9fa] pl-[41px]"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[38px] appearance-none rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[38px] text-left text-sm text-foreground outline-none"
            >
              <option value="all">Status: All</option>
              <option value="paid">Status: Paid</option>
              <option value="unpaid">Status: Unpaid</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-[38px] appearance-none rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[38px] text-left text-sm text-foreground outline-none"
            >
              <option value="all">Year: All</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  Year: {y}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="h-[38px] appearance-none rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[38px] text-left text-sm text-foreground outline-none"
            >
              <option value="All">Vehicle: All</option>
              {[...new Set(entries.map((e) => `${e.vehicle.make} ${e.vehicle.model}`))].map((v) => (
                <option key={v} value={v}>
                  Vehicle: {v}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as typeof ratingFilter)}
              className="h-[38px] appearance-none rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[38px] text-left text-sm text-foreground outline-none"
            >
              <option value="all">Rating: All</option>
              <option value="rated">Rating: Rated</option>
              <option value="unrated">Rating: Unrated</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="h-[38px] appearance-none rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[38px] text-left text-sm text-foreground outline-none"
            >
              <option value="all">Job: All</option>
              <option value="completed">Job: Completed</option>
              <option value="ready">Job: Ready</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-[38px] appearance-none rounded-xl border border-[#c2c6d5] bg-[#f8f9fa] pl-[17px] pr-[38px] text-left text-sm text-foreground outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-[38px] items-center gap-1 rounded-xl px-3 text-xs font-semibold text-primary hover:underline"
            >
              <X className="size-3.5" />
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[#424753]">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            <span className="font-semibold text-foreground">{visibleEntries.length}</span>{" "}
            {view === "archived" ? "archived entries" : "entries"}
          </p>
          {view === "all" && filtered.some((e) => !e.archived && e.rateable) && (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#424753]">
              <Checkbox
                checked={selected.length > 0 && selected.length === filtered.filter((e) => !e.archived && e.rateable).length}
                onCheckedChange={() => toggleSelectAll()}
                aria-label="Select all entries"
              />
              Select all
            </label>
          )}
        </div>

        <div className="flex w-[912px] flex-col gap-12 border-l-2 border-[#e2e8f0] pl-[42px] pt-2">
          {filtered.map((entry) => (
            <div key={entry.id} className={cn("relative", entry.archived && "opacity-75")}>
              <span
                className={cn(
                  "absolute -left-[51px] top-0 flex size-8 items-center justify-center rounded-xl border-2 bg-background p-0.5 shadow-[0_0_0_4px_white]",
                  entry.rated ? "border-[#e2e8f0]" : "border-primary",
                )}
              >
                <Wrench className={cn("size-[15px]", entry.rated ? "text-[#424753]" : "text-primary")} />
              </span>

              <div className="flex h-[220px] items-start overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
                <div className="relative h-full w-48 shrink-0 bg-secondary p-4">
                  <VehicleImage src={entry.vehicle.image} alt={entry.vehicle.model} fill className="object-cover opacity-80 mix-blend-multiply" />
                  <span className="absolute top-2 right-2 rounded-xl border border-[#e2e8f0] bg-white/80 px-[9px] py-[5px] text-[11px] font-medium text-foreground backdrop-blur-[2px]">
                    {entry.vehicle.make} {entry.vehicle.model}
                  </span>
                  {!entry.archived && entry.rateable && view === "all" && (
                    <span className="absolute top-2 left-2 rounded-lg bg-white/90 p-1 backdrop-blur-[2px]" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.includes(entry.id)}
                        onCheckedChange={() => toggleSelect(entry.id)}
                        aria-label={`Select ${entry.title}`}
                      />
                    </span>
                  )}
                </div>

                <div className="flex h-full flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-foreground">{entry.title}</h2>
                          <p className="text-sm text-[#424753]">
                            Reg: <span className="font-medium text-foreground">{entry.vehicle.regNo}</span> • Job:{" "}
                            <span className="font-medium text-foreground">{entry.job.id}</span>
                            {entry.invoice ? (
                              <>
                                {" "}• Inv: <span className="font-medium text-foreground">{entry.invoice.id}</span>
                              </>
                            ) : null}
                          </p>
                          {entry.serviceNames ? (
                            <p className="truncate pt-1 text-xs text-[#727784]">{entry.serviceNames}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.status} />
                          {entry.invoice && (
                            <span className="flex items-center gap-1 rounded-xl border border-[rgba(76,175,80,0.2)] bg-[rgba(76,175,80,0.1)] px-[9px] py-[5px] text-[11px] font-medium text-[#4caf50]">
                              {entry.invoice.status === "paid" ? "Paid" : "Unpaid"}
                            </span>
                          )}
                          {entry.archived && (
                            <span className="rounded-xl border border-border bg-secondary px-[9px] py-[5px] text-[11px] font-medium text-muted-foreground">
                              Archived
                            </span>
                          )}
                        </div>
                      </div>
                    <div className="flex gap-4 pt-2">
                      <span className="flex items-center gap-2 text-sm text-[#424753]">
                        <CalendarDays className="size-[13.5px]" />
                        {entry.date}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-[#424753]">
                        <UserRound className="size-[16.4px]" />
                        {entry.advisor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[rgba(243,244,245,0.5)] px-6 pt-[25px] pb-6 -mx-6 -mb-6">
{entry.rated ? (
                        <>
                          <div>
                            <button type="button" onClick={() => openRate(entry)} aria-label="Edit your rating" className="rounded">
                              <Stars rating={entry.rating ?? 0} />
                            </button>
                            {entry.review && <p className="pt-1 max-w-md truncate text-xs text-[#424753]">&ldquo;{entry.review}&rdquo;</p>}
                            <p className="pt-0.5 text-[11px] font-medium text-[#424753]">Submitted on {entry.ratedAt}</p>
                          </div>
                          <div className="flex gap-2">
                            {entry.invoice && (
                              <Button variant="outline" size="sm" onClick={() => { downloadInvoicePdf(entry.invoice!, entry.vehicle); toast.success("Invoice PDF downloaded"); }} className="gap-2 rounded-xl px-[17px] py-[9px] text-xs font-semibold">
                                <Download className="size-3" />
                                Invoice
                              </Button>
                            )}
                            <Button size="sm" variant="outline" asChild className="rounded-xl px-[17px] py-[9px] text-xs font-semibold">
                              <Link href={`/dashboard/services/${entry.job.id}`}>View Details</Link>
                            </Button>
                            {!entry.archived && (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => openRate(entry)} className="rounded-xl px-4 py-[9.5px] text-xs font-semibold text-primary">
                                  Edit Review
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteFor(entry)} className="rounded-xl px-3 py-[9.5px] text-xs font-semibold text-[#ba1a1a]" aria-label="Delete review">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs font-semibold tracking-[0.24px] text-[#424753]">How was your service?</p>
                            <div className="pt-1">
                              {entry.rateable && !entry.archived ? (
                                <button type="button" onClick={() => openRate(entry)} aria-label="Rate this service" className="rounded">
                                  <Stars rating={0} />
                                </button>
                              ) : (
                                <Stars rating={0} />
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild className="rounded-xl px-[17px] py-[9px] text-xs font-semibold">
                              <Link href={`/dashboard/services/${entry.job.id}`}>View Details</Link>
                            </Button>
                            {entry.rateable && !entry.archived && (
                              <Button size="sm" onClick={() => openRate(entry)} className="rounded-xl bg-[#8b5000] px-4 py-[8.5px] text-xs font-semibold text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                                Rate Service
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {entry.archived ? (
                  <Button size="sm" variant="outline" onClick={() => void restoreSingle(entry)} className="gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                    <RotateCcw className="size-3.5" />
                    Restore to history
                  </Button>
                ) : (
                  entry.rateable && (
                    <Button size="sm" variant="ghost" onClick={() => void archiveSingle(entry)} className="gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#424753] hover:text-foreground">
                      <Archive className="size-3.5" />
                      Archive
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#e2e8f0] bg-white px-4 py-16 text-center text-sm text-muted-foreground">
              {view === "archived" ? "No archived entries. Archive finished services to clear up your history." : "No service history found."}
            </div>
          )}
        </div>
      </div>

      <Dialog open={ratingFor !== null} onOpenChange={(open) => !open && setRatingFor(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {ratingFor?.rated ? "Edit Your Review" : "Rate Your Service"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {ratingFor?.title} • {ratingFor?.job?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-foreground">How was the service?</p>
              <Stars rating={score} size="h-8 w-8" onSelect={setScore} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Review (optional)</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience..."
                className="min-h-24 rounded-lg border-border bg-white resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingFor(null)} className="rounded-lg">
              Cancel
            </Button>
            <Button onClick={() => void submitRating()} disabled={submitting} className="rounded-lg">
              {submitting ? "Submitting..." : ratingFor?.rated ? "Update Review" : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmBulk} onOpenChange={(open) => !open && setConfirmBulk(false)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Archive {selected.length} {selected.length === 1 ? "entry" : "entries"}?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Archived entries move out of your history but invoices, payments, and ratings are preserved. You can restore them anytime from the Archived tab.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulk(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button onClick={() => void confirmBulkArchive()} disabled={archiving} className="gap-2 rounded-lg">
              <Archive className="size-4" />
              {archiving ? "Archiving..." : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteFor !== null} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Remove your review?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {deleteFor?.title} • {deleteFor?.job?.id} — your score and review will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFor(null)} className="rounded-lg">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDeleteReview()} disabled={deletingReview} className="gap-2 rounded-lg">
              <Trash2 className="size-4" />
              {deletingReview ? "Removing..." : "Remove review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
