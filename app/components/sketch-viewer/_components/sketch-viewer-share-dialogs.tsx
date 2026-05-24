import { SketchShareDialog } from "@/app/components/sketch-viewer/_components/sketch-share-dialog";

interface CreateShareDialogState {
  didCopyShareUrl: boolean;
  isOpen: boolean;
  isSharing: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  onShareNameChange: (name: string) => void;
  onSubmit: (event: SubmitEvent) => void;
  shareError: string | null;
  shareName: string;
  shareUrl: string | null;
}

interface CopyShareDialogState {
  didCopyShareUrl: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  shareError: string | null;
  shareUrl: string | null;
}

interface SketchViewerShareDialogsProps {
  createDialog: CreateShareDialogState;
  publicDialog: CopyShareDialogState;
}

export function SketchViewerShareDialogs({ createDialog, publicDialog }: SketchViewerShareDialogsProps) {
  return (
    <>
      {createDialog.isOpen ? (
        <SketchShareDialog
          mode="create"
          didCopyShareUrl={createDialog.didCopyShareUrl}
          isSharing={createDialog.isSharing}
          onClose={createDialog.onClose}
          onCopyShareUrl={createDialog.onCopyShareUrl}
          onShareNameChange={createDialog.onShareNameChange}
          onSubmit={createDialog.onSubmit}
          shareError={createDialog.shareError}
          shareName={createDialog.shareName}
          shareUrl={createDialog.shareUrl}
        />
      ) : null}

      {publicDialog.isOpen ? (
        <SketchShareDialog
          mode="copy"
          didCopyShareUrl={publicDialog.didCopyShareUrl}
          isSharing={false}
          onClose={publicDialog.onClose}
          onCopyShareUrl={publicDialog.onCopyShareUrl}
          shareError={publicDialog.shareError}
          shareUrl={publicDialog.shareUrl}
        />
      ) : null}
    </>
  );
}
