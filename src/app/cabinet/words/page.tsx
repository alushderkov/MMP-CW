"use client";

import { FormEvent, useEffect, useState } from "react";

type Word = {
  id: string;
  term: string;
  translation: string;
  transcription: string;
  language: string;
  partOfSpeech: string;
  example: string;
  tags: string[];
  mastery: number;
};

const emptyForm = {
  term: "",
  translation: "",
  transcription: "",
  language: "en",
  partOfSpeech: "",
  example: "",
  tags: "",
  mastery: "0",
};

export default function WordsPage() {
  const [items, setItems] = useState<Word[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const params = new URLSearchParams({ q, sort, order });
    const res = await fetch(`/api/words?${params}`);
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [q, sort, order]);

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function translate() {
    if (!form.term) {
      return;
    }
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: form.term, from: form.language || "en", to: "ru" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Перевод недоступен");
      return;
    }
    updateField("translation", data.translation);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      mastery: Number(form.mastery),
      tags: form.tags,
    };
    const res = await fetch(editing ? `/api/words/${editing}` : "/api/words", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }
    setForm(emptyForm);
    setEditing(null);
    await load();
  }

  function edit(item: Word) {
    setEditing(item.id);
    setForm({
      term: item.term,
      translation: item.translation,
      transcription: item.transcription || "",
      language: item.language,
      partOfSpeech: item.partOfSpeech || "",
      example: item.example || "",
      tags: (item.tags || []).join(", "),
      mastery: String(item.mastery),
    });
  }

  async function remove(id: string) {
    if (!confirm("Удалить слово?")) {
      return;
    }
    await fetch(`/api/words/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="toolbar">
        <input placeholder="Поиск по слову, переводу или тегу" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt">по дате</option>
          <option value="term">по слову</option>
          <option value="translation">по переводу</option>
          <option value="mastery">по усвоению</option>
          <option value="language">по языку</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">убывание</option>
          <option value="asc">возрастание</option>
        </select>
      </div>

      <form className="card" onSubmit={onSubmit} style={{ marginBottom: 16 }}>
        <h3>{editing ? "Редактирование слова" : "Новое слово"}</h3>
        <div className="form-row">
          <div>
            <label>Слово</label>
            <input value={form.term} onChange={(e) => updateField("term", e.target.value)} required />
          </div>
          <div>
            <label>Перевод</label>
            <input value={form.translation} onChange={(e) => updateField("translation", e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Язык</label>
            <select value={form.language} onChange={(e) => updateField("language", e.target.value)}>
              <option value="en">en</option>
              <option value="de">de</option>
              <option value="fr">fr</option>
              <option value="es">es</option>
            </select>
          </div>
          <div>
            <label>Усвоение (0–5)</label>
            <input type="number" min={0} max={5} value={form.mastery} onChange={(e) => updateField("mastery", e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Транскрипция</label>
            <input value={form.transcription} onChange={(e) => updateField("transcription", e.target.value)} />
          </div>
          <div>
            <label>Часть речи</label>
            <input value={form.partOfSpeech} onChange={(e) => updateField("partOfSpeech", e.target.value)} />
          </div>
        </div>
        <label>Пример</label>
        <input value={form.example} onChange={(e) => updateField("example", e.target.value)} />
        <label>Теги через запятую</label>
        <input value={form.tags} onChange={(e) => updateField("tags", e.target.value)} />
        {error ? <p className="error">{error}</p> : null}
        <p className="nav">
          <button className="btn" disabled={busy} type="submit">
            {editing ? "Сохранить" : "Добавить"}
          </button>
          <button className="btn secondary" onClick={translate} type="button">
            Перевести
          </button>
          {editing ? (
            <button
              className="btn ghost"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
              type="button"
            >
              Отмена
            </button>
          ) : null}
        </p>
      </form>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Слово</th>
              <th>Перевод</th>
              <th>Язык</th>
              <th>Усвоение</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <b>{item.term}</b>
                  <div>{item.transcription}</div>
                  {(item.tags || []).map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </td>
                <td>
                  {item.translation}
                  <div>{item.example}</div>
                </td>
                <td>{item.language}</td>
                <td className="mastery">{"●".repeat(item.mastery)}{"○".repeat(5 - item.mastery)}</td>
                <td>
                  <button className="btn ghost" onClick={() => edit(item)} type="button">
                    Изменить
                  </button>
                  <button className="btn ghost" onClick={() => remove(item.id)} type="button">
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
