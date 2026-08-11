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
        "relative w-[256px] shrink-0 overflow-hidden rounded-[8px] border bg-white text-left transition-colors",
        selected
          ? "border-2 border-primary bg-primary-soft"
          : "border border-border hover:border-primary/50",
      )}
    >
      <div className="relative h-[96px] w-full bg-secondary">
        <Image src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
        {selected && (
          <span className="absolute top-[8px] left-[8px] flex items-center gap-[4px] rounded-full bg-primary px-[8px] py-[4px] text-[12px] font-medium text-white">
            <Check className="size-[10px]" />
            Selected
          </span>
        )}
      </div>
      <div className="flex flex-col gap-[4px] p-[12px]">
        <span className="text-[14px] font-bold text-foreground">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </span>
        <span className="text-[12px] text-muted-foreground">Reg: {vehicle.regNo}</span>
        <span className="text-[12px] text-muted-foreground">Year: {vehicle.year}</span>
        <span className="text-[12px] text-muted-foreground">
          Fuel: {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
        </span>
        <span className="text-[12px] text-muted-foreground">Mileage: {vehicle.mileage.toLocaleString()} mi</span>
      </div>
    </button>
  );
}

export function AddVehicleCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[128px] shrink-0 flex-col items-center justify-center gap-[8px] rounded-[8px] border border-dashed border-input p-[13px] text-center transition-colors hover:border-primary/60"
    >
      <span className="flex size-[32px] items-center justify-center rounded-full bg-primary-soft">
        <Plus className="size-[16px] text-primary" />
      </span>
      <span className="text-[14px] font-medium text-[#374151]">
        Add New
        <br />
        Vehicle
      </span>
    </button>
  );
}
