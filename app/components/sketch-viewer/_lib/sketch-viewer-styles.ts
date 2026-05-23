import { cn } from "@/app/lib/cn";

export const sketchViewerGlassClass =
  "border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12]";

export const sketchViewerActiveControlClass =
  "!bg-foreground !text-background shadow-[0_1px_2px_rgb(0_0_0_/_0.12)] hover:!bg-foreground hover:!text-background";

export const sketchViewerToolRailClass = cn(
  sketchViewerGlassClass,
  "absolute left-1/2 top-5 z-40 flex w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center justify-center gap-0.5 rounded-[var(--viewer-control-radius)] p-1",
);

export const sketchViewerToolButtonClass =
  "grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent p-0 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55";

export const sketchViewerInputClass =
  "h-[2.625rem] w-full min-w-0 rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--viewer-field-background)] px-[0.8rem] py-[0.675rem] text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

export const sketchViewerShareButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-[0.45rem] rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--muted)_55%,transparent)] px-[0.8rem] py-[0.625rem] text-[0.8125rem] font-bold text-foreground transition-[background-color,border-color,opacity] duration-150 ease-in-out hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55";

export const sketchViewerPrimaryButtonClass =
  "border-[color-mix(in_srgb,var(--accent)_38%,var(--border))] bg-[color-mix(in_srgb,var(--foreground)_92%,transparent)] text-background hover:bg-foreground";
