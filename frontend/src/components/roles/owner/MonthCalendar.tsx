"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface MonthCalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

export function MonthCalendar({ selectedDate, onSelect }: MonthCalendarProps) {
  const today = new Date();
  const [view, setView] = useState({ month: today.getMonth(), year: today.getFullYear() });

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const prevMonth = () => {
    const m = view.month === 0 ? 11 : view.month - 1;
    const y = view.month === 0 ? view.year - 1 : view.year;
    setView({ month: m, year: y });
  };

  const nextMonth = () => {
    const m = view.month === 11 ? 0 : view.month + 1;
    const y = view.month === 11 ? view.year + 1 : view.year;
    setView({ month: m, year: y });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="text-muted-foreground hover:text-foreground" aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS[view.month]} {view.year}
        </span>
        <button type="button" onClick={nextMonth} className="text-muted-foreground hover:text-foreground" aria-label="Next month">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-[4px]">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-center text-xs font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(view.year, view.month, day);
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full text-xs transition-colors",
                isSelected
                  ? "bg-primary font-semibold text-white"
                  : isToday
                    ? "bg-primary-soft font-semibold text-primary"
                    : "text-foreground hover:bg-muted",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
