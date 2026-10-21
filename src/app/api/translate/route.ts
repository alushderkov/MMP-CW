import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { ALL_LANGUAGES } from "@/lib/catalog";
import { requireString } from "@/lib/validate";

export const dynamic = "force-dynamic";


const CODES = new Set(ALL_LANGUAGES.map((item) => item.code));

function tidy(translation: string, source: string) {
  const text = translation.replace(/\s+/g, " ").trim();
  const shouting = (value: string) => /\p{L}/u.test(value) && value === value.toUpperCase();
  if (!shouting(text) || shouting(source)) {
    return text;
  }
  const lower = text.toLowerCase();
  return /^\p{Lu}/u.test(source) ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const err = requireString(body.text, "Текст", 1, 500);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }
  const from = String(body.from || user.targetLanguage || "en").trim();
  const to = String(body.to || user.nativeLanguage || "ru").trim();
  if (!CODES.has(from) || !CODES.has(to)) {
    return NextResponse.json({ error: "Язык перевода не поддерживается" }, { status: 400 });
  }
  if (from === to) {
    return NextResponse.json({ error: "Выберите разные языки перевода" }, { status: 400 });
  }
  const source = String(body.text).trim();
  const endpoint = process.env.TRANSLATE_ENDPOINT || "https://api.mymemory.translated.net/get";
  const url = `${endpoint}?q=${encodeURIComponent(source)}&langpair=${encodeURIComponent(`${from}|${to}`)}`;

  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      return NextResponse.json({ error: "Сервис перевода временно недоступен" }, { status: 502 });
    }
    const data = await res.json();
    const translation = tidy(String(data?.responseData?.translatedText || ""), source);
    if (!translation || Number(data?.responseStatus) !== 200) {
      return NextResponse.json({ error: "Не удалось получить перевод" }, { status: 502 });
    }
    return NextResponse.json({ translation, from, to, provider: "MyMemory" });
  } catch {
    return NextResponse.json({ error: "Ошибка обращения к сервису перевода" }, { status: 502 });
  }
}
