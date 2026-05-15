"use client";

import { useRef, useCallback, useEffect } from "react";

export function useAutoScroll<T extends HTMLElement>(enabled = true) {
  const stickRef = useRef(true);
  const observerRef = useRef<MutationObserver | null>(null);
  const lastScrollTopRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      observerRef.current?.disconnect();
    };
  }, []);

  const ref = useCallback((el: T | null) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (el && enabled) {
      const observer = new MutationObserver(() => {
        if (!stickRef.current) return;
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
          lastScrollTopRef.current = el.scrollTop;
          rafRef.current = null;
        });
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true });
      observerRef.current = observer;
    }
  }, [enabled]);

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
