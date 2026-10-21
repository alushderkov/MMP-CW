"use client";

import { useEffect, useState } from "react";
import { speechLang } from "@/lib/catalog";

type Props = { text: string; language: string; label?: string };

export default function SpeakButton({ text, language, label }: Props) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  function speak() {
    const phrase = text.trim();
    if (!supported || !phrase) {
      return;
    }
    const synth = window.speechSynthesis;
    const lang = speechLang(language);
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = lang;
    utterance.rate = 0.9;
    const prefix = lang.slice(0, 2).toLowerCase();
    const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(prefix));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    setSpeaking(true);
    synth.speak(utterance);
  }

  const title = supported ? label || "Озвучить" : "Браузер не поддерживает озвучивание";

  return (
    <button
      className={speaking ? "icon-btn speak active" : "icon-btn speak"}
      type="button"
      onClick={speak}
      disabled={!supported || !text.trim()}
      title={title}
      aria-label={title}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
