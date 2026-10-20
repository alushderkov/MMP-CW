import Notice from "./models/Notice";
import { pushEvent } from "./sse";

export async function notify(
  userId: string,
  title: string,
  message: string,
  kind: "info" | "success" | "warning" = "info"
) {
  const notice = await Notice.create({ userId, title, message, kind });
  const payload = {
    id: String(notice._id),
    title: notice.title,
    message: notice.message,
    kind: notice.kind,
    read: false,
    createdAt: notice.createdAt,
  };
  pushEvent(userId, payload);
  return payload;
}
