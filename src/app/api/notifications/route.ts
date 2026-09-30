import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import Notice from "@/lib/models/Notice";

export const dynamic = "force-dynamic";


export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  const items = await Notice.find({ userId: user._id }).sort({ createdAt: -1 }).limit(40).lean();
  return NextResponse.json({
    items: items.map((item) => ({
      id: String(item._id),
      title: item.title,
      message: item.message,
      kind: item.kind,
      read: item.read,
      createdAt: item.createdAt,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorized();
  }
  await Notice.updateMany({ userId: user._id, read: false }, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
