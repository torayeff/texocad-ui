import { randomBytes } from "node:crypto";

const SLUG_SAFE_CHARS = /[^a-z0-9-]+/g;
const TABLE_KEY_UNSAFE_CHARS = /[/\\#?\n\r\t]/g;

export function safeTableKey(value: string) {
  return value.trim().replace(TABLE_KEY_UNSAFE_CHARS, "_");
}

export function slugifyShareName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(SLUG_SAFE_CHARS, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
    .replace(/^-|-$/g, "");
}

export function makeShareSlug(name: string) {
  const base = slugifyShareName(name) || "share";
  const suffix = randomBytes(4).toString("base64url").toLowerCase().replace(SLUG_SAFE_CHARS, "").slice(0, 6);
  return `${base}-${suffix}`;
}
