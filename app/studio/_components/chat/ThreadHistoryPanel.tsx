"use client";

import React, { useCallback, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { ThreadSummary } from "@/app/studio/_hooks/use-thread-history";

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ThreadHistoryPanelProps {
  threads: ThreadSummary[];
  isLoading: boolean;
  hasMore: boolean;
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onLoadMore: () => void;
}

export default function ThreadHistoryPanel({
  threads,
  isLoading,
  hasMore,
  activeThreadId,
  onSelectThread,
  onDeleteThread,
  onLoadMore,
}: ThreadHistoryPanelProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleDelete = useCallback((e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setConfirmingId(threadId);
  }, []);

  const handleSelect = useCallback((threadId: string) => {
    if (threadId !== activeThreadId) {
      onSelectThread(threadId);
    }
  }, [activeThreadId, onSelectThread]);

  return (
    <div className="h-full overflow-y-auto scroll-on-hover pt-2">
      {threads.length === 0 && !isLoading && (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No previous conversations
        </div>
      )}

      {threads.map((thread) => (
        <div
          key={thread.threadId}
          role="button"
          tabIndex={0}
          onClick={() => handleSelect(thread.threadId)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSelect(thread.threadId);
            }
          }}
          onBlur={() => {
            if (confirmingId === thread.threadId) setConfirmingId(null);
          }}
          className={`group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60 ${thread.threadId === activeThreadId
              ? "bg-muted/80 text-foreground font-medium"
              : "text-foreground/80 hover:text-foreground"
            }`}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate">{thread.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(thread.updatedAt)}
            </div>
          </div>

          {confirmingId === thread.threadId ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.threadId);
                  setConfirmingId(null);
                }}
                className="rounded px-2 py-1 text-[10px] font-medium text-red-600 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-950/50 dark:hover:bg-red-900/50 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingId(null);
                }}
                className="rounded px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => handleDelete(e, thread.threadId)}
              aria-label="Delete thread"
              className="shrink-0 rounded p-1.5 transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 focus:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex items-center justify-center gap-1.5 px-3 py-4 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          Loading...
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          onClick={onLoadMore}
          className="w-full px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Load more
        </button>
      )}
    </div>
  );
}
