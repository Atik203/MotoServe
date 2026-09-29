"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileUrl } from "@/hooks/useFileUrl";

interface ResolvedImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  fallbackClassName?: string;
  showFallbackLabel?: boolean;
}

export function ResolvedImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  fallbackClassName,
  showFallbackLabel = false,
}: ResolvedImageProps) {
  const resolved = useFileUrl(src);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground",
          fallbackClassName,
        )}
      >
        <ImageOff className="size-4" />
        {showFallbackLabel && <span className="text-[10px] font-medium">Unavailable</span>}
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
