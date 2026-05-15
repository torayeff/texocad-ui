import type { ButtonHTMLAttributes, ReactNode } from "react";

import { toolTooltipClass } from "@/app/components/model-viewer/_lib/viewer-styles";

interface ViewerToolButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  children: ReactNode;
  tooltip: string;
  tooltipDisabled?: boolean;
}

export function ViewerToolButton({
  children,
  className,
  tooltip,
  tooltipDisabled = false,
  ...buttonProps
}: ViewerToolButtonProps) {
  return (
    <span className="group/tooltip relative inline-grid">
      <button {...buttonProps} aria-label={buttonProps["aria-label"] ?? tooltip} className={className}>
        {children}
      </button>
      {tooltipDisabled ? null : (
        <span role="tooltip" className={toolTooltipClass}>
          {tooltip}
        </span>
      )}
    </span>
  );
}
