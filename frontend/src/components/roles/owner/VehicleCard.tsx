"use client";

import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  selected?: boolean;
  onSelect: () => void;
}

export function VehicleCard({ vehicle, selected, onSelect }: VehicleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-64 shrink-0 overflow-hidden rounded-lg border bg-white text-left transition-colors",
        selected
          ? "border-2 border-primary bg-primary-soft"
          : "border border-border hover:border-primary/50",
      )}
    >
      <div className="relative h-24 w-full bg-secondary">
        <Image src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
        {selected && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-medium text-white">
            <Check className="size-2.5" />
            Selected
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="text-sm font-bold text-foreground">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </span>
        <span className="text-xs text-muted-foreground">Reg: {vehicle.regNo}</span>
        <span className="text-xs text-muted-foreground">Year: {vehicle.year}</span>
        <span className="text-xs text-muted-foreground">
          Fuel: {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
        </span>
        <span className="text-xs text-muted-foreground">Mileage: {vehicle.mileage.toLocaleString()} mi</span>
      </div>
    </button>
  );
}

export function AddVehicleCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input p-[13px] text-center transition-colors hover:border-primary/60"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft">
        <Plus className="size-4 text-primary" />
      </span>
      <span className="text-sm font-medium text-[#374151]">
        Add New
        <br />
        Vehicle
      </span>
    </button>
  );
}
