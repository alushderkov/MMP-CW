import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import User from "@/lib/models/User";
import { isEmail, requireString } from "@/lib/validate";
import { publicUser, setSessionCookie, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await connectDb();
  const body = await request.json().catch(() => ({}));
  const errors = [
    requireString(body.email, "Почта", 5, 120),
    requireString(body.password, "Пароль", 1, 72),
  ].filter(Boolean) as string[];
  if (body.email && !isEmail(String(body.email))) {
    errors.push("Почта: некорректный формат");
  }
  if (errors.length) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  const user = await User.findOne({ email: String(body.email).trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(String(body.password), user.passwordHash))) {
    return NextResponse.json({ error: "Неверная почта или пароль" }, { status: 401 });
  }

  const response = NextResponse.json({ user: publicUser(user) });
  return setSessionCookie(response, signToken(String(user._id)));
}
