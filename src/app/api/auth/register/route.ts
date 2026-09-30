import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import User from "@/lib/models/User";
import { isEmail, requireString } from "@/lib/validate";
import { publicUser, setSessionCookie, signToken } from "@/lib/auth";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";


export async function POST(request: NextRequest) {
  await connectDb();
  const body = await request.json().catch(() => ({}));
  const errors = [
    requireString(body.name, "Имя", 2, 80),
    requireString(body.email, "Почта", 5, 120),
    requireString(body.password, "Пароль", 8, 72),
  ].filter(Boolean) as string[];

  if (body.email && !isEmail(String(body.email))) {
    errors.push("Почта: некорректный формат");
  }
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: "Пользователь с такой почтой уже существует" }, { status: 409 });
  }

  const user = await User.create({
    name: String(body.name).trim(),
    email,
    passwordHash: await bcrypt.hash(String(body.password), 10),
    nativeLanguage: body.nativeLanguage || "ru",
    targetLanguage: body.targetLanguage || "en",
  });

  await notify(String(user._id), "Регистрация завершена", "Личный кабинет готов к работе со словарём и уроками.", "success");
  const response = NextResponse.json({ user: publicUser(user) });
  return setSessionCookie(response, signToken(String(user._id)));
}
