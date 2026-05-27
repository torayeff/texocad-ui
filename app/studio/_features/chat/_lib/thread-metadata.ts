import type { Client } from "@langchain/langgraph-sdk";

import { CAD_ASSISTANT_ID, SKETCH_ASSISTANT_ID, type StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";
import {
  designRevisionsFromMessages,
  sketchRevisionsFromMessages,
} from "@/app/studio/_features/design-revisions/_lib/design-artifacts";
import { isRecord } from "@/app/lib/type-guards";

export const THREAD_GRAPH_METADATA_KEY = "graph_id";
export const THREAD_TITLE_METADATA_KEY = "texocad_title";
export const THREAD_TITLE_MAX_LENGTH = 100;

interface ThreadMetadata {
  metadata?: unknown;
  values?: unknown;
}

function isStudioAssistantId(value: unknown): value is StudioAssistantId {
  return value === CAD_ASSISTANT_ID || value === SKETCH_ASSISTANT_ID;
}

export function normalizeThreadTitle(value: string): string | null {
  const title = value.trim();
  if (!title) return null;
  if (title.length <= THREAD_TITLE_MAX_LENGTH) return title;
  return `${title.slice(0, THREAD_TITLE_MAX_LENGTH - 3).trimEnd()}...`;
}

export function defaultThreadTitle(threadId: string): string {
  return `Thread-${threadId}`;
}

export function titleFromThreadMetadata(thread: ThreadMetadata | null | undefined): string | null {
  if (!thread || !isRecord(thread.metadata)) return null;
  const title = thread.metadata[THREAD_TITLE_METADATA_KEY];
  return typeof title === "string" ? normalizeThreadTitle(title) : null;
}

export function modeFromThreadMetadata(thread: ThreadMetadata | null | undefined): StudioAssistantId | null {
  if (!thread || !isRecord(thread.metadata)) return null;
  const graphId = thread.metadata[THREAD_GRAPH_METADATA_KEY];
  return isStudioAssistantId(graphId) ? graphId : null;
}

export function modeFromThreadValues(thread: ThreadMetadata | null | undefined): StudioAssistantId | null {
  if (!thread || !isRecord(thread.values)) return null;
  const messages = thread.values.messages;
  if (!Array.isArray(messages)) return null;
  if (sketchRevisionsFromMessages(messages).length > 0) return SKETCH_ASSISTANT_ID;
  if (designRevisionsFromMessages(messages).length > 0) return CAD_ASSISTANT_ID;
  return null;
}

export function modeFromThread(thread: ThreadMetadata | null | undefined): StudioAssistantId | null {
  return modeFromThreadMetadata(thread) ?? modeFromThreadValues(thread);
}

export async function readThreadMode(client: Client, threadId: string): Promise<StudioAssistantId | null> {
  const thread = await client.threads.get(threadId);
  return modeFromThread(thread);
}
