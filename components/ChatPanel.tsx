"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserLocation } from "@/app/api/geo/actions";
import { openrouterRequest } from "@/app/api/llm/actions";
import ModelOptionDropdown, {
  DEFAULT_MODEL,
  type ModelId,
} from "@/components/ModelOptionDropdown";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  imageFile?: File | null;
  enableSpeech?: boolean;
  systemPrompt?: string;
  emptyHint?: string;
  placeholder?: string;
  /** When provided by the parent, skips an extra geocode fetch. */
  location?: string;
  address?: string;
  coords?: [number, number] | null;
};

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful personal tour guide. Describe what you see in images clearly and offer useful context such as history, reviews, or practical tips when relevant.";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildLocationSuffix(
  city: string,
  address: string,
  coords: [number, number] | null,
) {
  const [longitude, latitude] = coords ?? [null, null];
  return [
    address ? `Address: ${address}` : null,
    city ? `City: ${city}` : null,
    latitude != null && longitude != null
      ? `Coordinates: ${latitude}, ${longitude}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ChatPanel({
  imageFile = null,
  enableSpeech = false,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  emptyHint = "Ask about the image — history, reviews, what you are looking at, and more.",
  placeholder = "Ask about this image…",
  location: locationProp,
  address: addressProp,
  coords: coordsProp,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(locationProp ?? "");
  const [address, setAddress] = useState(addressProp ?? "");
  const [coords, setCoords] = useState<[number, number] | null>(
    coordsProp ?? null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasExternalLocation =
    locationProp !== undefined ||
    addressProp !== undefined ||
    coordsProp !== undefined;

  const {
    supported: ttsSupported,
    speaking,
    error: ttsError,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  const handleFinalTranscript = useCallback((transcript: string) => {
    setValue((current) =>
      current.trim() ? `${current.trim()} ${transcript}` : transcript,
    );
  }, []);

  const {
    supported: sttSupported,
    listening,
    error: sttError,
    toggle: toggleListening,
    stop: stopListening,
  } = useSpeechRecognition({
    onFinalTranscript: enableSpeech ? handleFinalTranscript : undefined,
  });

  useEffect(() => {
    if (locationProp !== undefined) setLocation(locationProp);
  }, [locationProp]);

  useEffect(() => {
    if (addressProp !== undefined) setAddress(addressProp);
  }, [addressProp]);

  useEffect(() => {
    if (coordsProp !== undefined) setCoords(coordsProp);
  }, [coordsProp]);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation("Location unavailable");
      setAddress("");
      setCoords(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setCoords([longitude, latitude]);
          const result = await getUserLocation(latitude, longitude);
          setLocation(result.city);
          setAddress(result.address);
        } catch {
          setLocation("Unknown place");
          setAddress("");
        }
      },
      () => {
        setLocation("Location denied");
        setAddress("");
        setCoords(null);
      },
    );
  }, []);

  useEffect(() => {
    if (hasExternalLocation) return;
    handleGetLocation();
  }, [hasExternalLocation, handleGetLocation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

    if (enableSpeech) {
      stopListening();
      stopSpeaking();
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setValue("");
    setSending(true);
    setError("");

    try {
      const imageUrl = imageFile ? await fileToDataUrl(imageFile) : null;
      const locationSuffix = buildLocationSuffix(location, address, coords);
      const query = [trimmed, locationSuffix].filter(Boolean).join("\n");
      const response = await openrouterRequest({
        query,
        model,
        useWebSearch: false,
        appendQuerySuffix: false,
        systemPrompt,
        imageUrl,
        reasoning: false,
      });

      const assistantText = response || "No response.";
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantText,
        },
      ]);

      if (enableSpeech && ttsSupported) {
        speak(assistantText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-[min(720px,calc(100vh-12rem))] w-full flex-col rounded-2xl border border-[#3f3f3f] bg-[#2b2b2b]">
      <div className="flex items-center justify-between gap-3 border-b border-[#3f3f3f] px-4 py-3">
        <h2 className="text-sm font-medium text-[#e5e5e5]">Chat</h2>
        {enableSpeech && (
          <div className="flex items-center gap-2">
            {speaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="rounded-full bg-[#3a3a3a] px-3 py-1 text-xs text-[#d4d4d4] transition-colors hover:bg-[#454545]"
              >
                Stop voice
              </button>
            )}
            <span className="text-xs text-[#8a8a8a]">
              {ttsSupported ? "TTS on" : "TTS unavailable"}
              {" · "}
              {sttSupported ? "Mic ready" : "Mic unavailable"}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">{emptyHint}</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-8 bg-[#3a3a3a] text-[#e5e5e5]"
                  : "mr-8 bg-[#1a1a1a] text-[#d4d4d4]"
              }`}
            >
              <p>{message.content}</p>
              {enableSpeech &&
                message.role === "assistant" &&
                ttsSupported && (
                  <button
                    type="button"
                    onClick={() => speak(message.content)}
                    className="mt-2 text-xs text-[#a3a3a3] transition-colors hover:text-[#e5e5e5]"
                  >
                    Speak again
                  </button>
                )}
            </div>
          ))
        )}
        {sending && (
          <div className="mr-8 rounded-xl bg-[#1a1a1a] px-3 py-2 text-sm text-[#8a8a8a]">
            Thinking…
          </div>
        )}
        {(error || (enableSpeech && (ttsError || sttError))) && (
          <p className="text-sm text-[#ff8a8a]">
            {error || ttsError || sttError}
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#3f3f3f] p-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            enableSpeech && listening ? "Listening…" : placeholder
          }
          rows={3}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#e5e5e5] placeholder:text-[#8a8a8a] outline-none"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <ModelOptionDropdown value={model} onChange={setModel} />
          <div className="flex items-center gap-1.5">
            {enableSpeech && sttSupported && (
              <button
                type="button"
                aria-label={listening ? "Stop listening" : "Start voice input"}
                aria-pressed={listening}
                onClick={toggleListening}
                disabled={sending}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
                  listening
                    ? "bg-[#e5e5e5] text-[#1a1a1a]"
                    : "bg-[#3a3a3a] text-[#a3a3a3] hover:bg-[#454545] hover:text-[#d4d4d4]"
                }`}
              >
                <MicIcon />
              </button>
            )}
            <button
              type="button"
              aria-label={sending ? "Sending" : "Send"}
              disabled={sending || !value.trim()}
              onClick={() => void handleSend()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5e5e5] text-[#1a1a1a] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <SpinnerIcon /> : <EnterIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 10v1a7 7 0 01-14 0v-1M12 19v4M8 23h8"
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
