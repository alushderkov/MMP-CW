"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Не удалось войти");
      return;
    }
    router.push("/cabinet");
  }

  return (
    <div className="shell">
      <form className="card auth" onSubmit={onSubmit}>
        <h1>Вход в Lingua</h1>
        <p>Демо: demo@lingua.local / Demo12345</p>
        <label htmlFor="email">Почта</label>
        <input id="email" name="email" type="email" required defaultValue="demo@lingua.local" />
        <label htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" required defaultValue="Demo12345" />
        {error ? <p className="error">{error}</p> : null}
        <p>
          <button className="btn" disabled={pending} type="submit">
            {pending ? "Вход..." : "Войти"}
          </button>
        </p>
        <p>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
}
