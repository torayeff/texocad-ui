import React, { useCallback } from "react";
import { Plus, Square, ArrowUp, Loader2, Paperclip, X, ChevronDown, Brain, Zap, Sparkles, Check, Clock, Timer } from "lucide-react";
import { useFileUpload } from "@/app/studio/_hooks/use-file-upload";
import type { UploadedFile } from "@/app/studio/_hooks/use-file-upload";

export type ModelTier = "fast" | "pro";
export type ThinkingLevel = "none" | "low" | "medium" | "high";

export interface ModelConfig {
  modelTier: ModelTier;
  thinking: ThinkingLevel;
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

const ThinkingSelector = ({ value, onChange }: { value: ThinkingLevel; onChange: (v: ThinkingLevel) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));

  const options: { value: ThinkingLevel; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "none", label: "Standard", icon: <Zap size={14} />, desc: "Fast responses, no reasoning steps" },
    { value: "low", label: "Low thinking", icon: <Timer size={14} />, desc: "Brief reasoning before answering" },
    { value: "medium", label: "Medium thinking", icon: <Clock size={14} />, desc: "Balanced reasoning and detail" },
    { value: "high", label: "High thinking", icon: <Brain size={14} />, desc: "Deep analysis for complex tasks" },
  ];

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Select reasoning level"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors ${value === "none"
          ? "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          : "text-blue-500 hover:bg-blue-500/10"
          }`}
      >
        {current.icon}
        {current.label}
        <ChevronDown size={12} className="ml-0.5 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-md p-1 text-foreground shadow-md animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`relative flex items-start gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 ${value === option.value ? "bg-muted/50" : ""
                  }`}
              >
                <div className={`mt-0.5 shrink-0 ${value === option.value ? "text-foreground" : "text-muted-foreground"}`}>
                  {option.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-none">{option.label}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{option.desc}</span>
                </div>
                {value === option.value && (
                  <Check size={14} className="absolute right-3 top-3 text-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ModelSelector = ({ value, onChange }: { value: ModelTier; onChange: (v: ModelTier) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setIsOpen(false));

  const options: { value: ModelTier; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "fast", label: "Fast", icon: <Zap size={14} />, desc: "Default, quick answers" },
    { value: "pro", label: "Pro", icon: <Sparkles size={14} />, desc: "Highest capability, slower" },
  ];

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="Select model capability"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium transition-colors ${value === "fast"
          ? "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          : "text-blue-500 hover:bg-blue-500/10"
          }`}
      >
        {current.icon}
        {current.label}
        <ChevronDown size={12} className="ml-0.5 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-md p-1 text-foreground shadow-md animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="flex flex-col">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`relative flex items-start gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60 ${value === option.value ? "bg-muted/50" : ""
                  }`}
              >
                <div className={`mt-0.5 shrink-0 ${value === option.value ? "text-foreground" : "text-muted-foreground"}`}>
                  {option.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-none">{option.label}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{option.desc}</span>
                </div>
                {value === option.value && (
                  <Check size={14} className="absolute right-3 top-3 text-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export interface ChatInputHandle {
  setPrompt: (text: string) => void;
  focus: () => void;
}

interface ChatInputProps {
  isBusy: boolean;
  isLoading: boolean;
  onSubmit: (text: string, modelConfig: ModelConfig) => void;
  stopGeneration: () => void;
}

const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput({
  isBusy,
  isLoading,
  onSubmit,
  stopGeneration,
}: ChatInputProps, ref) {
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<UploadedFile[]>([]);
  const [modelTier, setModelTier] = React.useState<ModelTier>("fast");
  const [thinking, setThinking] = React.useState<ThinkingLevel>("none");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
    onSubmit(parts.join("\n\n"), { modelTier, thinking });
    setInput("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, attachments, hasContent, isBusy, onSubmit, modelTier, thinking]);

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
              <ModelSelector value={modelTier} onChange={setModelTier} />
              <ThinkingSelector value={thinking} onChange={setThinking} />
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
