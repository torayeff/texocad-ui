"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, ArrowDown, Loader2 } from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";

import { LANGGRAPH_API_URL, ASSISTANT_ID } from "@/app/lib/config";
import { AgentState, isGeomExportEvent } from "./types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export const EXAMPLE_PROMPTS = [
  "A hollow cylinder with a threaded cap",
  "A mounting bracket with 4 screw holes",
  "A standard gear with 20 involute teeth",
  "A phone stand with an adjustable angle",
];

export interface ChatProps {
  onStlUpdate: (filename: string, threadId: string) => void;
}

export default function Chat({ onStlUpdate }: ChatProps) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  const onStlUpdateRef = useRef(onStlUpdate);
  useEffect(() => {
    onStlUpdateRef.current = onStlUpdate;
  }, [onStlUpdate]);

  const stream = useStream<AgentState>({
    apiUrl: LANGGRAPH_API_URL,
    assistantId: ASSISTANT_ID,
    onCustomEvent: (data: unknown) => {
      if (isGeomExportEvent(data) && data.filename.endsWith(".stl")) {
        onStlUpdateRef.current(data.filename, data.thread_id);
      }
    },
  });

  const { messages, isLoading, error, getToolCalls } = stream;
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  const visibleMessages = messages.filter((m) => m.type !== "tool");

  const visibleTodoCallIds = useMemo(() => {
    const ids = new Set<string>();
    let lastTodoId: string | undefined;
    for (const m of visibleMessages) {
      if (m.type === "human") {
        if (lastTodoId) ids.add(lastTodoId);
        lastTodoId = undefined;
        continue;
      }
      if (m.type !== "ai") continue;
      const tcs = getToolCalls(m);
      for (const tc of tcs) {
        if (tc.call.name === "write_todos") lastTodoId = tc.id;
      }
    }
    if (lastTodoId) ids.add(lastTodoId);
    return ids;
  }, [visibleMessages, getToolCalls]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom <= 100;
    setShowScrollBtn(distanceFromBottom > 100);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newMessage = { type: "human" as const, content: trimmed };
    stream.submit(
      { messages: [newMessage] },
      {
        optimisticValues(prev) {
          const prevMessages = Array.isArray(prev.messages) ? prev.messages : [];
          return { messages: [...prevMessages, newMessage] };
        },
      },
    );

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    isNearBottomRef.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [input, isLoading, stream]);

  const stopGeneration = useCallback(() => {
    stream.stop();
  }, [stream]);

  const handleExamplePrompt = useCallback((prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      {errorMessage ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/20 text-error text-xs">
          <span>Error: {errorMessage}</span>
        </div>
      ) : null}

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scroll-on-hover px-4 py-5 space-y-4"
        >
          {visibleMessages.length === 0 && !isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
              <MessageSquare size={34} className="opacity-30" />
              <p className="text-sm">Enter a prompt to generate a 3D model</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleExamplePrompt(prompt)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visibleMessages.map((message, idx) => {
            const isLastAi =
              isLoading &&
              idx === visibleMessages.length - 1 &&
              message.type === "ai";
            const toolCalls =
              message.type === "ai" ? getToolCalls(message) : undefined;

            return (
              <ChatMessage
                key={message.id ?? idx}
                message={message}
                isStreaming={isLastAi}
                toolCalls={toolCalls}
                visibleTodoCallIds={visibleTodoCallIds}
              />
            );
          })}

          {isLoading &&
            visibleMessages.length > 0 &&
            visibleMessages[visibleMessages.length - 1].type === "human" && (
              <div className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md hover:bg-accent/90 transition-opacity"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>

      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        sendMessage={sendMessage}
        stopGeneration={stopGeneration}
        inputRef={textareaRef}
      />
    </div>
  );
}
