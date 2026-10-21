import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { requireString } from "@/lib/validate";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const body = await request.json().catch(() => ({}));
  const errors = [
    requireString(body.currentPassword, "Текущий пароль", 1, 72),
    requireString(body.newPassword, "Новый пароль", 8, 72),
  ].filter(Boolean) as string[];
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }
  if (!(await bcrypt.compare(String(body.currentPassword), user.passwordHash))) {
    return NextResponse.json({ error: "Текущий пароль указан неверно" }, { status: 400 });
  }
  if (body.currentPassword === body.newPassword) {
    return NextResponse.json({ error: "Новый пароль должен отличаться от текущего" }, { status: 400 });
  }
  user.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
  await user.save();
  await notify(String(user._id), "Пароль изменён", "Для следующего входа используйте новый пароль.", "warning");
  return NextResponse.json({ ok: true });
}
