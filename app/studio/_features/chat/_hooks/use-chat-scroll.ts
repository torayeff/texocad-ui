"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseChatScrollOptions {
  dependencies: readonly unknown[];
}

export function useChatScroll({ dependencies }: UseChatScrollOptions) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isTickingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    if (isNearBottomRef.current) {
      requestAnimationFrame(() => {
        if (!isNearBottomRef.current) return;
        const element = messagesContainerRef.current;
        if (element) {
          element.scrollTop = element.scrollHeight;
          lastScrollTopRef.current = element.scrollTop;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const handleScroll = useCallback(() => {
    const element = messagesContainerRef.current;
    if (!element) return;

    const currentScrollTop = element.scrollTop;

    if (Math.abs(currentScrollTop - lastScrollTopRef.current) < 1) {
      return;
    }

    const distanceFromBottom = element.scrollHeight - currentScrollTop - element.clientHeight;
    const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
    const isScrollingDown = currentScrollTop > lastScrollTopRef.current;

    lastScrollTopRef.current = currentScrollTop;

    if (isScrollingUp) {
      isNearBottomRef.current = false;
    } else if (isScrollingDown) {
      isNearBottomRef.current = distanceFromBottom <= 100;
    }

    if (isTickingRef.current) return;
    isTickingRef.current = true;
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        const currentElement = messagesContainerRef.current;
        setShowScrollButton(currentElement.scrollHeight - currentElement.scrollTop - currentElement.clientHeight > 100);
      }
      isTickingRef.current = false;
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const markNearBottom = useCallback(() => {
    isNearBottomRef.current = true;
  }, []);

  return {
    handleScroll,
    markNearBottom,
    messagesContainerRef,
    messagesEndRef,
    scrollToBottom,
    showScrollButton,
  };
}
