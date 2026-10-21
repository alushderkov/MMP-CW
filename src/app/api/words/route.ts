import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Word from "@/lib/models/Word";
import Lesson from "@/lib/models/Lesson";
import { escapeRegex, parseListQuery } from "@/lib/validate";
import { readWordFields, serializeWord } from "@/lib/words";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const url = new URL(request.url);
  const { q, limit, sortSpec } = parseListQuery(url, "words");
  const filter: Record<string, unknown> = { userId: user._id };
  if (q) {
    const pattern = escapeRegex(q);
    filter.$or = [
      { term: { $regex: pattern, $options: "i" } },
      { translation: { $regex: pattern, $options: "i" } },
      { tags: { $regex: pattern, $options: "i" } },
    ];
  }
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
  if (tag) {
    filter.tags = tag;
  }
  const language = (url.searchParams.get("language") || "").trim();
  if (language) {
    filter.language = language;
  }
  const lessonId = url.searchParams.get("lesson") || "";
  if (lessonId) {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
    }
    const lesson = await Lesson.findOne({ _id: lessonId, userId: user._id }).lean<{ words?: unknown[] }>();
    if (!lesson) {
      return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
    }
    filter._id = { $in: lesson.words || [] };
  }
  let query = Word.find(filter).sort(sortSpec);
  if (limit) {
    query = query.limit(limit);
  }
  const items = await query.lean();
  return NextResponse.json({ items: items.map(serializeWord) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const { errors, data } = readWordFields(body, false);
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const created = await Word.create({
    language: user.targetLanguage || "en",
    ...data,
    userId: user._id,
  });

  await notify(String(user._id), "Слово добавлено", `«${created.term}» сохранено в словаре.`, "success");
  return NextResponse.json({ item: serializeWord(created.toObject()) }, { status: 201 });
}
