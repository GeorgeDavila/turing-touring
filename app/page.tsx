"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { openrouterRequestJson } from "@/app/api/llm/actions";
import {
  DEFAULT_MODEL,
  type ModelId,
} from "@/components/ModelOptionDropdown";
import CategoryOptions, {
  type Category,
} from "@/components/CategoryOptions";
import DateCalendar, {
  dateForPreset,
  startOfDay,
  type DatePreset,
} from "@/components/DateCalendar";
import TimeSelectionPanel, {
  DEFAULT_TIME_SELECTION,
  type TimeSelection,
} from "@/components/TimeSelectionPanel";
import PriceRangePanel, {
  DEFAULT_PRICE_MAX,
  DEFAULT_PRICE_MIN,
} from "@/components/PriceRangePanel";
import LocationButton from "@/components/LocationButton";
import { useUserLocation } from "@/hooks/useUserLocation";

const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  ssr: false,
  loading: () => <p>Loading Map...</p>,
});

const TYPE_FALLBACK: Record<Category, string> = {
  Events: "events",
  Networking: "networking events",
  Classes: "classes",
  Tourist: "tourist attractions",
  Nightlife: "nightlife spots",
} as const;

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
  datePreset: DatePreset | null,
  time: TimeSelection,
  priceMin: number,
  priceMax: number,
) {
  const type = subOption || TYPE_FALLBACK[category];
  const timeLabel = time === "any" ? "any time" : time;
  const dateLabel = datePreset ?? formatDateKey(date);
  return `Give me a link to ${type} near ${address} or neighboring areas. Date: ${dateLabel}. Time: ${timeLabel}. Price: $${priceMin} - $${priceMax}.`;
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
  const { location, address, coords, locating, refreshLocation } =
    useUserLocation();
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
  const [sentQuery, setSentQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [datePreset, setDatePreset] = useState<DatePreset | null>("today");
  const [timeSelection, setTimeSelection] = useState<TimeSelection>(
    DEFAULT_TIME_SELECTION,
  );
  const [priceMin, setPriceMin] = useState(DEFAULT_PRICE_MIN);
  const [priceMax, setPriceMax] = useState(DEFAULT_PRICE_MAX);

  useEffect(() => {
    if (!address) return;
    setValue(
      buildDefaultQuery(
        address,
        category,
        subOption,
        selectedDate,
        datePreset,
        timeSelection,
        priceMin,
        priceMax,
      ),
    );
  }, [
    address,
    category,
    subOption,
    selectedDate,
    datePreset,
    timeSelection,
    priceMin,
    priceMax,
  ]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    const query = [
      trimmed,
      `Category: ${category}`,
      subOption ? `Type: ${subOption}` : null,
      address ? `Address: ${address}` : null,
      location ? `City: ${location}` : null,
      `Date: ${datePreset ?? formatDateKey(selectedDate)}`,
      `Time: ${timeSelection}`,
      `Price: $${priceMin} - $${priceMax}`,
    ]
      .filter(Boolean)
      .join("\n");

    setSending(true);
    setSentQuery(query);
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

  function handleCategoryClick(nextCategory: Category) {
    setCategory(nextCategory);
    setSubOption("");
  }

  function handleSelectDate(date: Date) {
    setDatePreset(null);
    setSelectedDate(date);
  }

  function handleSelectPreset(preset: DatePreset) {
    setDatePreset(preset);
    setSelectedDate(dateForPreset(preset));
  }

  // Model controls retained for later reuse.
  void setModel;
  void setMaxTokens;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-[#1a1a1a] px-4 py-12">
      <h1 className="font-sans text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        Turing Touring
      </h1>

      <LocationButton
        location={location}
        locating={locating}
        onClick={refreshLocation}
      />

      <div className="flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4 text-sm text-[#e5e5e5]">
            <h2 className="mb-3 text-sm font-medium tracking-wide text-[#a3a3a3] uppercase">
              Your selections
            </h2>
            <dl className="space-y-2">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Category</dt>
                <dd>{category}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Type</dt>
                <dd>{subOption || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Date</dt>
                <dd className="capitalize">
                  {datePreset ??
                    selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Time</dt>
                <dd className="capitalize">{timeSelection}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Location</dt>
                <dd>{location || "—"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-[#8a8a8a]">Price</dt>
                <dd>
                  ${priceMin} – ${priceMax}
                </dd>
              </div>
            </dl>
          </div>

          <CategoryOptions
            category={category}
            subOption={subOption}
            onCategoryClick={handleCategoryClick}
            onSubOptionClick={handleSubOptionClick}
          />

          <PriceRangePanel
            min={priceMin}
            max={priceMax}
            onMinChange={setPriceMin}
            onMaxChange={setPriceMax}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <DateCalendar
            selectedDate={selectedDate}
            datePreset={datePreset}
            onSelectDate={handleSelectDate}
            onSelectPreset={handleSelectPreset}
          />

          <TimeSelectionPanel
            value={timeSelection}
            onChange={setTimeSelection}
          />
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

      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !value.trim()}
        className="w-full max-w-6xl rounded-xl bg-[#e5e5e5] px-4 py-3 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? "Searching…" : "Search"}
      </button>

      {sentQuery && (
        <pre className="w-full max-w-6xl whitespace-pre-wrap font-sans text-sm text-[#a3a3a3]">
          {sentQuery}
        </pre>
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
