"use client";

import { Eye, EyeOff } from "lucide-react";
import type { ViewerPart } from "@/app/studio/_types/viewer";

export function AssemblyTree({
  parts,
  visibilityMap,
  onToggle,
}: {
  parts: ViewerPart[];
  visibilityMap: Record<string, boolean>;
  onToggle: (name: string) => void;
}) {
  if (parts.length === 0) return null;

  return (
    <div className="absolute top-12 left-2 z-10 flex flex-col gap-0.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md p-1.5 shadow-sm max-h-[60%] overflow-y-auto">
      <span className="px-1.5 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
        Parts
      </span>
      {parts.map((part) => {
        const visible = visibilityMap[part.name] !== false;
        return (
          <button
            key={part.name}
            onClick={() => onToggle(part.name)}
            className="flex items-center gap-2 rounded px-1.5 py-1 text-xs transition-colors hover:bg-muted/80"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-[3px] transition-all duration-200 ${visible ? "opacity-100" : "opacity-30"}`}
              style={{ backgroundColor: visible ? part.color : "transparent", border: `1.5px solid ${part.color}` }}
            />
            <span className={`truncate transition-colors ${visible ? "text-foreground font-medium" : "text-muted-foreground line-through opacity-70"}`}>
              {part.name}
            </span>
            {visible ? (
              <Eye size={12} className="ml-auto shrink-0 text-muted-foreground transition-opacity hover:text-foreground" />
            ) : (
              <EyeOff size={12} className="ml-auto shrink-0 text-muted-foreground/40 transition-opacity hover:text-muted-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );
}
