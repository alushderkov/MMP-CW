"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Stats = {
  wordsTotal: number;
  lessonsTotal: number;
  learned: number;
  byMastery: { level: number; count: number }[];
  byLanguage: Record<string, number>;
};

type Word = { id: string; term: string; translation: string; mastery: number };

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [current, setCurrent] = useState<Word | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");

  async function load() {
    const [progressRes, wordsRes] = await Promise.all([fetch("/api/progress"), fetch("/api/words?sort=mastery&order=asc")]);
    setStats(await progressRes.json());
    const data = await wordsRes.json();
    setWords(data.items || []);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const maxMastery = useMemo(() => Math.max(1, ...(stats?.byMastery.map((x) => x.count) || [1])), [stats]);

  function nextCard() {
    if (!words.length) {
      setCurrent(null);
      return;
    }
    const pool = words.filter((w) => w.mastery < 5);
    const source = pool.length ? pool : words;
    setCurrent(source[Math.floor(Math.random() * source.length)]);
    setAnswer("");
    setResult("");
  }

  useEffect(() => {
    if (words.length && !current) {
      nextCard();
    }
  }, [words]);

  async function check(event: FormEvent) {
    event.preventDefault();
    if (!current) {
      return;
    }
    const ok = answer.trim().toLowerCase() === current.translation.trim().toLowerCase();
    setResult(ok ? "Верно" : `Правильный ответ: ${current.translation}`);
    const mastery = Math.max(0, Math.min(5, current.mastery + (ok ? 1 : -1)));
    await fetch(`/api/words/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mastery }),
    });
    await load();
  }

  return (
    <div>
      <div className="stats">
        <div className="stat">
          <b>{stats?.wordsTotal ?? 0}</b>
          всего слов
        </div>
        <div className="stat">
          <b>{stats?.learned ?? 0}</b>
          освоено (4–5)
        </div>
        <div className="stat">
          <b>{stats?.lessonsTotal ?? 0}</b>
          уроков
        </div>
        <div className="stat">
          <b>{Object.entries(stats?.byLanguage || {}).map(([k, v]) => `${k}:${v}`).join(" ") || "—"}</b>
          по языкам
        </div>
      </div>

      <div className="grid">
        <article className="card">
          <h3>Усвоение</h3>
          {(stats?.byMastery || []).map((row) => (
            <p key={row.level}>
              уровень {row.level}
              <span className="bar">
                <span style={{ width: `${(row.count / maxMastery) * 100}%` }} />
              </span>
              {row.count}
            </p>
          ))}
        </article>
        <article className="card">
          <h3>Повторение</h3>
          {current ? (
            <form onSubmit={check}>
              <p>
                Переведите: <b>{current.term}</b>
              </p>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="перевод" />
              {result ? <p>{result}</p> : null}
              <p className="nav">
                <button className="btn" type="submit">
                  Проверить
                </button>
                <button className="btn secondary" onClick={nextCard} type="button">
                  Следующее
                </button>
              </p>
            </form>
          ) : (
            <p>Добавьте слова, чтобы начать повторение.</p>
          )}
        </article>
      </div>
    </div>
  );
}
