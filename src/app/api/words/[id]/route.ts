import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Word from "@/lib/models/Word";
import { clampMastery, requireString } from "@/lib/validate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


function serialize(doc: Record<string, unknown>) {
  return {
    id: String(doc._id),
    term: doc.term,
    translation: doc.translation,
    transcription: doc.transcription,
    language: doc.language,
    partOfSpeech: doc.partOfSpeech,
    example: doc.example,
    tags: doc.tags,
    mastery: doc.mastery,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function idFilter(userId: unknown, id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return { _id: id, userId };
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const filter = idFilter(user._id, params.id);
  if (!filter) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  const item = await Word.findOne(filter).lean();
  if (!item) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  return NextResponse.json({ item: serialize(item) });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const filter = idFilter(user._id, params.id);
  if (!filter) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.term !== undefined) {
    const err = requireString(body.term, "Слово", 1, 120);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
    patch.term = String(body.term).trim();
  }
  if (body.translation !== undefined) {
    const err = requireString(body.translation, "Перевод", 1, 240);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
    patch.translation = String(body.translation).trim();
  }
  for (const key of ["transcription", "language", "partOfSpeech", "example", "notes"]) {
    if (body[key] !== undefined) {
      patch[key] = String(body[key] || "").trim();
    }
  }
  if (body.tags !== undefined) {
    patch.tags = Array.isArray(body.tags)
      ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
      : String(body.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  }
  if (body.mastery !== undefined) {
    patch.mastery = clampMastery(body.mastery);
  }
  const item = await Word.findOneAndUpdate(filter, patch, { new: true }).lean();
  if (!item) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  await notify(String(user._id), "Слово обновлено", `Изменения для «${item.term}» сохранены.`, "info");
  return NextResponse.json({ item: serialize(item) });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const filter = idFilter(user._id, params.id);
  if (!filter) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  const item = await Word.findOneAndDelete(filter).lean();
  if (!item) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  await notify(String(user._id), "Слово удалено", `«${item.term}» удалено из словаря.`, "warning");
  return NextResponse.json({ ok: true });
}
