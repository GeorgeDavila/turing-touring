"use client";

import CameraUploadInput from "@/components/CameraUploadInput";

export default function VlmPage() {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-[#1a1a1a] px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight text-[#e5e5e5] sm:text-5xl">
        VLM
      </h1>
      <p className="max-w-md text-center text-[#a3a3a3]">
        Capture or upload an image for vision language model analysis.
      </p>
      <CameraUploadInput />
    </div>
  );
}
