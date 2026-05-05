import { AlertCircle, Loader2, Upload } from "lucide-react";

import { type LoadState } from "@/app/studio-v2/_components/viewer/model-viewer-state";
import { cn, loadingIconClass } from "@/app/studio-v2/_components/viewer/ui/styles";

export interface StatusContentProps {
  loadState: LoadState;
  status: string;
}

export function StatusContent({ loadState, status }: StatusContentProps) {
  return (
    <>
      <span
        className={cn(
          "grid size-[1.875rem] shrink-0 place-items-center rounded-full bg-muted text-muted-foreground",
          loadState === "loading" && "text-accent",
          loadState === "error" && "text-error",
        )}
        aria-hidden="true"
      >
        {loadState === "loading" ? (
          <Loader2 size={15} strokeWidth={1.75} className={loadingIconClass} />
        ) : loadState === "error" ? (
          <AlertCircle size={15} strokeWidth={1.75} />
        ) : (
          <Upload size={15} strokeWidth={1.75} />
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.8125rem] font-semibold text-foreground">
          {status}
        </span>
      </span>
    </>
  );
}
