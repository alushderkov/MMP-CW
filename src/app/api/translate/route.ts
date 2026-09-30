import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { requireString } from "@/lib/validate";

export const dynamic = "force-dynamic";


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
  const from = String(body.from || "en").trim();
  const to = String(body.to || "ru").trim();
  const endpoint = process.env.TRANSLATE_ENDPOINT || "https://api.mymemory.translated.net/get";
  const url = `${endpoint}?q=${encodeURIComponent(String(body.text).trim())}&langpair=${encodeURIComponent(`${from}|${to}`)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Сервис перевода временно недоступен" }, { status: 502 });
    }
    const data = await res.json();
    const translation = data?.responseData?.translatedText;
    if (!translation) {
      return NextResponse.json({ error: "Не удалось получить перевод" }, { status: 502 });
    }
    return NextResponse.json({ translation, provider: "MyMemory" });
  } catch {
    return NextResponse.json({ error: "Ошибка обращения к сервису перевода" }, { status: 502 });
  }
}
