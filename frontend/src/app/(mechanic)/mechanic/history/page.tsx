"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, History, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { TableLoading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export default function MechanicHistoryPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const tasks = useAppSelector((s) => s.tasks.items);
  const tasksStatus = useAppSelector((s) => s.tasks.status);
  const vehicles = useAppSelector((s) => s.vehicles.items);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchTasks());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const completed = useMemo(
    () =>
      tasks.filter(
        (j) =>
          ["completed", "ready"].includes(j.status) &&
          (user
            ? j.mechanicId === user.id ||
              j.mechanicIds?.includes(user.id) ||
              j.mechanics?.some((m) => m.id === user.id)
            : true),
      ),
    [tasks, user],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completed;
    return completed.filter((t) => {
      const vehicle = vehicles.find((v) => v.id === t.vehicleId);
      return (
        t.id.toLowerCase().includes(q) ||
        vehicle?.make.toLowerCase().includes(q) ||
        vehicle?.model.toLowerCase().includes(q) ||
        vehicle?.regNo.toLowerCase().includes(q)
      );
    });
  }, [completed, search, vehicles]);

  const totalParts = completed.reduce((sum, t) => sum + t.partsUsed.reduce((s, p) => s + p.qty, 0), 0);

  if ((tasksStatus === "idle" || tasksStatus === "loading") && tasks.length === 0) {
    return <TableLoading label="Loading task history" />;
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Mechanic › History</p>
            <h1 className="text-[28px] font-bold tracking-[-0.56px] text-foreground">Completed Tasks</h1>
            <p className="pt-1 text-sm text-[#64748b]">{completed.length} jobs completed • {totalParts} total parts used</p>
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vehicle or task ID..."
              className="h-10 w-72 rounded-lg border-border bg-white pl-9 text-sm shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Jobs Completed",
              value: completed.length,
              color: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
            },
            {
              label: "Parts Used Total",
              value: totalParts,
              color: "bg-[rgba(0,82,204,0.1)] text-primary",
            },
            {
              label: "Ready for Pickup",
              value: completed.filter((t) => t.status === "ready").length,
              color: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
            >
              <span className={cn("flex size-10 items-center justify-center rounded-lg", stat.color)}>
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-[#111827]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[8px] border border-dashed border-border bg-white py-20">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <History className="size-6 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">
              {search ? "No tasks match your search." : "No completed tasks yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-[#f9fafb] hover:bg-[#f9fafb]">
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Task ID</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Plate</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Service(s)</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Parts Used</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((task) => {
                  const vehicle = vehicles.find((v) => v.id === task.vehicleId);
                  const partsCount = task.partsUsed.reduce((sum, p) => sum + p.qty, 0);
                  const isReady = task.status === "ready";
                  return (
                    <TableRow key={task.id} className="border-border transition-colors hover:bg-[#f9fafb]">
                      <TableCell className="font-mono text-sm font-semibold text-foreground">{task.id}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#64748b]">{vehicle?.regNo ?? "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm text-foreground">
                        {task.services[0]?.name ?? task.issues ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                          {partsCount} part{partsCount !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                            isReady
                              ? "bg-[rgba(255,193,7,0.1)] text-[#8b5000]"
                              : "bg-[rgba(76,175,80,0.1)] text-[#4caf50]",
                          )}
                        >
                          <CheckCircle2 className="size-3" />
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/mechanic/history/${task.id}`}
                          className="rounded-md border border-border bg-[#f9fafb] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
