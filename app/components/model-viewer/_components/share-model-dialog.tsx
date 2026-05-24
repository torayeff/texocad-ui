import { ShareDialog } from "@/app/components/share-dialog";

type ShareModelDialogProps = CreateShareModelDialogProps | CopyShareModelDialogProps;

interface ShareModelDialogBaseProps {
  didCopyShareUrl: boolean;
  isSharing: boolean;
  onClose: () => void;
  onCopyShareUrl: () => void;
  shareError: string | null;
  shareUrl: string | null;
}

interface CreateShareModelDialogProps extends ShareModelDialogBaseProps {
  mode: "create";
  onShareNameChange: (name: string) => void;
  onSubmit: (event: SubmitEvent) => void;
  shareName: string;
}

interface CopyShareModelDialogProps extends ShareModelDialogBaseProps {
  mode: "copy";
}

const shareModelCopy = {
  createDescription: "Create a public link for this selected model revision.",
  nameLabel: "Model name",
  placeholder: "My Example Model",
  title: "Share model",
  urlDescription: "Copy the public link for this model.",
};

export function ShareModelDialog(props: ShareModelDialogProps) {
  return (
    <ShareDialog
      copy={shareModelCopy}
      {...props}
      titleId="share-model-title"
    />
  );
}
