import { Check, Copy, Loader2, X } from "lucide-react";

import { ViewerToolButton } from "@/app/components/viewer/viewer-tool-button";
import {
  inputClass,
  primaryButtonClass,
  shareButtonClass,
  toolButtonClass,
  viewerGlassClass,
} from "@/app/components/viewer/viewer-styles";
import { cn } from "@/app/lib/cn";

const linkInputClass =
  "h-[1.875rem] w-full min-w-0 rounded-[calc(var(--viewer-control-radius)-0.125rem)] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--viewer-field-background)] px-2 py-0 text-xs text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

interface ShareDialogCopy {
  createDescription: string;
  nameLabel: string;
  placeholder: string;
  title: string;
  urlDescription: string;
}

interface ShareDialogBaseProps {
  copy: ShareDialogCopy;
  didCopyShareUrl: boolean;
  isSharing: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  shareError: string | null;
  shareUrl: string | null;
  titleId: string;
}

interface CreateShareDialogProps extends ShareDialogBaseProps {
  mode: "create";
  onShareNameChange: (name: string) => void;
  onSubmit: (event: SubmitEvent) => void;
  shareName: string;
}

interface CopyShareDialogProps extends ShareDialogBaseProps {
  mode: "copy";
}

type ShareDialogProps = CreateShareDialogProps | CopyShareDialogProps;

export function ShareDialog(props: ShareDialogProps) {
  const {
    copy,
    didCopyShareUrl,
    isSharing,
    onClose,
    onCopyShareUrl,
    shareError,
    shareUrl,
    titleId,
  } = props;
  const hasShareUrl = shareUrl !== null;
  const canCreateLink = props.mode === "create" && !hasShareUrl;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-background/40 p-4 backdrop-blur-[2px]" role="presentation">
      <div
        className={cn(viewerGlassClass, "grid w-[min(24rem,calc(100vw-2rem))] gap-3 rounded-[1.25rem] p-4 text-foreground")}
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
            className={toolButtonClass}
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
                className={cn(toolButtonClass, "shrink-0")}
                aria-label={didCopyShareUrl ? "Copied public link" : "Copy public link"}
              >
                {didCopyShareUrl ? <Check size={14} strokeWidth={1.75} /> : <Copy size={14} strokeWidth={1.75} />}
              </ViewerToolButton>
            </div>
          </div>
        ) : canCreateLink ? (
          <form
            className="grid gap-3"
            onSubmit={(event) => props.onSubmit(event.nativeEvent)}
          >
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor={`${titleId}-name`}>
                {copy.nameLabel}
              </label>
              <input
                id={`${titleId}-name`}
                className={inputClass}
                maxLength={80}
                value={props.shareName}
                onChange={(event) => props.onShareNameChange(event.currentTarget.value)}
                placeholder={copy.placeholder}
                autoFocus
              />
            </div>

            {shareError ? <p className="text-xs text-error">{shareError}</p> : null}

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={isSharing || !props.shareName.trim()}
                className={cn(shareButtonClass, primaryButtonClass)}
              >
                {isSharing ? <Loader2 size={14} strokeWidth={1.75} className="animate-spin" /> : null}
                {isSharing ? "Sharing..." : "Create link"}
              </button>
            </div>
          </form>
        ) : null}

        {hasShareUrl && shareError ? <p className="text-xs text-error">{shareError}</p> : null}
      </div>
    </div>
  );
}
