import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Word from "@/lib/models/Word";
import Lesson from "@/lib/models/Lesson";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const [words, lessons] = await Promise.all([
    Word.find({ userId: user._id }).lean(),
    Lesson.find({ userId: user._id }).lean(),
  ]);
  const byMastery = [0, 1, 2, 3, 4, 5].map((level) => ({
    level,
    count: words.filter((w) => w.mastery === level).length,
  }));
  const learned = words.filter((w) => w.mastery >= 4).length;
  const byLanguage: Record<string, number> = {};
  for (const word of words) {
    byLanguage[word.language] = (byLanguage[word.language] || 0) + 1;
  }
  return NextResponse.json({
    wordsTotal: words.length,
    lessonsTotal: lessons.length,
    learned,
    byMastery,
    byLanguage,
  });
}
