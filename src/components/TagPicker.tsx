"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { DEFAULT_TAGS } from "@/lib/catalog";

type Props = {
  value: string[];
  known: string[];
  onChange: (tags: string[]) => void;
};

export default function TagPicker({ value, known, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const suggestions = useMemo(() => {
    const all = Array.from(new Set([...known, ...DEFAULT_TAGS]));
    return all.filter((tag) => !value.includes(tag)).sort((a, b) => a.localeCompare(b, "ru"));
  }, [known, value]);

  function add(raw: string) {
    const tag = raw.trim().toLowerCase().slice(0, 30);
    if (tag && !value.includes(tag) && value.length < 12) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function onKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    }
    if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="tag-picker">
      <div className="chips">
        {value.map((tag) => (
          <span className="chip" key={tag}>
            {tag}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Убрать тег ${tag}`}>
              ×
            </button>
          </span>
        ))}
        <select
          className="chip-select"
          value=""
          onChange={(event) => add(event.target.value)}
          aria-label="Выбрать тег из списка"
          disabled={!suggestions.length || value.length >= 12}
        >
          <option value="">+ выбрать тег</option>
          {suggestions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft && add(draft)}
        placeholder="или введите новый тег и нажмите Enter"
        maxLength={30}
        disabled={value.length >= 12}
      />
    </div>
  );
}
