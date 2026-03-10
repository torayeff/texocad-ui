import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Brain,
  Wrench,
  ChevronDown,
  ListTodo,
  Circle,
  Loader2,
  Bot,
} from "lucide-react";

import type { ChatMessage, ToolCallInfo, ToolCallState } from "./types";
import { findToolCall } from "./groupBlocks";
import type { BlockGroup } from "./groupBlocks";

const REMARK_PLUGINS = [remarkGfm];

function formatDuration(seconds: number): string {
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
}

export function PanelTimer({
  active,
  fixedSeconds,
}: {
  active: boolean;
  fixedSeconds?: number;
}) {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    startRef.current = Date.now();

    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [active]);

  if (fixedSeconds !== undefined) {
    return (
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
        {formatDuration(fixedSeconds)}
      </span>
    );
  }

  if (!active && seconds === 0) return null;

  return (
    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
      {formatDuration(seconds)}
    </span>
  );
}

export function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (el && stickRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  });

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
  }, []);

  return [ref, onScroll] as const;
}

const TOOL_CALL_STATUS_CLASS: Record<ToolCallState, string> = {
  pending: "text-success",
  completed: "text-success",
  error: "text-error",
};

const TOOL_CALL_STATUS_LABEL: Record<ToolCallState, string> = {
  pending: "Running",
  completed: "Done",
  error: "Failed",
};

export const ToolCallCard = React.memo(function ToolCallCard({
  toolCall,
}: {
  toolCall: ToolCallInfo;
}) {
  const [inputScrollRef, handleInputScroll] = useAutoScroll<HTMLPreElement>();
  const [outputScrollRef, handleOutputScroll] = useAutoScroll<HTMLPreElement>();
  const { name, args, result, state } = toolCall;
  const cls = `flex-shrink-0 ${TOOL_CALL_STATUS_CLASS[state]}`;

  const statusIcon =
    state === "completed" ? <CircleCheck size={14} className={cls} /> :
      state === "error" ? <CircleX size={14} className={cls} /> :
        <CircleDashed size={14} className={cls} />;

  return (
    <details className="group">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Wrench size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground/85">
          {name}
        </span>
        {state !== "completed" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${state === "pending" ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
          >
            {TOOL_CALL_STATUS_LABEL[state]}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {statusIcon}
          <ChevronDown size={13} className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="mt-2 space-y-3 border-l border-border/30 pl-4">
        {args && Object.keys(args).length > 0 ? (
          <section className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
              Input
            </p>
            <pre
              ref={inputScrollRef}
              onScroll={handleInputScroll}
              className="max-h-40 overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-all text-foreground"
            >
              {JSON.stringify(args, null, 2)}
            </pre>
          </section>
        ) : null}

        {result ? (
          <section className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
              Output
            </p>
            <pre
              ref={outputScrollRef}
              onScroll={handleOutputScroll}
              className="max-h-40 overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-all text-foreground"
            >
              {result}
            </pre>
          </section>
        ) : null}
      </div>
    </details>
  );
});

interface TodoItem {
  content: string;
  status: string;
}

const TODO_STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CircleCheck size={14} className="flex-shrink-0 text-success" />,
  in_progress: <Loader2 size={14} className="flex-shrink-0 text-success animate-spin" />,
  pending: <Circle size={14} className="flex-shrink-0 text-muted-foreground/50" />,
};

export const TodoCard = React.memo(function TodoCard({
  toolCall,
}: {
  toolCall: ToolCallInfo;
}) {
  const { args, state } = toolCall;
  const todos: TodoItem[] = (args?.todos as TodoItem[]) ?? [];
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const allDone = todos.length > 0 && completedCount === todos.length;

  return (
    <details className="group">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ListTodo size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="font-medium text-foreground/85">Tasks</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground/80">
          {completedCount}/{todos.length}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {state === "pending" ? (
            <Loader2 size={13} className="flex-shrink-0 animate-spin text-success" />
          ) : allDone ? (
            <CircleCheck size={14} className="flex-shrink-0 text-success" />
          ) : null}
          <ChevronDown size={13} className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open:rotate-180" />
        </div>
      </summary>
      {todos.length > 0 ? (
        <ul className="mt-2 space-y-2 border-l border-border/30 pl-4">
          {todos.map((todo, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">
                {TODO_STATUS_ICON[todo.status] ?? TODO_STATUS_ICON.pending}
              </span>
              <span className={todo.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}>
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
});

export const InlineThinkingBlock = React.memo(function InlineThinkingBlock({
  content,
  isStreaming = false,
  defaultOpen = false,
}: {
  content: string;
  isStreaming?: boolean;
  defaultOpen?: boolean;
}) {
  const [scrollRef, handleScroll] = useAutoScroll<HTMLDivElement>();

  if (!content) return null;

  return (
    <details open={defaultOpen || undefined} className="group">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Brain size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span>Thinking{isStreaming ? "..." : ""}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={isStreaming} />
          {!isStreaming && <CircleCheck size={14} className="flex-shrink-0 text-success" />}
          <ChevronDown size={13} className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-2 max-h-60 overflow-y-auto border-l border-border/30 pl-4"
      >
        <div className="prose-chat text-muted-foreground">
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </details>
  );
});

export const InlineTextContent = React.memo(function InlineTextContent({
  content,
}: {
  content: string;
}) {
  if (!content.trim()) return null;

  return (
    <div className="prose-chat">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

export const SubagentGroup = React.memo(function SubagentGroup({
  group,
  toolCalls,
  isStreaming = false,
  visibleTodoCallIds,
}: {
  group: BlockGroup & { kind: "subagent" };
  toolCalls: ToolCallInfo[];
  isStreaming?: boolean;
  visibleTodoCallIds?: Set<string>;
}) {
  const allDone = group.blocks.every((b) => {
    if (b.kind === "tool_call" || b.kind === "tool_result") {
      const tc = findToolCall(toolCalls, b.toolCallId);
      return tc?.state === "completed";
    }
    return true;
  });
  const active = isStreaming || !allDone;

  return (
    <details className="group/sub">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="font-medium text-foreground/85">{group.agent}</span>
        {active ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            Active
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={active} />
          {!active && <CircleCheck size={14} className="flex-shrink-0 text-success" />}
          <ChevronDown size={13} className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/sub:rotate-180" />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {group.blocks.map((block, i) => {
          switch (block.kind) {
            case "thinking": {
              const isLast = isStreaming && i === group.blocks.length - 1;
              return (
                <InlineThinkingBlock
                  key={i}
                  content={block.content}
                  isStreaming={isLast}
                  defaultOpen={false}
                />
              );
            }
            case "text":
              return <InlineTextContent key={i} content={block.content} />;
            case "tool_call":
            case "tool_result": {
              if (block.kind === "tool_result") return null;
              const tc = findToolCall(toolCalls, block.toolCallId);
              if (!tc) return null;
              if (tc.name === "write_todos") {
                if (!visibleTodoCallIds?.has(tc.id)) return null;
                return <TodoCard key={tc.id} toolCall={tc} />;
              }
              return <ToolCallCard key={tc.id} toolCall={tc} />;
            }
            default: {
              const exhaustiveCheck: never = block;
              return exhaustiveCheck;
            }
          }
        })}
      </div>
    </details>
  );
});

export const MessageBubble = React.memo(function MessageBubble({
  message,
}: {
  message: ChatMessage;
}) {
  if (message.role !== "human") return null;

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
});
