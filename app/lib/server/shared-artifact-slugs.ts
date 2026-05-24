import { randomBytes } from "node:crypto";

import { slugify } from "@/app/lib/slugify";

const TABLE_KEY_UNSAFE_CHARS = /[/\\#?\n\r\t]/g;

export function safeTableKey(value: string) {
  return value.trim().replace(TABLE_KEY_UNSAFE_CHARS, "_");
}

export function slugifyShareName(name: string) {
  return slugify(name, { maxLength: 48 });
}

export function makeShareSlug(name: string) {
  const base = slugifyShareName(name) || "share";
  const suffix = randomBytes(4).toString("base64url").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 6);
  return `${base}-${suffix}`;
}
