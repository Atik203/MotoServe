"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";

const CATEGORIES: { label: string; value: ServiceCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Repairs", value: "repairs" },
  { label: "Inspections", value: "inspections" },
];

interface ServicePickerProps {
  services: Service[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxHeight?: string;
  showTotal?: boolean;
}

export function ServicePicker({
  services,
  selectedIds,
  onToggle,
  maxHeight = "max-h-72",
  showTotal = true,
}: ServicePickerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const matchCat = category === "all" || s.category === category;
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [services, search, category]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds],
  );

  const total = selectedServices.reduce((sum, s) => sum + s.basePrice, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Search + Category */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] pl-9 pr-8 text-sm text-[#191c1d] placeholder:text-[#9ca3af] outline-none focus:border-primary/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#9ca3af] hover:text-[#64748b]"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                category === c.value
                  ? "bg-primary text-white"
                  : "border border-[#e2e8f0] bg-white text-[#64748b] hover:border-primary/40 hover:text-primary",
              )}
            >
              {c.label}
              {c.value !== "all" && (
                <span className={cn("ml-1.5 text-[10px]", category === c.value ? "opacity-75" : "opacity-60")}>
                  {services.filter((s) => s.category === c.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected chips */}
      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-primary/20 bg-[#eff6ff] px-3 py-2">
          <span className="self-center text-[11px] font-semibold text-primary">Selected:</span>
          {selectedServices.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1.5 pl-2 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {s.name}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}

      {/* Services grid */}
      <div className={cn("overflow-y-auto pr-0.5", maxHeight)}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Search className="size-6 text-[#9ca3af]" />
            <p className="text-sm text-[#64748b]">No services match your search.</p>
            <button
              type="button"
              onClick={() => { setSearch(""); setCategory("all"); }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((s) => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onToggle(s.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all",
                    selected
                      ? "border-primary bg-[#eff6ff] shadow-sm"
                      : "border-[#e5e7eb] bg-white hover:border-primary/40 hover:bg-[#fafbff]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      selected ? "border-primary bg-primary text-white" : "border-[#c2c6d5] group-hover:border-primary/50",
                    )}
                  >
                    {selected && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#191c1d]">{s.name}</span>
                    <span className="block text-[10px] text-[#64748b]">
                      ${s.basePrice.toFixed(0)} · {s.durationMins}min
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize",
                      s.category === "maintenance" && "bg-[rgba(0,82,204,0.1)] text-[#0052cc]",
                      s.category === "repairs" && "bg-[rgba(186,26,26,0.08)] text-[#ba1a1a]",
                      s.category === "inspections" && "bg-[rgba(76,175,80,0.1)] text-[#2e7d32]",
                    )}
                  >
                    {s.category}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer total */}
      {showTotal && selectedServices.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2">
          <span className="text-xs text-[#64748b]">
            {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} selected
          </span>
          <span className="text-sm font-bold text-[#191c1d]">
            Est. ${total.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
