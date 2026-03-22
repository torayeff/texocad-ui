"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Canvas } from "@react-three/fiber";
import { Maximize2, Grid3x3, Box, RotateCw, Download, ChevronDown, Loader2 } from "lucide-react";

import { useMounted } from "@/app/hooks/use-mounted";
import { Scene } from "@/app/studio/_components/viewer/Scene";
import { VIEW_LABELS, INITIAL_CAMERA_POS } from "@/app/studio/_lib/viewer-constants";
import type { ViewPreset, ViewCommand } from "@/app/studio/_types/viewer";

type DownloadFormat = "stl" | "step" | "py";

const DOWNLOAD_FORMATS: { key: DownloadFormat; label: string; file: string }[] = [
  { key: "stl", label: "STL", file: "model.stl" },
  { key: "step", label: "STEP", file: "model.step" },
  { key: "py", label: "PYTHON", file: "model.py" },
];

export default function Viewer({
  stlUrl,
  downloadUrls,
}: {
  stlUrl: string | null;
  downloadUrls: { stl?: string; step?: string; py?: string };
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const [viewCommand, setViewCommand] = useState<ViewCommand | null>(null);
  const [activeView, setActiveView] = useState<ViewPreset>("iso");
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stlLoading, setStlLoading] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const cmdIdRef = useRef(0);
  const downloadRef = useRef<HTMLDivElement>(null);

  const isDark = mounted && resolvedTheme === "dark";
  const bgColor = isDark ? "#09090b" : "#f4f4f5";

  const setView = useCallback((view: ViewPreset) => {
    setActiveView(view);
    setViewCommand({ kind: "view", view, id: ++cmdIdRef.current });
  }, []);

  const fitView = useCallback(() => {
    setViewCommand({ kind: "fit", id: ++cmdIdRef.current });
  }, []);

  useEffect(() => {
    if (!downloadOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!downloadRef.current?.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [downloadOpen]);

  const hasAnyDownload = DOWNLOAD_FORMATS.some((f) => downloadUrls[f.key]);

  const handleDownload = useCallback((format: DownloadFormat) => {
    const url = downloadUrls[format];
    if (!url) return;
    const filename = DOWNLOAD_FORMATS.find((f) => f.key === format)?.file ?? format;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [downloadUrls]);

  return (
    <div className="relative h-full w-full" style={{ background: bgColor }}>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-1 shadow-sm">
        {(Object.keys(VIEW_LABELS) as ViewPreset[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${activeView === v
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <div ref={downloadRef} className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setDownloadOpen((o) => !o)}
          disabled={!hasAnyDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-card/80 backdrop-blur-sm border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download size={13} />
          Download
          <ChevronDown size={11} className={`transition-transform ${downloadOpen ? "rotate-180" : ""}`} />
        </button>
        {downloadOpen && (
          <div className="absolute right-0 mt-1 min-w-[120px] rounded-md border border-border/50 bg-card/95 backdrop-blur-sm shadow-md overflow-hidden">
            {DOWNLOAD_FORMATS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  handleDownload(f.key);
                  setDownloadOpen(false);
                }}
                disabled={!downloadUrls[f.key]}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={12} />
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-0.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-1 shadow-sm">
        <button
          onClick={fitView}
          title="Fit View"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Maximize2 size={14} strokeWidth={1.75} />
        </button>
        <div className="w-4 h-px bg-border/60 my-0.5" />
        <button
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle Grid"
          className={`rounded p-1.5 transition-colors hover:bg-muted ${showGrid
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Grid3x3 size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => setWireframe((w) => !w)}
          title="Toggle Wireframe"
          className={`rounded p-1.5 transition-colors hover:bg-muted ${wireframe
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Box size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => setAutoRotate((r) => !r)}
          title="Toggle Auto Rotate"
          className={`rounded p-1.5 transition-colors hover:bg-muted ${autoRotate
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <RotateCw size={14} strokeWidth={1.75} />
        </button>
      </div>

      <Canvas camera={{ position: INITIAL_CAMERA_POS, fov: 50 }}>
        <ambientLight intensity={isDark ? 0.4 : 0.6} />
        <directionalLight position={[10, 10, 5]} intensity={isDark ? 0.8 : 1} />
        <directionalLight
          position={[-5, -5, -5]}
          intensity={isDark ? 0.3 : 0.4}
        />
        <Scene
          url={stlUrl}
          viewCommand={viewCommand}
          showGrid={showGrid}
          wireframe={wireframe}
          autoRotate={autoRotate}
          isDark={isDark}
          onLoadError={setLoadError}
          onLoadingChange={setStlLoading}
        />
      </Canvas>

      {stlLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading model…</p>
          </div>
        </div>
      )}

      {loadError ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-error">{loadError}</p>
        </div>
      ) : !stlUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No model loaded. Generate one in the chat.
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 text-[10px] text-muted-foreground/40 select-none">
        <span>Drag to orbit</span>
        <span className="opacity-50">·</span>
        <span>Middle/right-drag to pan</span>
        <span className="opacity-50">·</span>
        <span>Scroll to zoom</span>
      </div>
    </div>
  );
}
