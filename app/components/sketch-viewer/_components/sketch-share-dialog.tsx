import { Check, Copy, Loader2, X } from "lucide-react";

import {
  sketchViewerGlassClass,
  sketchViewerInputClass,
  sketchViewerPrimaryButtonClass,
  sketchViewerShareButtonClass,
} from "@/app/components/sketch-viewer/_lib/sketch-viewer-styles";
import { cn } from "@/app/lib/cn";

interface SketchShareDialogProps {
  didCopyShareUrl: boolean;
  isSharing: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  onShareNameChange: (name: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  shareError: string | null;
  shareName: string;
  shareUrl: string | null;
}

export function SketchShareDialog({
  didCopyShareUrl,
  isSharing,
  onClose,
  onCopyShareUrl,
  onShareNameChange,
  onSubmit,
  shareError,
  shareName,
  shareUrl,
}: SketchShareDialogProps) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-background/40 p-4 backdrop-blur-[2px]" role="presentation">
      <form
        className={cn(sketchViewerGlassClass, "grid w-[min(24rem,calc(100vw-2rem))] gap-3 rounded-[1.25rem] p-4 text-foreground")}
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sketch-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="share-sketch-title" className="text-sm font-semibold">
              Share sketch
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Create a public link for this selected image revision.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSharing}
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Close share dialog"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>

        {shareUrl ? (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="share-sketch-link">
              Public link
            </label>
            <div className="flex min-w-0 gap-2">
              <input
                id="share-sketch-link"
                className={sketchViewerInputClass}
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
              <button
                type="button"
                onClick={onCopyShareUrl}
                className={cn(sketchViewerShareButtonClass, "shrink-0")}
              >
                {didCopyShareUrl ? <Check size={14} strokeWidth={1.75} /> : <Copy size={14} strokeWidth={1.75} />}
                {didCopyShareUrl ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="share-sketch-name">
              Sketch name
            </label>
            <input
              id="share-sketch-name"
              className={sketchViewerInputClass}
              maxLength={80}
              value={shareName}
              onChange={(event) => onShareNameChange(event.currentTarget.value)}
              placeholder="My Example Sketch"
              autoFocus
            />
          </div>
        )}

        {shareError ? <p className="text-xs text-error">{shareError}</p> : null}

        {shareUrl ? null : (
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSharing || !shareName.trim()}
              className={cn(sketchViewerShareButtonClass, sketchViewerPrimaryButtonClass)}
            >
              {isSharing ? <Loader2 size={14} strokeWidth={1.75} className="animate-spin" /> : null}
              {isSharing ? "Sharing..." : "Create link"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
