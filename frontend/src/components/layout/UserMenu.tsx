"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { roleHome } from "@/lib/nav";

export function userInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft text-[11px] font-bold text-primary transition-shadow hover:shadow-[0_0_0_3px_rgba(0,82,204,0.15)]"
        >
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name} fill className="object-cover" />
          ) : (
            userInitials(user.name)
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-lg">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">{user.name}</span>
          <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          <span className="text-[11px] font-medium text-primary capitalize">{user.role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer py-2">
          <Link href={roleHome(user.role)}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer py-2">
          <Link href="/profile">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          className="cursor-pointer py-2 text-[#ba1a1a] focus:text-[#ba1a1a]"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
