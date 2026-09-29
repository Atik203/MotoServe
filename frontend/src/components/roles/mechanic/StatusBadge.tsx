import { AlertTriangle, CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  received: { label: "Received", className: "bg-muted text-muted-foreground" },
  inspecting: { label: "Inspecting", className: "bg-accent text-accent-foreground" },
  repairing: { label: "Repairing", className: "bg-[rgba(0,82,204,0.1)] text-primary" },
  testing: { label: "Testing", className: "bg-[rgba(255,193,7,0.1)] text-[#b45309]" },
  ready: { label: "Ready", className: "bg-[rgba(16,185,129,0.1)] text-[#047857]" },
  completed: { label: "Completed", className: "bg-[rgba(16,185,129,0.1)] text-[#047857]" },
};

const priorityIcon = {
  urgent: <AlertTriangle className="size-3" />,
  high: <Wrench className="size-3" />,
  medium: <ClipboardList className="size-3" />,
  low: <CheckCircle2 className="size-3" />,
};

interface StatusBadgeProps {
  status: TaskStatus;
  priority?: TaskPriority;
}

export function StatusBadge({ status, priority }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-xs font-medium", cfg.className)}>
      {priority && priorityIcon[priority]}
      {cfg.label}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  const label =
    priority === "urgent"
      ? "Urgent Rush"
      : priority === "high"
        ? "High Priority"
        : priority === "medium"
          ? "Medium Priority"
          : "Low Priority";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[13px] py-[5px] text-xs font-semibold tracking-[0.8px] uppercase ring-1",
        priority === "urgent"
          ? "bg-[rgba(225,29,72,0.1)] text-[#be123c] ring-[rgba(225,29,72,0.2)]"
          : "bg-[rgba(255,193,7,0.1)] text-warning ring-[rgba(255,193,7,0.2)]",
      )}
    >
      {label}
    </span>
  );
}
