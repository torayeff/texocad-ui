"use client";

import { memo } from "react";
import { AlertCircle, Upload } from "lucide-react";

import { StatusContent } from "@/app/components/model-viewer/_components/status-content";
import type { LoadProgress, LoadState } from "@/app/types/model-viewer";
import { primaryButtonClass, viewerGlassClass } from "@/app/components/viewer/viewer-styles";
import { cn } from "@/app/lib/cn";

const modelFileAccept = ".step,.stp,.stl,.glb,.gltf,model/step,model/stl,model/gltf-binary,model/gltf+json";

function formatBytes(bytes: number) {
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 10) {
    return `${Math.round(megabytes)} MB`;
  }
  return `${megabytes.toFixed(1)} MB`;
}

interface ModelLoadPanelProps {
  loadProgress: LoadProgress | null;
  loadState: LoadState;
  showUpload: boolean;
  status: string;
  onFileChange?: (file: File | null) => void;
}

export const ModelLoadPanel = memo(function ModelLoadPanel({
  loadProgress,
  loadState,
  onFileChange,
  showUpload,
  status,
}: ModelLoadPanelProps) {
  const progressPercent = loadProgress ? Math.min(100, Math.max(0, Math.round(loadProgress.percent))) : 0;
  const progressSize = loadProgress?.loadedBytes !== undefined && loadProgress.totalBytes !== undefined
    ? `${formatBytes(loadProgress.loadedBytes)} / ${formatBytes(loadProgress.totalBytes)}`
    : null;

  const progressStatus = loadProgress ? (
    <div className={cn(viewerGlassClass, "grid w-[min(24rem,calc(100vw-2rem))] gap-2 rounded-2xl p-3")} role="status" aria-live="polite">
      <div className="flex min-w-0 items-center gap-2.5">
        <StatusContent loadState="loading" status={loadProgress.label} />
        <span className="ml-auto shrink-0 text-[0.8125rem] font-semibold tabular-nums text-muted-foreground">
          {progressPercent}%
        </span>
      </div>
      {progressSize ? (
        <p className="m-0 text-right text-[0.75rem] font-medium tabular-nums text-muted-foreground">
          {progressSize}
        </p>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--border)_58%,transparent)]"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  ) : null;

  if (loadState === "ready") {
    return null;
  }

  if (!showUpload || !onFileChange) {
    return (
      <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4">
        {progressStatus ?? (
          <div className={cn(viewerGlassClass, "flex min-w-0 items-center gap-2.5 rounded-2xl p-3")}>
            <StatusContent loadState={loadState} status={status} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4">
      <div className={cn(viewerGlassClass, "grid w-[min(25rem,calc(100vw-2rem))] gap-4 rounded-3xl p-4 text-center")}>
        <div className="grid gap-1">
          <h1 className="m-0 text-base font-bold tracking-[-0.02em] text-foreground">
            TexoCAD Viewer
          </h1>
          <p className="m-0 text-xs font-medium leading-[1.4] text-muted-foreground">
            Open STEP, STL, GLB, or self-contained GLTF files locally.
          </p>
        </div>

        <label
          className="group relative grid cursor-pointer justify-items-center gap-3 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--muted)_42%,transparent)] px-4 py-6 transition-colors hover:border-accent/45 hover:bg-muted/70"
          htmlFor="model-file"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onFileChange(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <span
            className="grid size-10 place-items-center rounded-2xl border border-border bg-muted text-muted-foreground transition-colors group-hover:text-foreground"
            aria-hidden="true"
          >
            <Upload size={18} strokeWidth={1.75} />
          </span>
          <span className="grid gap-1">
            <span className="text-sm font-bold leading-tight text-foreground">
              Drop your CAD file here
            </span>
            <span className="text-xs font-medium leading-[1.35] text-muted-foreground">
              or choose a file from your computer
            </span>
          </span>
          <span className={cn("inline-flex items-center justify-center rounded-xl px-3 py-2 text-[0.8125rem] font-bold leading-none transition-colors", primaryButtonClass)}>
            Choose file
          </span>
          <input
            id="model-file"
            type="file"
            accept={modelFileAccept}
            onChange={(event) => {
              onFileChange(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            className="pointer-events-none absolute size-px opacity-0"
          />
        </label>

        {loadState === "loading" ? progressStatus : null}

        {loadState === "error" ? (
          <p className="m-0 flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--error)_32%,var(--border))] bg-[color-mix(in_srgb,var(--error)_8%,transparent)] px-3 py-2 text-xs font-medium leading-[1.35] text-error">
            <AlertCircle size={13} strokeWidth={1.75} />
            {status}
          </p>
        ) : null}
      </div>
    </div>
  );
});
