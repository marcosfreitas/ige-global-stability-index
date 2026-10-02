# Error Handling

## Error hierarchy (`src/shared/errors/index.ts`)

```
BaseError (abstract)
├── DomainError          — business rule violations (400 by default)
│   └── InsufficientCreditsError (402)
└── AppError             — application/infrastructure failures (400 by default)
    ├── UnauthorizedError (401)
    ├── ForbiddenError (403)
    ├── ResourceNotFoundError (404)
    ├── ConflictError (409)
    ├── PayloadTooLargeError (413)
    ├── RateLimitError (429)
    ├── ExternalApiError (502)
    ├── DatabaseError (500)
    ├── ConfigurationError (500)
    └── ValidationError (400)
```

## Rules

1. Throw typed errors — never `throw new Error('something failed')`
2. `core/` throws `DomainError` or `AppError` subtypes only
3. `infrastructure/` wraps external failures in `ExternalApiError` or `DatabaseError`
4. Route handlers call `handleError(err)` in the catch block — never write manual error responses
5. The `toJSON()` on `BaseError` produces the standard envelope automatically

## Example

```typescript
// core/
if (credits <= 0) throw new InsufficientCreditsError();

// infrastructure/
const { error } = await this.db.from('users').select('*').eq('id', id).single();
if (error) this.handleError(error, 'findById');

// app/api/
try {
  const result = await service.execute(dto);
  return ok(result);
} catch (err) {
  return handleError(err); // maps everything correctly
}
```
