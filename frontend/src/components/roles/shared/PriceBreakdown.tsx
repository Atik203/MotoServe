"use client";

import { Layers, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAX_RATE, round2 } from "@/lib/pricing";

export interface BreakdownLine {
  id?: string;
  description: string;
  category: "service" | "parts" | "labor" | string;
  qty?: number | null;
  rate?: number | null;
  amount: number;
}

interface PriceBreakdownProps {
  lines: BreakdownLine[];
  servicesTotal: number;
  laborTotal: number;
  partsTotal: number;
  subtotal: number;
  tax: number;
  total: number;
  className?: string;
  compact?: boolean;
  emptyLabel?: string;
}

const categoryMeta: Record<string, { icon: typeof Wrench; tint: string; label: string }> = {
  service: { icon: Wrench, tint: "bg-[#eff6ff] text-primary", label: "Service" },
  labor: { icon: Layers, tint: "bg-[#f0fdf4] text-[#16a34a]", label: "Labor" },
  parts: { icon: Package, tint: "bg-[#fdf4ff] text-[#9333ea]", label: "Part" },
};

export function PriceBreakdown({
  lines,
  servicesTotal,
  laborTotal,
  partsTotal,
  subtotal,
  tax,
  total,
  className,
  compact,
  emptyLabel = "No items on this estimate yet.",
}: PriceBreakdownProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-col divide-y divide-[#f1f3f5]">
        {lines.map((line, idx) => {
          const meta = categoryMeta[line.category] ?? categoryMeta.service;
          const Icon = meta.icon;
          const isLabor = line.category.toLowerCase() === "labor";
          const qty = line.qty ?? 1;
          const rate = line.rate ?? 0;
          return (
            <div
              key={line.id ?? `${line.category}-${line.description}-${idx}`}
              className={cn("flex items-start justify-between gap-3 py-2.5", isLabor && "pl-6")}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md",
                    meta.tint,
                    compact && "size-5",
                  )}
                >
                  <Icon className={compact ? "size-3" : "size-3.5"} />
                </span>
                <div className="min-w-0">
                  <p className={cn("truncate font-semibold text-[#191c1d]", compact ? "text-xs" : "text-sm")}>
                    {line.description}
                  </p>
                  {isLabor && qty > 0 && (
                    <p className="text-[11px] text-[#64748b]">
                      {qty} hr{qty === 1 ? "" : "s"} × ${rate.toFixed(2)}/hr
                    </p>
                  )}
                  {!isLabor && qty > 1 && (
                    <p className="text-[11px] text-[#64748b]">
                      {qty} × ${rate.toFixed(2)}
                    </p>
                  )}
                  {!isLabor && qty <= 1 && (
                    <p className="text-[11px] text-[#64748b]">{meta.label}</p>
                  )}
                </div>
              </div>
              <span className={cn("shrink-0 font-mono font-bold text-[#191c1d]", compact ? "text-xs" : "text-sm")}>
                ${round2(line.amount).toFixed(2)}
              </span>
            </div>
          );
        })}
        {lines.length === 0 && (
          <p className="py-4 text-center text-xs text-[#64748b]">{emptyLabel}</p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-[#f1f3f5] pt-3 text-xs">
        <div className="flex items-center justify-between text-[#64748b]">
          <span>Services:</span>
          <span className="font-semibold text-[#191c1d]">${servicesTotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[#64748b]">
          <span>Workshop Labor:</span>
          <span className="font-semibold text-[#191c1d]">${laborTotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[#64748b]">
          <span>Parts &amp; Materials:</span>
          <span className="font-semibold text-[#191c1d]">${partsTotal.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-[#f1f3f5] pt-2 text-sm font-bold text-[#191c1d]">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[#64748b]">
          <span>Tax ({(TAX_RATE * 100).toFixed(1)}%):</span>
          <span className="font-semibold text-[#191c1d]">${tax.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-bold text-primary">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
