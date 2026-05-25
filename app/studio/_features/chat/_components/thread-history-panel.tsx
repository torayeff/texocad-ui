"use client";

import React, { useCallback, useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import type { ThreadSummary } from "@/app/studio/_features/chat/_types/chat";
import { normalizeThreadTitle } from "@/app/studio/_features/chat/_lib/thread-metadata";

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
  onSelectThread: (thread: ThreadSummary) => void;
  onDeleteThread: (threadId: string) => void;
  onRenameThread: (threadId: string, title: string) => Promise<void>;
  onLoadMore: () => void;
}

export default function ThreadHistoryPanel({
  threads,
  isLoading,
  hasMore,
  activeThreadId,
  onSelectThread,
  onDeleteThread,
  onRenameThread,
  onLoadMore,
}: ThreadHistoryPanelProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  const handleDelete = useCallback((e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    setConfirmingId(threadId);
  }, []);

  const handleSelect = useCallback((thread: ThreadSummary) => {
    if (editingId === thread.threadId) return;
    if (thread.threadId !== activeThreadId) {
      onSelectThread(thread);
    }
  }, [activeThreadId, editingId, onSelectThread]);

  const startRename = useCallback((e: React.MouseEvent, thread: ThreadSummary) => {
    e.stopPropagation();
    setConfirmingId(null);
    setEditingId(thread.threadId);
    setEditingTitle(thread.title);
    setRenameError(null);
  }, []);

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditingTitle("");
    setRenameError(null);
  }, []);

  const saveRename = useCallback(async (thread: ThreadSummary) => {
    const nextTitle = normalizeThreadTitle(editingTitle);
    if (!nextTitle) {
      setRenameError("Enter a title.");
      return;
    }
    if (nextTitle === thread.title) {
      cancelRename();
      return;
    }

    setRenamingId(thread.threadId);
    setRenameError(null);
    try {
      await onRenameThread(thread.threadId, nextTitle);
      cancelRename();
    } catch (err) {
      console.error("Failed to rename thread:", err);
      setRenameError("Could not rename thread.");
    } finally {
      setRenamingId(null);
    }
  }, [cancelRename, editingTitle, onRenameThread]);

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
                onClick={() => handleSelect(thread)}
                onKeyDown={(e) => {
                  if (editingId === thread.threadId) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(thread);
                  }
                }}
                onBlur={(e) => {
                  if (confirmingId === thread.threadId) {
                    const row = e.currentTarget;
                    requestAnimationFrame(() => {
                      if (row.contains(document.activeElement)) return;
                      setConfirmingId(null);
                    });
                  }
                }}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-3 py-3 text-left text-sm transition-colors focus-visible:bg-muted focus-visible:outline-none ${thread.threadId === activeThreadId
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <div className="min-w-0 flex-1">
                  {editingId === thread.threadId ? (
                    <div className="space-y-1.5">
                      <input
                        value={editingTitle}
                        autoFocus
                        disabled={renamingId === thread.threadId}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void saveRename(thread);
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelRename();
                          }
                        }}
                        className="w-full rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-border bg-background px-2 py-1 text-sm text-foreground outline-none transition-colors focus:border-foreground/40"
                      />
                      {renameError ? (
                        <div className="text-xs text-error">{renameError}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          Enter to save, Esc to cancel
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className={`truncate font-medium ${thread.threadId === activeThreadId ? "text-foreground" : ""}`}>
                        {thread.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(thread.updatedAt)}
                      </div>
                    </>
                  )}
                </div>

                {editingId === thread.threadId ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void saveRename(thread);
                      }}
                      disabled={renamingId === thread.threadId}
                      className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-muted px-2.5 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelRename();
                      }}
                      disabled={renamingId === thread.threadId}
                      className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : confirmingId === thread.threadId ? (
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
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      onClick={(e) => startRename(e, thread)}
                      aria-label="Rename thread"
                      className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:opacity-100"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, thread.threadId)}
                      aria-label="Delete thread"
                      className="rounded-[calc(var(--viewer-control-radius)-0.125rem)] p-1.5 text-muted-foreground transition-colors hover:bg-error/10 hover:text-error focus:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
