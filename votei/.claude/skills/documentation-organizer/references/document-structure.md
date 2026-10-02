# Document Structure Template

Every documentation file should follow this structure. Adapt to project needs.

## 1. Front Matter

```markdown
---
alwaysApply: true/false
---

# [Document Title] - [Subtitle]

[Brief 2-3 sentence overview of what this document covers]
```

## 2. Table of Contents

- Only for docs longer than 5 sections
- Use markdown links to section anchors
- Top-level sections only

## 3. Introduction

- **What**: What this document covers
- **Why**: Why it matters to the reader
- **Who**: Who should read (e.g. developers, ops, architects)
- **Prerequisites**: Assumed knowledge

## 4. Core Content Sections

Each major section:

```markdown
## [Section Title]

[1-2 sentence introduction to the section]

### [Subsection Title]

[Explanation of the concept]

#### Example: [Descriptive Name]

[Code example with inline comments]

<good-example>
// Show the correct way
</good-example>

<bad-example>
// Show common mistakes or anti-patterns
</bad-example>

#### When to Use

[Guidance on when this pattern applies]

#### When NOT to Use

[Explicitly state when to avoid this pattern]
```

## 5. Cross-References

- Link to related documents
- Reference specific sections in other docs
- Use relative paths for internal links

## 6. Visual Aids

- ASCII or Mermaid diagrams for architecture
- Code blocks for examples
- Tables for comparisons
- Lists for steps and checklists

## 7. Summary/Conclusion (long docs)

- Recap key takeaways
- Next steps or related reading
- Optional "Quick Reference" section
