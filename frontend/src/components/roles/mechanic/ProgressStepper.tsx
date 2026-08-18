"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobProgressStep } from "@/types";

const STEP_LABELS: Record<string, string> = {
  received: "Received",
  inspecting: "Inspecting",
  repairing: "Repairing",
  testing: "Testing",
  ready: "Ready",
  completed: "Completed",
};

interface ProgressStepperProps {
  steps: JobProgressStep[];
  size?: "sm" | "lg";
}

export function ProgressStepper({ steps, size = "lg" }: ProgressStepperProps) {
  const activeIdx = steps.findIndex((s) => s.done === false) === -1 ? steps.length - 1 : steps.findIndex((s) => s.done === false);

  return (
    <div className="relative">
      <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-border" />
      <div
        className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary transition-all"
        style={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }}
      />
      <div className="relative flex justify-between">
        {steps.map((step, i) => {
          const isActive = i === activeIdx;
          const isDone = step.done;
          return (
            <div key={step.step} className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 bg-white",
                  size === "lg" ? "size-8" : "size-6",
                  isDone && "border-primary bg-primary text-white",
                  isActive && !isDone && "border-primary bg-primary text-white shadow-[0_0_0_4px_rgba(0,82,204,0.2)]",
                  !isDone && !isActive && "border-border bg-white text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className={size === "lg" ? "size-3.5" : "size-3"} />
                ) : (
                  <span className={size === "lg" ? "size-2 rounded-full bg-current" : "size-1.5 rounded-full bg-current"} />
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-center",
                  size === "lg" ? "text-sm" : "text-xs",
                  isActive && !isDone ? "font-bold text-primary" : isDone ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {STEP_LABELS[step.step] ?? step.label ?? step.step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
