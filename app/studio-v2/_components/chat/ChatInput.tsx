import React, { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Square, ArrowUp, Loader2, Paperclip, X } from "lucide-react";
import { useFileUpload } from "@/app/studio-v2/_hooks/use-file-upload";
import type { UploadedFile } from "@/app/studio-v2/_hooks/use-file-upload";
import ModelPicker from "@/app/studio-v2/_components/chat/ModelPicker";

export interface ChatInputHandle {
  setPrompt: (text: string) => void;
  focus: () => void;
}

interface ChatInputProps {
  isBusy: boolean;
  isLoading: boolean;
  onSubmit: (text: string) => void;
  stopGeneration: () => void;
  model: string;
  onModelChange: (modelId: string) => void;
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
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    },
    focus: () => {
      textareaRef.current?.focus();
    }
  }), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
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
      const links = attachments.map((a) => `[${a.filename}](${a.url})`).join("\n");
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
    <div className="sticky bottom-0 z-10 p-4 bg-background">
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl border bg-muted/20 px-2 py-2 transition-colors focus-within:border-border/80 focus-within:bg-background focus-within:ring-1 focus-within:ring-border/40 ${isDragging
          ? "border-dashed border-primary/60 bg-primary/5"
          : "border-border"
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
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
              >
                <Paperclip size={12} className="text-muted-foreground" />
                <span className="max-w-[180px] truncate">{a.filename}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.url)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
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
            placeholder="Describe a part..."
            rows={1}
            className="w-full resize-none overflow-y-auto bg-transparent px-2 pt-3 text-[15px] text-foreground placeholder:text-muted-foreground outline-none max-h-[200px]"
            style={{ minHeight: "24px" }}
          />

          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={triggerFileSelect}
                aria-label="Attach file"
                title="Attach file"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
              </button>
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
                <button
                  onClick={stopGeneration}
                  aria-label="Stop generation"
                  title="Stop generation"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:opacity-90"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!hasContent || isBusy}
                  aria-label="Send message"
                  title="Send message"
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${hasContent
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-muted text-muted-foreground"
                    } disabled:cursor-not-allowed`}
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
export default ChatInput;
