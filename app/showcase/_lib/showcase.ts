import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

import {
  absoluteSiteUrl,
  getShowcaseImagePath,
  getShowcaseItemPath,
} from "@/app/lib/site";
import type { ShowcaseItem } from "@/app/showcase/_types/showcase";

const SHOWCASE_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "showcase",
  "showcase.json",
);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

const loadShowcaseItems = cache(async () => {
  const contents = await readFile(SHOWCASE_FILE_PATH, "utf8");
  return JSON.parse(contents) as ShowcaseItem[];
});

export const getAllShowcaseItems = cache(async () => loadShowcaseItems());

export const getShowcaseItemByThreadId = cache(async (threadId: string) => {
  const items = await loadShowcaseItems();
  return items.find((item) => item.thread_id === threadId) ?? null;
});

export function getShowcaseItemCanonical(threadId: string) {
  return absoluteSiteUrl(getShowcaseItemPath(threadId));
}

export function getShowcaseItemImageUrl(threadId: string) {
  return absoluteSiteUrl(getShowcaseImagePath(threadId));
}

export function getShowcaseItemSummary(item: ShowcaseItem) {
  const promptSummary = truncate(normalizeWhitespace(item.prompt), 180);
  return `${item.name} generated with TexoCAD from the prompt: ${promptSummary}`;
}
