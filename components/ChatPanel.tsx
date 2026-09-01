"use client";

import { useEffect, useRef, useState } from "react";
import { openrouterRequest } from "@/app/api/llm/actions";
import ModelOptionDropdown, {
  DEFAULT_MODEL,
  type ModelId,
} from "@/components/ModelOptionDropdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatPanelProps = {
  imageFile?: File | null;
};

const VLM_SYSTEM_PROMPT =
  "You are a helpful personal tour guide. Describe what you see in images clearly and offer useful context such as history, reviews, or practical tips when relevant.";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatPanel({ imageFile = null }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending) return;

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
      const response = await openrouterRequest({
        query: trimmed,
        model,
        useWebSearch: false,
        appendQuerySuffix: false,
        systemPrompt: VLM_SYSTEM_PROMPT,
        imageUrl,
        reasoning: false,
      });

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response || "No response.",
        },
      ]);
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
      <div className="border-b border-[#3f3f3f] px-4 py-3">
        <h2 className="text-sm font-medium text-[#e5e5e5]">Chat</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">
            Ask about the image — history, reviews, what you are looking at, and
            more.
          </p>
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
              {message.content}
            </div>
          ))
        )}
        {sending && (
          <div className="mr-8 rounded-xl bg-[#1a1a1a] px-3 py-2 text-sm text-[#8a8a8a]">
            Thinking…
          </div>
        )}
        {error && (
          <p className="text-sm text-[#ff8a8a]">{error}</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#3f3f3f] p-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this image…"
          rows={3}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#e5e5e5] placeholder:text-[#8a8a8a] outline-none"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <ModelOptionDropdown value={model} onChange={setModel} />
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
