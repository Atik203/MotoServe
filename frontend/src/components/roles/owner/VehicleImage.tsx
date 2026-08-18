"use client";

import Image from "next/image";
import { useFileUrl } from "@/hooks/useFileUrl";

interface VehicleImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function VehicleImage({ src, alt, fill, width, height, className, sizes, priority }: VehicleImageProps) {
  const resolved = useFileUrl(src);
  if (!resolved) return null;
  return <Image src={resolved} alt={alt} fill={fill} width={width} height={height} className={className} sizes={sizes} priority={priority} />;
}
