import { useRef, useEffect, useCallback } from "react";

export function useAutoScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    if (stickRef.current) {
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  });

  const onScroll = useCallback(() => {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
    });
  }, []);

  return [ref, onScroll] as const;
}
