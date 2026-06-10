import type { AIMessage, BaseMessage } from "@langchain/core/messages";

interface TextBlock {
  type: "text";
  text: string;
}

interface ReasoningBlock {
  type: "reasoning" | "thinking";
  reasoning?: string;
  thinking?: string;
}

type ContentBlock = Record<string, unknown>;

function isTextBlock(block: ContentBlock): block is ContentBlock & TextBlock {
  return block.type === "text" && typeof block.text === "string";
}

function isReasoningBlock(block: ContentBlock): block is ContentBlock & ReasoningBlock {
  return block.type === "reasoning" || block.type === "thinking";
}

function getContentBlocks(message: BaseMessage): ContentBlock[] | null {
  if ("contentBlocks" in message && Array.isArray(message.contentBlocks) && message.contentBlocks.length > 0) {
    return message.contentBlocks;
  }
  return Array.isArray(message.content) ? message.content as ContentBlock[] : null;
}

function getLegacyTextContent(message: BaseMessage): string {
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";

  return message.content
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function getMessageTextContent(message: BaseMessage): string {
  const blocks = getContentBlocks(message);

  if (blocks) {
    const text = blocks
      .filter(isTextBlock)
      .map((block) => block.text)
      .join("");

    if (text.trim() || blocks.some((b) => b.type === "text")) {
      return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    }
  }

  const legacyText = getLegacyTextContent(message);
  return legacyText.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "").trim();
}

function extractReasoningFromBlocks(blocks: ContentBlock[]): string {
  return blocks
    .filter(isReasoningBlock)
    .map((block) => {
      if (typeof block.reasoning === "string") return block.reasoning;
      if (typeof block.thinking === "string") return block.thinking;
      if ("summary" in block && Array.isArray(block.summary)) {
        return (block.summary as Array<Record<string, unknown>>)
          .filter((item) => item.type === "summary_text" && typeof item.text === "string")
          .map((item) => item.text as string)
          .join("");
      }
      return "";
    })
    .join("");
}

export function getReasoningContent(message: AIMessage): string {
  let reasoning = "";

  const blocks = getContentBlocks(message);

  if (blocks) {
    reasoning += extractReasoningFromBlocks(blocks);

    const textBlocks = blocks
      .filter(isTextBlock)
      .map((block) => block.text)
      .join("");

    if (textBlocks) {
      const thinkMatch = textBlocks.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      if (thinkMatch?.[1]) {
        reasoning += "\n" + thinkMatch[1].trim();
      }
    }
  }

  // contentBlocks may omit reasoning during OpenAI streaming
  if (!reasoning && Array.isArray(message.content)) {
    const rawBlocks = message.content as ContentBlock[];
    reasoning += extractReasoningFromBlocks(rawBlocks);
  }

  const kwargs = message.additional_kwargs || {};
  const fallback = kwargs.reasoning_content
    ?? kwargs.thinking
    ?? kwargs.reasoning
    ?? (message.response_metadata as Record<string, unknown>)?.reasoning_content
    ?? (message.response_metadata as Record<string, unknown>)?.thinking
    ?? (message.response_metadata as Record<string, unknown>)?.reasoning;

  if (typeof fallback === "string" && fallback.trim()) {
    reasoning += "\n" + fallback;
  }

  // DeepSeek models emit reasoning inside <think> tags in raw string content
  if (typeof message.content === "string") {
    const thinkMatch = message.content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    if (thinkMatch) {
      reasoning += "\n" + thinkMatch[1].trim();
    }
  }

  return reasoning.trim();
}
