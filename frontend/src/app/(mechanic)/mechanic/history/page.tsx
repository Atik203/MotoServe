"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2, History } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MechanicHistoryPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, vehicles.length]);

  const completed = jobs.filter((j) => ["completed", "ready"].includes(j.status) && (user ? j.mechanicId === user.id : true));

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Mechanic › History</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Completed Jobs</h1>
        </div>

        {completed.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <History className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No completed jobs yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-secondary hover:bg-secondary">
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Job</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Plate</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Parts Used</TableHead>
                  <TableHead className="text-xs font-medium uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((job) => {
                  const vehicle = vehicles.find((v) => v.id === job.vehicleId);
                  const partsCount = job.partsUsed.reduce((sum, p) => sum + p.qty, 0);
                  return (
                    <TableRow key={job.id} className="border-border">
                      <TableCell className="font-mono text-sm font-medium text-foreground">{job.id}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">{vehicle?.regNo ?? "—"}</TableCell>
                      <TableCell className="text-sm text-foreground">{partsCount}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(76,175,80,0.1)] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#4caf50]">
                          <CheckCircle2 className="size-3.5" />
                          {job.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/mechanic/jobs/${job.id}`} className="text-xs font-semibold text-primary hover:underline">
                          View
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
