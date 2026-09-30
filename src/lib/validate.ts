export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function requireString(value: unknown, field: string, min = 1, max = 500) {
  if (typeof value !== "string") {
    return `${field}: значение должно быть строкой`;
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return `${field}: минимум ${min} символ(ов)`;
  }
  if (trimmed.length > max) {
    return `${field}: максимум ${max} символов`;
  }
  return null;
}

export function clampMastery(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(5, Math.round(n)));
}

const SORT_WORDS = new Set(["term", "translation", "createdAt", "updatedAt", "mastery", "language"]);
const SORT_LESSONS = new Set(["title", "level", "language", "createdAt", "updatedAt"]);

export function parseListQuery(url: URL, kind: "words" | "lessons") {
  const q = (url.searchParams.get("q") || "").trim();
  const sortRaw = url.searchParams.get("sort") || "createdAt";
  const allowed = kind === "words" ? SORT_WORDS : SORT_LESSONS;
  const sort = allowed.has(sortRaw) ? sortRaw : "createdAt";
  const order = url.searchParams.get("order") === "asc" ? 1 : -1;
  return { q, sort, order };
}
