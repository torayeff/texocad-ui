# Bugs in @langchain/core and @langchain/react with OpenAI streaming

Identified while debugging `useStream` with LangGraph deep agents using OpenAI models (gpt-5.4).
Both issues work correctly with Gemini models.

Tested with `@langchain/core@^1.1.32`, `@langchain/react@^0.1.3`.

---

## Bug 1: `contentBlocks` drops reasoning blocks for OpenAI during streaming

**Package:** `@langchain/core`

**Description:**
The `contentBlocks` lazy getter on `AIMessage` is supposed to normalize provider-specific content into standard blocks (e.g. `{ type: "reasoning", reasoning: "..." }`). For OpenAI models, the raw `message.content` array contains:

```json
[
  { "type": "reasoning", "id": "rs_...", "summary": [{ "type": "summary_text", "text": "..." }], "index": 0 },
  { "type": "function_call", "name": "task", "arguments": "...", "call_id": "...", "index": 1 }
]
```

`contentBlocks` normalizes the `function_call` into a `{ type: "tool_call" }` block but **drops the reasoning block entirely**, returning:

```json
[{ "type": "tool_call", "id": "call_...", "name": "task", "args": { ... } }]
```

During early streaming, `contentBlocks` returns an empty array `[]` while the raw `content` has a reasoning block with an empty `summary` (reasoning hasn't arrived yet).

**Expected:** `contentBlocks` should include a `{ type: "reasoning", reasoning: "..." }` block normalized from the `summary` array, matching the documented behavior at https://docs.langchain.com/oss/python/langchain/frontend/reasoning-tokens.

**Workaround:** After checking `contentBlocks`, fall back to extracting reasoning from the raw `message.content` array and manually parsing the `summary` sub-array.

---

## Bug 2: `getSubagentsByMessage` fails due to message ID mismatch with OpenAI

**Package:** `@langchain/react`

**Description:**
When using `useStream` with `filterSubagentMessages: true` and OpenAI models, `getSubagentsByMessage(messageId)` always returns an empty array for the message that spawned the subagent.

The subagent entry in `stream.subagents` is keyed by tool call ID and has an internal `aiMessageId` that was captured during streaming. For OpenAI, the message ID changes between streaming and completion:

- During streaming: message ID is `lc_run--019cef82-1bfc-78e3-94cb-b4be4842a534`
- After completion: message ID becomes `resp_0abf15b12583c3530069b625679d78819c8f300f19f6f2ce49`

The subagent's `aiMessageId` retains the streaming chunk ID (`lc_run--...`), but the final message in `stream.messages` has the OpenAI response ID (`resp_...`). The lookup fails because these don't match.

With Gemini, message IDs remain stable between streaming chunks and the final message (`lc_run--...` throughout), so the lookup works.

**Expected:** `getSubagentsByMessage` should return the correct subagents regardless of whether the message ID changed between streaming and completion.

**Workaround:** When `getSubagentsByMessage` returns empty, fall back to matching subagents from `stream.subagents` Map by comparing the message's `task` tool call IDs against subagent IDs:

```typescript
if (subagents.length === 0) {
  const allSubagents = stream.subagents as Map<string, SubagentStreamInterface>;
  const taskCallIds = new Set(
    toolCalls
      .filter((tc) => tc.call.name === "task")
      .map((tc) => tc.call.id ?? tc.id),
  );
  subagents = [...allSubagents.values()].filter((s) => taskCallIds.has(s.id));
}
```

The tool call ID (`call_vDP2xacrLKcdTSDBhutSPuSm`) is stable and matches on both sides.
