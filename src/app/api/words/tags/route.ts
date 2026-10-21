import { NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Word from "@/lib/models/Word";

export const dynamic = "force-dynamic";


export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const tags: string[] = await Word.distinct("tags", { userId: user._id });
  tags.sort((a, b) => a.localeCompare(b, "ru"));
  return NextResponse.json({ items: tags });
}
