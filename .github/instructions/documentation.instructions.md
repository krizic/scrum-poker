---
description: "Use when implementing features, changing behavior, or producing any generated documentation. Keeps the README current and enforces that generated docs live outside the repository root."
---
# Documentation Guidelines

## Keep the README up to date
- Whenever you add, change, or remove a feature, script, config, or setup step, update `README.md` in the same change so it always reflects the current state.
- Keep setup/run/test commands in the README accurate (e.g. `pnpm` scripts). If a command changes, update the README.

## Keep generated documentation out of the root
- DO NOT create documentation files in the repository root (only `README.md` and standard root files like `LICENCE` belong there).
- Place all generated/supporting documentation under a dedicated folder. When there is no clearly better location, use `docs/`.
- Use meaningful subpaths inside `docs/` when helpful (e.g. `docs/architecture/`, `docs/migration/`).
- Only create documentation when it is requested or clearly necessary — do not add docs for their own sake.
