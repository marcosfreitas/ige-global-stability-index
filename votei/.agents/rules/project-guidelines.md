# Project Guidelines

## API Patterns
- All routes versioned: `/api/v1/`
- Response envelope: `{ success: true, data: T }` or `{ success: false, error: { code, message } }`
- Use `ok()`, `created()`, `handleError()` from `@/shared/utils/api-handler`
- Validate all input with Zod at the route level before calling services

## Error Handling
- Throw typed errors from `@/shared/errors` — never throw plain strings
- `handleError()` in route handlers maps all error types to proper HTTP responses
- Never swallow errors silently; always log before re-throwing infrastructure errors

## Code Style
- No `any` — use `unknown` and narrow
- No comments unless the WHY is non-obvious
- Prefer `async/await` over `.then()`
- No barrel `index.ts` in `infrastructure/` or `core/` — import directly

## Security
- Never trust client input — validate with Zod
- Always call `getCurrentUser()` before any authenticated operation
- Rate-limit public and authenticated endpoints with `checkRateLimit()`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

## Authentication
- Magic link (OTP) via Supabase Auth by default
- `getCurrentUser()` throws `UnauthorizedError` if not authenticated
- `getCurrentUserOrNull()` for pages that handle both states
- Proxy at `src/proxy.ts` refreshes sessions on every request

## Naming Conventions
- Services: `{verb}{Noun}Service` — `GetUserService`, `CreateOrderService`
- Repositories: `{Noun}Repository` — `UserRepository`
- Providers: `{Provider}Provider` — `AnthropicProvider`, `ResendProvider`
- Entities: plain interface, PascalCase — `User`, `Order`
- Contracts: interface with `I` prefix — `IUserRepository`, `ILLMProvider`
