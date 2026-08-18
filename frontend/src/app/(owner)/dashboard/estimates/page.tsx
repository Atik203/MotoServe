"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FileCheck, FileX, Hourglass, ReceiptText } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEstimates } from "@/store/slices/estimatesSlice";
import { fetchJobs } from "@/store/slices/jobsSlice";
import { fetchVehicles } from "@/store/slices/vehiclesSlice";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, { className: string; icon: typeof Hourglass }> = {
  pending: { className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]", icon: Hourglass },
  approved: { className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]", icon: FileCheck },
  rejected: { className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]", icon: FileX },
};

export default function MyEstimatesPage() {
  const dispatch = useAppDispatch();
  const estimates = useAppSelector((s) => s.estimates.items);
  const jobs = useAppSelector((s) => s.jobs.items);
  const vehicles = useAppSelector((s) => s.vehicles.items);

  useEffect(() => {
    if (estimates.length === 0) dispatch(fetchEstimates());
    if (jobs.length === 0) dispatch(fetchJobs());
    if (vehicles.length === 0) dispatch(fetchVehicles());
  }, [dispatch, estimates.length, jobs.length, vehicles.length]);

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard › Estimates</p>
          <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Repair Estimates</h1>
          <p className="pt-1 text-sm text-[#424753]">
            Review, approve, or reject the cost estimates sent by your service advisor.
          </p>
        </div>

        {estimates.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-white py-20">
            <ReceiptText className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No estimates yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {estimates.map((estimate) => {
              const job = jobs.find((j) => j.id === estimate.jobId);
              const vehicle = estimate.jobCard?.vehicle ?? (job ? vehicles.find((v) => v.id === job.vehicleId) : undefined);
              const Style = statusStyle[estimate.status] ?? statusStyle.pending;
              return (
                <div
                  key={estimate.id}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-semibold text-foreground">
                        {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : `Job ${job?.id ?? "—"}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {estimate.id}{job ? ` • Job ${job.id}` : ""}
                      </p>
                    </div>
                    <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize", Style.className)}>
                      <Style.icon className="size-3.5" />
                      {estimate.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 rounded-lg bg-[#f8f9fa] p-4">
                    {estimate.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-[#424753]">{item.description}</span>
                        <span className="font-medium text-foreground">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {estimate.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{estimate.items.length - 3} more items</p>
                    )}
                    <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                      <span className="text-sm font-semibold text-foreground">Total</span>
                      <span className="text-lg font-bold text-primary">${estimate.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/estimates/${estimate.id}`}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold tracking-[0.24px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
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
