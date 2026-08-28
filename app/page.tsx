"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAddressSimple, getCity } from "@/app/api/geo/actions";
import { openrouterRequestJson } from "@/app/api/llm/actions";

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

function buildDefaultQuery(
  address: string,
  category: Category,
  subOption: string,
) {
  const type = subOption || TYPE_FALLBACK[category];
  return `Give me a link to ${type} near ${address} or neighboring areas. Date: this weekend. Time: morning. Price: $0 - $50.`;
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
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<{
    link: string | null;
    date: string | null;
    time: string | null;
    price: number | null;
    description: string | null;
    google_maps_link: string | null;
    location: { latitude: number, longitude: number } | null;
  } | null>(null);
  const [responseError, setResponseError] = useState("");

  function handleCategoryChange(next: Category) {
    setCategory(next);
    setSubOption("");
  }

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
    setValue(buildDefaultQuery(address, category, subOption));
  }, [address, category, subOption]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    const query = [
      trimmed,
      `Category: ${category}`,
      subOption ? `Type: ${subOption}` : null,
      address ? `Address: ${address}` : null,
      location ? `City: ${location}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setSending(true);
    setResponse(null);
    setResponseError("");

    try {
      const result = await openrouterRequestJson({ query });
      setResponse(result);
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#1a1a1a] px-4 py-12">
      <h1 className="font-sans text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        Turing Touring
      </h1>

      {/* geolocation button to get the user's location */}
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
      <div className="w-full max-w-3xl rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4 shadow-lg">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you want to do?"
          autoFocus
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
              aria-label={sending ? "Sending" : "Send"}
              disabled={sending || !value.trim()}
              onClick={handleSend}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3a3a3a] text-[#a3a3a3] transition-colors hover:bg-[#454545] hover:text-[#d4d4d4] disabled:opacity-60"
            >
              {sending ? <SpinnerIcon /> : <EnterIcon />}
            </button>
          </div>
        </div>
      </div>

      {(response || responseError) && (
        <div className="w-full max-w-3xl rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4 text-sm leading-relaxed text-[#e5e5e5]">
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
              <p>Date: {response.date || "—"}</p>
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
              <p>Location Coordinates: {response.location?.latitude}, {response.location?.longitude}</p>
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
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#3f3f3f]">
          <MapComponent
            coords={coords}
            destinationCoords={
              response?.location ? toDestinationCoords(response.location!) : null
            }
          />
        </div>
      )}
    </div>
  );
}

function Dropdown<T extends string>({
  value,
  options,
  onChange,
  variant,
  placeholder = "",
}: {
  value: T | "";
  options: readonly T[];
  onChange: (value: T) => void;
  variant: "pill" | "text";
  placeholder?: string;
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
        <span className={!value ? "text-[#8a8a8a]" : undefined}>
          {value || placeholder}
        </span>
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

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        d="M12 3a9 9 0 019 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

