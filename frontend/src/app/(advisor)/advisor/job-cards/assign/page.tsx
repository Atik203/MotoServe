"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, Check, Clock, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs, assignMechanic } from "@/store/slices/jobsSlice";
import { fetchEmployees } from "@/store/slices/employeesSlice";
import { StatusBadge } from "@/components/roles/mechanic/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Employee, JobCard } from "@/types";

const WORKLOAD_LIMIT = 5;

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const fillColorFor = (workload: number) => {
  if (workload >= 4) return "#ba1a1a";
  if (workload >= 2) return "#ffc107";
  return "#4caf50";
};

const availabilityFor = (workload: number) => {
  if (workload >= WORKLOAD_LIMIT) {
    return { label: "Unavailable", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]" };
  }
  if (workload >= 2) {
    return { label: "Busy (in 30m)", className: "bg-[rgba(255,193,7,0.1)] text-[#6a3c00]" };
  }
  return { label: "Available Now", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]" };
};

export default function AssignMechanicPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const employees = useAppSelector((s) => s.employees.items);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jobId, setJobId] = useState("");
  const [search, setSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchJobs());
  }, [dispatch]);

  const assignableJobs = jobs.filter((j) => !["completed", "ready"].includes(j.status));
  const defaultJob = assignableJobs.find((j) => !j.mechanicId) ?? assignableJobs[0] ?? null;
  const job: JobCard | null =
    (jobId ? jobs.find((j) => j.id === jobId) ?? null : null) ?? defaultJob;

  const mechanics = useMemo(
    () => employees.filter((e) => e.role === "mechanic"),
    [employees],
  );

  const workloadOf = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) {
      if (j.mechanicId && j.status !== "completed" && j.status !== "ready") {
        counts.set(j.mechanicId, (counts.get(j.mechanicId) ?? 0) + 1);
      }
    }
    return (m: Employee) => counts.get(m.id) ?? 0;
  }, [jobs]);

  const filteredMechanics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return mechanics.filter(
      (m) => (!query || m.name.toLowerCase().includes(query)) && (!availableOnly || workloadOf(m) < WORKLOAD_LIMIT),
    );
  }, [mechanics, search, availableOnly, workloadOf]);

  const selectedMechanic = mechanics.find((m) => m.id === selectedId) ?? null;

  const handleConfirm = async () => {
    if (!selectedMechanic || !job) return;
    setSubmitting(true);
    try {
      await dispatch(
        assignMechanic({
          id: job.id,
          mechanicId: selectedMechanic.id,
          notes: notes.trim() || undefined,
        }),
      ).unwrap();
      toast.success(`Assigned ${selectedMechanic.name} to job ${job.id}`);
      router.push("/advisor");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#727784]">
            <span>Dashboard</span>
            <span>›</span>
            <span>Job Cards</span>
            <span>›</span>
            <span className="text-foreground">Assign Mechanic</span>
          </nav>
          <h1 className="text-4xl font-bold text-foreground">Assign Mechanic</h1>
          <div className="flex items-center gap-3 pt-1">
            <label className="text-sm text-[#424753]">Job:</label>
            <select
              value={job?.id ?? ""}
              onChange={(e) => {
                setJobId(e.target.value);
                setSelectedId(null);
              }}
              className="rounded border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm font-medium text-foreground outline-none"
            >
              {assignableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} — {j.vehicle ? `${j.vehicle.year} ${j.vehicle.make} ${j.vehicle.model}` : "Vehicle"} ({j.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 flex flex-col gap-6">
            <section className="relative overflow-hidden rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <span className="absolute -top-16 -right-16 size-32 rounded-full bg-[rgba(0,82,204,0.06)]" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded bg-[#f3f4f5]">
                    <Car className="size-5 text-[#191c1d]" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-semibold text-foreground">
                      {job?.vehicle ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}` : "Select a job"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#424753]">
                      <span>Customer: {job?.customer?.name ?? "—"}</span>
                      <span>•</span>
                      <span>Plate:</span>
                      <span className="rounded bg-[#edeeef] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#191c1d]">
                        {job?.vehicle?.regNo ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
                    job?.priority === "high"
                      ? "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]"
                      : job?.priority === "medium"
                        ? "bg-[rgba(255,193,7,0.1)] text-[#6a3c00]"
                        : "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      job?.priority === "high"
                        ? "bg-[#ba1a1a]"
                        : job?.priority === "medium"
                          ? "bg-[#ffc107]"
                          : "bg-[#4caf50]",
                    )}
                  />
                  {job ? `${job.priority} Priority` : "No job"}
                </span>
              </div>

              <div className="my-4 h-px bg-[#e5e7eb]" />

              <div className="relative grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#727784]">Requested Services</span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {job?.services.length ? job.services.map((s) => s.name).join(", ") : job?.issues ?? "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#727784]">Services</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Clock className="size-3.5 text-[#727784]" />
                    {job?.services.length ? `${job.services.length} service${job.services.length > 1 ? "s" : ""}` : "TBD"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#727784]">Station</span>
                  <span className="truncate text-sm font-medium text-foreground">{job?.station ?? "Not set"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-[#727784]">Job Status</span>
                  {job ? (
                    <StatusBadge status={job.status} />
                  ) : (
                    <span className="text-sm font-medium text-[#727784]">—</span>
                  )}
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Available Mechanics</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#727784]" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search names..."
                      className="h-[38px] w-48 rounded-lg border-[#e5e7eb] pl-[30px] text-[13px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAvailableOnly((v) => !v)}
                    className={cn(
                      "h-[38px] gap-2 rounded-lg border-[#e5e7eb] bg-white px-3.5 text-[13px] font-medium text-[#191c1d]",
                      availableOnly && "border-primary bg-[#eff6ff] text-primary",
                    )}
                  >
                    <Filter className="size-3.5" />
                    {availableOnly ? "Showing available" : "Filter"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredMechanics.map((m) => {
                  const workload = workloadOf(m);
                  const unavailable = workload >= WORKLOAD_LIMIT;
                  const selected = m.id === selectedId;
                  const fillPct = Math.min((workload / WORKLOAD_LIMIT) * 100, 100);
                  const fillColor = fillColorFor(workload);
                  const availability = availabilityFor(workload);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedId(selected ? null : m.id)}
                      className={cn(
                        "relative flex flex-col gap-3.5 rounded-lg border bg-white p-[18px] text-left shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors",
                        selected
                          ? "border-2 border-primary p-[17px]"
                          : "border-[#e5e7eb] hover:border-primary/40",
                        unavailable && "opacity-60",
                      )}
                    >
                      {selected && (
                        <span className="absolute top-3.5 right-3.5 flex size-5 items-center justify-center rounded-full bg-primary">
                          <Check className="size-3 text-white" />
                        </span>
                      )}

                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0">
                          <Avatar className="size-12 rounded-xl after:rounded-xl">
                            <AvatarImage
                              src={m.avatar}
                              alt={m.name}
                              className="rounded-xl"
                            />
                            <AvatarFallback className="rounded-xl bg-[#eff6ff] text-sm font-semibold text-primary">
                              {initials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-white",
                              unavailable ? "bg-[#ba1a1a]" : workload >= 2 ? "bg-[#ffc107]" : "bg-[#4caf50]",
                            )}
                          />
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-xl font-semibold text-foreground">{m.name}</span>
                          <span className="truncate text-xs text-[#727784]">
                            ID: {m.id}
                            {m.specialization ? ` • ${m.specialization}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] text-[#727784]">Current Workload</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {workload}/{WORKLOAD_LIMIT} jobs
                            </span>
                            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#edeeef]">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${fillPct}%`, backgroundColor: fillColor }}
                              />
                            </span>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-0.75 text-[11px] font-semibold",
                            availability.className,
                          )}
                        >
                          {availability.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="col-span-4 flex flex-col gap-6 lg:sticky lg:top-22">
            <section className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-semibold text-foreground">Assignment Notes</h2>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this assignment..."
                className="min-h-24 rounded-lg border-[#e5e7eb] text-[13px]"
              />
            </section>

            <section className="flex flex-col gap-3.5 rounded-lg border border-[#e5e7eb] bg-white p-[17px] shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#727784]">Job</span>
                <span className="text-sm font-semibold text-foreground">#{job?.id ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#727784]">Selected Mechanic</span>
                <span className={cn("text-sm", selectedMechanic ? "font-semibold text-foreground" : "font-medium text-[#727784]")}>
                  {selectedMechanic?.name ?? "None selected"}
                </span>
              </div>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={!selectedMechanic || submitting}
                className="h-10 rounded-lg text-sm font-semibold"
              >
                {submitting ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
