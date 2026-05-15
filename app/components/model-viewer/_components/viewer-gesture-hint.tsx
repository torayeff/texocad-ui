import { memo } from "react";

import { hintClass } from "@/app/components/model-viewer/_lib/viewer-styles";

interface ViewerGestureHintProps {
  showGestures: boolean;
}

export const ViewerGestureHint = memo(function ViewerGestureHint({ showGestures }: ViewerGestureHintProps) {
  if (!showGestures) {
    return null;
  }

  return (
    <div className={hintClass}>
      <span>Drag to orbit</span>
      <span className="opacity-50">·</span>
      <span>Scroll to zoom</span>
      <span className="opacity-50">·</span>
      <span>Middle/right-drag to pan</span>
      <span className="opacity-50">·</span>
      <span>Click to select</span>
      <span className="opacity-50">·</span>
      <span>Shift-click for assembly</span>
    </div>
  );
});
