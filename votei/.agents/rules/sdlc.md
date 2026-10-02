# SDLC — Development Workflow

## Sequence for every non-trivial change

1. **Plan** — scope files and layers with `/plan` before implementing
2. **Implement** — code; run `pnpm tsc --noEmit` before committing
3. **Review** — correctness, contracts, layer compliance, type safety, security
4. **Commit** — one logical unit, conventional prefix, `Co-Authored-By` trailer
5. **Push** — push after every commit

## Conventional commit prefixes
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — no behavior change
- `test:` — tests only
- `chore:` — tooling, deps, config

## Before committing
```bash
pnpm tsc --noEmit   # must pass
pnpm lint           # must pass
pnpm test           # must pass
```

## Adding a new domain
1. Create `src/core/{domain}/{contracts,entities,services}/`
2. Add contract interfaces
3. Create entity types
4. Implement services (one class per use case)
5. Create `src/infrastructure/repositories/{domain}.repository.ts`
6. Wire in `src/app/api/v1/{domain}/route.ts`
7. Add `src/features/{domain}/` for UI

## Adding a new integration
1. Create `src/infrastructure/{provider}/{name}.provider.ts`
2. Define interface in relevant `core/{domain}/contracts/index.ts`
3. Inject via constructor in route handler
