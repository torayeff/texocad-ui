export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const viewerGlassClass =
  "border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12]";

export const activeControlClass =
  "!bg-foreground !text-background shadow-[0_1px_2px_rgb(0_0_0_/_0.12)] hover:!bg-foreground hover:!text-background";

export const loadingIconClass = "animate-spin";

export const statusShellClass = cn(
  viewerGlassClass,
  "z-10 flex w-auto items-center gap-2.5 overflow-hidden rounded-[1.125rem] p-2.5 text-foreground",
);

export const progressStatusShellClass = cn(
  viewerGlassClass,
  "z-10 grid w-auto gap-2 overflow-hidden rounded-[0.875rem] px-[0.625rem] py-[0.55rem] text-foreground",
);

export const centerStatusClass =
  "absolute left-3 right-3 top-1/2 -translate-y-1/2 sm:left-1/2 sm:right-auto sm:w-[min(24rem,calc(100vw-2rem))] sm:-translate-x-1/2";

export const shareButtonClass =
  "inline-flex cursor-pointer items-center justify-center gap-[0.45rem] rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color-mix(in_srgb,var(--muted)_55%,transparent)] px-[0.8rem] py-[0.625rem] text-[0.8125rem] font-bold text-foreground transition-[background-color,border-color,opacity] duration-150 ease-in-out hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55";

export const primaryButtonClass =
  "border-[color-mix(in_srgb,var(--accent)_38%,var(--border))] bg-[color-mix(in_srgb,var(--foreground)_92%,transparent)] text-background hover:bg-foreground";

export const presetButtonClass =
  "shrink-0 rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent px-[0.625rem] py-[0.3125rem] text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground sm:px-[0.7rem]";

export const toolRailClass = cn(
  viewerGlassClass,
  "absolute left-1/2 top-3 z-20 flex w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 rounded-[var(--viewer-control-radius)] p-1 sm:flex-nowrap",
);

export const toolButtonClass =
  "grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent p-0 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55";

export const toolTooltipClass = cn(
  viewerGlassClass,
  "pointer-events-none absolute left-1/2 top-[calc(100%+0.375rem)] z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[0.6875rem] font-medium text-foreground opacity-0 shadow-[0_8px_24px_rgb(0_0_0_/_0.12)] group-hover/tooltip:opacity-100",
);

export const actionPopoverClass = cn(
  viewerGlassClass,
  "absolute z-20 grid gap-1 rounded-[var(--viewer-control-radius)] p-1 text-foreground",
);

export const loadPanelClass = cn(
  viewerGlassClass,
  "absolute left-1/2 top-1/2 z-10 grid max-h-[calc(100dvh-10rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-2.5 overflow-y-auto rounded-[1.25rem] p-3 transition-[background-color,border-color] duration-150 ease-in-out sm:max-h-none sm:gap-3 sm:overflow-visible sm:p-3.5",
);

export const dropZoneClass =
  "group relative grid min-h-[7.75rem] content-center justify-items-center gap-[0.55rem] rounded-[var(--viewer-radius)] border border-dashed border-[color-mix(in_srgb,var(--border)_76%,transparent)] bg-[color-mix(in_srgb,var(--viewer-field-background)_82%,transparent)] p-3.5 text-center text-foreground transition-[background-color,border-color,box-shadow] duration-150 ease-in-out hover:border-accent hover:bg-[color-mix(in_srgb,var(--muted)_70%,transparent)] hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] focus-within:border-accent focus-within:bg-[color-mix(in_srgb,var(--muted)_70%,transparent)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] sm:min-h-36 sm:gap-2.5 sm:p-4";

export const inputClass =
  "h-[2.625rem] w-full min-w-0 rounded-[0.8125rem] border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--viewer-field-background)] px-[0.8rem] py-[0.675rem] text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]";

export const hintClass =
  "pointer-events-none absolute bottom-7 left-3 right-3 z-10 flex select-none items-center justify-center gap-[0.35rem] whitespace-normal text-center text-[0.625rem] text-[color-mix(in_srgb,var(--muted-foreground)_60%,transparent)] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:gap-3 sm:whitespace-nowrap";
