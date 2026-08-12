"use client";

import { Bell, Search } from "lucide-react";
import { UserMenu } from "./UserMenu";

interface AppTopbarProps {
  searchPlaceholder?: string;
  links?: string[];
}

export function AppTopbar({
  searchPlaceholder = "Search vehicles, services...",
  links,
}: AppTopbarProps) {
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
      <div className="flex items-center gap-4">
        <button className="relative flex items-center justify-center" aria-label="Notifications">
          <Bell className="h-5 w-[17.5px] text-muted-foreground" />
          <span className="absolute top-0 right-0 size-2 rounded-full bg-destructive ring-2 ring-white" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
