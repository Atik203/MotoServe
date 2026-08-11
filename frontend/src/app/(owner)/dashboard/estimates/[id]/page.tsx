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

  const estimate = estimates.find((e) => e.id === params.id) ?? estimates.find((e) => e.id === "ES-3301") ?? null;

  if (!estimate) {
    return <div className="bg-background min-h-screen p-[32px] text-muted-foreground">Loading estimate...</div>;
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
    <div className="bg-background min-h-screen p-[32px]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[24px]">
        <div className="flex items-center">
          <div>
            <h1 className="text-[36px] font-bold tracking-[-0.72px] text-foreground">Estimate Approval</h1>
            <div className="flex items-center gap-[12px]">
              <p className="text-[16px] text-[#424753]">
                Job Card <span className="font-mono">{estimate.id}</span>
              </p>
              <span className="rounded-[12px] border border-[rgba(255,193,7,0.2)] bg-[rgba(255,193,7,0.1)] px-[11px] py-[3px] text-[12px] font-semibold tracking-[0.8px] text-warning uppercase">
                {estimate.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 items-start gap-[24px]">
          <div className="col-span-8 overflow-hidden rounded-[8px] border border-border bg-white shadow-[0_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="border-b border-border bg-[rgba(243,244,245,0.5)] px-[24px] pt-[24px] pb-[25px]">
              <div className="flex items-center gap-[16px]">
                <span className="flex size-[48px] items-center justify-center rounded-[4px] bg-[rgba(0,82,204,0.1)]">
                  <Car className="size-[18px] text-primary" />
                </span>
                <div>
                  <p className="text-[20px] font-bold text-foreground">2023 Ford F-150</p>
                  <p className="flex items-center gap-[4px] text-[14px] text-[#424753]">
                    License Plate:{" "}
                    <span className="rounded-[2px] border border-border bg-[#edeeef] px-[9px] py-px font-mono text-[14px] text-foreground">
                      A9C-1234
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[8px] p-[24px]">
              <h2 className="flex items-center gap-[8px] text-[12px] font-bold tracking-[0.6px] text-[#424753] uppercase">
                <AlertTriangle className="size-[10.9px]" />
                Inspection Findings
              </h2>
              <div className="rounded-[4px] border border-[#ffdad6] bg-[rgba(255,218,214,0.2)] p-[17px]">
                <p className="border-l-4 border-warning py-[4px] pl-[16px] text-[14px] italic leading-[20px] text-foreground">
                  {estimate.summary}
                </p>
              </div>

              <h2 className="pt-[16px] text-[12px] font-bold tracking-[0.6px] text-[#424753] uppercase">Detailed Cost Breakdown</h2>
              <div className="overflow-hidden rounded-[4px] border border-border">
                <div className="flex bg-secondary">
                  <p className="w-[340px] px-[16px] py-[12px] text-[12px] font-bold tracking-[0.24px] text-[#424753]">Service / Part</p>
                  <p className="w-[96px] px-[16px] py-[12px] text-center text-[12px] font-bold tracking-[0.24px] text-[#424753]">Qty / Hrs</p>
                  <p className="flex-1 px-[16px] py-[12px] text-right text-[12px] font-bold tracking-[0.24px] text-[#424753]">Amount</p>
                </div>
                {estimate.items.map((item, i) => (
                  <div key={item.id} className={i > 0 ? "border-t border-border" : ""}>
                    <div className="flex items-start">
                      <p className="w-[340px] px-[16px] py-[12px] text-[14px] text-foreground">{item.description}</p>
                      <p className="w-[96px] px-[16px] py-[12px] text-center text-[14px] text-[#424753]">
                        {item.category === "labor" ? "2.5" : "1"}
                      </p>
                      <p className="flex-1 px-[16px] py-[12px] text-right font-mono text-[14px] text-foreground">
                        ${item.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex h-[125px] items-start justify-end pt-[16px]">
                <div className="flex w-[256px] flex-col gap-[12px]">
                  <div className="flex items-start justify-between">
                    <span className="text-[14px] text-[#424753]">Subtotal</span>
                    <span className="font-mono text-[14px] text-[#424753]">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-start justify-between border-b border-border pb-[13px]">
                    <span className="text-[14px] text-[#424753]">Taxes (8.5%)</span>
                    <span className="font-mono text-[14px] text-[#424753]">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex items-start justify-between pt-[4px]">
                    <span className="text-[20px] font-bold text-foreground">Total</span>
                    <span className="font-mono text-[20px] font-bold text-primary">${estimate.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-[24px]">
            <div className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[24px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
              <h2 className="text-[20px] font-bold text-foreground">Advisor Information</h2>
              <div className="flex items-center gap-[16px]">
                <span className="flex size-[40px] items-center justify-center rounded-[12px] bg-primary-soft text-[12px] font-semibold text-primary">
                  SJ
                </span>
                <div>
                  <p className="text-[12px] font-bold tracking-[0.24px] text-foreground">Sarah Jenkins</p>
                  <p className="text-[11px] text-[#424753]">Service Advisor</p>
                </div>
              </div>
              <div className="relative rounded-[4px] bg-[#edeeef] px-[16px] py-[24px]">
                <p className="text-[14px] leading-[20px] text-foreground">
                  &quot;Hi John, our inspection revealed the front brakes are significantly worn. We recommend
                  replacing the pads and rotors now to ensure safety and prevent further damage to the calipers.
                  - Sarah&quot;
                </p>
              </div>
              <div className="flex items-center gap-[12px] rounded-[4px] border border-[rgba(0,82,204,0.1)] bg-[rgba(0,82,204,0.05)] p-[13px]">
                <Clock className="size-[20px] text-primary" />
                <div>
                  <p className="text-[11px] text-[#424753]">Estimated Completion</p>
                  <p className="text-[14px] font-bold text-foreground">Today, 5:30 PM</p>
                </div>
              </div>
              <div className="flex flex-col gap-[12px] border-t border-border pt-[25px]">
                <Button
                  onClick={() => void handleDecide("approved")}
                  disabled={estimate.status !== "pending"}
                  className="gap-[8px] rounded-[8px] px-[16px] py-[12px] text-[16px] font-bold shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                >
                  <Check className="size-[20px]" />
                  {estimate.status === "approved" ? "Approved" : estimate.status === "rejected" ? "Rejected" : "Approve Estimate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleDecide("rejected")}
                  disabled={estimate.status !== "pending"}
                  className="gap-[8px] rounded-[8px] border-2 border-[rgba(244,67,54,0.2)] px-[18px] py-[14px] text-[16px] font-bold text-[#f44336] hover:bg-[rgba(244,67,54,0.05)] disabled:opacity-40"
                >
                  <X className="size-[20px]" />
                  Reject Estimate
                </Button>
              </div>
            </div>

            <div className="flex gap-[12px] rounded-[8px] border border-border bg-secondary p-[17px]">
              <HelpCircle className="size-[20px] shrink-0 text-primary" />
              <div>
                <p className="text-[12px] font-bold tracking-[0.24px] text-foreground">Need Clarification?</p>
                <p className="text-[14px] leading-[20px] text-[#424753]">
                  You can request more details or a callback from your advisor before approving.
                </p>
                <Link href="/dashboard/chat" className="flex items-center gap-[4px] pt-[7.5px] text-[14px] text-primary">
                  <MessageSquare className="size-[14px]" />
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
