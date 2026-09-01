"use client";

import { useState } from "react";
import CameraUploadInput from "@/components/CameraUploadInput";
import ChatPanel from "@/components/ChatPanel";
import LocationButton from "@/components/LocationButton";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function VlmPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { location, locating, refreshLocation } = useUserLocation();

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-[#1a1a1a] px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        VLM
      </h1>
      <p className="max-w-md text-center text-[#a3a3a3]">
        Capture or upload an image for vision language model analysis. It uses your location to provide context to the model.
      </p>

      <LocationButton
        location={location}
        locating={locating}
        onClick={refreshLocation}
      />

      <div className="flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col">
          <CameraUploadInput
            onImageChange={(file) => setImageFile(file)}
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col lg:w-96">
          <ChatPanel imageFile={imageFile} />
        </aside>
      </div>
    </div>
  );
}
