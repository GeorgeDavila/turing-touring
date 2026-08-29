"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getAddressSimple, getCity } from "@/app/api/geo/actions";
import { openrouterRequestJson } from "@/app/api/llm/actions";
import {
  DEFAULT_MODEL,
  type ModelId,
} from "@/components/ModelOptionDropdown";

const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  ssr: false,
  loading: () => <p>Loading Map...</p>,
});

const CATEGORIES = ["Events", "Classes", "Tourist", "Nightlife"] as const;
type Category = (typeof CATEGORIES)[number];

const SUB_OPTIONS: Record<Category, string[]> = {
  Events: ["Music Events", "Concerts", "Festivals", "Sports Events", "Theater Events"],
  Classes: ["Cooking Classes", "Yoga Classes", "Language Classes", "Pottery Classes", "Art Classes"],
  Tourist: ["Museums", "Landmarks", "Walking Tours", "Viewpoints", "Shopping Centers", "Parks", "Beaches", "Hiking Trails", "Historical Sites", "Art Galleries"],
  Nightlife: ["Bars", "Clubs", "Live Music", "Late-Night Eats", "Dance Clubs", "Nightclubs", "Pubs", "Breweries", "Wine Bars", "Speakeasies"],
};

const TYPE_FALLBACK: Record<Category, string> = {
  Events: "events",
  Classes: "classes",
  Tourist: "tourist attractions",
  Nightlife: "nightlife spots",
};

const TIME_PRESETS = ["any", "morning", "afternoon", "evening"] as const;
type TimePreset = (typeof TIME_PRESETS)[number];

const TIME_INTERVALS = [
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

type TimeSelection = TimePreset | (typeof TIME_INTERVALS)[number];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDefaultQuery(
  address: string,
  category: Category,
  subOption: string,
  date: Date,
  time: TimeSelection,
) {
  const type = subOption || TYPE_FALLBACK[category];
  const timeLabel = time === "any" ? "any time" : time;
  return `Give me a link to ${type} near ${address} or neighboring areas. Date: ${formatDateKey(date)}. Time: ${timeLabel}. Price: $0 - $50.`;
}

function normalizeGoogleMapsUrl(link: string | null) {
  if (!link) return null;
  return link.startsWith("http") ? link : `https://${link}`;
}

function extractGoogleMapsDestination(googleMapsLink: string | null) {
  if (!googleMapsLink) return null;
  const link = normalizeGoogleMapsUrl(googleMapsLink);

  try {
    if (!link) return null;
    const url = new URL(link);
    const placeMatch = url.pathname.match(/\/place\/([^/@]+)/);
    if (placeMatch?.[1]) {
      const destination = decodeURIComponent(placeMatch[1]);
      return destination.endsWith("/") ? destination : `${destination}/`;
    }

    const q = url.searchParams.get("q");
    if (q) {
      const destination = q.trim().replace(/\s+/g, "+");
      return destination.endsWith("/") ? destination : `${destination}/`;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && !["maps", "dir", "place", "search"].includes(last)) {
      const destination = decodeURIComponent(last);
      return destination.endsWith("/") ? destination : `${destination}/`;
    }
  } catch {
    // Fall through for non-URL destination strings.
  }

  const destination = googleMapsLink.trim();
  return destination.endsWith("/") ? destination : `${destination}/`;
}

function buildDirectionsLink(
  coords: [number, number],
  googleMapsLink: string,
) {
  const [longitude, latitude] = coords;
  const destination = extractGoogleMapsDestination(googleMapsLink);
  return `https://www.google.com/maps/dir/${latitude},${longitude}/${destination}`;
}

function startOfDay(date: Date) {
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

function toDestinationCoords(location: {
  latitude: number;
  longitude: number;
}): [number, number] | null {
  if (location.latitude === 0 && location.longitude === 0) return null;
  return [location.longitude, location.latitude];
}

export default function Home() {
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<Category>("Events");
  const [subOption, setSubOption] = useState("");
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{
    link: string | null;
    time: string | null;
    price: number | null;
    description: string | null;
    google_maps_link: string | null;
    location: { latitude: number; longitude: number } | null;
  } | null>(null);
  const [responseError, setResponseError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [viewMonth, setViewMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [timeSelection, setTimeSelection] = useState<TimeSelection>("any");
  const today = startOfDay(new Date());
  const calendarDays = getCalendarDays(viewMonth);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation("Location unavailable");
      setAddress("");
      setCoords(null);
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoords([longitude, latitude]);
          const [city, addressResult] = await Promise.all([
            getCity(latitude, longitude),
            getAddressSimple(latitude, longitude),
          ]);
          setLocation(city);
          setAddress(addressResult);
        } catch {
          setLocation("Unknown place");
          setAddress("");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocation("Location denied");
        setAddress("");
        setCoords(null);
        setLocating(false);
      },
    );
  }, []);

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  useEffect(() => {
    if (!address) return;
    setValue(
      buildDefaultQuery(
        address,
        category,
        subOption,
        selectedDate,
        timeSelection,
      ),
    );
  }, [address, category, subOption, selectedDate, timeSelection]);

  // Kept for later reuse with the category buttons.
  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    const query = [
      trimmed,
      `Category: ${category}`,
      subOption ? `Type: ${subOption}` : null,
      address ? `Address: ${address}` : null,
      location ? `City: ${location}` : null,
      `Date: ${formatDateKey(selectedDate)}`,
      `Time: ${timeSelection}`,
    ]
      .filter(Boolean)
      .join("\n");

    setSending(true);
    setResponse(null);
    setResponseError("");

    try {
      const result = await openrouterRequestJson({
        query,
        model,
        maxTokens,
      });
      setResponse(result);
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  function handleSubOptionClick(nextCategory: Category, nextSubOption: string) {
    setCategory(nextCategory);
    setSubOption(nextSubOption);
  }

  function shiftMonth(delta: number) {
    setViewMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }

  // Avoid unused-variable warnings while query logic is retained for later.
  void handleSend;
  void setModel;
  void setMaxTokens;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-[#1a1a1a] px-4 py-12">
      <h1 className="font-sans text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        Turing Touring
      </h1>

      <button
        className="rounded-md bg-[#3a3a3a] px-4 py-2 text-sm text-[#e5e5e5] transition-colors hover:bg-[#454545] disabled:opacity-60"
        type="button"
        disabled={locating}
        onClick={handleGetLocation}
      >
        {locating
          ? "🌎 Locating… 🌍"
          : location
            ? `🌎 ${location} 🌍`
            : "🌎 Get Location 🌍"}
      </button>

      <div className="flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {CATEGORIES.map((cat) => (
            <section key={cat} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium tracking-wide text-[#a3a3a3] uppercase">
                {cat}
              </h2>
              <div className="flex flex-wrap gap-2">
                {SUB_OPTIONS[cat].map((option) => {
                  const selected = category === cat && subOption === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSubOptionClick(cat, option)}
                      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                        selected
                          ? "bg-[#e5e5e5] text-[#1a1a1a]"
                          : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
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
                <div
                  key={day}
                  className="py-1 text-center text-xs text-[#8a8a8a]"
                >
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
                    onClick={() => setSelectedDate(startOfDay(date))}
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

          <div className="rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4">
            <h3 className="mb-3 text-sm font-medium text-[#e5e5e5]">Time</h3>

            <div className="mb-4 flex flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTimeSelection(preset)}
                  className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
                    timeSelection === preset
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
                  onClick={() => setTimeSelection(interval)}
                  className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
                    timeSelection === interval
                      ? "bg-[#e5e5e5] text-[#1a1a1a]"
                      : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {(response || responseError) && (
        <div className="w-full max-w-6xl rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4 text-sm leading-relaxed text-[#e5e5e5]">
          {responseError ? (
            responseError
          ) : response ? (
            <div className="space-y-1">
              <p>
                Link:{" "}
                {response.link ? (
                  <a
                    href={
                      response.link.startsWith("http")
                        ? response.link
                        : `https://${response.link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7eb6ff] underline underline-offset-2 hover:text-[#a8cdff]"
                  >
                    {response.link}
                  </a>
                ) : (
                  "Not found"
                )}
              </p>
              <p>Time: {response.time || "—"}</p>
              <p>Price: {response.price}</p>
              <p>Description: {response.description || "—"}</p>
              <p>
                Location:{" "}
                {response.google_maps_link ? (
                  <a
                    href={
                      response.google_maps_link.startsWith("http")
                        ? response.google_maps_link
                        : `https://${response.google_maps_link}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7eb6ff] underline underline-offset-2 hover:text-[#a8cdff]"
                  >
                    {response.google_maps_link}
                  </a>
                ) : (
                  "—"
                )}
              </p>
              <p>
                Location Coordinates: {response.location?.latitude},{" "}
                {response.location?.longitude}
              </p>
              {response.google_maps_link && coords && (
                <a
                  href={buildDirectionsLink(coords, response.google_maps_link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#3a3a3a] px-3 py-1.5 text-sm text-[#e5e5e5] transition-colors hover:bg-[#454545]"
                >
                  Directions →
                </a>
              )}
            </div>
          ) : null}
        </div>
      )}

      {coords && (
        <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-[#3f3f3f]">
          <MapComponent
            coords={coords}
            destinationCoords={
              response?.location ? toDestinationCoords(response.location) : null
            }
          />
        </div>
      )}
    </div>
  );
}
