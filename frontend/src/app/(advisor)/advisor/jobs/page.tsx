"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FilePlus2, Search, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
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
import type { JobStatus } from "@/types";

const statusFilters: Array<JobStatus | "all"> = [
  "all",
  "received",
  "inspecting",
  "repairing",
  "testing",
  "ready",
  "completed",
];

export default function AdvisorJobsPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const customerFilterId = searchParams.get("customer");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (filter === "all" || j.status === filter) &&
        (!customerFilterId || j.customerId === customerFilterId) &&
        (!query ||
          j.id.toLowerCase().includes(query) ||
          (j.customer?.name ?? "").toLowerCase().includes(query) ||
          (j.vehicle?.regNo ?? "").toLowerCase().includes(query)),
    );
  }, [jobs, filter, search, customerFilterId]);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#727784]">
            <Link href="/advisor" className="hover:text-foreground">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-foreground">All Jobs</span>
          </nav>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">All Jobs</h1>
            <div className="flex items-center gap-2">
              <Link href="/advisor/job-cards/new">
                <Button className="h-10 gap-2 rounded-lg text-sm font-semibold">
                  <FilePlus2 className="size-4" />
                  Create Job Card
                </Button>
              </Link>
              <Link href="/advisor/job-cards/assign">
                <Button variant="outline" className="h-10 gap-2 rounded-lg border-[#e5e7eb] bg-white text-sm font-semibold text-[#191c1d]">
                  <UserCheck className="size-4" />
                  Assign Mechanic
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
                filter === s
                  ? "border-primary bg-[#eff6ff] text-primary"
                  : "border-[#e5e7eb] bg-white text-[#424753] hover:border-primary/40",
              )}
            >
              {s === "all" ? "All Statuses" : s}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#727784]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job, customer, plate..."
              className="h-9 w-64 rounded-lg border-[#e5e7eb] pl-[30px] text-[13px]"
            />
          </div>
        </div>

        <section className="w-full overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f3f4f5] hover:bg-[#f3f4f5]">
                <TableHead className="h-auto w-[116px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                  ID
                </TableHead>
                <TableHead className="h-auto w-[190px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                  Customer
                </TableHead>
                <TableHead className="h-auto px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                  Vehicle
                </TableHead>
                <TableHead className="h-auto w-[140px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                  Status
                </TableHead>
                <TableHead className="h-auto w-[120px] px-4 pt-2 pb-[9px] text-xs font-medium tracking-[0.24px] text-[#424753]">
                  Mechanic
                </TableHead>
                <TableHead className="h-auto px-4 pt-2 pb-[9px] text-right text-xs font-medium tracking-[0.24px] text-[#424753]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((job, i) => {
                const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                return (
                  <TableRow
                    key={job.id}
                    className={cn("border-[#e5e7eb] hover:bg-[#f8fafc]", i % 2 === 1 && "bg-[rgba(243,244,245,0.3)]")}
                  >
                    <TableCell className="px-4 py-5 text-sm font-medium text-[#191c1d]">#{job.id}</TableCell>
                    <TableCell className="px-4 py-5 text-sm text-[#191c1d]">{job.customer?.name ?? "—"}</TableCell>
                    <TableCell className="px-4 py-[13px]">
                      <p className="text-xs text-[#64748b]">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—"}
                      </p>
                      <p className="text-sm text-[#191c1d]">{vehicle?.regNo ?? "—"}</p>
                    </TableCell>
                    <TableCell className="px-4 py-5">
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="px-4 py-5 text-sm text-[#191c1d]">{job.mechanic?.name ?? "—"}</TableCell>
                    <TableCell className="px-4 py-[18px] text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!job.mechanicId && job.status !== "completed" && job.status !== "ready" && (
                          <Link
                            href="/advisor/job-cards/assign"
                            className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-[#eff6ff]"
                          >
                            Assign
                          </Link>
                        )}
                        {job.status !== "completed" && (
                          <Link
                            href={`/advisor/estimates/new?job=${job.id}`}
                            className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-[#eff6ff]"
                          >
                            Estimate
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <p className="text-sm font-semibold text-foreground">No jobs found</p>
              <p className="text-sm text-[#727784]">Try a different status filter or search term.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}