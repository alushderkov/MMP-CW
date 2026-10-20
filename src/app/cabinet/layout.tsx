"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Notice = { id: string; title: string; message: string; kind: string; createdAt: string; read?: boolean };

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("");
  const [toasts, setToasts] = useState<Notice[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          throw new Error("auth");
        }
        return res.json();
      })
      .then((data) => setName(data.user.name))
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setNotices(data.items || []))
      .catch(() => undefined);

    const source = new EventSource("/api/notifications/stream");
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (!payload.title) {
        return;
      }
      const notice = { ...payload, read: false };
      setToasts((prev) => [notice, ...prev].slice(0, 3));
      setNotices((prev) => [notice, ...prev].slice(0, 40));
    };
    return () => source.close();
  }, []);

  const links = useMemo(
    () => [
      ["/cabinet", "Обзор"],
      ["/cabinet/words", "Слова"],
      ["/cabinet/lessons", "Уроки"],
      ["/cabinet/progress", "Прогресс"],
    ],
    []
  );

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (!res.ok) {
      return;
    }
    setNotices((prev) => prev.map((item) => ({ ...item, read: true })));
    setToasts([]);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/cabinet">
          <div className="mark">L</div>
          <div>
            <b>Lingua</b>
            <span>{name || "личный кабинет"}</span>
          </div>
        </Link>
        <button className="btn secondary" onClick={logout} type="button">
          Выйти
        </button>
      </header>
      <nav className="cabinet-nav">
        {links.map(([href, label]) => (
          <Link className={pathname === href ? "active" : ""} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
      {children}
      <aside className="card" style={{ marginTop: 18 }}>
        <div className="notice-head">
          <h3>Уведомления</h3>
          <button className="btn ghost" type="button" onClick={markAllRead} disabled={!notices.some((item) => !item.read)}>
            Прочитать все
          </button>
        </div>
        <div className="notice-list">
          {notices.length === 0 ? <p>Пока нет событий.</p> : null}
          {notices.map((item) => (
            <p key={item.id} className={item.read ? "notice read" : "notice"}>
              <b>{item.title}.</b> {item.message}
            </p>
          ))}
        </div>
      </aside>
      <div className="toast-stack">
        {toasts.map((item) => (
          <div className={`toast ${item.kind}`} key={item.id}>
            <button className="toast-close" type="button" onClick={() => dismissToast(item.id)} aria-label="Скрыть">
              ×
            </button>
            <b>{item.title}</b>
            <div>{item.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
