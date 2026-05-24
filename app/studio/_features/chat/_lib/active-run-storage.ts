import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";

const ACTIVE_RUN_STORAGE_KEY = "texocad.activeAgentRun.v1";

export interface ActiveRunRecord {
  assistantId: StudioAssistantId;
  runId: string;
  threadId: string;
}

function isActiveRunRecord(value: unknown): value is ActiveRunRecord {
  if (value === null || typeof value !== "object") return false;
  const record = value as Partial<ActiveRunRecord>;
  return (
    (record.assistantId === "cad" || record.assistantId === "sketch") &&
    typeof record.runId === "string" &&
    record.runId.length > 0 &&
    typeof record.threadId === "string" &&
    record.threadId.length > 0
  );
}

export function readStoredActiveRun(): ActiveRunRecord | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACTIVE_RUN_STORAGE_KEY) ?? "null");
    return isActiveRunRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredActiveRun(record: ActiveRunRecord) {
  localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, JSON.stringify(record));
}

export function clearStoredActiveRun(record?: ActiveRunRecord | null) {
  if (!record) {
    localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
    return;
  }

  const stored = readStoredActiveRun();
  if (
    stored?.assistantId === record.assistantId &&
    stored.threadId === record.threadId &&
    stored.runId === record.runId
  ) {
    localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY);
  }
}

export function activeRunMatches(record: ActiveRunRecord | null, assistantId: StudioAssistantId, threadId: string | null) {
  return record?.assistantId === assistantId && record.threadId === threadId;
}
