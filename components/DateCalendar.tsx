"use client";

import { useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
  onSelectDate: (date: Date) => void;
};

export default function DateCalendar({
  selectedDate,
  onSelectDate,
}: DateCalendarProps) {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const today = startOfDay(new Date());
  const calendarDays = getCalendarDays(viewMonth);

  function shiftMonth(delta: number) {
    setViewMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }

  return (
    <div className="rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="rounded-md px-2 py-1 text-[#a3a3a3] transition-colors hover:bg-[#3a3a3a] hover:text-[#e5e5e5]"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h3 className="text-sm font-medium text-[#e5e5e5]">
          {viewMonth.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>
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
