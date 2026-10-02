# Tech Stack

## Runtime & Framework
- **Next.js 16** (App Router, Turbopack)
- **React 19** (Server Components, Server Actions)
- **TypeScript** (strict mode, no `any`)
- **Node.js 22** (`.nvmrc`)
- **pnpm** (package manager)

## Styling
- **Tailwind CSS 4.x** (CSS-first config via `@import "tailwindcss"`)
- **shadcn/ui** (Radix primitives, `components.json` aliases to `@/shared/components/ui`)

## Backend / Data
- **Supabase** — PostgreSQL, Auth, SSR
  - `@supabase/ssr` for server-side auth (cookies)
  - Generated types at `src/infrastructure/database/types.ts`
- **Zod 4** — all input validation at API boundaries

## State Management
- **TanStack Query (`@tanstack/react-query` 5.x)** — server state: fetching, caching, mutations, invalidation
  - `QueryProvider` at `src/shared/providers/query-provider.tsx` (wired in root layout)
  - Colocate query/mutation hooks in `src/features/{domain}/hooks/`
  - Devtools enabled in development only
  - Chosen over SWR for first-class mutations/optimistic updates (this is an app template, not a content site)
- **Zustand 5.x** — client/UI state only (no server data); stores in `src/shared/stores/`

## AI / LLM
- **Anthropic Claude** via `@anthropic-ai/sdk`
  - `AnthropicProvider` at `src/infrastructure/llm/anthropic.provider.ts`
  - Supports: standard completion, streaming, JSON schema output, rate-limit retry

## Email
- **Resend** via `resend` SDK
  - `ResendProvider` at `src/infrastructure/email/resend.provider.ts`

## Billing
- **Polar** via `@polar-sh/sdk`
  - `PolarProvider` at `src/infrastructure/billing/polar.provider.ts`
  - Webhook handler at `src/app/api/v1/webhooks/polar/route.ts`

## Rate Limiting
- **Upstash Redis** via `@upstash/ratelimit` + `@upstash/redis`
  - Helper at `src/shared/utils/rate-limit.ts`

## Testing
- **Jest** + `ts-jest` + `@testing-library/react`
- Colocate tests in `__tests__/` next to the code they cover
- Unit test `core/services/` with mocked contracts
