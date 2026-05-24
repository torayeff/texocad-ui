import { cn } from "@/app/lib/cn";

export const viewerGlassClass =
  "border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12]";

export const activeControlClass =
  "!bg-foreground !text-background shadow-[0_1px_2px_rgb(0_0_0_/_0.12)] hover:!bg-foreground hover:!text-background";

export const loadingIconClass = "animate-spin";

export const shareButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-[0.45rem] rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--muted)_55%,transparent)] px-[0.8rem] py-[0.625rem] text-[0.8125rem] font-bold text-muted-foreground transition-[background-color,border-color,opacity,color] duration-150 ease-in-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55";

export const primaryButtonClass =
  "border-[color-mix(in_srgb,var(--accent)_38%,var(--border))] bg-[color-mix(in_srgb,var(--foreground)_92%,transparent)] text-background hover:bg-foreground";

export const presetButtonClass =
  "shrink-0 rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent px-[0.625rem] py-[0.3125rem] text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground sm:px-[0.7rem]";

export const toolRailClass = cn(
  viewerGlassClass,
  "absolute left-1/2 top-5 z-40 flex w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 rounded-[var(--viewer-control-radius)] p-1 sm:flex-nowrap",
);

export const toolButtonClass =
  "grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent p-0 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55";

export const toolTooltipClass = cn(
  viewerGlassClass,
  "pointer-events-none absolute left-1/2 top-[calc(100%+0.375rem)] z-50 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[0.6875rem] font-medium text-foreground opacity-0 shadow-[0_8px_24px_rgb(0_0_0_/_0.12)] group-hover/tooltip:opacity-100",
);

export const actionPopoverClass = cn(
  viewerGlassClass,
  "absolute z-50 grid gap-1 rounded-[var(--viewer-control-radius)] text-foreground",
);

const controlPopoverAnchorClass =
  "w-[min(15rem,calc(100vw-1.5rem))]";

export const controlMenuPopoverClass = cn(
  actionPopoverClass,
  controlPopoverAnchorClass,
  "p-1",
);

export const controlPanelPopoverClass = cn(
  actionPopoverClass,
  controlPopoverAnchorClass,
  "gap-2 p-2.5",
);

export const controlFloatingPanelClass =
  "absolute z-50";

export const controlMenuItemClass = cn(
  presetButtonClass,
  "flex min-h-8 w-full items-center justify-between gap-3 text-left",
);

export const inputClass =
  "h-[2.625rem] w-full min-w-0 rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--viewer-field-background)] px-[0.8rem] py-[0.675rem] text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

export const hintClass =
  "pointer-events-none absolute bottom-7 left-3 right-3 z-10 flex select-none items-center justify-center gap-[0.35rem] whitespace-normal text-center text-[0.625rem] text-[color-mix(in_srgb,var(--muted-foreground)_60%,transparent)] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:gap-3 sm:whitespace-nowrap";
