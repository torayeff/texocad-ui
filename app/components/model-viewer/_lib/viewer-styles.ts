import { cn } from "@/app/lib/cn";
import { viewerGlassClass } from "@/app/components/viewer/viewer-styles";

export {
  actionPopoverClass,
  activeControlClass,
  controlFloatingPanelClass,
  controlMenuItemClass,
  controlMenuPopoverClass,
  controlPanelPopoverClass,
  inputClass,
  loadingIconClass,
  presetButtonClass,
  primaryButtonClass,
  shareButtonClass,
  toolButtonClass,
  toolRailClass,
  toolTooltipClass,
  viewerGlassClass,
} from "@/app/components/viewer/viewer-styles";

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

export const loadPanelClass = cn(
  viewerGlassClass,
  "absolute left-1/2 top-1/2 z-10 grid max-h-[calc(100dvh-10rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-2.5 overflow-y-auto rounded-[1.25rem] p-3 transition-[background-color,border-color] duration-150 ease-in-out sm:max-h-none sm:gap-3 sm:overflow-visible sm:p-3.5",
);

export const dropZoneClass =
  "group relative grid min-h-[7.75rem] content-center justify-items-center gap-[0.55rem] rounded-[var(--viewer-radius)] border border-dashed border-[color-mix(in_srgb,var(--border)_76%,transparent)] bg-[color-mix(in_srgb,var(--viewer-field-background)_82%,transparent)] p-3.5 text-center text-foreground transition-[background-color,border-color,box-shadow] duration-150 ease-in-out hover:border-accent hover:bg-[color-mix(in_srgb,var(--muted)_70%,transparent)] hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] focus-within:border-accent focus-within:bg-[color-mix(in_srgb,var(--muted)_70%,transparent)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] sm:min-h-36 sm:gap-2.5 sm:p-4";

export const hintClass =
  "pointer-events-none absolute bottom-7 left-3 right-3 z-10 flex select-none items-center justify-center gap-[0.35rem] whitespace-normal text-center text-[0.625rem] text-[color-mix(in_srgb,var(--muted-foreground)_60%,transparent)] sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:gap-3 sm:whitespace-nowrap";
