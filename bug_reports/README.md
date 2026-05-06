# Bug Reports

Upstream bugs filed against LangChain packages. Check the linked issues for resolution status before removing workarounds.

## 2026-03-15 — OpenAI Streaming Bugs

Both bugs are OpenAI-specific (Responses API). Gemini models are unaffected.

| Bug | Package | Issue | Status |
|---|---|---|---|
| `contentBlocks` drops reasoning blocks | `@langchain/core@1.1.44` | [langchainjs#10421](https://github.com/langchain-ai/langchainjs/issues/10421) | Open |
| `getSubagentsByMessage` returns `[]` | `@langchain/langgraph-sdk@1.8.10` | [langgraphjs#2187](https://github.com/langchain-ai/langgraphjs/issues/2187) | Fixed upstream |

**Workaround still applied in this codebase:** See `app/studio/_lib/message-content.ts`.
