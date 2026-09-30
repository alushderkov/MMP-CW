import { NextResponse } from "next/server";
import { getCurrentUser, publicUser, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  return NextResponse.json({ user: publicUser(user) });
}
