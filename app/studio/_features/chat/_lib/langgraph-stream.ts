import type { BaseMessage } from "@langchain/core/messages";

import type { SubagentView } from "@/app/studio/_features/chat/_lib/message-rows";
import type { StreamToolCall } from "@/app/studio/_features/chat/_types/chat";
import { isRecord } from "@/app/lib/type-guards";

export interface CreatedRunIds {
  runId: string | null;
  threadId: string | null;
}

export interface StreamRowAccessors {
  getToolCalls: (message: BaseMessage) => StreamToolCall[];
  getSubagentsByMessage: (messageId: string) => SubagentView[];
}

interface StreamThreadControls {
  joinStream?: (runId: string) => void | Promise<void>;
  switchThread?: (threadId: string | null) => void | Promise<void>;
}

type JoinStream = NonNullable<StreamThreadControls["joinStream"]>;
type SwitchThread = NonNullable<StreamThreadControls["switchThread"]>;

interface ThreadRun {
  createdAt?: string;
  created_at?: string;
  runId?: string;
  run_id?: string;
  status?: string;
}

const EMPTY_TOOL_CALLS: StreamToolCall[] = [];
const EMPTY_SUBAGENTS: SubagentView[] = [];

function stringValue(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function runId(run: ThreadRun) {
  return run.run_id ?? run.runId ?? null;
}

function runCreatedAt(run: ThreadRun) {
  const value = run.created_at ?? run.createdAt;
  return value ? Date.parse(value) : 0;
}

export function createdRunIds(run: unknown, fallbackThreadId: string | null): CreatedRunIds {
  if (!isRecord(run)) {
    return { runId: null, threadId: fallbackThreadId };
  }

  return {
    runId: stringValue(run, "run_id", "runId"),
    threadId: stringValue(run, "thread_id", "threadId") ?? fallbackThreadId,
  };
}

export function latestActiveRunId(runs: unknown) {
  if (!Array.isArray(runs)) return null;

  return runs
    .filter((run): run is ThreadRun => (
      isRecord(run) &&
      (run.status === "pending" || run.status === "running")
    ))
    .sort((a, b) => runCreatedAt(b) - runCreatedAt(a))
    .map(runId)[0] ?? null;
}

export function streamThreadControls(stream: unknown): StreamThreadControls {
  if (!isRecord(stream)) return {};

  const joinStream = stream.joinStream;
  const switchThread = stream.switchThread;

  return {
    joinStream: typeof joinStream === "function" ? joinStream as JoinStream : undefined,
    switchThread: typeof switchThread === "function" ? switchThread as SwitchThread : undefined,
  };
}

export function streamRowAccessors(stream: unknown): StreamRowAccessors {
  if (!isRecord(stream)) {
    return {
      getToolCalls: () => EMPTY_TOOL_CALLS,
      getSubagentsByMessage: () => EMPTY_SUBAGENTS,
    };
  }

  const getToolCalls = typeof stream.getToolCalls === "function"
    ? stream.getToolCalls
    : null;
  const getSubagentsByMessage = typeof stream.getSubagentsByMessage === "function"
    ? stream.getSubagentsByMessage
    : null;

  return {
    getToolCalls: (message) => {
      const toolCalls = getToolCalls?.(message);
      return Array.isArray(toolCalls) ? toolCalls as StreamToolCall[] : EMPTY_TOOL_CALLS;
    },
    getSubagentsByMessage: (messageId) => {
      const subagents = getSubagentsByMessage?.(messageId);
      return Array.isArray(subagents) ? subagents as SubagentView[] : EMPTY_SUBAGENTS;
    },
  };
}
