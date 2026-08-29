"use client";

export const DEFAULT_PRICE_MIN = 0;
export const DEFAULT_PRICE_MAX = 50;

type PriceRangePanelProps = {
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
};

export default function PriceRangePanel({
  min,
  max,
  onMinChange,
  onMaxChange,
}: PriceRangePanelProps) {
  return (
    <div className="rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4">
      <h3 className="mb-3 text-sm font-medium text-[#e5e5e5]">Price</h3>
      <div className="flex gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs tracking-wide text-[#8a8a8a] uppercase">
            Min
          </span>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => onMinChange(Number(e.target.value) || 0)}
            className="rounded-md border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2 text-sm text-[#e5e5e5] outline-none focus:border-[#6b6b6b]"
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs tracking-wide text-[#8a8a8a] uppercase">
            Max
          </span>
          <input
            type="number"
            min={0}
            value={max}
            onChange={(e) => onMaxChange(Number(e.target.value) || 0)}
            className="rounded-md border border-[#3f3f3f] bg-[#1a1a1a] px-3 py-2 text-sm text-[#e5e5e5] outline-none focus:border-[#6b6b6b]"
          />
        </label>
      </div>
    </div>
  );
}
