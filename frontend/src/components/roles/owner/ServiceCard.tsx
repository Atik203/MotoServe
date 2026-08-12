"use client";

import {
  Check,
  ClipboardCheck,
  Clock,
  Disc3,
  Droplet,
  Gauge,
  RefreshCcw,
  Snowflake,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/types";

const serviceIcons: Record<string, LucideIcon> = {
  "Oil Change": Droplet,
  "Full Synthetic Oil Change": Droplet,
  "Tire Rotation": RefreshCcw,
  "Multi-Point Inspection": ClipboardCheck,
  "Brake Service": Disc3,
  "Brake Pad Replacement": Disc3,
  "Engine Diagnostic": Gauge,
  "AC Recharge": Snowflake,
};

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onToggle: () => void;
}

export function ServiceCard({ service, selected, onToggle }: ServiceCardProps) {
  const Icon = serviceIcons[service.name] ?? Wrench;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border p-[18px] text-left transition-colors",
        selected
          ? "border-2 border-primary bg-primary-soft"
          : "border border-border bg-white hover:border-primary/50",
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          selected ? "bg-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]" : "bg-primary-soft",
        )}
      >
        <Icon className={cn("size-4", selected ? "text-primary" : "text-primary")} />
      </span>
      <span className="text-sm font-bold text-foreground">{service.name}</span>
      <span className="flex items-center justify-between pt-[3.5px]">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {service.durationMins < 60 ? `${service.durationMins} mins` : `${service.durationMins / 60} hr${service.durationMins > 60 ? "s" : ""}`}
        </span>
        <span className="text-xs text-muted-foreground">
          from <span className="font-bold text-foreground">${service.basePrice.toFixed(2)}</span>
        </span>
      </span>
      {selected && (
        <span className="absolute top-3 right-3">
          <Check className="size-4 text-primary" />
        </span>
      )}
    </button>
  );
}
