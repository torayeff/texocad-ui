import { ShareDialog } from "@/app/components/share-dialog";
import {
  inputClass,
  primaryButtonClass,
  shareButtonClass,
  toolButtonClass,
  viewerGlassClass,
} from "@/app/components/model-viewer/_lib/viewer-styles";

interface ShareModelDialogProps {
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

export function ShareModelDialog({
  didCopyShareUrl,
  isSharing,
  onClose,
  onCopyShareUrl,
  onShareNameChange,
  onSubmit,
  shareError,
  shareName,
  shareUrl,
}: ShareModelDialogProps) {
  return (
    <ShareDialog
      copy={{
        createDescription: "Create a public link for this selected model revision.",
        nameLabel: "Model name",
        placeholder: "My Example Model",
        title: "Share model",
        urlDescription: "Copy the public link for this model.",
      }}
      didCopyShareUrl={didCopyShareUrl}
      inputClassName={inputClass}
      isSharing={isSharing}
      onClose={onClose}
      onCopyShareUrl={onCopyShareUrl}
      onShareNameChange={onShareNameChange}
      onSubmit={onSubmit}
      primaryButtonClassName={primaryButtonClass}
      shareButtonClassName={shareButtonClass}
      shareError={shareError}
      shareName={shareName}
      shareUrl={shareUrl}
      shellClassName={viewerGlassClass}
      titleId="share-model-title"
      toolButtonClassName={toolButtonClass}
    />
  );
}
