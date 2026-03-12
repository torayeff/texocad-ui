import { useRef, useCallback } from "react";

export function useAutoScroll<T extends HTMLElement>() {
  const stickRef = useRef(true);
  const observerRef = useRef<MutationObserver | null>(null);
  const isTickingRef = useRef(false);

  const ref = useCallback((el: T | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (el) {
      const observer = new MutationObserver(() => {
        if (stickRef.current) {
          el.scrollTop = el.scrollHeight;
        }
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });
      observerRef.current = observer;
    }
  }, []);

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (isTickingRef.current) return;
    isTickingRef.current = true;

    const el = e.currentTarget;
    requestAnimationFrame(() => {
      stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
      isTickingRef.current = false;
    });
  }, []);

  return [ref, onScroll] as const;
}
