import type { AIMessage, BaseMessage } from "@langchain/core/messages";

function getLegacyTextContent(message: BaseMessage): string {
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";

  return message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function getMessageTextContent(message: BaseMessage): string {
  if ("contentBlocks" in message && Array.isArray(message.contentBlocks)) {
    const text = message.contentBlocks
      .filter((block): block is { type: "text"; text: string } =>
        block.type === "text" && typeof (block as Record<string, unknown>).text === "string",
      )
      .map((block) => block.text)
      .join("");

    if (text.trim()) return text;
  }

  return getLegacyTextContent(message);
}

export function getReasoningContent(message: AIMessage): string {
  if ("contentBlocks" in message && Array.isArray(message.contentBlocks)) {
    const reasoning = message.contentBlocks
      .filter((block): block is { type: "reasoning"; reasoning: string } =>
        block.type === "reasoning" && typeof (block as Record<string, unknown>).reasoning === "string",
      )
      .map((block) => block.reasoning)
      .join("");

    if (reasoning.trim()) return reasoning;
  }

  const fallback = message.additional_kwargs?.reasoning_content
    ?? message.additional_kwargs?.thinking
    ?? message.additional_kwargs?.reasoning;

  return typeof fallback === "string" ? fallback : "";
}
