"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Camera, Pencil, Trash2 } from "lucide-react";

interface RepairPhotosProps {
  photos: string[];
}

export function RepairPhotos({ photos }: RepairPhotosProps) {
  const upload = () => toast.info("Photo upload coming with the backend");

  return (
    <section className="flex flex-col gap-[16px] rounded-[8px] border border-border bg-white p-[17px] shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <h2 className="flex items-center gap-[8px] text-[16px] font-medium text-foreground">
        <Camera className="size-[18px]" />
        Repair Photos
      </h2>

      <div className="grid grid-cols-2 gap-[8px]">
        {photos.map((photo, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-[4px] border border-border bg-secondary">
            <Image src={photo} alt={`Repair photo ${i + 1}`} fill className="object-cover" />
            <div className="absolute top-[4px] right-[4px] flex gap-[4px] opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded-full bg-white/80 p-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
                <Pencil className="size-[10px] text-foreground" />
              </span>
              <span className="rounded-full bg-white/80 p-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
                <Trash2 className="size-[10px] text-destructive" />
              </span>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={upload}
          className="flex aspect-square flex-col items-center justify-center gap-[8px] rounded-[4px] border-2 border-dashed border-[#c2c6d5] bg-secondary transition-colors hover:border-primary"
        >
          <Camera className="size-[16px] text-muted-foreground" />
          <span className="text-[14px] font-medium text-muted-foreground">Upload Photo</span>
        </button>
      </div>
    </section>
  );
}
