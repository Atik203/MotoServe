"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Clock, Package, PackageCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPartRequests, reviewPartRequest } from "@/store/slices/partRequestsSlice";
import { Button } from "@/components/ui/button";
import type { PartRequestStatus } from "@/types";

type ReviewAction = "approved" | "rejected" | "fulfilled";

function statusMeta(status: PartRequestStatus) {
  if (status === "approved") return { label: "Approved", className: "bg-[rgba(76,175,80,0.1)] text-[#4caf50]", icon: Check };
  if (status === "fulfilled") return { label: "Fulfilled", className: "bg-[rgba(0,82,204,0.1)] text-primary", icon: PackageCheck };
  if (status === "rejected") return { label: "Rejected", className: "bg-[rgba(186,26,26,0.1)] text-[#ba1a1a]", icon: X };
  return { label: "Pending", className: "bg-[rgba(255,193,7,0.1)] text-[#8b5000]", icon: Clock };
}

interface PartRequestsPanelProps {
  title?: string;
  limit?: number;
  className?: string;
}

export function PartRequestsPanel({
  title = "Part Requests",
  limit = 6,
  className,
}: PartRequestsPanelProps) {
  const dispatch = useAppDispatch();
  const requests = useAppSelector((s) => s.partRequests.items);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showDecided, setShowDecided] = useState(false);

  useEffect(() => {
    void dispatch(fetchPartRequests());
  }, [dispatch]);

  const openRequests = requests.filter((r) => r.status === "pending" || r.status === "approved");
  const decidedRequests = requests.filter((r) => r.status === "fulfilled" || r.status === "rejected");
  const list = (showDecided ? decidedRequests : openRequests).slice(0, limit);

  const act = async (id: string, status: ReviewAction, partName: string, kind?: "issue" | "restock") => {
    setBusyId(id);
    try {
      await dispatch(reviewPartRequest({ id, status })).unwrap();
      toast.success(
        status === "fulfilled"
          ? kind === "restock"
            ? `${partName} received — catalog stock increased`
            : `${partName} issued — stock reduced and added to the task parts`
          : `Part request ${status}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[8px] border border-border bg-white p-[25px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-[9px]">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Package className="size-4 text-primary" />
          {title}
          {openRequests.length > 0 && (
            <span className="rounded-full bg-[rgba(255,193,7,0.15)] px-2 py-0.5 text-[11px] font-bold text-[#8b5000]">
              {openRequests.length} open
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowDecided(false)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
              !showDecided
                ? "border-amber-300 bg-amber-100 font-bold text-amber-800"
                : "border-border bg-white text-muted-foreground hover:text-foreground",
            )}
          >
            To review ({openRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setShowDecided(true)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
              showDecided
                ? "border-blue-300 bg-blue-100 font-bold text-[#0052cc]"
                : "border-border bg-white text-muted-foreground hover:text-foreground",
            )}
          >
            Decided ({decidedRequests.length})
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          {showDecided
            ? "No decided requests yet."
            : "Nothing waiting on you — no open part requests."}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((req) => {
            const meta = statusMeta(req.status);
            const Icon = meta.icon;
            const isBusy = busyId === req.id;
            return (
              <div
                key={req.id}
                className="flex flex-col gap-2 rounded-[8px] border border-border bg-[#f9fafb] px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {req.partName}{" "}
                      <span className="font-normal text-muted-foreground">× {req.qty}</span>
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {req.mechanic?.name ?? "Mechanic"}
                      {req.taskCardId ? (
                        <>
                          {" · "}
                          <Link
                            href={`/advisor/tasks/${req.taskCardId}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {req.taskCardId}
                          </Link>
                        </>
                      ) : (
                        " · no task linked"
                      )}
                      {" · "}
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {req.notes && (
                      <p className="mt-0.5 truncate text-[11px] italic text-muted-foreground">
                        &ldquo;{req.notes}&rdquo;
                      </p>
                    )}
                    {req.reviewedBy && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {meta.label} by {req.reviewedBy}
                        {req.reviewNote ? ` — ${req.reviewNote}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        req.kind === "restock"
                          ? "bg-[rgba(147,51,234,0.1)] text-[#9333ea]"
                          : "bg-[rgba(0,82,204,0.08)] text-primary",
                      )}
                    >
                      {req.kind === "restock" ? "Restock" : "Issue"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                        meta.className,
                      )}
                    >
                      <Icon className="size-3" />
                      {meta.label}
                    </span>
                  </div>
                </div>

                {(req.status === "pending" || req.status === "approved") && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {req.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => void act(req.id, "approved", req.partName, req.kind)}
                        disabled={isBusy}
                        className="h-7 gap-1 rounded-lg bg-[#2e7d32] px-2.5 text-[11px] font-bold text-white hover:bg-[#1b5e20]"
                      >
                        <Check className="size-3" />
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => void act(req.id, "fulfilled", req.partName, req.kind)}
                      disabled={isBusy}
                      className="h-7 gap-1 rounded-lg bg-[#0052cc] px-2.5 text-[11px] font-bold text-white hover:bg-[#0047b3]"
                    >
                      <PackageCheck className="size-3" />
                      {isBusy ? "Saving..." : "Mark fulfilled"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void act(req.id, "rejected", req.partName, req.kind)}
                      disabled={isBusy}
                      className="h-7 gap-1 rounded-lg border border-border bg-white px-2.5 text-[11px] font-semibold text-[#ba1a1a] hover:bg-red-50"
                    >
                      <X className="size-3" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        <strong>Issue</strong> requests take the part out of stock and add it to the task&apos;s parts (billed on
        the invoice). <strong>Restock</strong> requests top the catalog back up when the delivery arrives.
      </p>
    </section>
  );
}
