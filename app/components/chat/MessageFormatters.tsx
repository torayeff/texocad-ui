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
} from "lucide-react";

import type { ChatMessage, ToolCallInfo, ToolCallState } from "./types";

const REMARK_PLUGINS = [remarkGfm];

export function PanelTimer({ active }: { active: boolean }) {
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

  if (!active && seconds === 0) return null;

  return (
    <span className="text-[10px] text-muted-foreground/60 font-medium tabular-nums">
      {seconds}s
    </span>
  );
}

function useAutoScroll<T extends HTMLElement>() {
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
  pending: "text-muted-foreground animate-pulse",
  completed: "text-success",
  error: "text-error",
};

export const ThinkingBlock = React.memo(function ThinkingBlock({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const [scrollRef, handleScroll] = useAutoScroll<HTMLDivElement>();
  const reasoning = message.thinking;

  if (!reasoning) return null;

  return (
    <details open className="group rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      <summary className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
        <Brain size={14} className="flex-shrink-0 text-muted-foreground/70" />
        <span>Thinking{isStreaming ? "..." : ""}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={isStreaming} />
          {!isStreaming && <CircleCheck size={14} className="flex-shrink-0 text-success" />}
          <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground/50 transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <div ref={scrollRef} onScroll={handleScroll} className="px-3.5 pb-2.5 max-h-60 overflow-y-auto">
        <div className="prose-chat text-muted-foreground">
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
            {reasoning}
          </ReactMarkdown>
        </div>
      </div>
    </details>
  );
});

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
    <details open className="group rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      <summary className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
        <Wrench size={14} className="flex-shrink-0 text-muted-foreground/70" />
        <span className="font-mono">{name}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {statusIcon}
          <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground/50 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-border/40">
        {args && Object.keys(args).length > 0 && (
          <details className="group/inner border-b border-border/40">
            <summary className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
              Input
              <span className="ml-1 group-open/inner:hidden">...</span>
            </summary>
            <div className="px-3 pb-2">
              <pre ref={inputScrollRef} onScroll={handleInputScroll} className="text-xs font-mono text-foreground whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {result && (
          <details className="group/inner">
            <summary className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
              Output
              <span className="ml-1 group-open/inner:hidden">...</span>
            </summary>
            <div className="px-3 pb-2">
              <pre ref={outputScrollRef} onScroll={handleOutputScroll} className="text-xs font-mono text-foreground whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {result}
              </pre>
            </div>
          </details>
        )}
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
  in_progress: <Loader2 size={14} className="flex-shrink-0 text-accent animate-spin" />,
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
    <div className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-muted-foreground">
        <ListTodo size={14} className="flex-shrink-0 text-muted-foreground/70" />
        <span>Tasks</span>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
          {completedCount}/{todos.length}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {allDone && <CircleCheck size={14} className="flex-shrink-0 text-success" />}
        </div>
      </div>
      {todos.length > 0 && (
        <ul className="border-t border-border/40 px-3.5 py-2 space-y-1.5">
          {todos.map((todo, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5">
                {TODO_STATUS_ICON[todo.status] ?? TODO_STATUS_ICON.pending}
              </span>
              <span className={todo.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}>
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export const AITextContent = React.memo(function AITextContent({
  message,
}: {
  message: ChatMessage;
}) {
  if (!message.content.trim()) return null;

  return (
    <div className="prose-chat">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
        {message.content}
      </ReactMarkdown>
    </div>
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
