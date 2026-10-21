import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, publicUser, unauthorized } from "@/lib/auth";
import { isNativeLanguage, isStudyLanguage } from "@/lib/catalog";
import { requireString } from "@/lib/validate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const errors: string[] = [];
  if (body.name !== undefined) {
    const err = requireString(body.name, "Имя", 2, 80);
    if (err) errors.push(err);
    else user.name = String(body.name).trim();
  }
  if (body.nativeLanguage !== undefined) {
    if (!isNativeLanguage(String(body.nativeLanguage))) errors.push("Родной язык: выберите значение из списка");
    else user.nativeLanguage = String(body.nativeLanguage);
  }
  if (body.targetLanguage !== undefined) {
    if (!isStudyLanguage(String(body.targetLanguage))) errors.push("Изучаемый язык: выберите значение из списка");
    else user.targetLanguage = String(body.targetLanguage);
  }
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }
  await user.save();
  await notify(String(user._id), "Профиль обновлён", "Имя и языковые настройки сохранены.", "info");
  return NextResponse.json({ user: publicUser(user) });
}
