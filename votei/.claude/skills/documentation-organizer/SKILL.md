---
name: documentation-organizer
description: Organizes documentation files and content direction using a book-style structure. Use when creating or editing project documentation, setting up a docs folder, defining doc structure and naming, writing style and patterns, or when the user asks about documentation standards, doc organization, or content hierarchy.
---

# Documentation Organizer

Project-agnostic guidance for organizing documentation files and directing content. Use this skill whenever you create or edit documentation so it stays consistent, navigable, and maintainable.

## Core Principles

1. **Progressive disclosure** – High-level first, then details; each section understandable on its own; use forward/backward references.
2. **Consistent structure** – Same organizational pattern across documents so readers know where to find information.
3. **Narrative flow** – Tell a story: explain "why" before "how," connect concepts, use transitions.
4. **Practical examples** – Every pattern has runnable, realistic examples; show correct usage and common mistakes.

## Where Docs Live

- **Pattern and guidelines**: Rules/skills (e.g. this skill or a project rule file) define how to write.
- **Actual content**: Project documentation lives in a docs folder (commonly `docs/`). Adapt the folder name and structure to the project.

## Document Structure (Every Doc)

1. **Front matter** – Optional YAML (e.g. `alwaysApply`, scope).
2. **Title** – `# [Document Title] - [Subtitle]` plus a 2–3 sentence overview.
3. **Table of contents** – For docs with more than 5 top-level sections; use markdown links.
4. **Introduction** – What, why, who should read, prerequisites.
5. **Core sections** – Each major section: short intro → subsections → explanation → examples (good/bad) → "When to use" / "When NOT to use."
6. **Cross-references** – Links to related docs and sections (relative paths).
7. **Summary** (for long docs) – Takeaways, next steps, optional quick reference.

## File and Folder Conventions

- **Numbered prefixes** (e.g. `01-`, `02-`) to suggest reading order within a folder.
- **Kebab-case** file names; descriptive but concise.
- **Group by topic** in folders (e.g. getting-started, architecture, development, features, deployment, reference).

Suggested folder roles (adapt to the project):

| Folder | Purpose |
|--------|---------|
| (root) or getting-started | Overview, installation, first steps |
| architecture | System design, layers, domains |
| development | Patterns, API design, testing |
| features | Feature-specific docs |
| deployment | Environments, CI/CD, monitoring |
| reference | API endpoints, errors, glossary |

## Writing Style

- **Voice**: Active, present tense, direct "you" in instructions.
- **Clarity**: One idea per sentence; short paragraphs (3–5 sentences); explain jargon on first use; be specific.
- **Code**: Runnable, commented, complete (imports/context), realistic.
- **Accuracy**: Note versions and dates; verify examples; link to implementation where useful.

## Content Patterns

**Inverted pyramid** (general): What → Why → How → When → Examples → Related.

**Tutorial**: Prerequisites → Overview → Steps (explanation + code + verification) → Next steps.

**Reference** (APIs/specs): Summary → Syntax → Parameters → Returns → Exceptions → Examples → See also.

## Formatting Conventions

**Callouts**: `> **Note**`, `> **Warning**`, `> **Important**`, `> **Tip**`.

**Code annotations**: Use `// ✅ GOOD`, `// ❌ BAD`, `// 💡 TIP` (or equivalent) to clarify examples.

**Decisions**: For ADRs use: Title, Status (Accepted/Proposed/Deprecated/Superseded), Context, Decision, Consequences, Alternatives.

## Maintenance

- Update docs when behavior changes; update before breaking changes; docs are part of the change.
- Optional CHANGELOG for docs: Added, Changed, Deprecated, Removed.
- Periodic review: verify examples, versions, links; remove deprecated content.

## Quality Checklist

Docs should be: **Findable** (hierarchy, TOC, cross-links), **Understandable** (right level, concepts before use, examples), **Accurate** (matches code, examples work), **Complete** (common + error cases, edge cases, related links), **Maintainable** (consistent structure, single source of truth).

## Reference Details

For full templates and extended guidance, read when needed:

- [references/document-structure.md](references/document-structure.md) – Full document template and section pattern.
- [references/file-naming-and-folders.md](references/file-naming-and-folders.md) – Folder tree and naming rules.
- [references/writing-style-and-formatting.md](references/writing-style-and-formatting.md) – Voice, clarity, callouts, decision records, versioning.
