"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import SpeakButton from "@/components/SpeakButton";
import WordForm, { Word } from "@/components/WordForm";
import { STUDY_LANGUAGES, languageLabel, partOfSpeechLabel } from "@/lib/catalog";

export default function WordsPage() {
  const [items, setItems] = useState<Word[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Word | null>(null);
  const [removing, setRemoving] = useState<Word | null>(null);
  const [flash, setFlash] = useState("");

  async function load() {
    const params = new URLSearchParams({ q, sort, order, tag, language });
    const res = await fetch(`/api/words?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoaded(true);
  }

  async function loadTags() {
    const res = await fetch("/api/words/tags");
    const data = await res.json();
    setTags(data.items || []);
  }

  useEffect(() => {
    load().catch(() => setLoaded(true));
  }, [q, sort, order, tag, language]);

  useEffect(() => {
    loadTags().catch(() => undefined);
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setFormOpen(true);
      window.history.replaceState(null, "", "/cabinet/words");
    }
  }, []);

  useEffect(() => {
    if (!flash) {
      return;
    }
    document.getElementById(`word-${flash}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setFlash(""), 2400);
    return () => clearTimeout(timer);
  }, [flash, items]);

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  function openEdit(item: Word) {
    setEditing(item);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  async function onSaved(item: Word) {
    setFormOpen(false);
    setEditing(null);
    await Promise.all([load(), loadTags()]);
    setFlash(item.id);
  }

  async function remove() {
    if (!removing) {
      return;
    }
    await fetch(`/api/words/${removing.id}`, { method: "DELETE" });
    setRemoving(null);
    await Promise.all([load(), loadTags()]);
  }

  const filtered = Boolean(q || tag || language);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Словарь</h2>
          <p className="muted">{loaded ? `${items.length} ${filtered ? "найдено" : "в словаре"}` : "Загрузка..."}</p>
        </div>
        <button className="btn" type="button" onClick={openCreate}>
          + Добавить слово
        </button>
      </div>

      <div className="toolbar">
        <input className="grow" placeholder="Поиск по слову, переводу или тегу" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Фильтр по тегу">
          <option value="">все теги</option>
          {tags.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Фильтр по языку">
          <option value="">все языки</option>
          {STUDY_LANGUAGES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Поле сортировки">
          <option value="createdAt">по дате</option>
          <option value="term">по слову</option>
          <option value="translation">по переводу</option>
          <option value="mastery">по усвоению</option>
          <option value="language">по языку</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Направление сортировки">
          <option value="desc">убывание</option>
          <option value="asc">возрастание</option>
        </select>
      </div>

      <div className="card table-card">
        {loaded && items.length === 0 ? (
          <div className="empty">
            <p>{filtered ? "По заданным условиям слов не найдено." : "Словарь пока пуст."}</p>
            {filtered ? (
              <button className="btn secondary" type="button" onClick={() => { setQ(""); setTag(""); setLanguage(""); }}>
                Сбросить фильтры
              </button>
            ) : (
              <button className="btn" type="button" onClick={openCreate}>
                Добавить первое слово
              </button>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Слово</th>
                <th>Перевод</th>
                <th>Теги</th>
                <th>Язык</th>
                <th>Усвоение</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} id={`word-${item.id}`} className={flash === item.id ? "flash" : ""}>
                  <td>
                    <div className="term">
                      <b>{item.term}</b>
                      <SpeakButton text={item.term} language={item.language} />
                    </div>
                    {item.transcription ? <div className="muted">[{item.transcription}]</div> : null}
                    {item.partOfSpeech ? <div className="muted small">{partOfSpeechLabel(item.partOfSpeech)}</div> : null}
                  </td>
                  <td>
                    {item.translation}
                    {item.example ? <div className="muted small">{item.example}</div> : null}
                    {item.notes ? <div className="note small">{item.notes}</div> : null}
                  </td>
                  <td>
                    {(item.tags || []).map((name) => (
                      <button className="tag tag-btn" key={name} type="button" onClick={() => setTag(name)} title="Показать слова с этим тегом">
                        {name}
                      </button>
                    ))}
                  </td>
                  <td>{languageLabel(item.language)}</td>
                  <td className="mastery" title={`${item.mastery} из 5`}>
                    {"●".repeat(item.mastery)}
                    {"○".repeat(5 - item.mastery)}
                  </td>
                  <td className="row-actions">
                    <button className="btn ghost small" onClick={() => openEdit(item)} type="button">
                      Изменить
                    </button>
                    <button className="btn ghost small danger-text" onClick={() => setRemoving(item)} type="button">
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <WordForm key={formKey} open={formOpen} word={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />
      <ConfirmDialog
        open={Boolean(removing)}
        title="Удаление слова"
        message={removing ? `Слово «${removing.term}» будет удалено из словаря и из всех уроков.` : ""}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
