"use client";

import { Bell, Search } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useAppSelector } from "@/store/hooks";

interface AppTopbarProps {
  searchPlaceholder?: string;
  links?: string[];
}

export function AppTopbar({
  searchPlaceholder = "Search vehicles, services...",
  links,
}: AppTopbarProps) {
  const unreadCount = useAppSelector((s) => s.chat.threads.reduce((sum, t) => sum + t.unread, 0));

  return (
    <header className="bg-white border-b border-border fixed top-0 right-0 left-64 z-20 flex h-16 items-center justify-between px-6">
      {links ? (
        <nav className="flex items-center gap-6">
          {links.map((label) => (
            <span key={label} className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
          ))}
        </nav>
      ) : (
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-[38px] w-full rounded-lg border border-border bg-background pr-[13px] pl-[41px] text-sm text-muted-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      )}
      <div className="flex items-center gap-4 pr-2">
        <button className="relative flex items-center justify-center" aria-label="Notifications">
          <Bell className="h-5 w-[17.5px] text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 py-0.5 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
