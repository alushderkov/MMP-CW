import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Lesson from "@/lib/models/Lesson";
import { readLessonFields, serializeLessons } from "@/lib/lessons";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  const doc = await Lesson.findOne({ _id: params.id, userId: user._id }).lean<Record<string, unknown>>();
  if (!doc) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  const [item] = await serializeLessons(user._id, [doc]);
  return NextResponse.json({ item });
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
  const { errors, data } = await readLessonFields(user._id, body, true);
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }
  const doc = await Lesson.findOneAndUpdate({ _id: params.id, userId: user._id }, data, { new: true }).lean<Record<string, unknown>>();
  if (!doc) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  await notify(String(user._id), "Урок обновлён", `Изменения для «${doc.title}» сохранены.`, "info");
  const [item] = await serializeLessons(user._id, [doc]);
  return NextResponse.json({ item });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  const deleted = await Lesson.findOneAndDelete({ _id: params.id, userId: user._id }).lean<Record<string, unknown>>();
  if (!deleted) {
    return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  }
  await notify(String(user._id), "Урок удалён", `«${deleted.title}» удалён.`, "warning");
  return NextResponse.json({ ok: true });
}
