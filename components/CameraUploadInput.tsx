"use client";

import { useEffect, useRef, useState } from "react";

type InputMode = "camera" | "upload";

type CameraUploadInputProps = {
  onImageChange?: (file: File | null, previewUrl: string | null) => void;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function CameraUploadInput({
  onImageChange,
}: CameraUploadInputProps) {
  const [mode, setMode] = useState<InputMode>("camera");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  function setPreview(file: File | null, url: string | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setPreviewUrl(url);
    onImageChange?.(file, url);
  }

  useEffect(() => {
    if (mode !== "camera" || previewUrl) return;

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported in this browser");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError("");
      } catch {
        setCameraError("Camera access denied or unavailable");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [mode, previewUrl]);

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        stopStream(streamRef.current);
        streamRef.current = null;
        setPreview(file, url);
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(file, url);
    event.target.value = "";
  }

  function clearImage() {
    setPreview(null, null);
    setCameraError("");
  }

  function switchMode(next: InputMode) {
    if (next === mode) return;
    stopStream(streamRef.current);
    streamRef.current = null;
    setPreview(null, null);
    setCameraError("");
    setMode(next);
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b] p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {(["camera", "upload"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => switchMode(option)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
              mode === option
                ? "bg-[#e5e5e5] text-[#1a1a1a]"
                : "bg-[#3a3a3a] text-[#d4d4d4] hover:bg-[#454545]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#1a1a1a]">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Selected"
            className="h-full w-full object-contain"
          />
        ) : mode === "camera" ? (
          <>
            {cameraError ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#a3a3a3]">
                {cameraError}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[#a3a3a3] transition-colors hover:bg-[#252525] hover:text-[#e5e5e5]"
          >
            <span className="text-3xl">+</span>
            <span>Choose an image</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {previewUrl ? (
          <button
            type="button"
            onClick={clearImage}
            className="rounded-md bg-[#3a3a3a] px-4 py-2 text-sm text-[#e5e5e5] transition-colors hover:bg-[#454545]"
          >
            {mode === "camera" ? "Retake" : "Choose another"}
          </button>
        ) : mode === "camera" ? (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={Boolean(cameraError)}
            className="rounded-md bg-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Capture
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-white"
          >
            Upload image
          </button>
        )}
      </div>
    </div>
  );
}
