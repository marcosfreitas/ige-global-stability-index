# File Naming and Folder Structure

Project-agnostic conventions. Adapt the folder set to the project.

## Example Structure

```
docs/
├── README.md                          # Project overview & navigation
├── getting-started/                   # Setup & basics
│   ├── 01-installation.md
│   ├── 02-configuration.md
│   └── 03-first-steps.md
├── architecture/                     # System design
│   ├── 01-overview.md
│   ├── 02-domain-layer.md
│   ├── 03-application-layer.md
│   └── 04-infrastructure-layer.md
├── development/                       # Development guides
│   ├── 01-patterns.md
│   ├── 02-api-design.md
│   ├── 03-database.md
│   └── 04-testing.md
├── features/                          # Feature documentation
│   ├── 01-authentication.md
│   ├── 02-[feature-b].md
│   └── 03-[feature-c].md
├── deployment/                        # Operations
│   ├── 01-environments.md
│   ├── 02-ci-cd.md
│   └── 03-monitoring.md
└── reference/                         # Quick reference / appendix
    ├── api-endpoints.md
    ├── error-codes.md
    └── glossary.md
```

## Naming Rules

- **Numbered prefixes** (01-, 02-, …) to enforce reading order within a folder
- **Kebab-case** for file names
- **Descriptive but concise** names
- **Group related docs** in folders by topic

## Folder Roles (suggested)

| Folder | Typical content |
|--------|-----------------|
| Root / README | Overview, index, navigation |
| getting-started | Installation, configuration, first run |
| architecture | High-level design, layers, domains |
| development | Patterns, API design, DB, testing |
| features | Per-feature guides |
| deployment | Environments, CI/CD, monitoring |
| reference | APIs, error codes, glossary |

Add, remove, or rename folders to match the project.
