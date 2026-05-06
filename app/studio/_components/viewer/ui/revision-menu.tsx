import { Check } from "lucide-react";

import type { ViewerRevisionOption } from "@/app/studio/_components/viewer/model-viewer-revisions";
import {
  activeControlClass,
  actionPopoverClass,
  cn,
  presetButtonClass,
} from "@/app/studio/_components/viewer/ui/styles";

interface RevisionMenuProps {
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  revisions: ViewerRevisionOption[];
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  onClose: () => void;
}

export function RevisionMenu({
  activeRevisionKey,
  isLatestRevisionSelected,
  revisions,
  onSelectLatestRevision,
  onSelectRevision,
  onClose,
}: RevisionMenuProps) {
  const latestRevisionKey = revisions[0]?.key ?? null;

  return (
    <div
      className={cn(actionPopoverClass, "left-1/2 top-[calc(100%+0.5rem)] max-h-80 w-56 -translate-x-1/2 overflow-y-auto p-1")}
      id="revision-menu"
      role="menu"
      aria-label="Revisions"
    >
      <div className="px-2 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Revisions
      </div>
      {revisions.map((revision) => {
        const isLatestRevision = revision.key === latestRevisionKey;
        const isSelected = activeRevisionKey === revision.key && (!isLatestRevision || isLatestRevisionSelected);
        return (
          <button
            key={revision.key}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            onClick={() => {
              if (!revision.canView) return;
              if (isLatestRevision) {
                onSelectLatestRevision();
              } else {
                onSelectRevision(revision.key);
              }
              onClose();
            }}
            disabled={!revision.canView}
            className={cn(
              presetButtonClass,
              "flex w-full items-center justify-between gap-3 text-left disabled:opacity-55",
              isSelected && activeControlClass,
            )}
          >
            <span className="min-w-0">
              <span className="block truncate">
                Revision {revision.revisionNumber}{isLatestRevision ? " (latest)" : ""}
              </span>
              <span className="block truncate text-[0.6875rem] font-normal opacity-70">
                {isLatestRevision ? "Auto-follow new revisions" : revision.filename ?? "STEP unavailable"}
              </span>
            </span>
            {isSelected ? <Check size={13} strokeWidth={1.75} className="shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}
