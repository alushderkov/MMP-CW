"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CabinetContext, CabinetUser } from "@/components/CabinetContext";

type Notice = { id: string; title: string; message: string; kind: string; createdAt: string; read?: boolean };

const TOAST_TTL = 8000;

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CabinetUser | null>(null);
  const [toasts, setToasts] = useState<Notice[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          throw new Error("auth");
        }
        return res.json();
      })
      .then((data) => setUser(data.user))
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
      timers.current.set(notice.id, setTimeout(() => dismissToast(notice.id), TOAST_TTL));
    };
    const pending = timers.current;
    return () => {
      source.close();
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const links = useMemo(
    () => [
      ["/cabinet", "Обзор"],
      ["/cabinet/words", "Слова"],
      ["/cabinet/lessons", "Уроки"],
      ["/cabinet/progress", "Прогресс"],
      ["/cabinet/translator", "Переводчик"],
      ["/cabinet/profile", "Профиль"],
    ],
    []
  );

  const unread = notices.filter((item) => !item.read).length;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  function dismissToast(id: string) {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (!res.ok) {
      return;
    }
    setNotices((prev) => prev.map((item) => ({ ...item, read: true })));
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }

  return (
    <CabinetContext.Provider value={{ user, setUser }}>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/cabinet">
            <div className="mark">L</div>
            <div>
              <b>Lingua</b>
              <span>{user?.name || "личный кабинет"}</span>
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
            <h3>
              Уведомления {unread ? <span className="badge">{unread}</span> : null}
            </h3>
            <button className="btn ghost" type="button" onClick={markAllRead} disabled={!unread}>
              Прочитать все
            </button>
          </div>
          <div className="notice-list">
            {notices.length === 0 ? <p>Пока нет событий.</p> : null}
            {notices.map((item) => (
              <p key={item.id} className={item.read ? "notice read" : "notice"}>
                <b>{item.title}.</b> {item.message}
                <time>{new Date(item.createdAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}</time>
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
    </CabinetContext.Provider>
  );
}
