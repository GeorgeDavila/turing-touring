"use client";

import { useEffect, useRef, useState } from "react";

export const MODEL_OPTIONS = [
  {
    id: "deepseek/deepseek-v4-pro",
    label: "deepseek-v4-pro",
  },
  {
    id: "deepseek/deepseek-v4-flash-0731",
    label: "deepseek-v4-flash-0731",
  },
  {
    id: "qwen/qwen3.8-flash",
    label: "qwen3.8-flash",
  },
  {
    id: "qwen/qwen3-235b-a22b-2507",
    label: "qwen3-235b-a22b-2507",
  },
  {
    id: "google/gemini-3.7-flash",
    label: "gemini-3.7-flash",
  },
] as const;

export type ModelId = (typeof MODEL_OPTIONS)[number]["id"];

export const DEFAULT_MODEL: ModelId = "deepseek/deepseek-v4-pro";

type ModelOptionDropdownProps = {
  value: ModelId;
  onChange: (value: ModelId) => void;
};

export default function ModelOptionDropdown({
  value,
  onChange,
}: ModelOptionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected =
    MODEL_OPTIONS.find((option) => option.id === value) ?? MODEL_OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-[#a3a3a3] transition-colors hover:bg-[#3a3a3a] hover:text-[#d4d4d4]"
      >
        <span>{selected.label}</span>
        <ChevronDown />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 z-10 mb-2 min-w-full overflow-hidden rounded-xl border border-[#3f3f3f] bg-[#2b2b2b] py-1 shadow-lg"
        >
          {MODEL_OPTIONS.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`w-full whitespace-nowrap px-3 py-2 text-left text-sm transition-colors hover:bg-[#3a3a3a] ${
                  option.id === value ? "text-[#e5e5e5]" : "text-[#a3a3a3]"
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="opacity-70"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
