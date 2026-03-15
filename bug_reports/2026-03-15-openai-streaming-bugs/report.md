# Filing Instructions

Two bugs, two repos. File them separately.

---

## Step 1: File Bug 1 in `langchain-ai/langchainjs`

Go to: https://github.com/langchain-ai/langchainjs/issues/new

Fill in the form fields:

---

### Title

`contentBlocks` drops `type: "reasoning"` blocks from OpenAI Responses API content array

### Error Message and Stack Trace (if applicable)

No error thrown. `AIMessage.contentBlocks` silently returns an incomplete array — reasoning blocks are missing from the output.

Input (`message.content`):
```json
[
  { "type": "reasoning", "id": "rs_...", "summary": [{ "type": "summary_text", "text": "..." }], "index": 0 },
  { "type": "function_call", "name": "task", "arguments": "...", "call_id": "...", "index": 1 }
]
```

Output (`message.contentBlocks`):
```json
[{ "type": "tool_call", "id": "call_...", "name": "task", "args": { ... } }]
```

Expected output:
```json
[
  { "type": "reasoning", "reasoning": "..." },
  { "type": "tool_call", "id": "call_...", "name": "task", "args": { ... } }
]
```

### Example Code

```typescript
import { AIMessage } from "@langchain/core/messages";

// Simulate an AIMessage as it arrives from OpenAI Responses API (gpt-5.4)
// with reasoning + function_call in the content array
const message = new AIMessage({
  content: [
    {
      type: "reasoning",
      id: "rs_abc123",
      summary: [{ type: "summary_text", text: "Let me think about this..." }],
      index: 0,
    },
    {
      type: "function_call",
      name: "task",
      arguments: '{"description":"do something"}',
      call_id: "call_xyz789",
      index: 1,
    },
  ],
  tool_calls: [
    { id: "call_xyz789", name: "task", args: { description: "do something" } },
  ],
  response_metadata: {
    model_provider: "openai",
  },
  additional_kwargs: {},
});

console.log("Raw content types:", message.content.map((b) => b.type));
// → ["reasoning", "function_call"]

console.log("contentBlocks types:", message.contentBlocks.map((b) => b.type));
// → ["tool_call"]  ← reasoning block is missing!

// Expected: ["reasoning", "tool_call"]
```

### Description

When using OpenAI Responses API models (e.g. gpt-5.4), `AIMessage.contentBlocks` silently drops reasoning blocks. During early streaming it returns `[]` while the raw content already has a reasoning block with an empty `summary`.

This works correctly with Gemini models.

**Root cause:** In [`libs/langchain-core/src/messages/block_translators/openai.ts`](https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/messages/block_translators/openai.ts), `convertToV1FromResponses` ([line 242](https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/messages/block_translators/openai.ts#L242)) checks for reasoning only at `message.additional_kwargs.reasoning.summary` ([line 247](https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/messages/block_translators/openai.ts#L247)):

```typescript
if (
  _isObject(message.additional_kwargs?.reasoning) &&
  _isArray(message.additional_kwargs.reasoning.summary)
) {
  yield { type: "reasoning", reasoning: /* ... */ };
}
```

The content array loop at [lines 269–270](https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/messages/block_translators/openai.ts#L269-L270) only processes `type: "text"` blocks:

```typescript
for (const block of content) {
  if (_isContentBlock(block, "text")) {
    // only text blocks are handled — everything else is silently skipped
  }
}
```

When OpenAI puts `{ type: "reasoning", summary: [...] }` directly in the content array (instead of in `additional_kwargs.reasoning`), there is no code path to handle it.

**Suggested fix:** Add a handler for `type: "reasoning"` in the content loop (around [line 269](https://github.com/langchain-ai/langchainjs/blob/main/libs/langchain-core/src/messages/block_translators/openai.ts#L269)):

```typescript
for (const block of content) {
  if (_isContentBlock(block, "text")) {
    // ... existing text handling
  } else if (_isContentBlock(block, "reasoning")) {
    const summary = _isArray(block.summary)
      ? block.summary.reduce((acc, item) => {
          if (_isObject(item) && _isString(item.text)) return `${acc}${item.text}`;
          return acc;
        }, "")
      : "";
    yield { type: "reasoning", reasoning: summary };
  }
}
```

### System Info

```
langchain@1.2.32
@langchain/core@1.1.32

Platform: mac (Darwin arm64)
Node version: v24.12.0
pnpm --version: 10.26.1

Model: OpenAI gpt-5.4 (Responses API)
Works correctly with Gemini models.
```

---

## Step 2: File Bug 2 in `langchain-ai/langgraphjs`

Go to: https://github.com/langchain-ai/langgraphjs/issues/new

Fill in the form fields:

---

### Title

`getSubagentsByMessage` returns empty array for OpenAI — message ID mutates between streaming and completion

### Error Message and Stack Trace (if applicable)

No error thrown. `getSubagentsByMessage(messageId)` silently returns `[]` for every message that spawned subagents when using OpenAI models.

```
// Always returns [] for OpenAI
stream.getSubagentsByMessage("resp_0abf15b12583c3530069b625679d78819c8f300f19f6f2ce49")

// Because internally, aiMessageId was captured as:
// "lc_run--019cef82-1bfc-78e3-94cb-b4be4842a534"
// but the final message ID is:
// "resp_0abf15b12583c3530069b625679d78819c8f300f19f6f2ce49"
```

### Example Code

```typescript
import { SubagentManager } from "@langchain/langgraph-sdk/ui";

const manager = new SubagentManager({
  subagentToolNames: ["task"],
});

// Step 1: During streaming, an AI message chunk arrives with a temporary ID
const streamingMessageId = "lc_run--019cef82-1bfc-78e3-94cb-b4be4842a534";
manager.registerFromToolCalls(
  [
    {
      id: "call_vDP2xacrLKcdTSDBhutSPuSm",
      name: "task",
      args: { description: "do something", subagent_type: "general-purpose" },
    },
  ],
  streamingMessageId
);

// Step 2: Mark it running (simulating namespace match)
manager.markRunning("call_vDP2xacrLKcdTSDBhutSPuSm");

// Step 3: After streaming completes, OpenAI replaces the message ID
const finalMessageId = "resp_0abf15b12583c3530069b625679d78819c8f300f19f6f2ce49";

// Step 4: Try to look up subagents by the final message ID
const result = manager.getSubagentsByMessage(finalMessageId);
console.log("Subagents found:", result.length);
// → 0  ← should be 1!

// The streaming ID still works, but it's no longer the message ID in stream.messages
const resultOld = manager.getSubagentsByMessage(streamingMessageId);
console.log("Subagents found (old ID):", resultOld.length);
// → 1  ← this works, but this ID no longer exists in the message list
```

### Description

When using `useStream` with subagent support and OpenAI models, `getSubagentsByMessage(messageId)` always returns an empty array for messages that spawned subagents.

OpenAI mutates message IDs between streaming and completion:

- During streaming: `id = "lc_run--019cef82-1bfc-78e3-94cb-b4be4842a534"`
- After completion: `id = "resp_0abf15b12583c3530069b625679d78819c8f300f19f6f2ce49"`

This works correctly with Gemini models (IDs stay as `lc_run--...` throughout).

**Root cause:** In [`libs/sdk/src/ui/subagents.ts`](https://github.com/langchain-ai/langgraphjs/blob/main/libs/sdk/src/ui/subagents.ts), `getSubagentsByMessage` at [line 490](https://github.com/langchain-ai/langgraphjs/blob/main/libs/sdk/src/ui/subagents.ts#L490) uses strict equality on `aiMessageId`:

```typescript
getSubagentsByMessage(messageId: string) {
  return [...this.subagents.values()]
    .filter((s) => s.aiMessageId === messageId && this.isValidSubagent(s))
    .map((s) => this.buildExecution(s));
}
```

`aiMessageId` is set once in `registerFromToolCalls` ([line 604](https://github.com/langchain-ai/langgraphjs/blob/main/libs/sdk/src/ui/subagents.ts#L604)) when the first streaming chunk arrives and is never updated. The `existing` branch at [line 548](https://github.com/langchain-ai/langgraphjs/blob/main/libs/sdk/src/ui/subagents.ts#L548) only updates `toolCall.args` and then [`continue`s at line 576](https://github.com/langchain-ai/langgraphjs/blob/main/libs/sdk/src/ui/subagents.ts#L576) without touching `aiMessageId`. There is no ID reconciliation anywhere in `SubagentManager`.

**Suggested fix (Option A):** Update `aiMessageId` in the `existing` branch of `registerFromToolCalls`:

```typescript
if (existing) {
  if (aiMessageId && aiMessageId !== existing.aiMessageId) {
    this.subagents.set(toolCall.id, { ...existing, aiMessageId });
    hasChanges = true;
  }
  // ... rest of existing args update logic
  continue;
}
```

**Suggested fix (Option B):** Fall back to tool-call-ID matching in `getSubagentsByMessage`. Tool call IDs (e.g. `call_vDP2xacrLKcdTSDBhutSPuSm`) are stable across all providers.

**Workaround:** Match subagents by tool call IDs instead of message ID:

```typescript
let subagents = stream.getSubagentsByMessage(message.id);
if (subagents.length === 0) {
  const allSubagents = stream.subagents;
  const taskCallIds = new Set(
    toolCalls
      .filter((tc) => tc.call.name === "task")
      .map((tc) => tc.call.id ?? tc.id),
  );
  subagents = [...allSubagents.values()].filter((s) => taskCallIds.has(s.id));
}
```

### System Info

```
@langchain/langgraph-sdk@1.7.2
@langchain/react@0.1.3

Platform: mac (Darwin arm64)
Node version: v24.12.0
pnpm --version: 10.26.1

Model: OpenAI gpt-5.4 (Responses API)
Works correctly with Gemini models.
```
