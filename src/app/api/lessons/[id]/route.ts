import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Lesson from "@/lib/models/Lesson";
import { requireString } from "@/lib/validate";
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const err = requireString(body.title, "Название", 2, 160);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
    patch.title = String(body.title).trim();
  }
  if (body.content !== undefined) {
    const err = requireString(body.content, "Содержание", 10, 8000);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
    patch.content = String(body.content).trim();
  }
  if (body.language !== undefined) {
    patch.language = String(body.language).trim();
  }
  if (body.level !== undefined) {
    const level = String(body.level).toUpperCase();
    if (!LEVELS.has(level)) {
      return NextResponse.json({ error: "Уровень: допустимы A1, A2, B1, B2, C1, C2" }, { status: 400 });
    }
    patch.level = level;
  }
  const item = await Lesson.findOneAndUpdate({ _id: params.id, userId: user._id }, patch, { new: true }).lean();
  if (!item) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  const doc = item as Record<string, unknown>;
  await notify(String(user._id), "Урок обновлён", `Изменения для «${doc.title}» сохранены.`, "info");
  return NextResponse.json({ item: serialize(doc) });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
    const deleted = await Lesson.findOneAndDelete({ _id: params.id, userId: user._id }).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  const doc = deleted as Record<string, unknown>;
  await notify(String(user._id), "Урок удалён", `«${doc.title}» удалён.`, "warning");
  return NextResponse.json({ ok: true });
}
