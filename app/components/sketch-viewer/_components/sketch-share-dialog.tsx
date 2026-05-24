import { ShareDialog } from "@/app/components/share-dialog";

type SketchShareDialogProps = CreateSketchShareDialogProps | CopySketchShareDialogProps;

interface SketchShareDialogBaseProps {
  didCopyShareUrl: boolean;
  isSharing: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  shareError: string | null;
  shareUrl: string | null;
}

interface CreateSketchShareDialogProps extends SketchShareDialogBaseProps {
  mode: "create";
  onShareNameChange: (name: string) => void;
  onSubmit: (event: SubmitEvent) => void;
  shareName: string;
}

interface CopySketchShareDialogProps extends SketchShareDialogBaseProps {
  mode: "copy";
}

const shareSketchCopy = {
  createDescription: "Create a public link for this selected sketch revision.",
  nameLabel: "Sketch name",
  placeholder: "My Example Sketch",
  title: "Share sketch",
  urlDescription: "Copy the public link for this sketch.",
};

export function SketchShareDialog(props: SketchShareDialogProps) {
  return (
    <ShareDialog
      copy={shareSketchCopy}
      {...props}
      titleId="share-sketch-title"
    />
  );
}
