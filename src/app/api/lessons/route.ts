import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Lesson from "@/lib/models/Lesson";
import { escapeRegex, parseListQuery } from "@/lib/validate";
import { readLessonFields, serializeLessons } from "@/lib/lessons";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const url = new URL(request.url);
  const { q, sortSpec } = parseListQuery(url, "lessons");
  const filter: Record<string, unknown> = { userId: user._id };
  if (q) {
    const pattern = escapeRegex(q);
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { content: { $regex: pattern, $options: "i" } },
    ];
  }
  const level = (url.searchParams.get("level") || "").trim().toUpperCase();
  if (level) {
    filter.level = level;
  }
  const language = (url.searchParams.get("language") || "").trim();
  if (language) {
    filter.language = language;
  }
  const items = await Lesson.find(filter).sort(sortSpec).lean();
  return NextResponse.json({ items: await serializeLessons(user._id, items as Record<string, unknown>[]) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const { errors, data } = await readLessonFields(user._id, body, false);
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const created = await Lesson.create({
    language: user.targetLanguage || "en",
    ...data,
    userId: user._id,
  });
  await notify(String(user._id), "Урок создан", `«${created.title}» добавлен в кабинет.`, "success");
  const [item] = await serializeLessons(user._id, [created.toObject()]);
  return NextResponse.json({ item }, { status: 201 });
}
