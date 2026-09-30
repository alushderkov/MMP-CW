import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Word from "@/lib/models/Word";
import { clampMastery, parseListQuery, requireString } from "@/lib/validate";
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

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const { q, sort, order } = parseListQuery(new URL(request.url), "words");
  const filter: Record<string, unknown> = { userId: user._id };
  if (q) {
    filter.$or = [
      { term: { $regex: q, $options: "i" } },
      { translation: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ];
  }
  const items = await Word.find(filter).sort({ [sort]: order }).lean();
  return NextResponse.json({ items: items.map(serialize) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const errors = [
    requireString(body.term, "Слово", 1, 120),
    requireString(body.translation, "Перевод", 1, 240),
  ].filter(Boolean) as string[];
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : String(body.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  const created = await Word.create({
    userId: user._id,
    term: String(body.term).trim(),
    translation: String(body.translation).trim(),
    transcription: String(body.transcription || "").trim(),
    language: String(body.language || user.targetLanguage || "en").trim(),
    partOfSpeech: String(body.partOfSpeech || "").trim(),
    example: String(body.example || "").trim(),
    notes: String(body.notes || "").trim(),
    tags,
    mastery: clampMastery(body.mastery),
  });

  await notify(String(user._id), "Слово добавлено", `«${created.term}» сохранено в словаре.`, "success");
  return NextResponse.json({ item: serialize(created.toObject()) }, { status: 201 });
}
