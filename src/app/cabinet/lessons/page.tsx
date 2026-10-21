"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import SpeakButton from "@/components/SpeakButton";
import { useCabinet } from "@/components/CabinetContext";
import { LEVELS, STUDY_LANGUAGES, languageLabel } from "@/lib/catalog";

type LessonWord = { id: string; term: string; translation: string; transcription: string; language: string };

type Lesson = {
  id: string;
  title: string;
  content: string;
  language: string;
  level: string;
  words: LessonWord[];
};

type Draft = { title: string; content: string; language: string; level: string; words: string[] };

function toDraft(lesson: Lesson | null, language: string): Draft {
  return lesson
    ? { title: lesson.title, content: lesson.content, language: lesson.language, level: lesson.level, words: lesson.words.map((w) => w.id) }
    : { title: "", content: "", language, level: "A1", words: [] };
}

function LessonForm({ open, lesson, onClose, onSaved }: { open: boolean; lesson: Lesson | null; onClose: () => void; onSaved: (id: string) => void }) {
  const { user } = useCabinet();
  const [form, setForm] = useState<Draft>(() => toDraft(lesson, user?.targetLanguage || "en"));
  const [dictionary, setDictionary] = useState<LessonWord[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(toDraft(lesson, user?.targetLanguage || "en"));
    setFilter("");
    setError("");
    fetch("/api/words?sort=term&order=asc")
      .then((res) => res.json())
      .then((data) => setDictionary(data.items || []))
      .catch(() => setDictionary([]));
  }, [open, lesson, user]);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return dictionary.filter(
      (word) =>
        (word.language === form.language || form.words.includes(word.id)) &&
        (!needle || word.term.toLowerCase().includes(needle) || word.translation.toLowerCase().includes(needle))
    );
  }, [dictionary, filter, form.language, form.words]);

  function toggle(id: string) {
    setForm((prev) => ({ ...prev, words: prev.words.includes(id) ? prev.words.filter((w) => w !== id) : [...prev.words, id] }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(lesson ? `/api/lessons/${lesson.id}` : "/api/lessons", {
      method: lesson ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }
    onSaved(data.item.id);
  }

  return (
    <Modal open={open} title={lesson ? `Редактирование урока «${lesson.title}»` : "Новый урок"} onClose={onClose} wide>
      <form onSubmit={onSubmit}>
        <label htmlFor="lesson-title">Название</label>
        <input id="lesson-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={2} maxLength={160} data-autofocus />
        <div className="form-row">
          <div>
            <label htmlFor="lesson-level">Уровень</label>
            <select id="lesson-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {LEVELS.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lesson-language">Язык</label>
            <select id="lesson-language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              {STUDY_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="lesson-content">Содержание</label>
        <textarea id="lesson-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required minLength={10} maxLength={8000} />
        <p className="hint">{form.content.trim().length} / 8000 символов, не менее 10</p>
        <label>Слова урока · выбрано {form.words.length}</label>
        <div className="word-picker">
          <input placeholder="Найти слово в словаре" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="word-picker-list">
            {visible.length === 0 ? <p className="muted small">В словаре нет слов на языке «{languageLabel(form.language)}».</p> : null}
            {visible.map((word) => (
              <label className={form.words.includes(word.id) ? "pick checked" : "pick"} key={word.id}>
                <input type="checkbox" checked={form.words.includes(word.id)} onChange={() => toggle(word.id)} />
                <b>{word.term}</b> <span className="muted">— {word.translation}</span>
              </label>
            ))}
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="modal-actions">
          <button className="btn ghost" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Сохранение..." : lesson ? "Сохранить изменения" : "Создать урок"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function LessonsPage() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [reading, setReading] = useState<Lesson | null>(null);
  const [removing, setRemoving] = useState<Lesson | null>(null);
  const [flash, setFlash] = useState("");

  async function load() {
    const params = new URLSearchParams({ q, sort, order, level, language });
    const res = await fetch(`/api/lessons?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoaded(true);
  }

  useEffect(() => {
    load().catch(() => setLoaded(true));
  }, [q, sort, order, level, language]);

  useEffect(() => {
    if (!flash) {
      return;
    }
    document.getElementById(`lesson-${flash}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setFlash(""), 2400);
    return () => clearTimeout(timer);
  }, [flash, items]);

  function openCreate() {
    setEditing(null);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  function openEdit(item: Lesson) {
    setReading(null);
    setEditing(item);
    setFormKey((key) => key + 1);
    setFormOpen(true);
  }

  async function onSaved(id: string) {
    setFormOpen(false);
    setEditing(null);
    await load();
    setFlash(id);
  }

  async function remove() {
    if (!removing) {
      return;
    }
    await fetch(`/api/lessons/${removing.id}`, { method: "DELETE" });
    setRemoving(null);
    await load();
  }

  const filtered = Boolean(q || level || language);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Уроки</h2>
          <p className="muted">{loaded ? `${items.length} ${filtered ? "найдено" : "в кабинете"}` : "Загрузка..."}</p>
        </div>
        <button className="btn" type="button" onClick={openCreate}>
          + Новый урок
        </button>
      </div>

      <div className="toolbar">
        <input className="grow" placeholder="Поиск по названию или тексту урока" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Фильтр по уровню">
          <option value="">все уровни</option>
          {LEVELS.map((item) => (
            <option key={item}>{item}</option>
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
          <option value="title">по названию</option>
          <option value="level">по уровню</option>
          <option value="language">по языку</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Направление сортировки">
          <option value="desc">убывание</option>
          <option value="asc">возрастание</option>
        </select>
      </div>

      {loaded && items.length === 0 ? (
        <div className="card empty">
          <p>{filtered ? "По заданным условиям уроков не найдено." : "Уроков пока нет."}</p>
          {filtered ? (
            <button className="btn secondary" type="button" onClick={() => { setQ(""); setLevel(""); setLanguage(""); }}>
              Сбросить фильтры
            </button>
          ) : (
            <button className="btn" type="button" onClick={openCreate}>
              Создать первый урок
            </button>
          )}
        </div>
      ) : null}

      <div className="lesson-list">
        {items.map((item) => (
          <article className={flash === item.id ? "card lesson flash" : "card lesson"} key={item.id} id={`lesson-${item.id}`}>
            <h3>{item.title}</h3>
            <p>
              <span className="tag">{item.level}</span>
              <span className="tag">{languageLabel(item.language)}</span>
              <span className="tag">слов: {item.words.length}</span>
            </p>
            <p className="clamp">{item.content}</p>
            {item.words.length ? (
              <p className="lesson-words">
                {item.words.slice(0, 6).map((word) => (
                  <span className="chip static" key={word.id}>
                    {word.term}
                  </span>
                ))}
                {item.words.length > 6 ? <span className="muted small">и ещё {item.words.length - 6}</span> : null}
              </p>
            ) : null}
            <p className="nav">
              <button className="btn" onClick={() => setReading(item)} type="button">
                Открыть
              </button>
              <button className="btn secondary" onClick={() => openEdit(item)} type="button">
                Изменить
              </button>
              <button className="btn ghost danger-text" onClick={() => setRemoving(item)} type="button">
                Удалить
              </button>
            </p>
          </article>
        ))}
      </div>

      <Modal open={Boolean(reading)} title={reading?.title || ""} onClose={() => setReading(null)} wide>
        {reading ? (
          <>
            <p>
              <span className="tag">{reading.level}</span>
              <span className="tag">{languageLabel(reading.language)}</span>
            </p>
            <div className="lesson-text">{reading.content}</div>
            <h4>Слова урока</h4>
            {reading.words.length ? (
              <ul className="lesson-vocab">
                {reading.words.map((word) => (
                  <li key={word.id}>
                    <SpeakButton text={word.term} language={word.language} />
                    <b>{word.term}</b>
                    {word.transcription ? <span className="muted"> [{word.transcription}]</span> : null}
                    <span> — {word.translation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">К уроку пока не привязаны слова. Их можно выбрать в форме редактирования.</p>
            )}
            <div className="modal-actions">
              <button className="btn secondary" type="button" onClick={() => openEdit(reading)}>
                Изменить
              </button>
              {reading.words.length ? (
                <Link className="btn" href={`/cabinet/progress?lesson=${reading.id}`} data-autofocus>
                  Тренировать слова урока
                </Link>
              ) : null}
            </div>
          </>
        ) : null}
      </Modal>

      <LessonForm key={formKey} open={formOpen} lesson={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />
      <ConfirmDialog
        open={Boolean(removing)}
        title="Удаление урока"
        message={removing ? `Урок «${removing.title}» будет удалён. Слова из словаря останутся.` : ""}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
