"use client";

import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { API_BASE } from "@/app/lib/config";
import { useMounted } from "@/app/lib/use-mounted";
import Chat from "@/app/components/chat/Chat";

const Viewer = dynamic(() => import("@/app/components/Viewer"), { ssr: false });

export default function Home() {
  const [stlUrl, setStlUrl] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<{
    filename: string;
    threadId: string;
  } | null>(null);
  const [splitPct, setSplitPct] = useState(62);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  const handleStlUpdate = useCallback(
    (filename: string, threadId: string) => {
      setStlUrl(
        `${API_BASE}/api/files/${threadId}/${filename}?t=${Date.now()}`
      );
      setCurrentModel({ filename, threadId });
    },
    []
  );

  const startResize = useCallback(() => {
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const onMove = (event: MouseEvent) => {
      const container = contentRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(35, pct)));
    };

    const onUp = () => setIsResizing(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const ThemeIcon = isDark ? Moon : Sun;
  const viewerKey = stlUrl ?? "empty";
  const viewerPaneStyle = {
    "--viewer-width": `${splitPct}%`,
  } as CSSProperties;

  return (
    <main className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <Image
            src={isDark ? "/logo-white.png" : "/logo-black.png"}
            alt="TexoCAD"
            width={22}
            height={22}
          />
          <span className="text-sm font-medium text-foreground">TexoCAD</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label={
              isDark ? "Switch to light mode" : "Switch to dark mode"
            }
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ThemeIcon size={16} />
          </button>
        </div>
      </header>

      <div ref={contentRef} className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className="min-h-0 flex-[3] border-b border-border md:min-w-0 md:flex-none md:basis-[var(--viewer-width)] md:border-b-0"
          style={viewerPaneStyle}
        >
          <Viewer key={viewerKey} stlUrl={stlUrl} currentModel={currentModel} />
        </div>

        <div
          className="relative hidden w-0 md:block"
          role="presentation"
        >
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            onMouseDown={startResize}
            className={`absolute inset-y-0 -left-1 z-10 w-2 !cursor-col-resize bg-transparent transition-colors ${isResizing ? "bg-accent/20" : "hover:bg-muted/80"
              }`}
          />
        </div>
        <div className="min-h-0 flex-[2] md:min-w-[320px] md:flex-1 md:border-l md:border-border">
          <Chat onStlUpdate={handleStlUpdate} />
        </div>
      </div>
    </main>
  );
}
