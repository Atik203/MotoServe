"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Clock,
  CreditCard,
  Search,
  Wrench,
  X,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useNotifications, type ActivityItem } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ActivityManagerProps {
  role: "owner" | "advisor" | "mechanic" | "admin";
  title?: string;
  subtitle?: string;
}

type FilterCategory = "all" | "unread" | "tasks" | "estimates" | "invoices" | "appointments" | "chat";
type SortOrder = "newest" | "oldest";

export function ActivityManager({
  role,
  title = "Activity & Notifications",
  subtitle = "Real-time updates on vehicle progress, estimates, invoices, appointments, and communications.",
}: ActivityManagerProps) {
  const {
    allActivities,
    unreadCount,
    countsByCategory,
    markAsRead,
    markAsUnread,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const breadcrumbPrefix =
    role === "owner"
      ? "Dashboard"
      : role === "advisor"
        ? "Advisor"
        : role === "mechanic"
          ? "Mechanic"
          : "Admin";

  // Filter & Search
  const filteredActivities = useMemo(() => {
    let list = allActivities;

    // Filter by tab
    if (activeTab === "unread") {
      list = list.filter((item) => item.unread);
    } else if (activeTab !== "all") {
      list = list.filter((item) => item.category === activeTab);
    }

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchVehicle = item.metadata?.vehicle?.toLowerCase().includes(q);
        const matchReg = item.metadata?.regNo?.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        return matchTitle || matchSubtitle || matchDesc || matchVehicle || matchReg || matchId;
      });
    }

    // Sort order
    return list.sort((a, b) => {
      const diff = b.dateObj.getTime() - a.dateObj.getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
  }, [allActivities, activeTab, searchQuery, sortOrder]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleToggleRead = (e: React.MouseEvent, item: ActivityItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.unread) {
      markAsRead(item.id, item.threadId);
      toast.success("Marked as read");
    } else {
      markAsUnread(item.id);
      toast.info("Marked as unread");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {breadcrumbPrefix} › <span className="text-foreground">Activity</span>
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllRead}
                variant="outline"
                className="gap-2 rounded-xl border-border bg-white text-xs font-semibold shadow-xs hover:bg-secondary"
              >
                <CheckCheck className="size-4 text-primary" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Activity</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary">
                <Bell className="size-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{countsByCategory.all}</p>
            <span className="text-[11px] text-muted-foreground">All logged updates</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Unread Alerts</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="size-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">{unreadCount}</p>
            <span className="text-[11px] text-muted-foreground">Require attention</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Tasks & Services</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Wrench className="size-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{countsByCategory.tasks}</p>
            <span className="text-[11px] text-muted-foreground">Workshop service updates</span>
          </div>

          <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Estimates & Billing</span>
              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <CreditCard className="size-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {countsByCategory.estimates + countsByCategory.invoices}
            </p>
            <span className="text-[11px] text-muted-foreground">Quotes and payments</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_1px_1.5px_rgba(0,0,0,0.06)]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
            {[
              { id: "all", label: "All Activity", count: countsByCategory.all },
              { id: "unread", label: "Unread", count: unreadCount, badgeColor: "bg-amber-100 text-amber-700" },
              { id: "tasks", label: "Tasks & Services", count: countsByCategory.tasks },
              { id: "estimates", label: "Estimates", count: countsByCategory.estimates },
              { id: "invoices", label: "Invoices", count: countsByCategory.invoices },
              { id: "appointments", label: "Appointments", count: countsByCategory.appointments },
              { id: "chat", label: "Messages", count: countsByCategory.chat },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as FilterCategory)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : tab.badgeColor || "bg-secondary text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Sort row */}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vehicle, registration, task, or ID..."
                className="h-9 rounded-xl border-border bg-secondary/40 pl-9 pr-8 text-xs focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="h-9 appearance-none rounded-xl border border-border bg-secondary/40 pl-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:bg-secondary"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>

              {(searchQuery || activeTab !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="h-9 gap-1 rounded-xl text-xs font-semibold text-primary"
                >
                  <RotateCcw className="size-3.5" />
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Count summary */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredActivities.length}</span>{" "}
            {filteredActivities.length === 1 ? "activity" : "activities"}
          </p>
        </div>

        {/* Activity Items List */}
        <div className="flex flex-col gap-3">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 px-4 text-center shadow-xs">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <Bell className="size-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h3 className="text-base font-semibold text-foreground">No activity records found</h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || activeTab !== "all"
                    ? "Try clearing your search query or selecting a different filter tab."
                    : "When new vehicle updates, estimates, or notifications arrive, they will appear here."}
                </p>
              </div>
              {(searchQuery || activeTab !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="mt-2 rounded-xl text-xs font-semibold"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            filteredActivities.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white p-5 transition-all shadow-[0_1px_1.5px_rgba(0,0,0,0.04)] hover:border-primary/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] md:flex-row md:items-center",
                  item.unread && "border-primary/30 bg-primary-soft/10",
                )}
              >
                {/* Left side: Icon + details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      "relative flex size-11 shrink-0 items-center justify-center rounded-xl",
                      item.iconBg,
                      item.iconColor,
                    )}
                  >
                    <item.icon className="size-5" />
                    {item.unread && (
                      <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground truncate">{item.title}</h2>
                      {item.statusBadge && (
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                            item.statusBadge.className,
                          )}
                        >
                          {item.statusBadge.label}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap ml-auto md:ml-0">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-foreground/80">{item.subtitle}</p>

                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {item.fullDate}
                      </span>

                      {item.metadata?.vehicle && (
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.metadata.vehicle}
                        </span>
                      )}

                      {item.metadata?.regNo && (
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground font-mono">
                          {item.metadata.regNo}
                        </span>
                      )}

                      {item.metadata?.amount && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          {item.metadata.amount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center justify-end gap-2 shrink-0 border-t border-border/60 pt-3 md:border-t-0 md:pt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleToggleRead(e, item)}
                    className="h-8 rounded-xl px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {item.unread ? "Mark read" : "Mark unread"}
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="h-8 gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (item.unread) {
                          markAsRead(item.id, item.threadId);
                        }
                      }}
                    >
                      {item.actionLabel}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
