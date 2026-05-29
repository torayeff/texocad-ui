import type { StudioAssistantId } from "@/app/studio/_features/chat/_lib/langgraph-config";

export const STUDIO_AGENT_QUERY_PARAM = "agent";
export const STUDIO_THREAD_QUERY_PARAM = "thread_id";

function studioUrlWithQueryParam(
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

export function studioUrlWithAgent(
  pathname: string,
  currentSearch: string,
  mode: StudioAssistantId | null,
) {
  return studioUrlWithQueryParam(pathname, currentSearch, STUDIO_AGENT_QUERY_PARAM, mode);
}

export function studioUrlWithThread(
  pathname: string,
  currentSearch: string,
  threadId: string | null,
) {
  return studioUrlWithQueryParam(pathname, currentSearch, STUDIO_THREAD_QUERY_PARAM, threadId);
}
