import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDb();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 503 });
  }
}
