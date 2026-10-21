import { Types } from "mongoose";
import Word from "./models/Word";
import { LEVELS, isStudyLanguage } from "./catalog";
import { parseObjectIds, requireString } from "./validate";

type LessonDoc = Record<string, unknown> & { words?: unknown[] };
type WordRef = { _id: unknown; term: string; translation: string; transcription?: string; language: string };

export async function serializeLessons(userId: unknown, docs: LessonDoc[]) {
  const ids = docs.flatMap((doc) => (doc.words || []).map(String));
  const refs = ids.length
    ? await Word.find({ userId, _id: { $in: ids } }, "term translation transcription language").lean<WordRef[]>()
    : [];
  const byId = new Map(refs.map((ref) => [String(ref._id), ref]));
  return docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    language: doc.language,
    level: doc.level,
    words: (doc.words || [])
      .map((id) => byId.get(String(id)))
      .filter((ref): ref is WordRef => Boolean(ref))
      .map((ref) => ({
        id: String(ref._id),
        term: ref.term,
        translation: ref.translation,
        transcription: ref.transcription || "",
        language: ref.language,
      })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
}

export async function readLessonFields(userId: unknown, body: Record<string, unknown>, partial: boolean) {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  const has = (key: string) => body[key] !== undefined;

  if (!partial || has("title")) {
    const err = requireString(body.title, "Название", 2, 160);
    if (err) errors.push(err);
    else data.title = String(body.title).trim();
  }
  if (!partial || has("content")) {
    const err = requireString(body.content, "Содержание", 10, 8000);
    if (err) errors.push(err);
    else data.content = String(body.content).trim();
  }
  if (!partial || has("level")) {
    const level = String(body.level || "A1").toUpperCase();
    if (!LEVELS.includes(level)) errors.push("Уровень: допустимы A1, A2, B1, B2, C1, C2");
    else data.level = level;
  }
  if (has("language")) {
    const language = String(body.language).trim();
    if (!isStudyLanguage(language)) errors.push("Язык: выберите значение из списка");
    else data.language = language;
  }
  if (!partial || has("words")) {
    const ids = parseObjectIds(body.words);
    const owned = ids.length ? await Word.find({ userId, _id: { $in: ids } }, "_id").lean<{ _id: Types.ObjectId }[]>() : [];
    const ownedSet = new Set(owned.map((item) => String(item._id)));
    data.words = ids.filter((id) => ownedSet.has(id));
  }
  return { errors, data };
}
