import { ShareDialog } from "@/app/components/share-dialog";
import {
  sketchViewerGlassClass,
  sketchViewerInputClass,
  sketchViewerPrimaryButtonClass,
  sketchViewerShareButtonClass,
  sketchViewerToolButtonClass,
} from "@/app/components/sketch-viewer/_lib/sketch-viewer-styles";

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
    <ShareDialog
      copy={{
        createDescription: "Create a public link for this selected sketch revision.",
        nameLabel: "Sketch name",
        placeholder: "My Example Sketch",
        title: "Share sketch",
        urlDescription: "Copy the public link for this sketch.",
      }}
      didCopyShareUrl={didCopyShareUrl}
      inputClassName={sketchViewerInputClass}
      isSharing={isSharing}
      onClose={onClose}
      onCopyShareUrl={onCopyShareUrl}
      onShareNameChange={onShareNameChange}
      onSubmit={onSubmit}
      primaryButtonClassName={sketchViewerPrimaryButtonClass}
      shareButtonClassName={sketchViewerShareButtonClass}
      shareError={shareError}
      shareName={shareName}
      shareUrl={shareUrl}
      shellClassName={sketchViewerGlassClass}
      titleId="share-sketch-title"
      toolButtonClassName={sketchViewerToolButtonClass}
    />
  );
}
