# TexoCAD UI

Web app for [TexoCAD](https://www.texocad.ai): AI design agents that turn product ideas into requirements, concept images, 3D models, and CAD. Includes the chat studio and the in-browser 3D/CAD viewer.

The agents themselves run in the backend: **[texocad-agents](https://github.com/torayeff/texocad-agents)**.

Developed by **Robominder**.

## Requirements

- Node.js 20.9+
- A running [texocad-agents](https://github.com/torayeff/texocad-agents) backend
- A [Clerk](https://clerk.com) application (authentication). Use the same one as the backend.
- An Azure Storage account (uploads, designs, and shared models). Use the same one as the backend.
- [PostHog](https://posthog.com) (optional, for analytics)

## Setup

```bash
npm install
cp env.example .env.local   # then fill in the values below
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_LANGGRAPH_API_URL` | Backend URL, e.g. `http://localhost:2024` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk API keys |
| `NEXT_PUBLIC_CLERK_PLAN_SLUG` | Clerk Billing plan that unlocks the studio (the backend expects `early_bird`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Where users land after sign-in or sign-up (default `/studio`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection string |
| `AZURE_STORAGE_CONTAINER` | Private blob container. Must match the backend's `AZURE_STORAGE_CONTAINER_NAME`. |
| `AZURE_STORAGE_PUBLIC_CONTAINER` | Public blob container for shared models and sketches |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` | Optional. If unset, analytics is off. |
| `MAINTENANCE_MODE` | Set to `true` to send all pages to `/maintenance` |

### Studio access

`/studio` is open to signed-in users who have either the Clerk Billing plan set in `NEXT_PUBLIC_CLERK_PLAN_SLUG` or a `freeAccess`/`vipAccess` grant. To give yourself access without billing:

1. In the Clerk Dashboard, set the user's public metadata to `{ "freeAccess": true }`. Use `vipAccess` to also unlock every model.
2. Under **Sessions → Customize session token**, add the claims:

   ```json
   {
     "freeAccess": "{{user.public_metadata.freeAccess}}",
     "vipAccess": "{{user.public_metadata.vipAccess}}"
   }
   ```

The backend reads the same claims.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | Run ESLint |
| `npm run list-access-users` | List Clerk users with `freeAccess`/`vipAccess` (reads `CLERK_SECRET_KEY` from `.env`) |

## License

Copyright 2026 Robominder Ltd.

Licensed under the [Apache License, Version 2.0](LICENSE).

The STEP importer bundles [occt-import-js](https://github.com/kovacsv/occt-import-js) and Open CASCADE Technology. Both are LGPL-2.1, and their license texts are copied to `public/licenses/` on install.
