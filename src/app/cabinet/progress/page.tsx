"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import SpeakButton from "@/components/SpeakButton";
import { languageLabel, plural } from "@/lib/catalog";

type Stats = {
  wordsTotal: number;
  lessonsTotal: number;
  learned: number;
  byMastery: { level: number; count: number }[];
  byLanguage: Record<string, number>;
};

type Word = { id: string; term: string; translation: string; transcription: string; example: string; language: string; mastery: number };
type LessonOption = { id: string; title: string; words: unknown[] };
type Direction = "term" | "translation";
type Result = { ok: boolean; expected: string } | null;

function variants(value: string) {
  return value
    .split(/[,;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [source, setSource] = useState("");
  const [direction, setDirection] = useState<Direction>("term");
  const [words, setWords] = useState<Word[]>([]);
  const [current, setCurrent] = useState<Word | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const answerRef = useRef<HTMLInputElement>(null);

  async function loadStats() {
    const res = await fetch("/api/progress");
    setStats(await res.json());
  }

  async function loadWords(lesson: string) {
    const params = new URLSearchParams({ sort: "mastery", order: "asc" });
    if (lesson) {
      params.set("lesson", lesson);
    }
    const res = await fetch(`/api/words?${params}`);
    const data = await res.json();
    return (data.items || []) as Word[];
  }

  useEffect(() => {
    loadStats().catch(() => undefined);
    fetch("/api/lessons?sort=title&order=asc")
      .then((res) => res.json())
      .then((data) => setLessons(data.items || []))
      .catch(() => undefined);
    const lesson = new URLSearchParams(window.location.search).get("lesson") || "";
    setSource(lesson);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadWords(source)
      .then((items) => {
        if (cancelled) {
          return;
        }
        setWords(items);
        setScore({ right: 0, total: 0 });
        pick(items, null);
      })
      .catch(() => !cancelled && setWords([]));
    return () => {
      cancelled = true;
    };
  }, [source]);

  const maxMastery = useMemo(() => Math.max(1, ...(stats?.byMastery.map((x) => x.count) || [1])), [stats]);

  function pick(pool: Word[], previous: Word | null) {
    if (!pool.length) {
      setCurrent(null);
      return;
    }
    const weak = pool.filter((w) => w.mastery < 5);
    let candidates = weak.length ? weak : pool;
    if (previous && candidates.length > 1) {
      candidates = candidates.filter((w) => w.id !== previous.id);
    }
    setCurrent(candidates[Math.floor(Math.random() * candidates.length)]);
    setAnswer("");
    setResult(null);
    setHint(false);
    setTimeout(() => answerRef.current?.focus(), 0);
  }

  async function check(event: FormEvent) {
    event.preventDefault();
    if (!current || result) {
      return;
    }
    const expected = direction === "term" ? current.translation : current.term;
    const ok = variants(expected).includes(answer.trim().toLowerCase());
    setResult({ ok, expected });
    setScore((prev) => ({ right: prev.right + (ok ? 1 : 0), total: prev.total + 1 }));
    const mastery = Math.max(0, Math.min(5, current.mastery + (ok ? 1 : -1)));
    if (mastery === current.mastery) {
      return;
    }
    const res = await fetch(`/api/words/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mastery }),
    });
    if (res.ok) {
      const updated = { ...current, mastery };
      setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setCurrent(updated);
      await loadStats();
    }
  }

  const prompt = current ? (direction === "term" ? current.term : current.translation) : "";
  const hintText = !current
    ? ""
    : direction === "term"
      ? current.example || "Для этого слова нет примера употребления."
      : `Первая буква «${current.term.charAt(0)}», символов: ${current.term.length}.`;

  return (
    <div>
      <div className="stats">
        <div className="stat">
          <b>{stats?.wordsTotal ?? 0}</b>
          {plural(stats?.wordsTotal ?? 0, "слово", "слова", "слов")} всего
        </div>
        <div className="stat">
          <b>{stats?.learned ?? 0}</b>
          освоено (4–5)
        </div>
        <div className="stat">
          <b>{stats?.lessonsTotal ?? 0}</b>
          {plural(stats?.lessonsTotal ?? 0, "урок", "урока", "уроков")}
        </div>
        <div className="stat">
          <b className="small-stat">
            {Object.entries(stats?.byLanguage || {}).length
              ? Object.entries(stats?.byLanguage || {}).map(([k, v]) => (
                  <span key={k}>
                    {languageLabel(k)} — {v}
                  </span>
                ))
              : "—"}
          </b>
          по языкам
        </div>
      </div>

      <div className="grid two">
        <article className="card">
          <h3>Усвоение</h3>
          {(stats?.byMastery || []).map((row) => (
            <p key={row.level} className="hist-row">
              <span>уровень {row.level}</span>
              <span className="bar">
                <span style={{ width: `${(row.count / maxMastery) * 100}%` }} />
              </span>
              <span>{row.count}</span>
            </p>
          ))}
        </article>
        <article className="card">
          <div className="review-head">
            <h3>Повторение</h3>
            <span className="muted">
              верно {score.right} из {score.total}
            </span>
          </div>
          <div className="form-stack">
            <div>
              <label htmlFor="review-source">Слова</label>
              <select id="review-source" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">весь словарь</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id} disabled={!lesson.words.length}>
                    урок «{lesson.title}» ({lesson.words.length})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Направление</label>
              <div className="segmented wide" role="radiogroup" aria-label="Направление тренировки">
                <button type="button" role="radio" aria-checked={direction === "term"} className={direction === "term" ? "active" : ""} onClick={() => { setDirection("term"); pick(words, null); }}>
                  слово → перевод
                </button>
                <button type="button" role="radio" aria-checked={direction === "translation"} className={direction === "translation" ? "active" : ""} onClick={() => { setDirection("translation"); pick(words, null); }}>
                  перевод → слово
                </button>
              </div>
            </div>
          </div>
          {current ? (
            <form onSubmit={check} className="review-card">
              <p className="muted small">{direction === "term" ? `Переведите с языка «${languageLabel(current.language)}»` : `Вспомните слово на языке «${languageLabel(current.language)}»`}</p>
              <div className="term big">
                <b>{prompt}</b>
                {direction === "term" ? <SpeakButton text={current.term} language={current.language} /> : null}
              </div>
              {direction === "term" && current.transcription ? <p className="muted">[{current.transcription}]</p> : null}
              {hint ? <p className="hint-box">{hintText}</p> : null}
              <input ref={answerRef} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={direction === "term" ? "перевод" : "слово"} disabled={Boolean(result)} />
              {result ? (
                <p className={result.ok ? "result ok" : "result bad"}>
                  {result.ok ? "Верно!" : `Неверно. Правильный ответ: ${result.expected}`}
                  {!result.ok || direction === "translation" ? <SpeakButton text={current.term} language={current.language} /> : null}
                </p>
              ) : null}
              <p className="nav">
                {result ? (
                  <button className="btn" onClick={() => pick(words, current)} type="button" autoFocus>
                    Следующее
                  </button>
                ) : (
                  <>
                    <button className="btn" type="submit" disabled={!answer.trim()}>
                      Проверить
                    </button>
                    <button className="btn secondary" onClick={() => setHint(true)} type="button" disabled={hint}>
                      Подсказка
                    </button>
                    <button className="btn ghost" onClick={() => pick(words, current)} type="button">
                      Пропустить
                    </button>
                  </>
                )}
              </p>
            </form>
          ) : (
            <p>{source ? "В уроке нет слов для повторения." : "Добавьте слова, чтобы начать повторение."}</p>
          )}
        </article>
      </div>
    </div>
  );
}
