"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Canvas } from "@react-three/fiber";
import { Maximize2, Box, Rotate3d, RotateCcw, Move3d, Download, ChevronDown, Loader2 } from "lucide-react";

import { useMounted } from "@/app/hooks/use-mounted";
import { trackFileDownload } from "@/app/lib/analytics";
import { useLocalStorageState } from "@/app/studio/_hooks/use-local-storage-state";
import { Scene } from "@/app/studio/_components/viewer/Scene";
import { AssemblyTree } from "@/app/studio/_components/viewer/AssemblyTree";
import { VIEW_LABELS, INITIAL_CAMERA_POS } from "@/app/studio/_lib/viewer-constants";
import type { ViewPreset, ViewCommand, ViewerPart } from "@/app/studio/_types/viewer";

type DownloadFormat = "stl" | "step" | "py" | "3mf";

const DOWNLOAD_LABELS: Record<DownloadFormat, string> = {
  stl: "STL",
  step: "STEP",
  py: "PYTHON",
  "3mf": "3MF",
};

export default function Viewer({ parts }: { parts: ViewerPart[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const [viewCommand, setViewCommand] = useState<ViewCommand | null>(null);
  const [activeView, setActiveView] = useState<ViewPreset>("iso");
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGizmos, setShowGizmos] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stlLoading, setStlLoading] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});
  const [partPositions, setPartPositions] = useLocalStorageState<
    Record<string, [number, number, number]>
  >("texocad:part-positions", {});
  const cmdIdRef = useRef(0);
  const downloadRef = useRef<HTMLDivElement>(null);

  const isDark = mounted && resolvedTheme === "dark";
  const bgColor = isDark ? "#09090b" : "#f4f4f5";

  const hasAnyStl = parts.some((p) => p.stlUrl);

  const setView = useCallback((view: ViewPreset) => {
    setActiveView(view);
    setViewCommand({ kind: "view", view, id: ++cmdIdRef.current });
  }, []);

  const fitView = useCallback(() => {
    setViewCommand({ kind: "fit", id: ++cmdIdRef.current });
  }, []);

  const togglePartVisibility = useCallback((name: string) => {
    setVisibilityMap((prev) => ({ ...prev, [name]: prev[name] === false }));
  }, []);

  const handlePartMove = useCallback(
    (name: string, pos: [number, number, number]) => {
      setPartPositions((prev) => ({ ...prev, [name]: pos }));
    },
    [setPartPositions],
  );

  const resetPositions = useCallback(() => {
    setPartPositions({});
  }, [setPartPositions]);

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

  const allDownloads = buildDownloadEntries(parts);
  const hasAnyDownload = allDownloads.length > 0;

  const handleDownload = useCallback((url: string, filename: string, format: DownloadFormat, partName: string) => {
    trackFileDownload({ format, partName });
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-card/80 backdrop-blur-md border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download size={13} />
          Download
          <ChevronDown size={11} className={`transition-transform ${downloadOpen ? "rotate-180" : ""}`} />
        </button>
        {downloadOpen && (
          <div className="absolute right-0 mt-2 min-w-[200px] rounded-lg border border-border/50 bg-card/80 backdrop-blur-md shadow-lg overflow-hidden max-h-[70vh] flex flex-col">
            <div className="overflow-y-auto p-1.5 flex flex-col gap-1.5">
              {parts.filter(p => Object.values(p.downloadUrls).some(url => !!url)).map((part, i) => {
                const availableFormats = (Object.entries(part.downloadUrls) as [DownloadFormat, string | undefined][])
                  .filter(([, url]) => !!url)
                  .map(([fmt, url]) => ({ fmt, url: url! }));

                return (
                  <div key={part.name} className={`flex flex-col gap-1.5 p-2 rounded-md ${i % 2 === 0 ? "bg-muted/30" : "bg-transparent"}`}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: part.color }}
                      />
                      <span className="text-xs font-medium text-foreground truncate">
                        {part.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {availableFormats.map(({ fmt, url }) => (
                        <button
                          key={`${part.name}-${fmt}`}
                          onClick={() => {
                            handleDownload(url, `${part.name}.${fmt}`, fmt, part.name);
                            setDownloadOpen(false);
                          }}
                          className="px-2 py-1 text-[10px] font-semibold rounded bg-muted/50 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors border border-border/40"
                        >
                          {DOWNLOAD_LABELS[fmt]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AssemblyTree
        parts={parts}
        visibilityMap={visibilityMap}
        onToggle={togglePartVisibility}
      />

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
          <Rotate3d size={14} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => setShowGizmos((g) => !g)}
          title="Toggle Move Axes"
          className={`rounded p-1.5 transition-colors hover:bg-muted ${showGizmos
            ? "text-accent"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Move3d size={14} strokeWidth={1.75} />
        </button>
        <div className="w-4 h-px bg-border/60 my-0.5" />
        <button
          onClick={resetPositions}
          title="Reset Part Positions"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw size={14} strokeWidth={1.75} />
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
          parts={parts}
          visibilityMap={visibilityMap}
          partPositions={partPositions}
          showGizmos={showGizmos}
          viewCommand={viewCommand}
          wireframe={wireframe}
          autoRotate={autoRotate}
          onLoadError={setLoadError}
          onLoadingChange={setStlLoading}
          onPartMove={handlePartMove}
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
      ) : !hasAnyStl && (
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
        <span className="opacity-50">·</span>
        <span>Drag gizmo to move parts</span>
      </div>
    </div>
  );
}

interface DownloadEntry {
  key: string;
  label: string;
  filename: string;
  url: string;
}

function buildDownloadEntries(parts: ViewerPart[]): DownloadEntry[] {
  const entries: DownloadEntry[] = [];
  for (const part of parts) {
    for (const [fmt, url] of Object.entries(part.downloadUrls) as [DownloadFormat, string | undefined][]) {
      if (!url) continue;
      entries.push({
        key: `${part.name}-${fmt}`,
        label: parts.length > 1 ? `${part.name}.${fmt} (${DOWNLOAD_LABELS[fmt]})` : `${DOWNLOAD_LABELS[fmt]}`,
        filename: `${part.name}.${fmt}`,
        url,
      });
    }
  }
  return entries;
}
