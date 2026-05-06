"use client";

import { memo, useState } from "react";
import { Copyright, Info } from "lucide-react";

import { LegalNoticesDialog } from "@/app/studio/_components/viewer/ui/legal-notices-dialog";
import { hintClass, legalNoticeClass } from "@/app/studio/_components/viewer/ui/styles";

interface ViewerGestureHintProps {
  showGestures: boolean;
}

export const ViewerGestureHint = memo(function ViewerGestureHint({ showGestures }: ViewerGestureHintProps) {
  const [legalNoticesOpen, setLegalNoticesOpen] = useState(false);

  return (
    <>
      {showGestures ? (
        <div className={hintClass}>
          <span>Drag to orbit</span>
          <span className="opacity-50">·</span>
          <span>Scroll to zoom</span>
          <span className="opacity-50">·</span>
          <span>Middle/right-drag to pan</span>
        </div>
      ) : null}

      <div className={legalNoticeClass}>
        <span className="inline-flex items-center gap-[0.25rem]">
          <Copyright size={11} strokeWidth={2} aria-hidden="true" />
          <span>TexoCAD</span>
        </span>
        <span className="opacity-50">·</span>
        <button
          type="button"
          onClick={() => setLegalNoticesOpen(true)}
          aria-label="Open legal notices"
          className="pointer-events-auto inline-flex items-center gap-[0.25rem] border-0 bg-transparent p-0 text-inherit"
        >
          <Info size={11} strokeWidth={2} aria-hidden="true" />
          <span>Legal</span>
        </button>
      </div>

      {legalNoticesOpen ? <LegalNoticesDialog onClose={() => setLegalNoticesOpen(false)} /> : null}
    </>
  );
});
