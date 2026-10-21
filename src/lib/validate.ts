import mongoose from "mongoose";

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

export function optionalString(value: unknown, field: string, max: number) {
  if (value === undefined || value === null) {
    return null;
  }
  return requireString(String(value), field, 0, max);
}

export function clampMastery(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.min(5, Math.round(n)));
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseTags(value: unknown) {
  const list = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of list) {
    const tag = String(item).trim().toLowerCase().slice(0, 30);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags.slice(0, 12);
}

export function parseObjectIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(new Set(value.map(String))).filter((id) => mongoose.Types.ObjectId.isValid(id));
}

const SORT_WORDS = new Set(["term", "translation", "createdAt", "updatedAt", "mastery", "language"]);
const SORT_LESSONS = new Set(["title", "level", "language", "createdAt", "updatedAt"]);

export function parseListQuery(url: URL, kind: "words" | "lessons") {
  const q = (url.searchParams.get("q") || "").trim();
  const sortRaw = url.searchParams.get("sort") || "createdAt";
  const allowed = kind === "words" ? SORT_WORDS : SORT_LESSONS;
  const sort = allowed.has(sortRaw) ? sortRaw : "createdAt";
  const order: 1 | -1 = url.searchParams.get("order") === "asc" ? 1 : -1;
  const limitRaw = Number(url.searchParams.get("limit"));
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 0;
  const sortSpec: Record<string, 1 | -1> = { [sort]: order, _id: order };
  return { q, sort, order, limit, sortSpec };
}
