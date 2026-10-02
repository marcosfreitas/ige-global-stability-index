# Security Guidelines

## API Security
- Validate ALL input with Zod before processing
- Call `getCurrentUser()` at the top of every authenticated handler
- Apply `checkRateLimit(identifier)` — use userId for auth'd routes, IP for public
- Never log sensitive data (tokens, passwords, full request bodies)

## Supabase
- Enable RLS on every table — no exceptions
- Use `server.ts` client for API routes (cookie-based session)
- Use `admin.ts` client only for privileged server-side operations (webhooks, cron)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or env

## Anthropic / LLM
- Never pass raw user input directly as the system prompt
- Validate and sanitize content before including in prompts
- Limit `maxTokens` appropriately — don't allow unbounded generation

## Billing Webhooks
- Verify webhook signatures before processing any event
- Use `POLAR_WEBHOOK_SECRET` to authenticate Polar events
- Process webhooks idempotently — events may arrive multiple times

## Environment Variables
- All secrets via `assertEnv()` — crashes loudly on missing config rather than silently failing
- Public vars prefixed `NEXT_PUBLIC_` only when truly needed client-side
- Never commit `.env*` files — only `.env*.example`

## OWASP Top 10
- A01 Broken Access Control: RLS + `getCurrentUser()` on every endpoint
- A02 Cryptographic Failures: Supabase handles auth tokens; never roll your own crypto
- A03 Injection: Supabase parameterized queries; Zod validation at boundaries
- A05 Security Misconfiguration: `assertEnv()` prevents silent misconfig
- A07 Auth Failures: Magic link OTP; no password storage
