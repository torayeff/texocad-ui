import { useState, useEffect, useRef } from "react";

function formatDuration(seconds: number): string {
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
}

export function PanelTimer({
  active,
  fixedSeconds,
  startedAtMs,
}: {
  active: boolean;
  fixedSeconds?: number;
  startedAtMs?: number;
}) {
  const [seconds, setSeconds] = useState(0);
  const lockedStartRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!active) {
      lockedStartRef.current = undefined;
      return;
    }

    if (lockedStartRef.current === undefined) {
      lockedStartRef.current = startedAtMs ?? Date.now();
    }

    const base = lockedStartRef.current;
    const update = () => setSeconds(Math.max(0, Math.floor((Date.now() - base) / 1000)));

    const rafId = requestAnimationFrame(update);
    const interval = setInterval(update, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [active, startedAtMs]);

  if (fixedSeconds !== undefined) {
    return (
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
        {formatDuration(fixedSeconds)}
      </span>
    );
  }

  if (!seconds) return null;

  return (
    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
      {formatDuration(seconds)}
    </span>
  );
}
