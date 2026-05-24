import type { UploadedFile } from "@/app/studio/_features/chat/_types/chat";

const HIDDEN_HUMAN_MESSAGE_LINE_PREFIXES = ["Input image:", "Mask:"];
const MARKDOWN_IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const MARKDOWN_LINK_LINE = /^\[([^\]]+)\]\(([^)]+)\)$/;
const MASK_LINE_PREFIX = "Mask:";

export interface HumanAttachment {
  filename: string;
  isImage: boolean;
  url: string;
}

export interface HumanMessageParts {
  attachments: HumanAttachment[];
  text: string;
}

export function isImageAttachment(attachment: UploadedFile) {
  return attachment.contentType.startsWith("image/");
}

export function attachmentMarkdown(attachment: UploadedFile) {
  if (isImageAttachment(attachment)) {
    return `![${attachment.filename}](${attachment.url})`;
  }
  return `[${attachment.filename}](${attachment.url})`;
}

function isHiddenHumanMessageLine(line: string) {
  return HIDDEN_HUMAN_MESSAGE_LINE_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function parseMaskLine(line: string): HumanAttachment | null {
  if (!line.startsWith(MASK_LINE_PREFIX)) return null;
  const url = line.slice(MASK_LINE_PREFIX.length).trim();
  if (!url) return null;

  return {
    filename: "Mask",
    isImage: true,
    url,
  };
}

function parseAttachmentLine(line: string): HumanAttachment | null {
  const imageMatch = line.match(MARKDOWN_IMAGE_LINE);
  if (imageMatch) {
    return {
      filename: imageMatch[1] || "Attachment image",
      isImage: true,
      url: imageMatch[2],
    };
  }

  const linkMatch = line.match(MARKDOWN_LINK_LINE);
  if (!linkMatch) return null;

  return {
    filename: linkMatch[1],
    isImage: false,
    url: linkMatch[2],
  };
}

export function humanMessageDisplayParts(content: string): HumanMessageParts {
  const attachments: HumanAttachment[] = [];
  const lines = content
    .split("\n")
    .filter((line) => {
      const maskAttachment = parseMaskLine(line);
      if (maskAttachment) {
        attachments.push(maskAttachment);
        return false;
      }

      if (isHiddenHumanMessageLine(line)) return false;

      const attachment = parseAttachmentLine(line.trim());
      if (attachment) {
        attachments.push(attachment);
        return false;
      }

      return line.trim() !== "Attachments:";
    });

  return {
    attachments,
    text: lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
}
