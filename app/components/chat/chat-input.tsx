"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Plus, Square, ArrowUp, Loader2 } from "lucide-react";
import { useFileUpload } from "@/app/hooks/chat/use-file-upload";
import ModelPicker from "@/app/components/chat/model-picker";
import ReasoningEffortPicker from "@/app/components/chat/reasoning-effort-picker";
import { AttachmentPill } from "@/app/components/chat/attachment-pill";
import {
  MaskComposerBanner,
  maskComposerDisabledReason,
} from "@/app/components/chat/mask-composer-banner";
import { MODELS } from "@/app/lib/chat/models";
import {
  chatContentRailClass,
  composerButtonClass,
  composerTooltipClass,
} from "@/app/lib/chat/chat-styles";
import { attachmentMarkdown } from "@/app/lib/chat/message-attachments";
import { SITE_ROUTES } from "@/app/lib/site";
import type { SketchMaskComposerState } from "@/app/types/sketch-viewer";
import type { ChatInputHandle, UploadedFile } from "@/app/types/chat";
import type {
  ReasoningEffortId,
  ReasoningEffortOption,
  ReasoningUpsell,
} from "@/app/lib/chat/models";

interface ChatInputProps {
  isBusy: boolean;
  isLoading: boolean;
  maskComposer: SketchMaskComposerState | null;
  onSubmit: (text: string) => boolean;
  stopGeneration: () => void;
  model: string;
  onModelChange: (modelId: string) => void;
  reasoningEffort: ReasoningEffortId;
  reasoningEfforts: ReasoningEffortOption[];
  onReasoningEffortChange: (effortId: ReasoningEffortId) => void;
  lockedReasoningEfforts?: ReasoningEffortOption[];
  reasoningUpsell?: ReasoningUpsell | null;
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

const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  isBusy,
  isLoading,
  maskComposer,
  onSubmit,
  stopGeneration,
  model,
  onModelChange,
  reasoningEffort,
  reasoningEfforts,
  onReasoningEffortChange,
  lockedReasoningEfforts = [],
  reasoningUpsell = null,
}: ChatInputProps, ref) {
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<UploadedFile[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { openSignIn } = useClerk();
  const { sessionClaims } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;
  const shouldShowModelPicker = isVip && MODELS.length > 1;
  const shouldShowReasoningPicker = !maskComposer && reasoningEfforts.length > 0;

  const handleLockedReasoningSelect = useCallback(() => {
    if (reasoningUpsell === "sign-in") {
      void openSignIn();
      return;
    }
    if (reasoningUpsell === "upgrade") {
      router.push(SITE_ROUTES.pricing);
    }
  }, [openSignIn, reasoningUpsell, router]);

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
  const maskSubmitDisabledReason = maskComposerDisabledReason(maskComposer);
  const canSubmitMaskEdit = maskComposer !== null && input.trim().length > 0 && maskSubmitDisabledReason === null && !isBusy;
  const isComposerBusy = isBusy || maskComposer?.isSubmitting === true;

  const sendMessage = useCallback(() => {
    if (maskComposer) {
      if (!canSubmitMaskEdit) return;
      const parts = [input.trim()];
      if (attachments.length > 0) {
        const links = attachments.map(attachmentMarkdown).join("\n");
        parts.push(`Attachments:\n${links}`);
      }
      void maskComposer
        .submit(parts.join("\n\n"))
        .then(() => {
          setInput("");
          setAttachments([]);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        })
        .catch(() => {
          // Validation and submit errors are shown by the sketch mask editor.
        });
      return;
    }

    if (!hasContent || isBusy) return;
    const text = input.trim();
    const parts: string[] = [];
    if (text) parts.push(text);
    if (attachments.length > 0) {
      const links = attachments.map(attachmentMarkdown).join("\n");
      parts.push(`Attachments:\n${links}`);
    }
    const didSubmit = onSubmit(parts.join("\n\n"));
    if (!didSubmit) return;

    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, attachments, canSubmitMaskEdit, hasContent, isBusy, maskComposer, onSubmit]);

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
    <div className="shrink-0 px-[var(--app-chrome-gutter)] py-4">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${chatContentRailClass} relative rounded-3xl border bg-[var(--viewer-glass-background)] px-2 py-2 shadow-[0_12px_40px_rgb(0_0_0_/_0.10)] backdrop-blur-[16px] backdrop-saturate-[1.12] transition-colors focus-within:border-border/80 focus-within:ring-1 focus-within:ring-border/40 ${isDragging
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

        {maskComposer ? (
          <MaskComposerBanner
            disabledReason={maskSubmitDisabledReason}
            isComposerBusy={isComposerBusy}
            maskComposer={maskComposer}
          />
        ) : null}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2 pb-2">
            {attachments.map((a) => (
              <AttachmentPill
                key={a.url}
                attachment={a}
                onRemove={removeAttachment}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 px-1">
          <textarea
            ref={textareaRef}
            value={input}
            disabled={isComposerBusy}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => window.scrollTo(0, 0)}
            placeholder={maskComposer ? "Describe the masked edit..." : "Describe what you need..."}
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
              {shouldShowModelPicker && (
                <ModelPicker
                  value={model}
                  onChange={onModelChange}
                  disabled={isBusy}
                />
              )}
              {shouldShowReasoningPicker && (
                <ReasoningEffortPicker
                  value={reasoningEffort}
                  options={reasoningEfforts}
                  onChange={onReasoningEffortChange}
                  disabled={isBusy}
                  lockedOptions={reasoningUpsell ? lockedReasoningEfforts : []}
                  lockedHint={reasoningUpsell === "sign-in" ? "Sign in to unlock" : "Upgrade to unlock"}
                  onLockedSelect={handleLockedReasoningSelect}
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
                  disabled={maskComposer ? !canSubmitMaskEdit : !hasContent || isBusy}
                  aria-label="Send message"
                  tooltip={maskComposer ? "Submit masked edit" : "Send message"}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] transition-colors ${(maskComposer ? canSubmitMaskEdit : hasContent)
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
