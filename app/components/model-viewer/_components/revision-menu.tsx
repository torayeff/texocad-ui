import { forwardRef } from "react";
import { Check } from "lucide-react";

import type { CSSProperties } from "react";
import type { ViewerRevisionOption } from "@/app/types/model-viewer";
import {
  activeControlClass,
  controlMenuItemClass,
  controlMenuPopoverClass,
} from "@/app/components/viewer/viewer-styles";
import { cn } from "@/app/lib/cn";

interface RevisionMenuProps {
  activeRevisionKey: string | null;
  id?: string;
  isLatestRevisionSelected: boolean;
  revisions: ViewerRevisionOption[];
  style?: CSSProperties;
  unavailableLabel?: string;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  onClose: () => void;
}

export const RevisionMenu = forwardRef<HTMLDivElement, RevisionMenuProps>(function RevisionMenu({
  activeRevisionKey,
  id = "revision-menu",
  isLatestRevisionSelected,
  revisions,
  style,
  unavailableLabel = "STEP unavailable",
  onSelectLatestRevision,
  onSelectRevision,
  onClose,
}, ref) {
  const latestRevisionKey = revisions[0]?.key ?? null;

  return (
    <div
      ref={ref}
      className={cn(controlMenuPopoverClass, "max-h-80 overflow-y-auto")}
      style={style}
      id={id}
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
              controlMenuItemClass,
              "disabled:opacity-55",
              isSelected && activeControlClass,
            )}
          >
            <span className="min-w-0">
              <span className="block truncate">
                Revision {revision.revisionNumber}{isLatestRevision ? " (latest)" : ""}
              </span>
              <span className="block truncate text-[0.6875rem] font-normal opacity-70">
                {isLatestRevision ? "Auto-follow new revisions" : revision.filename ?? unavailableLabel}
              </span>
            </span>
            {isSelected ? <Check size={13} strokeWidth={1.75} className="shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
});
