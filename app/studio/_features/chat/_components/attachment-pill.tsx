"use client";

import { Paperclip, X } from "lucide-react";

import { isImageAttachment } from "@/app/studio/_features/chat/_lib/message-attachments";
import { useSignedAttachmentUrl } from "@/app/studio/_features/chat/_hooks/use-signed-attachment-url";
import type { UploadedFile } from "@/app/studio/_features/chat/_types/chat";

interface AttachmentPillProps {
  attachment: UploadedFile;
  onRemove: (url: string) => void;
}

export function AttachmentPill({ attachment, onRemove }: AttachmentPillProps) {
  const signedUrl = useSignedAttachmentUrl(attachment.url);

  return (
    <span className="inline-flex items-center gap-1 rounded-xl bg-muted px-2 py-1 text-xs text-foreground">
      {isImageAttachment(attachment) ? (
        // eslint-disable-next-line @next/next/no-img-element -- Uploaded private blob URLs are user-scoped and not configured for Next image optimization.
        <img
          src={signedUrl}
          alt=""
          className="size-8 rounded-lg object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <Paperclip size={12} className="text-muted-foreground" />
      )}
      <span className="max-w-[180px] truncate">{attachment.filename}</span>
      <button
        type="button"
        onClick={() => onRemove(attachment.url)}
        className="ml-0.5 rounded-[calc(var(--viewer-control-radius)-0.125rem)] p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={12} />
      </button>
    </span>
  );
}
