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
    <div className="h-full overflow-y-auto scroll-on-hover px-4 pb-6 pt-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col">
        {threads.length === 0 && !isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center px-3 py-10 text-sm text-muted-foreground">
            No builds yet
          </div>
        ) : (
          <div className="space-y-1">
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
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-3 py-3 text-left text-sm transition-colors focus-visible:bg-muted focus-visible:outline-none ${thread.threadId === activeThreadId
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`truncate font-medium ${thread.threadId === activeThreadId ? "text-foreground" : ""}`}>
                    {thread.title}
                  </div>
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
                      className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-error/10 px-2.5 py-1 text-[10px] font-medium text-error transition-colors hover:bg-error/15"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingId(null);
                      }}
                      className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleDelete(e, thread.threadId)}
                    aria-label="Delete thread"
                    className="shrink-0 rounded-[calc(var(--viewer-control-radius)-0.125rem)] p-1.5 text-muted-foreground opacity-0 transition-[opacity,color,background-color] group-hover:opacity-100 hover:bg-error/10 hover:text-error focus:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-1.5 px-3 py-4 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            Loading...
          </div>
        )}

        {hasMore && !isLoading && (
          <button
            onClick={onLoadMore}
            className="mt-4 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-3 py-2.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
