"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const DATE_PRESETS = [
  "today",
  "tomorrow",
  "this weekend",
  "this week",
  "next weekend",
  "next week",
  "this month",
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return startOfDay(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days),
  );
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

/** Saturday of the weekend that contains `date` (or the upcoming one if mid-week). */
function thisWeekendStart(date: Date) {
  const day = date.getDay();
  if (day === 0) return addDays(date, -1); // Sunday → prior Saturday
  if (day === 6) return date; // Saturday
  return addDays(date, 6 - day); // Mon–Fri → upcoming Saturday
}

function nextWeekendStart(date: Date) {
  return addDays(thisWeekendStart(date), 7);
}

export function dateForPreset(preset: DatePreset, from = new Date()): Date {
  const today = startOfDay(from);
  switch (preset) {
    case "today":
      return today;
    case "tomorrow":
      return addDays(today, 1);
    case "this weekend":
      return thisWeekendStart(today);
    case "this week":
      return startOfWeek(today);
    case "next weekend":
      return nextWeekendStart(today);
    case "next week":
      return addDays(startOfWeek(today), 7);
    case "this month":
      return new Date(today.getFullYear(), today.getMonth(), 1);
  }
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    days.push({
      date: new Date(year, month, -i),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, month, day),
      inMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date;
    days.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }

  return days;
}

type DateCalendarProps = {
  selectedDate: Date;
  datePreset: DatePreset | null;
  onSelectDate: (date: Date) => void;
  onSelectPreset: (preset: DatePreset) => void;
};

export default function DateCalendar({
  selectedDate,
  datePreset,
  onSelectDate,
  onSelectPreset,
}: DateCalendarProps) {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const today = startOfDay(new Date());
  const calendarDays = getCalendarDays(viewMonth);

  useEffect(() => {
    setViewMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
  }, [selectedDate]);

  function shiftMonth(delta: number) {
    setViewMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }

  return (
    <div className="rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4">
      <h3 className="mb-3 text-sm font-medium text-[#e5e5e5]">Date</h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
              datePreset === preset
                ? "bg-[#e5e5e5] text-[#1a1a1a]"
                : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-md px-2 py-1 text-[#a3a3a3] transition-colors hover:bg-[#3a3a3a] hover:text-[#e5e5e5]"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-medium text-[#e5e5e5]">
          {viewMonth.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="rounded-md px-2 py-1 text-[#a3a3a3] transition-colors hover:bg-[#3a3a3a] hover:text-[#e5e5e5]"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 text-center text-xs text-[#8a8a8a]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, inMonth }) => {
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(startOfDay(date))}
              className={`aspect-square rounded-lg text-sm transition-colors ${
                selected
                  ? "bg-[#e5e5e5] text-[#1a1a1a]"
                  : inMonth
                    ? "text-[#d4d4d4] hover:bg-[#3a3a3a]"
                    : "text-[#5a5a5a] hover:bg-[#333333]"
              } ${isToday && !selected ? "ring-1 ring-[#6b6b6b]" : ""}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
