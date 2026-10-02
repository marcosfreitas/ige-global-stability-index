# Writing Style and Formatting

## Voice & Tone

- **Active voice**: "The service handles requests" (not "Requests are handled")
- **Present tense**: "The function returns" (not "will return")
- **Direct address**: Use "you" when giving instructions
- **Professional but friendly**: Like explaining to a colleague

## Clarity Rules

- **One idea per sentence**: Break complex thoughts into multiple sentences
- **Short paragraphs**: 3-5 sentences maximum
- **Avoid jargon**: Explain technical terms on first use
- **Be specific**: e.g. "3 seconds" not "a short time"

## Code Examples

- **Runnable**: Copy-pasteable
- **Commented**: Explain non-obvious parts inline
- **Complete**: Include imports and context
- **Realistic**: Real-world scenarios, not "foo" and "bar"

## Technical Accuracy

- Note current versions and year where relevant
- Test examples so they work
- Link to source or implementation when helpful

## Callout Boxes

```markdown
> **Note**: Additional context or clarification

> **Warning**: Something that could cause problems

> **Important**: Critical information not to miss

> **Tip**: Best practice or optimization hint
```

## Code Annotations

```typescript
// ✅ GOOD: Clear description of why this is correct
const result = await service.process();

// ❌ BAD: Clear description of what's wrong
const result = service.process(); // Missing await

// 💡 TIP: Helpful optimization or alternative
const cached = useMemo(() => expensiveComputation(), [deps]);
```

## Decision Records (ADRs)

```markdown
### Decision: [Title]

**Status**: Accepted | Proposed | Deprecated | Superseded

**Context**: [What is the issue we're addressing?]

**Decision**: [What did we decide?]

**Consequences**: [Trade-offs]
- Positive: [Benefits]
- Negative: [Drawbacks]
- Risks: [Potential issues]

**Alternatives Considered**: [What else did we explore?]
```

## Version Control for Docs

- Update **when** behavior changes, **before** breaking changes, **after** new features; treat docs as part of the change
- Optional CHANGELOG.md pattern:

```markdown
# Changelog

## [2.1.0] - YYYY-MM-DD
### Added
- New section on X

### Changed
- Updated Y

### Deprecated
- Old Z (see migration guide)

### Removed
- Outdated W
```

## Maintenance Checklist

**Periodic review**: Verify examples work; update versions and dates; check links; remove deprecated content; add new patterns that emerged.

**After major changes**: Update affected docs; add migration guides if needed; update cross-references; check consistency.
