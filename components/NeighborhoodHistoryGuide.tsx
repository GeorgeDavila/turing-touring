"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserLocation } from "@/app/api/geo/actions";
import { openrouterRequest } from "@/app/api/llm/actions";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

const POLL_INTERVAL_MS = 3 * 60 * 1000;

const NEIGHBORHOOD_SYSTEM_PROMPT =
  "You are a spoken neighborhood tour guide. Give a short, engaging history of the specific neighborhood or area the user is in. Keep it to 2-4 spoken sentences. Focus on local history, notable places, and interesting facts. Do not use bullet points or markdown.";

type NeighborhoodHistoryGuideProps = {
  enabled: boolean;
};

function neighborhoodKey(city: string, address: string) {
  return `${city}|${address}`.toLowerCase();
}

export default function NeighborhoodHistoryGuide({
  enabled,
}: NeighborhoodHistoryGuideProps) {
  const [status, setStatus] = useState("");
  const [narration, setNarration] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lastKeyRef = useRef("");
  const inFlightRef = useRef(false);
  const { speak, supported: ttsSupported } = useSpeechSynthesis();

  const runCheck = useCallback(async () => {
    if (!enabled || inFlightRef.current) return;
    if (!navigator.geolocation) {
      setError("Location unavailable");
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    setError("");
    setStatus("Checking your neighborhood…");

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 60_000,
          });
        },
      );

      const { latitude, longitude } = position.coords;
      const { city, address } = await getUserLocation(latitude, longitude);
      const key = neighborhoodKey(city, address);

      if (key && key === lastKeyRef.current) {
        setStatus(`Still near ${city || "this area"} — waiting for a move.`);
        return;
      }

      setStatus(`Looking up history for ${city || "this neighborhood"}…`);

      const query = [
        "Tell me the history of the neighborhood I am in right now.",
        address ? `Address: ${address}` : null,
        city ? `City / area: ${city}` : null,
        `Coordinates: ${latitude}, ${longitude}`,
        "Keep the answer short enough to read aloud.",
      ]
        .filter(Boolean)
        .join("\n");

      const response = await openrouterRequest({
        query,
        useWebSearch: true,
        appendQuerySuffix: false,
        systemPrompt: NEIGHBORHOOD_SYSTEM_PROMPT,
        reasoning: false,
        maxTokens: 800,
      });

      const text = response.trim() || "I could not find neighborhood history here.";
      lastKeyRef.current = key;
      setNarration(text);
      setStatus(`Neighborhood guide · ${city || "nearby"}`);
      if (ttsSupported) speak(text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Neighborhood guide failed",
      );
      setStatus("");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled, speak, ttsSupported]);

  useEffect(() => {
    if (!enabled) {
      lastKeyRef.current = "";
      setStatus("");
      setError("");
      return;
    }

    void runCheck();
    const id = window.setInterval(() => {
      void runCheck();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [enabled, runCheck]);

  if (!enabled) return null;

  return (
    <div className="w-full max-w-6xl rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4 text-sm text-[#e5e5e5]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium tracking-wide text-[#a3a3a3] uppercase">
          Neighborhood history
        </h2>
        {loading && <span className="text-xs text-[#8a8a8a]">Updating…</span>}
      </div>
      {status && <p className="mb-2 text-xs text-[#8a8a8a]">{status}</p>}
      {error && <p className="mb-2 text-sm text-[#ff8a8a]">{error}</p>}
      {narration ? (
        <p className="leading-relaxed text-[#d4d4d4]">{narration}</p>
      ) : (
        !error && (
          <p className="text-[#8a8a8a]">
            Waiting for location to share a bit of local history…
          </p>
        )
      )}
    </div>
  );
}
