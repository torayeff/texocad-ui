import { ShareModelDialog } from "@/app/components/model-viewer/_components/share-model-dialog";

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

interface ModelViewerShareDialogsProps {
  generatedDialog: CreateShareDialogState;
  localDialog: CreateShareDialogState;
  publicDialog: CopyShareDialogState;
}

export function ModelViewerShareDialogs({
  generatedDialog,
  localDialog,
  publicDialog,
}: ModelViewerShareDialogsProps) {
  return (
    <>
      {localDialog.isOpen ? (
        <ShareModelDialog
          mode="create"
          didCopyShareUrl={localDialog.didCopyShareUrl}
          isSharing={localDialog.isSharing}
          onClose={localDialog.onClose}
          onCopyShareUrl={localDialog.onCopyShareUrl}
          onShareNameChange={localDialog.onShareNameChange}
          onSubmit={localDialog.onSubmit}
          shareError={localDialog.shareError}
          shareName={localDialog.shareName}
          shareUrl={localDialog.shareUrl}
        />
      ) : null}

      {generatedDialog.isOpen ? (
        <ShareModelDialog
          mode="create"
          didCopyShareUrl={generatedDialog.didCopyShareUrl}
          isSharing={generatedDialog.isSharing}
          onClose={generatedDialog.onClose}
          onCopyShareUrl={generatedDialog.onCopyShareUrl}
          onShareNameChange={generatedDialog.onShareNameChange}
          onSubmit={generatedDialog.onSubmit}
          shareError={generatedDialog.shareError}
          shareName={generatedDialog.shareName}
          shareUrl={generatedDialog.shareUrl}
        />
      ) : null}

      {publicDialog.isOpen ? (
        <ShareModelDialog
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
