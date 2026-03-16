import { useRef, useCallback } from "react";

export function useAutoScroll<T extends HTMLElement>() {
  const stickRef = useRef(true);
  const observerRef = useRef<MutationObserver | null>(null);
  const isTickingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

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
    const el = e.currentTarget;
    const currentScrollTop = el.scrollTop;
    const distanceFromBottom = el.scrollHeight - currentScrollTop - el.clientHeight;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;

    if (isScrollingUp && distanceFromBottom > 0) {
      stickRef.current = false;
    }

    if (isTickingRef.current) return;
    isTickingRef.current = true;

    requestAnimationFrame(() => {
      if (!isScrollingUp) {
        stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 30;
      }
      isTickingRef.current = false;
    });
  }, []);

  return [ref, onScroll] as const;
}
