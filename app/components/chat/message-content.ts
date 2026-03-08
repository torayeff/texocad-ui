import type { Message } from "@langchain/langgraph-sdk";

type TextBlock = {
  type?: string;
  text?: string | null;
};

export function getMessageTextContent(content: Message["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return (content as TextBlock[])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}
