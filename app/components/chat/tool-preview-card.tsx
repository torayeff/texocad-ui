"use client";

import React from "react";
import { X } from "lucide-react";

import type { ToolPreviewImage } from "@/app/types/chat";

interface ToolPreviewCardProps {
  image: ToolPreviewImage;
  label?: string;
}

export const ToolPreviewCard = React.memo(function ToolPreviewCard({
  image,
  label,
}: ToolPreviewCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const labelText = label || "Preview image";

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Open ${labelText}`}
        className="block w-fit overflow-hidden rounded-xl border border-border/40 bg-background p-1 shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] transition-colors hover:border-border hover:bg-muted/25"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Tool previews can be base64 data URLs or signed URLs. */}
        <img
          src={image.src}
          alt=""
          className="h-16 w-24 rounded-lg object-contain"
          loading="lazy"
          decoding="async"
        />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labelText}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/78 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close preview"
              className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] bg-[var(--viewer-modal-background)] text-muted-foreground shadow-[0_8px_24px_rgb(0_0_0_/_0.18)] backdrop-blur-[16px] backdrop-saturate-[1.12] transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- Tool previews can be base64 data URLs or signed URLs. */}
            <img
              src={image.src}
              alt={labelText}
              className="max-h-[90dvh] max-w-[90vw] rounded-xl object-contain shadow-[0_24px_80px_rgb(0_0_0_/_0.28)]"
            />
          </div>
        </div>
      ) : null}
    </>
  );
});
