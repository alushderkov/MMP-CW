"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SpeakButton from "@/components/SpeakButton";
import { useCabinet } from "@/components/CabinetContext";
import { plural } from "@/lib/catalog";

type Stats = {
  wordsTotal: number;
  lessonsTotal: number;
  learned: number;
  byLanguage: Record<string, number>;
};

type Word = { id: string; term: string; translation: string; language: string; mastery: number };

function WordList({ items, empty }: { items: Word[]; empty: string }) {
  if (!items.length) {
    return <p className="muted">{empty}</p>;
  }
  return (
    <ul className="mini-list">
      {items.map((item) => (
        <li key={item.id}>
          <SpeakButton text={item.term} language={item.language} />
          <b>{item.term}</b>
          <span className="muted"> — {item.translation}</span>
          <span className="mastery small">{"●".repeat(item.mastery)}{"○".repeat(5 - item.mastery)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CabinetHome() {
  const { user } = useCabinet();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Word[]>([]);
  const [weak, setWeak] = useState<Word[]>([]);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => undefined);
    fetch("/api/words?sort=createdAt&order=desc&limit=5")
      .then((res) => res.json())
      .then((data) => setRecent(data.items || []))
      .catch(() => undefined);
    fetch("/api/words?sort=mastery&order=asc&limit=5")
      .then((res) => res.json())
      .then((data) => setWeak((data.items || []).filter((item: Word) => item.mastery < 4)))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>{user ? `Здравствуйте, ${user.name}!` : "Обзор"}</h2>
          <p className="muted">Сводка по словарю и быстрый переход к занятиям.</p>
        </div>
        <div className="nav">
          <Link className="btn" href="/cabinet/words?new=1">
            + Добавить слово
          </Link>
          <Link className="btn secondary" href="/cabinet/progress">
            Повторить слова
          </Link>
        </div>
      </div>
      <div className="stats">
        <div className="stat">
          <b>{stats?.wordsTotal ?? "—"}</b>
          {plural(stats?.wordsTotal ?? 0, "слово", "слова", "слов")} в словаре
        </div>
        <div className="stat">
          <b>{stats?.lessonsTotal ?? "—"}</b>
          {plural(stats?.lessonsTotal ?? 0, "урок", "урока", "уроков")}
        </div>
        <div className="stat">
          <b>{stats?.learned ?? "—"}</b>
          освоено
        </div>
        <div className="stat">
          <b>{stats ? Object.keys(stats.byLanguage).length : "—"}</b>
          {plural(stats ? Object.keys(stats.byLanguage).length : 0, "изучаемый язык", "изучаемых языка", "изучаемых языков")}
        </div>
      </div>
      <section className="grid two">
        <article className="card">
          <h3>Недавно добавленные</h3>
          <WordList items={recent} empty="Словарь пока пуст." />
          <Link className="btn ghost" href="/cabinet/words">
            Весь словарь →
          </Link>
        </article>
        <article className="card">
          <h3>Требуют повторения</h3>
          <WordList items={weak} empty="Все слова хорошо усвоены." />
          <Link className="btn ghost" href="/cabinet/progress">
            К тренировке →
          </Link>
        </article>
      </section>
      <section className="grid">
        <article className="card">
          <h3>Уроки</h3>
          <p>Материалы по уровням A1–C2 со списком слов для тренировки.</p>
          <Link className="btn" href="/cabinet/lessons">
            К урокам
          </Link>
        </article>
        <article className="card">
          <h3>Переводчик</h3>
          <p>Перевод в обе стороны и сохранение результата в словарь.</p>
          <Link className="btn" href="/cabinet/translator">
            Открыть переводчик
          </Link>
        </article>
        <article className="card">
          <h3>Профиль</h3>
          <p>Имя, родной и изучаемый языки, смена пароля.</p>
          <Link className="btn" href="/cabinet/profile">
            Настройки
          </Link>
        </article>
      </section>
    </div>
  );
}
