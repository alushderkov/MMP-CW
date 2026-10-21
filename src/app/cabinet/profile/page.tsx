"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCabinet } from "@/components/CabinetContext";
import { NATIVE_LANGUAGES, STUDY_LANGUAGES } from "@/lib/catalog";

export default function ProfilePage() {
  const { user, setUser } = useCabinet();
  const [profile, setProfile] = useState({ name: "", nativeLanguage: "ru", targetLanguage: "en" });
  const [profileState, setProfileState] = useState({ error: "", done: false, busy: false });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", repeat: "" });
  const [passwordState, setPasswordState] = useState({ error: "", done: false, busy: false });

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, nativeLanguage: user.nativeLanguage, targetLanguage: user.targetLanguage });
    }
  }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setProfileState({ error: "", done: false, busy: true });
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setProfileState({ error: data.error || "Не удалось сохранить профиль", done: false, busy: false });
      return;
    }
    setUser(data.user);
    setProfileState({ error: "", done: true, busy: false });
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (passwords.newPassword !== passwords.repeat) {
      setPasswordState({ error: "Новый пароль и повтор не совпадают", done: false, busy: false });
      return;
    }
    setPasswordState({ error: "", done: false, busy: true });
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setPasswordState({ error: data.error || "Не удалось изменить пароль", done: false, busy: false });
      return;
    }
    setPasswords({ currentPassword: "", newPassword: "", repeat: "" });
    setPasswordState({ error: "", done: true, busy: false });
  }

  return (
    <div className="grid two">
      <form className="card" onSubmit={saveProfile}>
        <h3>Профиль</h3>
        <label htmlFor="profile-email">Почта</label>
        <input id="profile-email" value={user?.email || ""} readOnly disabled />
        <label htmlFor="profile-name">Имя</label>
        <input id="profile-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required minLength={2} maxLength={80} />
        <div className="form-row">
          <div>
            <label htmlFor="profile-native">Родной язык</label>
            <select id="profile-native" value={profile.nativeLanguage} onChange={(e) => setProfile({ ...profile, nativeLanguage: e.target.value })}>
              {NATIVE_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="profile-target">Изучаемый язык</label>
            <select id="profile-target" value={profile.targetLanguage} onChange={(e) => setProfile({ ...profile, targetLanguage: e.target.value })}>
              {STUDY_LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="hint">Родной язык используется как язык перевода, изучаемый – как язык новых слов и уроков по умолчанию.</p>
        {profileState.error ? <p className="error">{profileState.error}</p> : null}
        {profileState.done ? <p className="result ok">Профиль сохранён.</p> : null}
        <p>
          <button className="btn" type="submit" disabled={profileState.busy}>
            {profileState.busy ? "Сохранение..." : "Сохранить профиль"}
          </button>
        </p>
      </form>
      <form className="card" onSubmit={savePassword}>
        <h3>Смена пароля</h3>
        <label htmlFor="password-current">Текущий пароль</label>
        <input id="password-current" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required autoComplete="current-password" />
        <label htmlFor="password-new">Новый пароль (не менее 8 символов)</label>
        <input id="password-new" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={8} maxLength={72} autoComplete="new-password" />
        <label htmlFor="password-repeat">Повтор нового пароля</label>
        <input id="password-repeat" type="password" value={passwords.repeat} onChange={(e) => setPasswords({ ...passwords, repeat: e.target.value })} required minLength={8} maxLength={72} autoComplete="new-password" />
        {passwordState.error ? <p className="error">{passwordState.error}</p> : null}
        {passwordState.done ? <p className="result ok">Пароль изменён.</p> : null}
        <p>
          <button className="btn" type="submit" disabled={passwordState.busy}>
            {passwordState.busy ? "Сохранение..." : "Изменить пароль"}
          </button>
        </p>
      </form>
    </div>
  );
}
