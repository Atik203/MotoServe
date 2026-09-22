"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFileUrl } from "@/hooks/useFileUrl";
import { cn } from "@/lib/utils";

interface ResolvedAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function ResolvedAvatar({ src, name, className, imageClassName, fallbackClassName }: ResolvedAvatarProps) {
  const resolved = useFileUrl(src);
  return (
    <Avatar className={className}>
      {resolved && <AvatarImage src={resolved} alt={name} className={imageClassName} />}
      <AvatarFallback className={cn("font-bold", fallbackClassName)}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}