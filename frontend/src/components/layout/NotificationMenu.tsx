"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function NotificationMenu() {
  const {
    user,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsHovered(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsHovered(false);
      }
    }

    if (isOpen || isHovered) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isHovered]);

  const isExpanded = isOpen || isHovered;

  const activityHref =
    user?.role === "owner"
      ? "/dashboard/activity"
      : user?.role
        ? `/${user.role}/activity`
        : "/dashboard/activity";

  return (
    <div
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex items-center"
    >
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isExpanded}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex size-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isExpanded && "bg-secondary text-foreground",
        )}
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover container: fluid transition, hover bridge, stays open smoothly */}
      <div
        className={cn(
          "invisible absolute top-[calc(100%+8px)] right-0 z-50 w-80 sm:w-96 translate-y-1 rounded-2xl border border-border bg-white shadow-xl opacity-0 transition-all duration-150 ease-out before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-[''] group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100",
          isExpanded && "visible translate-y-0 opacity-100",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                {unreadCount} new
              </span>
            ) : (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                All caught up
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead();
              }}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Bell className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No new notifications</p>
              <p className="text-xs text-muted-foreground">
                You will be notified here when vehicle status, estimates, or messages update.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  markAsRead(item.id, item.threadId);
                  setIsOpen(false);
                  setIsHovered(false);
                }}
                className={cn(
                  "flex items-start gap-3 p-3.5 transition-colors hover:bg-secondary/60",
                  item.unread && "bg-primary-soft/30",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    item.iconBg,
                    item.iconColor,
                  )}
                >
                  <item.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        "text-xs truncate",
                        item.unread ? "font-semibold text-foreground" : "font-medium text-[#424753]",
                      )}
                    >
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
                {item.unread && (
                  <span className="size-2 mt-1.5 rounded-full bg-primary shrink-0" aria-label="Unread" />
                )}
              </Link>
            ))
          )}
        </div>

        {/* Footer: always visible so user can access their full activity history */}
        <div className="border-t border-border px-4 py-2.5 bg-background/50 rounded-b-xl flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {notifications.length > 0
              ? `Showing ${notifications.length} alert${notifications.length === 1 ? "" : "s"}`
              : "No unread alerts"}
          </span>
          <Link
            href={activityHref}
            onClick={() => {
              setIsOpen(false);
              setIsHovered(false);
            }}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            View Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
