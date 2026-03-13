import React, { useMemo } from "react";
import type {
  Message,
  AIMessage,
  ToolCallWithResult,
  SubagentStreamInterface,
  TodoItem,
  DeepAgentStream,
} from "@/app/studio/_types/chat";
import { AIPanel, ActivitySection } from "@/app/studio/_components/chat/AIPanel";
import { SubagentCard } from "@/app/studio/_components/chat/SubagentGroup";
import { TodoCard } from "@/app/studio/_components/chat/TodoCard";
import { ToolCallCard } from "@/app/studio/_components/chat/ToolCallCard";
import { InlineThinkingBlock, InlineTextContent } from "@/app/studio/_components/chat/InlineBlocks";

function getTextContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function getReasoningContent(msg: AIMessage): string | undefined {
  const raw = msg.additional_kwargs?.reasoning_content
    ?? msg.additional_kwargs?.thinking;
  if (typeof raw === "string") return raw;
  return undefined;
}

function getActivitySummary(
  toolCalls: ToolCallWithResult[],
  subagents: SubagentStreamInterface[],
  thinking: string | undefined,
): string {
  const parts: string[] = [];
  if (thinking) parts.push("1 thought");
  if (toolCalls.length > 0) {
    parts.push(`${toolCalls.length} tool${toolCalls.length === 1 ? "" : "s"}`);
  }
  if (subagents.length > 0) {
    parts.push(`${subagents.length} subagent${subagents.length === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

function getStatusLabel(
  isStreaming: boolean,
  toolCalls: ToolCallWithResult[],
  subagents: SubagentStreamInterface[],
  thinking: string | undefined,
): string | null {
  const pendingTool = toolCalls.find((tc) => tc.state === "pending");
  if (pendingTool) return `Running ${pendingTool.call.name.replace(/_/g, " ")}`;

  const runningSubagent = subagents.find((s) => s.status === "running");
  if (runningSubagent) {
    const name = runningSubagent.toolCall?.args?.subagent_type ?? "subagent";
    return `${name} active`;
  }

  if (thinking && isStreaming) return "Thinking";
  if (isStreaming) return "Working";
  if (toolCalls.some((tc) => tc.state === "error")) return "Needs attention";
  return null;
}

export function HumanMessage({ message }: { message: Message }) {
  const text = getTextContent(message.content);

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}

export function AIMessageView({
  message,
  isStreaming,
  stream,
  todos,
}: {
  message: AIMessage;
  isStreaming: boolean;
  stream: DeepAgentStream;
  todos: TodoItem[];
}) {
  const text = getTextContent(message.content);
  const thinking = getReasoningContent(message);

  const toolCalls = useMemo(
    () => stream.getToolCalls(message),
    [stream, message],
  );

  const subagents = useMemo(
    () => (message.id ? stream.getSubagentsByMessage(message.id) : []),
    [stream, message.id],
  );

  const nonTaskToolCalls = useMemo(
    () => toolCalls.filter((tc) => tc.call.name !== "task" && tc.call.name !== "write_todos"),
    [toolCalls],
  );

  const hasText = text.trim().length > 0;
  const hasActivity = thinking || nonTaskToolCalls.length > 0 || subagents.length > 0;
  const hasTodos = todos.length > 0;

  const activitySummary = getActivitySummary(nonTaskToolCalls, subagents, thinking);
  const statusLabel = getStatusLabel(isStreaming, toolCalls, subagents, thinking);

  const agentName = message.name ?? "";
  const usage = message.usage_metadata;

  if (!hasText && !hasActivity && !hasTodos && !isStreaming) return null;

  return (
    <AIPanel
      agentName={agentName}
      statusLabel={statusLabel}
      isStreaming={isStreaming}
      usage={usage ? {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      } : undefined}
    >
      {hasText ? <InlineTextContent content={text} /> : null}

      {hasTodos ? <TodoCard todos={todos} /> : null}

      {hasActivity ? (
        <ActivitySection summary={activitySummary}>
          {thinking ? (
            <InlineThinkingBlock
              content={thinking}
              isStreaming={isStreaming && !hasText}
              defaultOpen={false}
            />
          ) : null}

          {nonTaskToolCalls.map((tc) => (
            <ToolCallCard key={tc.id} toolCall={tc} />
          ))}

          {subagents.map((subagent) => (
            <SubagentCard key={subagent.id} subagent={subagent} />
          ))}
        </ActivitySection>
      ) : null}
    </AIPanel>
  );
}

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isStreaming = false,
  stream,
  todos,
}: {
  message: Message;
  isStreaming?: boolean;
  stream: DeepAgentStream;
  todos: TodoItem[];
}) {
  if (message.type === "human") {
    return <HumanMessage message={message} />;
  }

  if (message.type === "ai") {
    return (
      <AIMessageView
        message={message}
        isStreaming={isStreaming}
        stream={stream}
        todos={todos}
      />
    );
  }

  return null;
});
