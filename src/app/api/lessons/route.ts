import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Lesson from "@/lib/models/Lesson";
import { parseListQuery, requireString } from "@/lib/validate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);

function serialize(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    language: doc.language,
    level: doc.level,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const { q, sort, order } = parseListQuery(new URL(request.url), "lessons");
  const filter: Record<string, unknown> = { userId: user._id };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } },
      { level: { $regex: q, $options: "i" } },
    ];
  }
  const items = await Lesson.find(filter).sort({ [sort]: order }).lean();
  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const errors = [
    requireString(body.title, "Название", 2, 160),
    requireString(body.content, "Содержание", 10, 8000),
  ].filter(Boolean) as string[];
  const level = String(body.level || "A1").toUpperCase();
  if (!LEVELS.has(level)) {
    errors.push("Уровень: допустимы A1, A2, B1, B2, C1, C2");
  }
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const created = await Lesson.create({
    userId: user._id,
    title: String(body.title).trim(),
    content: String(body.content).trim(),
    language: String(body.language || user.targetLanguage || "en").trim(),
    level,
  });
  await notify(String(user._id), "Урок создан", `«${created.title}» добавлен в кабинет.`, "success");
  return NextResponse.json({ item: serialize(created.toObject()) }, { status: 201 });
}
