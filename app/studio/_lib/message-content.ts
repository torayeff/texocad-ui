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
  const blocks = ("contentBlocks" in message && Array.isArray((message as any).contentBlocks))
    ? (message as any).contentBlocks
    : (Array.isArray(message.content) ? message.content : null);

  if (blocks) {
    const text = blocks
      .filter((block: any): block is { type: "text"; text: string } =>
        block.type === "text" && typeof (block as Record<string, unknown>).text === "string",
      )
      .map((block: any) => block.text)
      .join("");

    if (text.trim() || blocks.some((b: any) => b.type === "text")) {
      return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    }
  }

  const legacyText = getLegacyTextContent(message);
  return legacyText.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "").trim();
}

export function getReasoningContent(message: AIMessage): string {
  let reasoning = "";

  const blocks = ("contentBlocks" in message && Array.isArray((message as any).contentBlocks))
    ? (message as any).contentBlocks
    : (Array.isArray(message.content) ? message.content : null);

  if (blocks) {
    reasoning += blocks
      .filter((block: Record<string, unknown>) => block.type === "reasoning" || block.type === "thinking")
      .map((block: Record<string, unknown>) => (block.reasoning || block.thinking || ""))
      .join("");

    const textBlocks = blocks
      .filter((block: any) => block.type === "text" && typeof block.text === "string")
      .map((block: any) => block.text)
      .join("");

    if (textBlocks) {
      const thinkMatch = textBlocks.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      if (thinkMatch && thinkMatch[1]) {
        reasoning += "\n" + thinkMatch[1].trim();
      }
    }
  }

  const kwargs = message.additional_kwargs || {};
  const fallback = kwargs.reasoning_content
    ?? kwargs.thinking
    ?? kwargs.reasoning
    ?? (message as any).response_metadata?.reasoning_content
    ?? (message as any).response_metadata?.thinking
    ?? (message as any).response_metadata?.reasoning;

  if (typeof fallback === "string" && fallback.trim()) {
    reasoning += "\n" + fallback;
  }

  // Handle <think> tags in raw string content (e.g., DeepSeek models)
  if (typeof message.content === "string") {
    const thinkMatch = message.content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    if (thinkMatch) {
      reasoning += "\n" + thinkMatch[1].trim();
    }
  }

  return reasoning.trim();
}
