"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  wordsTotal: number;
  lessonsTotal: number;
  learned: number;
  byLanguage: Record<string, number>;
};

export default function CabinetHome() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <div className="stats">
        <div className="stat">
          <b>{stats?.wordsTotal ?? "—"}</b>
          слова в словаре
        </div>
        <div className="stat">
          <b>{stats?.lessonsTotal ?? "—"}</b>
          уроков
        </div>
        <div className="stat">
          <b>{stats?.learned ?? "—"}</b>
          освоено
        </div>
        <div className="stat">
          <b>{Object.keys(stats?.byLanguage || {}).length || "—"}</b>
          языка
        </div>
      </div>
      <section className="grid">
        <article className="card">
          <h3>Слова</h3>
          <p>Добавляйте карточки, ищите по термину и переводу, сортируйте по усвоению.</p>
          <Link className="btn" href="/cabinet/words">
            Открыть словарь
          </Link>
        </article>
        <article className="card">
          <h3>Уроки</h3>
          <p>Ведите собственные материалы по уровням и возвращайтесь к ним из кабинета.</p>
          <Link className="btn" href="/cabinet/lessons">
            К урокам
          </Link>
        </article>
        <article className="card">
          <h3>Прогресс</h3>
          <p>Сводка по уровням усвоения и повторение слов прямо в кабинете.</p>
          <Link className="btn" href="/cabinet/progress">
            Смотреть прогресс
          </Link>
        </article>
      </section>
    </div>
  );
}
