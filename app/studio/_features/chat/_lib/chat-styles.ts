import { cn } from "@/app/lib/cn";

export const chatGlassClass =
  "border border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12]";

export const activeControlClass =
  "!bg-foreground !text-background shadow-[0_1px_2px_rgb(0_0_0_/_0.12)] hover:!bg-foreground hover:!text-background";

export const toolButtonClass =
  "grid size-[1.875rem] place-items-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent p-0 text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-55";

export const toolTooltipClass = cn(
  chatGlassClass,
  "pointer-events-none absolute left-1/2 top-[calc(100%+0.375rem)] z-50 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[0.6875rem] font-medium text-foreground opacity-0 shadow-[0_8px_24px_rgb(0_0_0_/_0.12)] group-hover/tooltip:opacity-100",
);

export const controlMenuItemClass =
  "flex min-h-8 w-full shrink-0 items-center justify-between gap-3 rounded-[calc(var(--viewer-control-radius)-0.125rem)] border-0 bg-transparent px-[0.625rem] py-[0.3125rem] text-left text-xs font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:bg-muted hover:text-foreground sm:px-[0.7rem]";

export const chatHeaderClass =
  "relative z-20 flex h-11 shrink-0 items-center justify-between border-b border-[color-mix(in_srgb,var(--border)_48%,transparent)] bg-[var(--viewer-glass-background)] px-4 py-1.5 text-foreground shadow-[0_1px_2px_rgb(0_0_0_/_0.05)] backdrop-blur-[16px] backdrop-saturate-[1.12]";

export const chatHeaderTooltipClass = cn(
  toolTooltipClass,
  "left-auto right-0 translate-x-0 group-hover/chat-header:opacity-100 group-focus-within/chat-header:opacity-100",
);

export const composerButtonClass =
  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[calc(var(--viewer-control-radius)-0.125rem)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export const composerTooltipClass = cn(
  toolTooltipClass,
  "bottom-[calc(100%+0.375rem)] top-auto group-hover/composer:opacity-100 group-focus-within/composer:opacity-100",
);
