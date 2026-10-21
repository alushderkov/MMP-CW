import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Word from "@/lib/models/Word";
import Lesson from "@/lib/models/Lesson";
import { readWordFields, serializeWord } from "@/lib/words";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

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
  const item = await Word.findOne(filter).lean<Record<string, unknown>>();
  if (!item) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  return NextResponse.json({ item: serializeWord(item) });
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
  const { errors, data } = readWordFields(body, true);
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }
  const item = await Word.findOneAndUpdate(filter, data, { new: true }).lean<Record<string, unknown>>();
  if (!item) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  const onlyMastery = Object.keys(data).length === 1 && "mastery" in data;
  if (!onlyMastery) {
    await notify(String(user._id), "Слово обновлено", `Изменения для «${item.term}» сохранены.`, "info");
  }
  return NextResponse.json({ item: serializeWord(item) });
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
  const item = await Word.findOneAndDelete(filter).lean<Record<string, unknown>>();
  if (!item) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }
  await Lesson.updateMany({ userId: user._id, words: item._id }, { $pull: { words: item._id } });
  await notify(String(user._id), "Слово удалено", `«${item.term}» удалено из словаря.`, "warning");
  return NextResponse.json({ ok: true });
}
