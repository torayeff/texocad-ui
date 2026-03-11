import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  CircleCheck,
  CircleDashed,
  CircleX,
  Loader2,
  Circle,
  ListTodo,
  ChevronDown,
  Wrench,
  Brain,
} from "lucide-react";

import type {
  ChatMessage as ChatMessageType,
  AIBlock,
  ToolCallInfo,
  ToolCallState,
} from "@/app/lib/useChat";


export function useAutoScroll<T extends HTMLElement>() {
  const stickRef = useRef(true);
  const observerRef = useRef<MutationObserver | null>(null);
  const isTickingRef = useRef(false);

  const ref = useCallback((el: T | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (el) {
      const observer = new MutationObserver(() => {
        if (stickRef.current) {
          el.scrollTop = el.scrollHeight;
        }
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });
      observerRef.current = observer;
    }
  }, []);

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (isTickingRef.current) return;
    isTickingRef.current = true;

    const el = e.currentTarget;
    requestAnimationFrame(() => {
      stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
      isTickingRef.current = false;
    });
  }, []);

  return [ref, onScroll] as const;
}

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


export type BlockGroup =
  | { kind: "parent"; blocks: AIBlock[] }
  | { kind: "subagent"; agent: string; blocks: AIBlock[] };

export function groupBlocks(blocks: AIBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  for (const block of blocks) {
    if (block.isSubagent) {
      const last = groups[groups.length - 1];
      if (last && last.kind === "subagent" && last.agent === block.agent) {
        last.blocks.push(block);
      } else {
        groups.push({ kind: "subagent", agent: block.agent, blocks: [block] });
      }
    } else {
      const last = groups[groups.length - 1];
      if (last && last.kind === "parent") {
        last.blocks.push(block);
      } else {
        groups.push({ kind: "parent", blocks: [block] });
      }
    }
  }
  return groups;
}


export function resolveAgentName(message: ChatMessageType): string {
  for (const block of message.blocks) {
    if (!block.isSubagent && block.agent) return block.agent;
  }
  return "";
}

export function formatToolName(name: string): string {
  return name.replace(/_/g, " ");
}

export function getPendingTool(toolCalls: ToolCallInfo[]): ToolCallInfo | undefined {
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    if (toolCalls[i].state === "pending") return toolCalls[i];
  }
  return undefined;
}

export function getLatestVisibleBlock(blocks: AIBlock[]): AIBlock | undefined {
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].kind !== "tool_result") return blocks[i];
  }
  return undefined;
}

export function getActiveThinkingBlock(
  blocks: AIBlock[],
  isStreaming: boolean,
): Extract<AIBlock, { kind: "thinking" }> | undefined {
  if (!isStreaming) return undefined;

  const latestBlock = getLatestVisibleBlock(blocks);
  if (latestBlock?.kind !== "thinking") return undefined;
  return latestBlock;
}

export function getActivitySummary(groups: BlockGroup[], toolCalls: ToolCallInfo[]): string {
  const parts: string[] = [];
  const thinkingCount = groups.reduce(
    (count, group) =>
      count + group.blocks.filter((block) => block.kind === "thinking").length,
    0,
  );
  const subagentCount = groups.filter((group) => group.kind === "subagent").length;

  if (thinkingCount > 0) {
    parts.push(`${thinkingCount} thought${thinkingCount === 1 ? "" : "s"}`);
  }
  if (toolCalls.length > 0) {
    parts.push(`${toolCalls.length} tool${toolCalls.length === 1 ? "" : "s"}`);
  }
  if (subagentCount > 0) {
    parts.push(`${subagentCount} subagent${subagentCount === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}

export function getStatusLabel(message: ChatMessageType, isStreaming: boolean): string | null {
  const pendingTool = getPendingTool(message.toolCalls);
  if (pendingTool) {
    if (pendingTool.isSubagent && pendingTool.agent) {
      return `${pendingTool.agent} running ${formatToolName(pendingTool.name)}`;
    }
    return `Running ${formatToolName(pendingTool.name)}`;
  }

  const latestBlock = getLatestVisibleBlock(message.blocks);
  if (latestBlock?.kind === "thinking") {
    if (latestBlock.isSubagent && latestBlock.agent) return `${latestBlock.agent} thinking`;
    return "Thinking";
  }
  if (latestBlock?.isSubagent && latestBlock.agent && isStreaming) {
    return `${latestBlock.agent} active`;
  }
  if (isStreaming) return "Working";
  if (message.toolCalls.some((toolCall) => toolCall.state === "error")) return "Needs attention";
  return null;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function getAnswerBlocks(blocks: AIBlock[]): Extract<AIBlock, { kind: "text" }>[] {
  return blocks.filter(
    (block): block is Extract<AIBlock, { kind: "text" }> =>
      !block.isSubagent && block.kind === "text",
  );
}

export function hasVisibleParentActivity(
  blocks: AIBlock[],
  toolCallMap: Map<string, ToolCallInfo>,
  visibleTodoCallIdsStr?: string,
): boolean {
  return blocks.some((block) => {
    if (block.kind === "thinking") return true;
    if (block.kind !== "tool_call") return false;
    const toolCall = toolCallMap.get(block.toolCallId);
    if (!toolCall) return false;
    if (toolCall.name !== "write_todos") return true;
    return visibleTodoCallIdsStr?.includes(toolCall.id) ?? false;
  });
}

export function hasVisibleActivity(
  groups: BlockGroup[],
  toolCallMap: Map<string, ToolCallInfo>,
  visibleTodoCallIdsStr?: string,
): boolean {
  return groups.some((group) => {
    if (group.kind === "subagent") return true;
    return hasVisibleParentActivity(group.blocks, toolCallMap, visibleTodoCallIdsStr);
  });
}


const REMARK_PLUGINS = [remarkGfm];

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
    <details open={defaultOpen || undefined} className="group/thinking">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Brain size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span>Thinking{isStreaming ? "..." : ""}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={isStreaming} />
          {!isStreaming && <CircleCheck size={14} className="flex-shrink-0 text-success" />}
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/thinking:rotate-180"
          />
        </div>
      </summary>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mt-2 max-h-60 overflow-y-auto border-l border-border/30 pl-4"
      >
        <div className="prose-chat text-muted-foreground">
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{content}</ReactMarkdown>
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
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{content}</ReactMarkdown>
    </div>
  );
});


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
    state === "completed" ? (
      <CircleCheck size={14} className={cls} />
    ) : state === "error" ? (
      <CircleX size={14} className={cls} />
    ) : (
      <CircleDashed size={14} className={cls} />
    );

  return (
    <details className="group/tool">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <Wrench size={13} className="flex-shrink-0 text-muted-foreground/60" />
        <span className="min-w-0 truncate font-mono text-[11px] font-medium text-foreground/85">
          {name}
        </span>
        {state !== "completed" ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${state === "pending" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              }`}
          >
            {TOOL_CALL_STATUS_LABEL[state]}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5">
          <PanelTimer active={state === "pending"} />
          {statusIcon}
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/tool:rotate-180"
          />
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
              className="max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground"
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
              className="max-h-40 whitespace-pre-wrap break-all overflow-y-auto rounded-lg bg-muted/40 px-3 py-2 text-[11px] font-mono text-foreground"
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

function getTodoItems(value: unknown): TodoItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const { content, status } = item as Record<string, unknown>;
    if (typeof content !== "string" || typeof status !== "string") return [];

    return [{ content, status }];
  });
}

const TODO_STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CircleCheck size={14} className="flex-shrink-0 text-success" />,
  in_progress: <Loader2 size={14} className="flex-shrink-0 text-success animate-spin" />,
  pending: <Circle size={14} className="flex-shrink-0 text-muted-foreground/50" />,
};

export const TodoCard = React.memo(function TodoCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const { args, state } = toolCall;
  const todos = getTodoItems(args.todos);
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const allDone = todos.length > 0 && completedCount === todos.length;

  return (
    <details className="group/todo">
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
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/todo:rotate-180"
          />
        </div>
      </summary>
      {todos.length > 0 ? (
        <ul className="mt-2 space-y-2 border-l border-border/30 pl-4">
          {todos.map((todo, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">
                {TODO_STATUS_ICON[todo.status] ?? TODO_STATUS_ICON.pending}
              </span>
              <span
                className={
                  todo.status === "completed"
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }
              >
                {todo.content}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
});


export const SubagentGroup = React.memo(function SubagentGroup({
  group,
  toolCallMap,
  isStreaming = false,
  visibleTodoCallIdsStr,
  activeThinkingBlock,
}: {
  group: BlockGroup & { kind: "subagent" };
  toolCallMap: Map<string, ToolCallInfo>;
  isStreaming?: boolean;
  visibleTodoCallIdsStr?: string;
  activeThinkingBlock?: Extract<AIBlock, { kind: "thinking" }>;
}) {
  const allDone = group.blocks.every((block) => {
    if (block.kind === "tool_call" || block.kind === "tool_result") {
      const tc = toolCallMap.get(block.toolCallId);
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
          <ChevronDown
            size={13}
            className="flex-shrink-0 text-muted-foreground/40 transition-transform group-open/sub:rotate-180"
          />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {group.blocks.map((block, i) => {
          switch (block.kind) {
            case "thinking": {
              const isActiveThinkingBlock = isStreaming && activeThinkingBlock === block;
              return (
                <InlineThinkingBlock
                  key={i}
                  content={block.content}
                  isStreaming={isActiveThinkingBlock}
                  defaultOpen={false}
                />
              );
            }
            case "text":
              return <InlineTextContent key={i} content={block.content} />;
            case "tool_call":
            case "tool_result": {
              if (block.kind === "tool_result") return null;
              const tc = toolCallMap.get(block.toolCallId);
              if (!tc) return null;
              if (tc.name === "write_todos") {
                if (!visibleTodoCallIdsStr?.includes(tc.id)) return null;
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


export function AIPanel({
  agentName,
  statusLabel,
  isStreaming,
  usage,
  children,
}: {
  agentName: string;
  statusLabel: string | null;
  isStreaming: boolean;
  usage?: ChatMessageType["usage"];
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-xs">
        <Bot size={13} className="flex-shrink-0 text-muted-foreground/70" />
        <span className="font-medium text-foreground/90">{agentName || "Assistant"}</span>
        {statusLabel ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${isStreaming ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/80"
              }`}
          >
            {statusLabel}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2 text-muted-foreground/70">
          <PanelTimer
            active={isStreaming}
            fixedSeconds={!isStreaming ? usage?.runtimeSeconds : undefined}
          />
          {isStreaming ? (
            <Loader2 size={13} className="animate-spin text-success" />
          ) : (
            <CircleCheck size={13} className="text-success" />
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-3 pl-5">
        {children}
        {!isStreaming && (usage?.inputTokens || usage?.outputTokens) ? (
          <div className="text-[11px] text-muted-foreground/70">
            {formatNumber(usage?.inputTokens ?? 0)} input ·{" "}
            {formatNumber(usage?.outputTokens ?? 0)} output tokens
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ActivitySection({
  children,
  summary,
}: {
  children: React.ReactNode;
  summary: string;
}) {
  return (
    <details className="group/activity">
      <summary className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <span className="font-medium text-foreground/85">Activity</span>
        {summary ? <span className="text-[11px] text-muted-foreground/70">{summary}</span> : null}
        <div className="ml-auto flex items-center gap-2">
          <ChevronDown
            size={13}
            className="text-muted-foreground/50 transition-transform group-open/activity:rotate-180"
          />
        </div>
      </summary>
      <div className="mt-2 flex flex-col gap-2 border-l border-border/30 pl-4">
        {children}
      </div>
    </details>
  );
}


export const HumanMessage = React.memo(function HumanMessage({
  message,
}: {
  message: ChatMessageType;
}) {
  if (message.role !== "human") return null;

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {message.content}
        </p>
      </div>
    </div>
  );
});

export const AIMessage = React.memo(function AIMessage({
  message,
  isStreaming,
  visibleTodoCallIdsStr,
}: {
  message: ChatMessageType;
  isStreaming: boolean;
  visibleTodoCallIdsStr?: string;
}) {
  const hasBlocks = message.blocks.length > 0;
  const hasToolCalls = message.toolCalls.length > 0;
  const hasText = message.content.trim().length > 0;

  const toolCallMap = useMemo(() => {
    const map = new Map<string, ToolCallInfo>();
    message.toolCalls.forEach((tc) => map.set(tc.id, tc));
    return map;
  }, [message.toolCalls]);

  const groups = useMemo(() => groupBlocks(message.blocks), [message.blocks]);

  const activitySummary = useMemo(
    () => getActivitySummary(groups, message.toolCalls),
    [groups, message.toolCalls]
  );

  const agentName = resolveAgentName(message);
  const answerBlocks = getAnswerBlocks(message.blocks);
  const statusLabel = getStatusLabel(message, isStreaming);
  const activeThinkingBlock = getActiveThinkingBlock(message.blocks, isStreaming);

  const hasActivity = hasBlocks
    ? hasVisibleActivity(groups, toolCallMap, visibleTodoCallIdsStr)
    : Boolean(message.thinking) || hasToolCalls;

  if (!hasBlocks && !hasToolCalls && !hasText && !isStreaming) return null;

  function renderParentActivityBlock(block: AIBlock, key: string): React.ReactNode {
    switch (block.kind) {
      case "thinking":
        return (
          <InlineThinkingBlock
            key={key}
            content={block.content}
            isStreaming={block === activeThinkingBlock}
            defaultOpen={false}
          />
        );
      case "tool_call": {
        const toolCall = toolCallMap.get(block.toolCallId);
        if (!toolCall) return null;
        if (toolCall.name === "write_todos") {
          if (!visibleTodoCallIdsStr?.includes(toolCall.id)) return null;
          return <TodoCard key={toolCall.id} toolCall={toolCall} />;
        }
        return <ToolCallCard key={toolCall.id} toolCall={toolCall} />;
      }
      case "text":
      case "tool_result":
        return null;
      default: {
        return null;
      }
    }
  }

  if (!hasBlocks) {
    return (
      <AIPanel
        agentName={agentName}
        statusLabel={statusLabel}
        isStreaming={isStreaming}
        usage={message.usage}
      >
        {hasText ? <InlineTextContent content={message.content} /> : null}
        {hasActivity ? (
          <ActivitySection summary={activitySummary}>
            {message.thinking ? (
              <InlineThinkingBlock
                content={message.thinking}
                isStreaming={isStreaming}
                defaultOpen={false}
              />
            ) : null}
            {message.toolCalls.map((toolCall: ToolCallInfo) => {
              if (toolCall.name === "write_todos") {
                if (!visibleTodoCallIdsStr?.includes(toolCall.id)) return null;
                return <TodoCard key={toolCall.id} toolCall={toolCall} />;
              }
              return <ToolCallCard key={toolCall.id} toolCall={toolCall} />;
            })}
          </ActivitySection>
        ) : null}
      </AIPanel>
    );
  }

  return (
    <AIPanel
      agentName={agentName}
      statusLabel={statusLabel}
      isStreaming={isStreaming}
      usage={message.usage}
    >
      {answerBlocks.length > 0 ? (
        <div className="flex flex-col gap-3">
          {answerBlocks.map((block: Extract<AIBlock, { kind: "text" }>, index: number) => (
            <InlineTextContent key={`answer-${index}`} content={block.content} />
          ))}
        </div>
      ) : null}

      {hasActivity ? (
        <ActivitySection summary={activitySummary}>
          {groups.map((group: BlockGroup, groupIndex: number) => {
            if (group.kind === "subagent") {
              const isLastGroup = groupIndex === groups.length - 1;
              return (
                <SubagentGroup
                  key={`${group.agent}-${groupIndex}`}
                  group={group}
                  toolCallMap={toolCallMap}
                  isStreaming={isStreaming && isLastGroup}
                  visibleTodoCallIdsStr={visibleTodoCallIdsStr}
                  activeThinkingBlock={activeThinkingBlock}
                />
              );
            }

            return group.blocks.map((block: AIBlock, blockIndex: number) =>
              renderParentActivityBlock(block, `${groupIndex}-${blockIndex}`)
            );
          })}
        </ActivitySection>
      ) : null}
    </AIPanel>
  );
});


export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  visibleTodoCallIdsStr,
}: {
  message: ChatMessageType;
  isStreaming?: boolean;
  visibleTodoCallIdsStr?: string;
}) {
  if (message.role === "human") {
    return <HumanMessage message={message} />;
  }

  if (message.role === "ai") {
    return (
      <AIMessage
        message={message}
        isStreaming={isStreaming}
        visibleTodoCallIdsStr={visibleTodoCallIdsStr}
      />
    );
  }

  return null;
});
