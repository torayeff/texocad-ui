import type {
  ToolPreviewImage,
  ToolResultImageBlock,
  ToolResultTextBlock,
} from "@/app/studio/_features/chat/_types/chat";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getResultContent(result: unknown): unknown[] {
  if (!isRecord(result) || !("content" in result)) return [];
  const { content } = result;
  return Array.isArray(content) ? content : [content];
}

function isTextBlock(block: unknown): block is ToolResultTextBlock {
  return isRecord(block) && block.type === "text" && typeof block.text === "string";
}

function getTextBlockContent(block: unknown): string {
  if (typeof block === "string") return block;
  if (isTextBlock(block)) return block.text;
  return "";
}

function isImageBlock(block: unknown): block is ToolResultImageBlock {
  return isRecord(block) && (block.type === "image" || block.type === "image_url");
}

function imageUrlFromBlock(block: ToolResultImageBlock): string | null {
  if (typeof block.url === "string" && block.url.trim()) return block.url;
  if (typeof block.image_url === "string" && block.image_url.trim()) return block.image_url;
  if (
    isRecord(block.image_url)
    && typeof block.image_url.url === "string"
    && block.image_url.url.trim()
  ) {
    return block.image_url.url;
  }
  return null;
}

function base64FromBlock(block: ToolResultImageBlock): string | null {
  if (typeof block.base64 === "string" && block.base64.trim()) return block.base64;
  if (typeof block.data === "string" && block.data.trim()) return block.data;
  return null;
}

function previewImageFromBlock(block: ToolResultImageBlock): ToolPreviewImage | null {
  const mimeType = block.mime_type ?? block.mimeType ?? "image/png";
  const url = imageUrlFromBlock(block);
  if (url) return { src: url, mimeType };

  const base64 = base64FromBlock(block);
  if (!base64) return null;
  const src = base64.startsWith("data:") ? base64 : `data:${mimeType};base64,${base64}`;
  return { src, mimeType };
}

export function getToolResultText(result: unknown): string {
  const content = getResultContent(result);
  if (content.length === 0) return typeof result === "string" ? result : "";

  return content
    .map(getTextBlockContent)
    .join("");
}

export function getToolPreviewImages(result: unknown): ToolPreviewImage[] {
  return getResultContent(result)
    .filter(isImageBlock)
    .map(previewImageFromBlock)
    .filter((image): image is ToolPreviewImage => image !== null);
}
