"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        targetLanguage: form.get("targetLanguage"),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Не удалось зарегистрироваться");
      return;
    }
    router.push("/cabinet");
  }

  return (
    <div className="shell">
      <form className="card auth" onSubmit={onSubmit}>
        <h1>Регистрация</h1>
        <label htmlFor="name">Имя</label>
        <input id="name" name="name" required minLength={2} />
        <label htmlFor="email">Почта</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Пароль (не менее 8 символов)</label>
        <input id="password" name="password" type="password" required minLength={8} />
        <label htmlFor="targetLanguage">Изучаемый язык</label>
        <select id="targetLanguage" name="targetLanguage" defaultValue="en">
          <option value="en">английский</option>
          <option value="de">немецкий</option>
          <option value="fr">французский</option>
          <option value="es">испанский</option>
        </select>
        {error ? <p className="error">{error}</p> : null}
        <p>
          <button className="btn" disabled={pending} type="submit">
            {pending ? "Сохранение..." : "Создать аккаунт"}
          </button>
        </p>
        <p>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}
