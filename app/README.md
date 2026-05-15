# App Organization

This app follows the project structure rule in `.cursor/rules/project-structure.mdc`.
Use this file as the project-specific map for where new code belongs.

## Mental Model

- `app/<route>` owns route entry points and route-private code.
- `app/<route>/_features/<feature>` owns larger route-private features.
- `app/components` owns UI that is used by more than one route.
- `app/lib/server` owns server-only integrations and persistence.
- `app/types` contains only contracts that cross route or feature boundaries.

## Current Ownership

- `app/studio` owns the authenticated Studio route, including its shell in `app/studio/_components/studio-client.tsx`.
- `app/studio/_features/chat` owns the LangGraph chat UI, chat hooks, message parsing, and chat-only types.
- `app/studio/_features/design-revisions` owns generated design revision artifacts and revision source mapping.
- `app/components/model-viewer` owns the reusable CAD viewer used by both Studio and public shared-model pages.
- `app/viewer/[slug]` owns the public shared-model route and its route wrapper.
- `app/api` owns thin route handlers that parse requests and call server logic.
- `app/lib/server` owns Azure Blob/Table storage, share persistence, and storage authorization helpers.

## Placement Guide

- Put new chat behavior in `app/studio/_features/chat`.
- Put generated design revision logic in `app/studio/_features/design-revisions`.
- Put reusable viewer rendering, camera, loading, and viewer controls in `app/components/model-viewer`.
- Put public shared-model page behavior in `app/viewer/[slug]`.
- Put Azure storage or share persistence logic in `app/lib/server`.
- Promote code to `app/components`, `app/lib`, or `app/types` only after it has real cross-route reuse.

## Boundary Notes

- `app/components/model-viewer/model-viewer.tsx` accepts a core `source` prop plus optional grouped capabilities for downloads, revisions, and sharing. Public viewer pages should only pass `source` unless they need one of those capabilities.
- Loader and worker internals stay under `app/components/model-viewer/_types` and `app/components/model-viewer/_lib`; they are not app-wide contracts.
- Studio design revision types stay under `app/studio/_features/design-revisions/_types`; the shared viewer only knows the smaller share payload it needs.
