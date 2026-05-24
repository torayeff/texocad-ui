import { Check, Copy, Loader2, X } from "lucide-react";

import { ViewerToolButton } from "@/app/components/model-viewer/_components/viewer-tool-button";
import { cn } from "@/app/lib/cn";

const linkInputClass =
  "h-[1.875rem] w-full min-w-0 rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--viewer-field-background)] px-2 py-0 text-xs text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

interface ShareDialogProps {
  copy: {
    createDescription: string;
    nameLabel: string;
    placeholder: string;
    title: string;
    urlDescription: string;
  };
  didCopyShareUrl: boolean;
  inputClassName: string;
  isSharing: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  onShareNameChange: (name: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  primaryButtonClassName: string;
  shareButtonClassName: string;
  shareError: string | null;
  shareName: string;
  shareUrl: string | null;
  shellClassName: string;
  titleId: string;
  toolButtonClassName: string;
}

export function ShareDialog({
  copy,
  didCopyShareUrl,
  inputClassName,
  isSharing,
  onClose,
  onCopyShareUrl,
  onShareNameChange,
  onSubmit,
  primaryButtonClassName,
  shareButtonClassName,
  shareError,
  shareName,
  shareUrl,
  shellClassName,
  titleId,
  toolButtonClassName,
}: ShareDialogProps) {
  const hasShareUrl = shareUrl !== null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-background/40 p-4 backdrop-blur-[2px]" role="presentation">
      <form
        className={cn(shellClassName, "grid w-[min(24rem,calc(100vw-2rem))] gap-3 rounded-[1.25rem] p-4 text-foreground")}
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-sm font-semibold">
              {copy.title}
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {hasShareUrl ? copy.urlDescription : copy.createDescription}
            </p>
          </div>
          <ViewerToolButton
            type="button"
            onClick={onClose}
            disabled={isSharing}
            tooltip="Close"
            tooltipDisabled={isSharing}
            className={toolButtonClassName}
            aria-label="Close share dialog"
          >
            <X size={14} strokeWidth={1.75} />
          </ViewerToolButton>
        </div>

        {hasShareUrl ? (
          <div className="grid gap-2">
            <div className="flex min-w-0 gap-2">
              <input
                id={`${titleId}-link`}
                aria-label="Public link"
                className={linkInputClass}
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
              <ViewerToolButton
                type="button"
                onClick={onCopyShareUrl}
                tooltip={didCopyShareUrl ? "Copied" : "Copy"}
                className={cn(toolButtonClassName, "shrink-0")}
                aria-label={didCopyShareUrl ? "Copied public link" : "Copy public link"}
              >
                {didCopyShareUrl ? <Check size={14} strokeWidth={1.75} /> : <Copy size={14} strokeWidth={1.75} />}
              </ViewerToolButton>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor={`${titleId}-name`}>
              {copy.nameLabel}
            </label>
            <input
              id={`${titleId}-name`}
              className={inputClassName}
              maxLength={80}
              value={shareName}
              onChange={(event) => onShareNameChange(event.currentTarget.value)}
              placeholder={copy.placeholder}
              autoFocus
            />
          </div>
        )}

        {shareError ? <p className="text-xs text-error">{shareError}</p> : null}

        {hasShareUrl ? null : (
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSharing || !shareName.trim()}
              className={cn(shareButtonClassName, primaryButtonClassName)}
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
