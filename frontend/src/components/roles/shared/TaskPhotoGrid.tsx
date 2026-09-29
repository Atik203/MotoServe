"use client";

import { cn } from "@/lib/utils";
import { ResolvedImage } from "./ResolvedImage";

interface TaskPhotoGridProps {
  photos: string[];
  variant?: "grid" | "strip";
  className?: string;
  itemClassName?: string;
  altPrefix?: string;
  imageClassName?: string;
}

export function TaskPhotoGrid({
  photos,
  variant = "grid",
  className,
  itemClassName = "aspect-square",
  altPrefix = "Repair photo",
  imageClassName = "object-cover",
}: TaskPhotoGridProps) {
  if (photos.length === 0) return null;

  return (
    <div
      className={cn(
        variant === "grid" ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2",
        className,
      )}
    >
      {photos.map((photo, i) => (
        <div
          key={`${photo}-${i}`}
          className={cn(
            "relative overflow-hidden rounded-[6px] border border-border bg-muted",
            itemClassName,
          )}
        >
          <ResolvedImage
            src={photo}
            alt={`${altPrefix} ${i + 1}`}
            fill
            className={imageClassName}
            showFallbackLabel
          />
        </div>
      ))}
    </div>
  );
}
