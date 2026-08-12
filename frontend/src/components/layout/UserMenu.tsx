"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User } from "lucide-react";
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
    <div className="group relative flex items-center">
      <button
        type="button"
        aria-label="Account menu"
        className="relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft text-xs font-bold text-primary transition-shadow hover:shadow-[0_0_0_3px_rgba(0,82,204,0.15)]"
      >
        {user.avatar ? (
          <Image src={user.avatar} alt={user.name} fill className="object-cover" />
        ) : (
          userInitials(user.name)
        )}
      </button>

      <div className="invisible absolute top-[calc(100%+8px)] right-0 z-50 w-56 translate-y-1 rounded-lg border border-border bg-white p-1.5 opacity-0 shadow-md transition-all duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex flex-col gap-0.5 px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
          <span className="text-[11px] font-medium text-primary capitalize">{user.role}</span>
        </div>
        <div className="my-1 h-px bg-border" />
        <Link
          href={roleHome(user.role)}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <LayoutDashboard className="size-4 text-muted-foreground" />
          Dashboard
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <User className="size-4 text-muted-foreground" />
          Profile
        </Link>
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#ba1a1a] transition-colors hover:bg-[rgba(186,26,26,0.08)]"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
