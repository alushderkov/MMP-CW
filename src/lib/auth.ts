import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDb } from "./db";
import User from "./models/User";

const COOKIE = "lingua_session";

function secret() {
  return process.env.JWT_SECRET || "lingua-course-work-2026";
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, secret(), {
    expiresIn: (process.env.JWT_EXPIRES || "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export async function getCurrentUser() {
  await connectDb();
  const token = cookies().get(COOKIE)?.value;
  if (!token) {
    return null;
  }
  try {
    const payload = jwt.verify(token, secret()) as { sub: string };
    const user = await User.findById(payload.sub);
    return user;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
}

export function publicUser(user: { _id: unknown; name: string; email: string; nativeLanguage: string; targetLanguage: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    nativeLanguage: user.nativeLanguage,
    targetLanguage: user.targetLanguage,
  };
}
