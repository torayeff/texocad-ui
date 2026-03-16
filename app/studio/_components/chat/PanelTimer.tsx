import { useState, useRef, useEffect } from "react";

function formatDuration(seconds: number): string {
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`;
}

export function PanelTimer({
  active,
  fixedSeconds,
}: {
  active: boolean;
  fixedSeconds?: number;
}) {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    startRef.current = Date.now();

    const update = () => setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    const rafId = requestAnimationFrame(update);
    const interval = setInterval(update, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [active]);

  if (fixedSeconds !== undefined) {
    return (
      <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
        {formatDuration(fixedSeconds)}
      </span>
    );
  }

  if (!active && seconds === 0) return null;

  return (
    <span className="text-[10px] font-medium tabular-nums text-muted-foreground/60">
      {formatDuration(seconds)}
    </span>
  );
}
