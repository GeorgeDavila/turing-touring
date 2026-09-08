"use client";

import { useState } from "react";
import CameraUploadInput from "@/components/CameraUploadInput";
import ChatPanel from "@/components/ChatPanel";
import LocationButton from "@/components/LocationButton";
import NeighborhoodHistoryGuide from "@/components/NeighborhoodHistoryGuide";
import { useUserLocation } from "@/hooks/useUserLocation";

const TALKING_TOUR_SYSTEM_PROMPT =
  "You are a spoken personal tour guide. Keep answers clear and conversational so they sound natural when read aloud. Use the user's location to personalize history, landmarks, tips, and recommendations.";

export default function TalkingTourPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [neighborhoodHistoryEnabled, setNeighborhoodHistoryEnabled] =
    useState(false);
  const { location, address, coords, locating, refreshLocation } =
    useUserLocation();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-[#1a1a1a] px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        Talking Tour
      </h1>
      <p className="max-w-md text-center text-[#a3a3a3]">
        Talk to a tour guide about your interests and location. Replies are read
        aloud with the{" "}
        <a
          href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7eb6ff] underline underline-offset-2 hover:text-[#a8cdff]"
        >
          Web Speech API
        </a>
        .
      </p>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#d4d4d4]">
        <input
          type="checkbox"
          checked={neighborhoodHistoryEnabled}
          onChange={(event) =>
            setNeighborhoodHistoryEnabled(event.target.checked)
          }
          className="h-4 w-4 accent-[#e5e5e5]"
        />
        Occasionally narrate neighborhood history as I move
      </label>

      <LocationButton
        location={location}
        locating={locating}
        onClick={refreshLocation}
      />

      <NeighborhoodHistoryGuide enabled={neighborhoodHistoryEnabled} />

      <div className="flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col">
          <CameraUploadInput
            onImageChange={(file) => setImageFile(file)}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col lg:w-96">
          <ChatPanel
            imageFile={imageFile}
            enableSpeech
            systemPrompt={TALKING_TOUR_SYSTEM_PROMPT}
            emptyHint="Ask out loud or type — your guide will answer and speak back."
            placeholder="Ask your tour guide…"
            location={location}
            address={address}
            coords={coords}
          />
        </aside>
      </div>
    </div>
  );
}
