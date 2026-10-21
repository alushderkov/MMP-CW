"use client";

import { FormEvent, useEffect, useState } from "react";
import Modal from "./Modal";
import SpeakButton from "./SpeakButton";
import TagPicker from "./TagPicker";
import { useCabinet } from "./CabinetContext";
import { PARTS_OF_SPEECH, STUDY_LANGUAGES, languageLabel, normalizePartOfSpeech } from "@/lib/catalog";

export type Word = {
  id: string;
  term: string;
  translation: string;
  transcription: string;
  language: string;
  partOfSpeech: string;
  example: string;
  tags: string[];
  mastery: number;
  notes: string;
};

type Draft = Omit<Word, "id">;

type Props = {
  open: boolean;
  word?: Word | null;
  preset?: Partial<Draft>;
  onClose: () => void;
  onSaved: (item: Word) => void;
};

function toDraft(word: Partial<Draft> | null | undefined, language: string): Draft {
  return {
    term: word?.term || "",
    translation: word?.translation || "",
    transcription: word?.transcription || "",
    language: word?.language || language,
    partOfSpeech: normalizePartOfSpeech(word?.partOfSpeech) || "",
    example: word?.example || "",
    tags: word?.tags || [],
    mastery: word?.mastery ?? 0,
    notes: word?.notes || "",
  };
}

export default function WordForm({ open, word, preset, onClose, onSaved }: Props) {
  const { user } = useCabinet();
  const native = user?.nativeLanguage || "ru";
  const [form, setForm] = useState<Draft>(() => toDraft(word || preset, user?.targetLanguage || "en"));
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [translating, setTranslating] = useState<"" | "forward" | "back">("");

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(toDraft(word || preset, user?.targetLanguage || "en"));
    setError("");
    fetch("/api/words/tags")
      .then((res) => res.json())
      .then((data) => setKnownTags(data.items || []))
      .catch(() => setKnownTags([]));
  }, [open, word]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function translate(direction: "forward" | "back") {
    const text = direction === "forward" ? form.term : form.translation;
    if (!text.trim()) {
      return;
    }
    setTranslating(direction);
    setError("");
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        direction === "forward" ? { text, from: form.language, to: native } : { text, from: native, to: form.language }
      ),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setTranslating("");
    if (!res || !res.ok) {
      setError(data.error || "Перевод недоступен");
      return;
    }
    update(direction === "forward" ? "translation" : "term", data.translation);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(word ? `/api/words/${word.id}` : "/api/words", {
      method: word ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }
    onSaved(data.item);
  }

  const foreign = languageLabel(form.language);
  const nativeLabel = languageLabel(native);

  return (
    <Modal open={open} title={word ? `Редактирование слова «${word.term}»` : "Новое слово"} onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <div>
            <label htmlFor="word-language">Язык слова</label>
            <select id="word-language" value={form.language} onChange={(e) => update("language", e.target.value)}>
              {STUDY_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="word-pos">Часть речи</label>
            <select id="word-pos" value={form.partOfSpeech} onChange={(e) => update("partOfSpeech", e.target.value)}>
              <option value="">не указана</option>
              {PARTS_OF_SPEECH.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="word-term">Слово ({foreign})</label>
            <div className="input-with-action">
              <input id="word-term" value={form.term} onChange={(e) => update("term", e.target.value)} required maxLength={120} data-autofocus />
              <SpeakButton text={form.term} language={form.language} />
            </div>
          </div>
          <div>
            <label htmlFor="word-translation">Перевод ({nativeLabel})</label>
            <input id="word-translation" value={form.translation} onChange={(e) => update("translation", e.target.value)} required maxLength={240} />
          </div>
        </div>
        <div className="translate-actions">
          <button className="btn secondary small" type="button" onClick={() => translate("forward")} disabled={!form.term.trim() || Boolean(translating)}>
            {translating === "forward" ? "Перевод..." : `${foreign} → ${nativeLabel}`}
          </button>
          <button className="btn secondary small" type="button" onClick={() => translate("back")} disabled={!form.translation.trim() || Boolean(translating)}>
            {translating === "back" ? "Перевод..." : `${nativeLabel} → ${foreign}`}
          </button>
          <span className="hint">Автоперевод через сервис MyMemory в обе стороны</span>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="word-transcription">Транскрипция</label>
            <input id="word-transcription" value={form.transcription} onChange={(e) => update("transcription", e.target.value)} maxLength={80} placeholder="например, ˈæpl" />
          </div>
          <div>
            <label>Уровень усвоения</label>
            <div className="segmented" role="radiogroup" aria-label="Уровень усвоения">
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={form.mastery === level}
                  className={form.mastery === level ? "active" : ""}
                  onClick={() => update("mastery", level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label htmlFor="word-example">Пример употребления</label>
        <input id="word-example" value={form.example} onChange={(e) => update("example", e.target.value)} maxLength={400} />
        <label>Теги</label>
        <TagPicker value={form.tags} known={knownTags} onChange={(tags) => update("tags", tags)} />
        <label htmlFor="word-notes">Заметка</label>
        <textarea id="word-notes" className="short" value={form.notes} onChange={(e) => update("notes", e.target.value)} maxLength={400} placeholder="ассоциация, правило, особенность произношения" />
        {error ? <p className="error">{error}</p> : null}
        <div className="modal-actions">
          <button className="btn ghost" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="btn" disabled={busy} type="submit">
            {busy ? "Сохранение..." : word ? "Сохранить изменения" : "Добавить слово"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
