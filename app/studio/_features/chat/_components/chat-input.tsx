"use client";

import React, { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Square, ArrowUp, Loader2, Paperclip, X } from "lucide-react";
import { useFileUpload } from "@/app/studio/_features/chat/_hooks/use-file-upload";
import ModelPicker from "@/app/studio/_features/chat/_components/model-picker";
import {
  composerButtonClass,
  composerTooltipClass,
} from "@/app/studio/_features/chat/_lib/chat-styles";
import type { ChatInputHandle, UploadedFile } from "@/app/studio/_features/chat/_types/chat";

interface ChatInputProps {
  isBusy: boolean;
  isLoading: boolean;
  onSubmit: (text: string) => void;
  stopGeneration: () => void;
  model: string;
  onModelChange: (modelId: string) => void;
}

interface ComposerIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  tooltip: string;
}

function ComposerIconButton({ children, className, tooltip, ...buttonProps }: ComposerIconButtonProps) {
  return (
    <span className="group/composer relative inline-grid">
      <button {...buttonProps} aria-label={buttonProps["aria-label"] ?? tooltip} className={className}>
        {children}
      </button>
      <span role="tooltip" className={composerTooltipClass}>
        {tooltip}
      </span>
    </span>
  );
}

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
}

function isImageAttachment(attachment: UploadedFile) {
  return attachment.contentType.startsWith("image/");
}

function attachmentMarkdown(attachment: UploadedFile) {
  if (isImageAttachment(attachment)) {
    return `![${attachment.filename}](${attachment.url})`;
  }
  return `[${attachment.filename}](${attachment.url})`;
}

const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  isBusy,
  isLoading,
  onSubmit,
  stopGeneration,
  model,
  onModelChange,
}: ChatInputProps, ref) {
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<UploadedFile[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { sessionClaims } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;

  const onFileUploaded = useCallback((file: UploadedFile) => {
    setAttachments((prev) => [...prev, file]);
  }, []);

  const removeAttachment = useCallback((url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  }, []);

  const {
    fileInputRef,
    isUploading,
    isDragging,
    triggerFileSelect,
    handleFileChange,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    acceptedTypes,
  } = useFileUpload(onFileUploaded);

  React.useImperativeHandle(ref, () => ({
    setPrompt: (text: string) => {
      setInput(text);
      requestAnimationFrame(() => resizeTextarea(textareaRef.current));
    },
    focus: () => {
      textareaRef.current?.focus();
    }
  }), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      resizeTextarea(e.target);
    },
    []
  );

  const hasContent = input.trim() || attachments.length > 0;

  const sendMessage = useCallback(() => {
    if (!hasContent || isBusy) return;
    const text = input.trim();
    const parts: string[] = [];
    if (text) parts.push(text);
    if (attachments.length > 0) {
      const links = attachments.map(attachmentMarkdown).join("\n");
      parts.push(`Attachments:\n${links}`);
    }
    onSubmit(parts.join("\n\n"));
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, attachments, hasContent, isBusy, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <div className="shrink-0 p-4">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl border bg-[var(--viewer-glass-background)] px-2 py-2 shadow-[0_12px_40px_rgb(0_0_0_/_0.10)] backdrop-blur-[16px] backdrop-saturate-[1.12] transition-colors focus-within:border-border/80 focus-within:ring-1 focus-within:ring-border/40 ${isDragging
          ? "border-dashed border-primary/60 bg-primary/5"
          : "border-[color-mix(in_srgb,var(--border)_58%,transparent)]"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2 pb-2">
            {attachments.map((a) => (
              <span
                key={a.url}
                className="inline-flex items-center gap-1 rounded-xl bg-muted px-2 py-1 text-xs text-foreground"
              >
                {isImageAttachment(a) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Uploaded private blob URLs are user-scoped and not configured for Next image optimization.
                  <img
                    src={a.url}
                    alt=""
                    className="size-8 rounded-lg object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <Paperclip size={12} className="text-muted-foreground" />
                )}
                <span className="max-w-[180px] truncate">{a.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.url)}
                  className="ml-0.5 rounded-[calc(var(--viewer-control-radius)-0.125rem)] p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 px-1">
          <textarea
            ref={textareaRef}
            value={input}
            disabled={isBusy}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => window.scrollTo(0, 0)}
            placeholder="Describe a part..."
            rows={1}
            className="w-full resize-none overflow-y-auto bg-transparent px-2 pt-3 text-base text-foreground placeholder:text-muted-foreground outline-none max-h-[200px] md:text-[15px]"
            style={{ minHeight: "24px" }}
          />

          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1">
              <ComposerIconButton
                type="button"
                disabled={isUploading}
                onClick={triggerFileSelect}
                aria-label="Attach file"
                tooltip="Attach file"
                className={composerButtonClass}
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
              </ComposerIconButton>
              {isVip && (
                <ModelPicker
                  value={model}
                  onChange={onModelChange}
                  disabled={isBusy}
                />
              )}
            </div>

            <div className="flex items-center pr-1">
              {isLoading ? (
                <ComposerIconButton
                  onClick={stopGeneration}
                  aria-label="Stop generation"
                  tooltip="Stop generation"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-foreground text-background transition-colors hover:bg-foreground/90"
                >
                  <Square size={14} fill="currentColor" />
                </ComposerIconButton>
              ) : (
                <ComposerIconButton
                  onClick={sendMessage}
                  disabled={!hasContent || isBusy}
                  aria-label="Send message"
                  tooltip="Send message"
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] transition-colors ${hasContent
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground"
                    } disabled:cursor-not-allowed`}
                >
                  <ArrowUp size={16} />
                </ComposerIconButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
export default ChatInput;
