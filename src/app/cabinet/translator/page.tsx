"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import SpeakButton from "@/components/SpeakButton";
import WordForm from "@/components/WordForm";
import { useCabinet } from "@/components/CabinetContext";
import { ALL_LANGUAGES, isNativeLanguage, isStudyLanguage, languageLabel } from "@/lib/catalog";

export default function TranslatorPage() {
  const { user } = useCabinet();
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("ru");
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (user) {
      setFrom(user.targetLanguage);
      setTo(user.nativeLanguage);
    }
  }, [user]);

  function swap() {
    setFrom(to);
    setTo(from);
    if (translation) {
      setText(translation);
      setTranslation(text);
    }
    setError("");
    setSaved("");
  }

  async function translate(event?: FormEvent) {
    event?.preventDefault();
    if (!text.trim() || from === to) {
      return;
    }
    setBusy(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, from, to }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) {
      setTranslation("");
      setError(data.error || "Перевод недоступен");
      return;
    }
    setTranslation(data.translation);
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      translate();
    }
  }

  const foreignSide = isStudyLanguage(from) && isNativeLanguage(to) ? "from" : isNativeLanguage(from) && isStudyLanguage(to) ? "to" : "";
  const preset =
    foreignSide === "from"
      ? { term: text.trim(), translation, language: from }
      : foreignSide === "to"
        ? { term: translation, translation: text.trim(), language: to }
        : undefined;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Переводчик</h2>
          <p className="muted">Перевод в обе стороны через сервис MyMemory. Сочетание Ctrl+Enter запускает перевод.</p>
        </div>
      </div>
      <form className="card translator" onSubmit={translate}>
        <div className="lang-bar">
          <select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Язык исходного текста">
            {ALL_LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
          <button className="icon-btn swap" type="button" onClick={swap} title="Поменять языки местами" aria-label="Поменять языки местами">
            ⇄
          </button>
          <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Язык перевода">
            {ALL_LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="translator-panes">
          <div className="pane">
            <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(""); }} onKeyDown={onKey} placeholder={`Текст на языке «${languageLabel(from)}»`} maxLength={500} autoFocus />
            <div className="pane-foot">
              <SpeakButton text={text} language={from} />
              <span className="muted small">{text.length} / 500</span>
            </div>
          </div>
          <div className="pane result-pane">
            <div className={translation ? "translation" : "translation muted"}>{busy ? "Перевод..." : translation || "Здесь появится перевод"}</div>
            <div className="pane-foot">
              <SpeakButton text={translation} language={to} />
            </div>
          </div>
        </div>
        {from === to ? <p className="error">Выберите разные языки.</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {saved ? <p className="result ok">Слово «{saved}» добавлено в словарь.</p> : null}
        <p className="nav">
          <button className="btn" type="submit" disabled={busy || !text.trim() || from === to}>
            Перевести
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setFormKey((key) => key + 1);
              setSaveOpen(true);
            }}
            disabled={!translation || !foreignSide}
            title={foreignSide ? "Открыть форму слова с заполненными полями" : "Для словаря нужна пара «изучаемый язык – родной язык»"}
          >
            В словарь
          </button>
        </p>
      </form>
      <WordForm
        key={formKey}
        open={saveOpen}
        preset={preset}
        onClose={() => setSaveOpen(false)}
        onSaved={(item) => {
          setSaveOpen(false);
          setSaved(item.term);
        }}
      />
    </div>
  );
}
