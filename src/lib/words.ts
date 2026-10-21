import { isStudyLanguage, normalizePartOfSpeech } from "./catalog";
import { clampMastery, optionalString, parseTags, requireString } from "./validate";

export function serializeWord(doc: Record<string, unknown>) {
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

export function readWordFields(body: Record<string, unknown>, partial: boolean) {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  const has = (key: string) => body[key] !== undefined;

  if (!partial || has("term")) {
    const err = requireString(body.term, "Слово", 1, 120);
    if (err) errors.push(err);
    else data.term = String(body.term).trim();
  }
  if (!partial || has("translation")) {
    const err = requireString(body.translation, "Перевод", 1, 240);
    if (err) errors.push(err);
    else data.translation = String(body.translation).trim();
  }
  for (const [key, field, max] of [
    ["transcription", "Транскрипция", 80],
    ["example", "Пример", 400],
    ["notes", "Заметка", 400],
  ] as const) {
    if (!partial || has(key)) {
      const err = optionalString(body[key], field, max);
      if (err) errors.push(err);
      else data[key] = String(body[key] ?? "").trim();
    }
  }
  if (has("language")) {
    const language = String(body.language).trim();
    if (!isStudyLanguage(language)) errors.push("Язык: выберите значение из списка");
    else data.language = language;
  }
  if (!partial || has("partOfSpeech")) {
    const pos = normalizePartOfSpeech(body.partOfSpeech);
    if (pos === null) errors.push("Часть речи: выберите значение из списка");
    else data.partOfSpeech = pos;
  }
  if (!partial || has("tags")) {
    data.tags = parseTags(body.tags);
  }
  if (!partial || has("mastery")) {
    data.mastery = clampMastery(body.mastery);
  }
  return { errors, data };
}
