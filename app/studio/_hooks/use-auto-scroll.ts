import { useRef, useCallback } from "react";

export function useAutoScroll<T extends HTMLElement>() {
  const stickRef = useRef(true);
  const observerRef = useRef<MutationObserver | null>(null);
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
          lastScrollTopRef.current = el.scrollTop;
        }
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });
      observerRef.current = observer;
    }
  }, []);

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const currentScrollTop = el.scrollTop;

    if (Math.abs(currentScrollTop - lastScrollTopRef.current) < 1) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - currentScrollTop - el.clientHeight;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    const isScrollingDown = currentScrollTop > lastScrollTopRef.current;

    lastScrollTopRef.current = currentScrollTop;

    if (isScrollingUp) {
      stickRef.current = false;
    } else if (isScrollingDown) {
      stickRef.current = distanceFromBottom <= 30;
    }
  }, []);

  return [ref, onScroll] as const;
}
