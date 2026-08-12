"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Car, Check, Clock, HelpCircle, MessageSquare, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEstimates, decideEstimate } from "@/store/slices/estimatesSlice";
import { Button } from "@/components/ui/button";

export default function EstimateApprovalPage() {
  const params = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const estimates = useAppSelector((s) => s.estimates.items);

  useEffect(() => {
    if (estimates.length === 0) dispatch(fetchEstimates());
  }, [dispatch, estimates.length]);

  const estimate = estimates.find((e) => e.id === params.id) ?? null;

  if (!estimate) {
    return <div className="bg-background min-h-screen p-8 text-muted-foreground">Loading estimate...</div>;
  }

  const subtotal = estimate.total / 1.085;
  const tax = estimate.total - subtotal;

  const handleDecide = async (decision: "approved" | "rejected") => {
    try {
      await dispatch(decideEstimate({ id: estimate.id, decision })).unwrap();
      toast.success(decision === "approved" ? "Estimate approved — work will continue" : "Estimate rejected — advisor notified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.72px] text-foreground">Estimate Approval</h1>
            <div className="flex items-center gap-3">
              <p className="text-base text-[#424753]">
                Job Card <span className="font-mono">{estimate.id}</span>
              </p>
              <span className="rounded-xl border border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] px-[11px] py-0.75 text-xs font-semibold tracking-[0.8px] text-warning uppercase">
                {estimate.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-8 overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="border-b border-border bg-[rgba(243,244,245,0.5)] px-6 pt-6 pb-[25px]">
              <div className="flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded bg-[rgba(0,82,204,0.1)]">
                  <Car className="size-[18px] text-primary" />
                </span>
                <div>
                  <p className="text-xl font-bold text-foreground">2023 Ford F-150</p>
                  <p className="flex items-center gap-1 text-sm text-[#424753]">
                    License Plate:{" "}
                    <span className="rounded-sm border border-border bg-[#edeeef] px-[9px] py-px font-mono text-sm text-foreground">
                      A9C-1234
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 p-6">
              <h2 className="flex items-center gap-2 text-xs font-bold tracking-[0.6px] text-[#424753] uppercase">
                <AlertTriangle className="size-[10.9px]" />
                Inspection Findings
              </h2>
              <div className="rounded border border-[#ffdad6] bg-[rgba(255,218,214,0.2)] p-[17px]">
                <p className="border-l-4 border-warning py-1 pl-4 text-sm italic leading-5 text-foreground">
                  {estimate.summary}
                </p>
              </div>

              <h2 className="pt-4 text-xs font-bold tracking-[0.6px] text-[#424753] uppercase">Detailed Cost Breakdown</h2>
              <div className="overflow-hidden rounded border border-border">
                <div className="flex bg-secondary">
                  <p className="w-[340px] px-4 py-3 text-xs font-bold tracking-[0.24px] text-[#424753]">Service / Part</p>
                  <p className="w-24 px-4 py-3 text-center text-xs font-bold tracking-[0.24px] text-[#424753]">Qty / Hrs</p>
                  <p className="flex-1 px-4 py-3 text-right text-xs font-bold tracking-[0.24px] text-[#424753]">Amount</p>
                </div>
                {estimate.items.map((item, i) => (
                  <div key={item.id} className={i > 0 ? "border-t border-border" : ""}>
                    <div className="flex items-start">
                      <p className="w-[340px] px-4 py-3 text-sm text-foreground">{item.description}</p>
                      <p className="w-24 px-4 py-3 text-center text-sm text-[#424753]">
                        {item.category === "labor" ? "2.5" : "1"}
                      </p>
                      <p className="flex-1 px-4 py-3 text-right font-mono text-sm text-foreground">
                        ${item.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex h-[125px] items-start justify-end pt-4">
                <div className="flex w-64 flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-[#424753]">Subtotal</span>
                    <span className="font-mono text-sm text-[#424753]">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-start justify-between border-b border-border pb-[13px]">
                    <span className="text-sm text-[#424753]">Taxes (8.5%)</span>
                    <span className="font-mono text-sm text-[#424753]">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-xl font-bold text-foreground">Total</span>
                    <span className="font-mono text-xl font-bold text-primary">${estimate.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-xl font-bold text-foreground">Advisor Information</h2>
              <div className="flex items-center gap-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-xs font-semibold text-primary">
                  SJ
                </span>
                <div>
                  <p className="text-xs font-bold tracking-[0.24px] text-foreground">Sarah Jenkins</p>
                  <p className="text-[11px] text-[#424753]">Service Advisor</p>
                </div>
              </div>
              <div className="relative rounded bg-[#edeeef] px-4 py-6">
                <p className="text-sm leading-5 text-foreground">
                  &quot;Hi John, our inspection revealed the front brakes are significantly worn. We recommend
                  replacing the pads and rotors now to ensure safety and prevent further damage to the calipers.
                  - Sarah&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 rounded border border-[rgba(0,82,204,0.1)] bg-[rgba(0,82,204,0.05)] p-[13px]">
                <Clock className="size-5 text-primary" />
                <div>
                  <p className="text-[11px] text-[#424753]">Estimated Completion</p>
                  <p className="text-sm font-bold text-foreground">Today, 5:30 PM</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-border pt-[25px]">
                <Button
                  onClick={() => void handleDecide("approved")}
                  disabled={estimate.status !== "pending"}
                  className="gap-2 rounded-lg px-4 py-3 text-base font-bold shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <Check className="size-5" />
                  {estimate.status === "approved" ? "Approved" : estimate.status === "rejected" ? "Rejected" : "Approve Estimate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleDecide("rejected")}
                  disabled={estimate.status !== "pending"}
                  className="gap-2 rounded-lg border-2 border-[rgba(244,67,54,0.2)] px-[18px] py-3.5 text-base font-bold text-[#f44336] hover:bg-[rgba(244,67,54,0.05)] disabled:opacity-40"
                >
                  <X className="size-5" />
                  Reject Estimate
                </Button>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border border-border bg-secondary p-[17px]">
              <HelpCircle className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-bold tracking-[0.24px] text-foreground">Need Clarification?</p>
                <p className="text-sm leading-5 text-[#424753]">
                  You can request more details or a callback from your advisor before approving.
                </p>
                <Link href="/dashboard/chat" className="flex items-center gap-1 pt-[7.5px] text-sm text-primary">
                  <MessageSquare className="size-3.5" />
                  Request Callback
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
