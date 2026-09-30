import { getCurrentUser } from "@/lib/auth";
import { subscribe } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Требуется авторизация", { status: 401 });
  }

  const encoder = new TextEncoder();
  let cleanup: () => void = () => undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: string) => controller.enqueue(encoder.encode(payload));
      cleanup = subscribe(String(user._id), send);
      send(`data: ${JSON.stringify({ type: "hello" })}\n\n`);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
