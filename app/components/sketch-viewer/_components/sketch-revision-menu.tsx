import { forwardRef } from "react";
import { Check, ImageIcon } from "lucide-react";

import type { CSSProperties } from "react";
import type { SketchRevisionOption } from "@/app/types/sketch-viewer";
import {
  activeControlClass,
  controlMenuItemClass,
  controlMenuPopoverClass,
} from "@/app/components/viewer/viewer-styles";
import { cn } from "@/app/lib/cn";

interface SketchRevisionMenuProps {
  activeRevisionKey: string | null;
  isLatestRevisionSelected: boolean;
  latestRevisionKey: string | null;
  revisions: SketchRevisionOption[];
  style?: CSSProperties;
  onSelectLatestRevision: () => void;
  onSelectRevision: (key: string) => void;
  onClose: () => void;
}

export const SketchRevisionMenu = forwardRef<HTMLDivElement, SketchRevisionMenuProps>(function SketchRevisionMenu({
  activeRevisionKey,
  isLatestRevisionSelected,
  latestRevisionKey,
  revisions,
  style,
  onSelectLatestRevision,
  onSelectRevision,
  onClose,
}, ref) {
  return (
    <div
      ref={ref}
      className={cn(controlMenuPopoverClass, "max-h-80 overflow-y-auto")}
      style={style}
      id="sketch-revision-menu"
      role="menu"
      aria-label="Sketch revisions"
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
              "min-h-12 disabled:opacity-55",
              isSelected && activeControlClass,
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--viewer-field-background)_82%,transparent)]">
                {revision.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed blob URLs are short-lived thumbnails.
                  <img
                    src={revision.thumbnailUrl}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <ImageIcon size={14} strokeWidth={1.75} />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate">
                  Revision {revision.revisionNumber}{isLatestRevision ? " (latest)" : ""}
                </span>
                <span className="block truncate text-[0.6875rem] font-normal opacity-70">
                  {revision.filename ?? "Image unavailable"}
                </span>
              </span>
            </span>
            {isSelected ? <Check size={13} strokeWidth={1.75} className="shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
});
