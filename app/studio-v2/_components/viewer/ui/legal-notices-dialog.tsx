import { memo } from "react";
import { ExternalLink, X } from "lucide-react";

import {
  cn,
  modalBackdropClass,
  modalPanelClass,
  shareButtonClass,
  toolButtonClass,
} from "@/app/studio-v2/_components/viewer/ui/styles";

const licenseLinks = [
  {
    href: "/licenses/occt-import-js-lgpl-2.1.txt",
    label: "occt-import-js LGPL v2.1 license",
  },
  {
    href: "/licenses/opencascade-technology-lgpl-2.1.txt",
    label: "Open CASCADE Technology license",
  },
];

interface LegalNoticesDialogProps {
  onClose: () => void;
}

export const LegalNoticesDialog = memo(function LegalNoticesDialog({ onClose }: LegalNoticesDialogProps) {
  return (
    <div className={cn(modalBackdropClass, "z-30")} role="presentation">
      <section
        className={cn(modalPanelClass, "w-[min(30rem,100%)] gap-4")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-notices-title"
        aria-describedby="legal-notices-description"
      >
        <div className="flex items-start justify-between gap-3.5">
          <div className="grid min-w-0 gap-[0.2rem]">
            <h2 id="legal-notices-title" className="m-0 text-[1.0625rem] font-bold tracking-[-0.02em] text-foreground">
              Legal notices
            </h2>
            <p id="legal-notices-description" className="m-0 text-[0.8125rem] leading-[1.45] text-muted-foreground">
              Third-party CAD import technology used by TexoCAD Studio V2.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(toolButtonClass, "size-8 shrink-0 rounded-[var(--viewer-control-radius)]")}
            aria-label="Close legal notices"
            title="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="grid gap-2 text-[0.8125rem] leading-[1.5] text-muted-foreground">
          <p className="m-0">
            TexoCAD Studio V2 uses <span className="font-semibold text-foreground">occt-import-js</span>, a
            JavaScript/WebAssembly interface for Open CASCADE Technology, to read STEP files in the browser.
          </p>
          <p className="m-0">
            The library is licensed under GNU LGPL v2.1 and is served as a separate WebAssembly asset.
          </p>
        </div>

        <div className="grid gap-2">
          {licenseLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between gap-3 rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_58%,transparent)] bg-[color-mix(in_srgb,var(--muted)_38%,transparent)] px-[0.8rem] py-[0.65rem] text-[0.8125rem] font-semibold text-foreground no-underline transition-colors duration-150 ease-in-out hover:bg-muted"
            >
              <span>{label}</span>
              <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
            </a>
          ))}
        </div>

        <a
          href="https://github.com/kovacsv/occt-import-js"
          target="_blank"
          rel="noreferrer"
          className={cn(shareButtonClass, "w-fit")}
        >
          <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>View source on GitHub</span>
        </a>
      </section>
    </div>
  );
});
