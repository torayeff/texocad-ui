import type { AssistantId } from "@/app/lib/chat/langgraph-config";

export const AGENT_QUERY_PARAM = "agent";
export const THREAD_QUERY_PARAM = "thread_id";

function chatUrlWithQueryParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string | null,
) {
  const params = new URLSearchParams(currentSearch);
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function chatUrlWithAgent(
  pathname: string,
  currentSearch: string,
  mode: AssistantId | null,
) {
  return chatUrlWithQueryParam(pathname, currentSearch, AGENT_QUERY_PARAM, mode);
}

export function chatUrlWithThread(
  pathname: string,
  currentSearch: string,
  threadId: string | null,
) {
  return chatUrlWithQueryParam(pathname, currentSearch, THREAD_QUERY_PARAM, threadId);
}
