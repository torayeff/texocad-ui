"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { HumanMessage } from "@langchain/core/messages";
import type { Client } from "@langchain/langgraph-sdk";

import { CLERK_PLAN_SLUG } from "@/app/lib/site";
import { useInitialThreadMetadata } from "@/app/hooks/chat/use-initial-thread-metadata";
import type { AssistantId } from "@/app/lib/chat/langgraph-config";
import {
  DEFAULT_FREE_REASONING_EFFORT_ID,
  DEFAULT_MODEL_ID,
  DEFAULT_REASONING_EFFORT_ID,
  MODELS,
  isReasoningEffortAllowed,
  lockedReasoningEffortsForAccess,
  reasoningEffortsForAccess,
} from "@/app/lib/chat/models";
import type { ReasoningEffortId, ReasoningUpsell } from "@/app/lib/chat/models";
import { trackMessageSubmitted } from "@/app/lib/chat/analytics";

interface ChatSubmitStream {
  submit: (
    values: { messages: Array<{ type: "human"; content: string }> },
    options: {
      metadata?: Record<string, unknown>;
      optimisticValues: (prev: Record<string, unknown>) => Record<string, unknown>;
      onDisconnect: "continue";
      streamSubgraphs: boolean;
      streamResumable: boolean;
      config: { recursion_limit: number };
    },
  ) => void;
}

interface UseChatMessageSubmissionOptions {
  assistantId: AssistantId;
  client: Client;
  isAuthReady: boolean;
  isBusy: boolean;
  markNearBottom: () => void;
  scrollToBottom: () => void;
  setHasChosenMode: (hasChosenMode: boolean) => void;
  setPendingHumanMessage: (message: HumanMessage | null) => void;
  stream: ChatSubmitStream;
  urlThreadId: string | null;
}

export function useChatMessageSubmission({
  assistantId,
  client,
  isAuthReady,
  isBusy,
  markNearBottom,
  scrollToBottom,
  setHasChosenMode,
  setPendingHumanMessage,
  stream,
  urlThreadId,
}: UseChatMessageSubmissionOptions) {
  const { has, isLoaded, isSignedIn, sessionClaims } = useAuth();
  const isVip = sessionClaims?.vipAccess === true;
  const hasAdvancedReasoning = Boolean(isVip || has?.({ plan: CLERK_PLAN_SLUG }));
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_ID);
  const [selectedReasoningEffortId, setSelectedReasoningEffortId] =
    useState<ReasoningEffortId>(DEFAULT_REASONING_EFFORT_ID);
  const reasoningEfforts = useMemo(
    () => reasoningEffortsForAccess(hasAdvancedReasoning),
    [hasAdvancedReasoning],
  );
  const lockedReasoningEfforts = useMemo(
    () => (isLoaded ? lockedReasoningEffortsForAccess(hasAdvancedReasoning) : []),
    [hasAdvancedReasoning, isLoaded],
  );
  const reasoningUpsell: ReasoningUpsell | null = !isLoaded || hasAdvancedReasoning
    ? null
    : (isSignedIn ? "upgrade" : "sign-in");
  const defaultReasoningEffort = hasAdvancedReasoning
    ? DEFAULT_REASONING_EFFORT_ID
    : DEFAULT_FREE_REASONING_EFFORT_ID;
  const selectedReasoningEffort = isLoaded && !isReasoningEffortAllowed(selectedReasoningEffortId, hasAdvancedReasoning)
    ? defaultReasoningEffort
    : selectedReasoningEffortId;
  const initialThreadMetadata = useInitialThreadMetadata(client, isAuthReady, urlThreadId);

  const handleModelChange = useCallback((modelId: string) => {
    if (!MODELS.some((model) => model.id === modelId)) return;
    setSelectedModel(modelId);
  }, []);

  const handleReasoningEffortChange = useCallback((effortId: ReasoningEffortId) => {
    if (!isReasoningEffortAllowed(effortId, hasAdvancedReasoning)) return;
    setSelectedReasoningEffortId(effortId);
  }, [hasAdvancedReasoning]);

  const sendMessage = useCallback((content: string) => {
    if (isBusy) return false;
    const trimmed = content.trim();
    if (!trimmed) return false;

    const humanMessage = new HumanMessage(trimmed);
    setHasChosenMode(true);
    trackMessageSubmitted({
      hasAttachments: trimmed.includes("Attachments:"),
    });
    setPendingHumanMessage(humanMessage);

    const threadMetadata = initialThreadMetadata(trimmed, assistantId, urlThreadId);
    // `owner` is intentionally omitted: the LangGraph backend stamps it from the
    // verified JWT, so any client-sent value is ignored.
    const metadata = {
      ...threadMetadata,
      ...(isVip ? { model: selectedModel } : {}),
      reasoning_effort: selectedReasoningEffort,
    };

    stream.submit(
      { messages: [{ type: "human", content: trimmed }] },
      {
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        optimisticValues: (prev: Record<string, unknown>) => ({
          ...prev,
          messages: [...(Array.isArray(prev.messages) ? prev.messages : []), humanMessage],
        }),
        onDisconnect: "continue",
        streamSubgraphs: true,
        streamResumable: true,
        config: { recursion_limit: 10000 },
      },
    );

    markNearBottom();
    requestAnimationFrame(() => {
      scrollToBottom();
    });
    return true;
  }, [
    assistantId,
    initialThreadMetadata,
    isBusy,
    isVip,
    markNearBottom,
    scrollToBottom,
    selectedModel,
    selectedReasoningEffort,
    setHasChosenMode,
    setPendingHumanMessage,
    stream,
    urlThreadId,
  ]);

  return {
    handleModelChange,
    handleReasoningEffortChange,
    lockedReasoningEfforts,
    reasoningEfforts,
    reasoningUpsell,
    selectedModel,
    selectedReasoningEffort,
    sendMessage,
  };
}
