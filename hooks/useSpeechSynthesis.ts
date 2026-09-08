"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setError("Speech synthesis is not supported in this browser");
        return;
      }

      const trimmed = text.trim();
      if (!trimmed) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setSpeaking(true);
        setError("");
      };
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => {
        setSpeaking(false);
        setError("Could not speak this response");
      };

      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  return { supported, speaking, error, speak, stop };
}
