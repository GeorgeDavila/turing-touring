"use client";

import { useEffect, useRef, useState } from "react";

const CATEGORIES = ["Events", "Classes", "Tourist", "Nightlife"] as const;
type Category = (typeof CATEGORIES)[number];

const SUB_OPTIONS: Record<Category, string[]> = {
  Events: ["Concerts", "Festivals", "Sports", "Theater"],
  Classes: ["Cooking", "Yoga", "Language", "Pottery"],
  Tourist: ["Museums", "Landmarks", "Walking Tours", "Viewpoints"],
  Nightlife: ["Bars", "Clubs", "Live Music", "Late-Night Eats"],
};

export default function Home() {
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<Category>("Events");
  const [subOption, setSubOption] = useState(SUB_OPTIONS.Events[0]);

  function handleCategoryChange(next: Category) {
    setCategory(next);
    setSubOption(SUB_OPTIONS[next][0]);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#1a1a1a] px-4">
      <h1 className="font-sans text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        Turing Touring
      </h1>
      <div className="w-full max-w-3xl rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4 shadow-lg">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you want to do?"
          rows={3}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#e5e5e5] placeholder:text-[#8a8a8a] outline-none"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dropdown
              value={category}
              options={CATEGORIES}
              onChange={handleCategoryChange}
              variant="pill"
            />
            <Dropdown
              value={subOption}
              options={SUB_OPTIONS[category]}
              onChange={setSubOption}
              variant="text"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Attach file"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] transition-colors hover:bg-[#3a3a3a] hover:text-[#d4d4d4]"
            >
              <PaperclipIcon />
            </button>
            <button
              type="button"
              aria-label="Send"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-[#a3a3a3] transition-colors hover:bg-[#454545] hover:text-[#d4d4d4]"
            >
              <EnterIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dropdown<T extends string>({
  value,
  options,
  onChange,
  variant,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  variant: "pill" | "text";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className={
          variant === "pill"
            ? "inline-flex items-center gap-1.5 rounded-full bg-[#3a3a3a] px-3 py-1.5 text-sm text-[#d4d4d4] transition-colors hover:bg-[#454545]"
            : "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-sm text-[#a3a3a3] transition-colors hover:bg-[#3a3a3a] hover:text-[#d4d4d4]"
        }
      >
        {variant === "pill" && (
          <span className="text-base leading-none" aria-hidden>
            ∞
          </span>
        )}
        <span>{value}</span>
        <ChevronDown />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 z-10 mb-2 min-w-full overflow-hidden rounded-xl border border-[#3f3f3f] bg-[#2b2b2b] py-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full whitespace-nowrap px-3 py-2 text-left text-sm transition-colors hover:bg-[#3a3a3a] ${
                  option === value ? "text-[#e5e5e5]" : "text-[#a3a3a3]"
                }`}
              >
                {option}
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

function PaperclipIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EnterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 10l-5 5 5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 4v7a4 4 0 01-4 4H4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
