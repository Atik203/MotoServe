"use client";

import { useState } from "react";
import Image from "next/image";
import { Car } from "lucide-react";
import { useFileUrl } from "@/hooks/useFileUrl";
import { cn } from "@/lib/utils";

interface VehicleImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export function VehicleImage({ src, alt, fill, width, height, className, sizes, priority, fallbackSrc }: VehicleImageProps) {
  const resolved = useFileUrl(src);
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  if (!resolved || failed) {
    if (fallbackSrc && !fallbackFailed) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={className}
          sizes={sizes}
          priority={priority}
          onError={() => setFallbackFailed(true)}
        />
      );
    }
    return (
      <div className={cn("flex items-center justify-center bg-[#eef1f4]", className)}>
        <Car className="size-1/3 text-muted-foreground/60" />
      </div>
    );
  }

  return <Image src={resolved} alt={alt} fill={fill} width={width} height={height} className={className} sizes={sizes} priority={priority} onError={() => setFailed(true)} />;
}