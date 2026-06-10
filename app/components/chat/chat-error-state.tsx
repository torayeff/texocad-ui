"use client";

interface ChatErrorStateProps {
  onStartNew: () => void;
}

export function ChatNotFoundState({ onStartNew }: ChatErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Thread not found</p>
      <button
        onClick={onStartNew}
        className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] px-4 py-2 text-sm font-medium text-muted-foreground shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12] transition-colors hover:bg-muted hover:text-foreground"
      >
        Start a new conversation
      </button>
    </div>
  );
}

export function ChatErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20 text-error text-xs">
      <span>Error: {message}</span>
    </div>
  );
}
