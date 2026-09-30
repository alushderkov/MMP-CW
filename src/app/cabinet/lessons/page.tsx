"use client";

import { FormEvent, useEffect, useState } from "react";

type Lesson = {
  id: string;
  title: string;
  content: string;
  language: string;
  level: string;
};

const emptyForm = { title: "", content: "", language: "en", level: "A1" };

export default function LessonsPage() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams({ q, sort, order });
    const res = await fetch(`/api/lessons?${params}`);
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [q, sort, order]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch(editing ? `/api/lessons/${editing}` : "/api/lessons", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Ошибка сохранения");
      return;
    }
    setForm(emptyForm);
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Удалить урок?")) {
      return;
    }
    await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="toolbar">
        <input placeholder="Поиск по названию или тексту урока" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="createdAt">по дате</option>
          <option value="title">по названию</option>
          <option value="level">по уровню</option>
          <option value="language">по языку</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">убывание</option>
          <option value="asc">возрастание</option>
        </select>
      </div>

      <form className="card" onSubmit={onSubmit} style={{ marginBottom: 16 }}>
        <h3>{editing ? "Редактирование урока" : "Новый урок"}</h3>
        <label>Название</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="form-row">
          <div>
            <label>Уровень</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Язык</label>
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="en">en</option>
              <option value="de">de</option>
              <option value="fr">fr</option>
              <option value="es">es</option>
            </select>
          </div>
        </div>
        <label>Содержание</label>
        <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        {error ? <p className="error">{error}</p> : null}
        <p className="nav">
          <button className="btn" type="submit">
            {editing ? "Сохранить" : "Создать урок"}
          </button>
          {editing ? (
            <button className="btn ghost" onClick={() => { setEditing(null); setForm(emptyForm); }} type="button">
              Отмена
            </button>
          ) : null}
        </p>
      </form>

      <div className="lesson-list">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.title}</h3>
            <p>
              <span className="tag">{item.level}</span>
              <span className="tag">{item.language}</span>
            </p>
            <p>{item.content}</p>
            <p className="nav">
              <button className="btn secondary" onClick={() => { setEditing(item.id); setForm(item); }} type="button">
                Изменить
              </button>
              <button className="btn ghost" onClick={() => remove(item.id)} type="button">
                Удалить
              </button>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
