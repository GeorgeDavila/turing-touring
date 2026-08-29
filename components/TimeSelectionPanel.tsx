"use client";

export const TIME_PRESETS = ["any", "morning", "afternoon", "evening"] as const;
type TimePreset = (typeof TIME_PRESETS)[number];

export const TIME_INTERVALS = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
] as const;

export type TimeSelection = TimePreset | (typeof TIME_INTERVALS)[number];

export const DEFAULT_TIME_SELECTION: TimeSelection = "any";

type TimeSelectionPanelProps = {
  value: TimeSelection;
  onChange: (value: TimeSelection) => void;
};

export default function TimeSelectionPanel({
  value,
  onChange,
}: TimeSelectionPanelProps) {
  return (
    <div className="rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4">
      <h3 className="mb-3 text-sm font-medium text-[#e5e5e5]">Time</h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
              value === preset
                ? "bg-[#e5e5e5] text-[#1a1a1a]"
                : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs tracking-wide text-[#8a8a8a] uppercase">
        Intervals
      </p>
      <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
        {TIME_INTERVALS.map((interval) => (
          <button
            key={interval}
            type="button"
            onClick={() => onChange(interval)}
            className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
              value === interval
                ? "bg-[#e5e5e5] text-[#1a1a1a]"
                : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
            }`}
          >
            {interval}
          </button>
        ))}
      </div>
    </div>
  );
}
