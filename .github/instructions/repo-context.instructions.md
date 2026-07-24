---
description: "Use when gathering codebase context, especially during migration or large refactors. A full repo snapshot exists at repo-context.md — read it first to populate context instead of querying and reading many files separately."
---
# Using the Repo Context Snapshot

A generated snapshot of the whole repository lives at [repo-context.md](../../repo-context.md). It contains the directory structure plus the contents of the tracked source files in one place.

## Prefer the snapshot for context gathering
- When you need broad context about the codebase (its structure, files, and their contents) — especially during migration or large refactors — read `repo-context.md` FIRST to populate context in a single read.
- Prefer this over issuing many separate `search`/`read` calls across individual files. It is faster and cheaper to load the snapshot once.
- Use the snapshot to orient yourself and identify the relevant files before making targeted reads.

## Keep it authoritative but verify before editing
- `repo-context.md` may be truncated (some large files show `Lines X-Y omitted`) and can become stale. Treat it as a fast index, not the source of truth.
- Before editing a file, read the current on-disk version of that specific file to confirm exact, up-to-date contents.
- If the snapshot and the real files disagree, trust the on-disk files.

## Do not hand-edit or commit noise
- Do not manually edit `repo-context.md`; it is generated. Regenerate it if it is stale rather than patching it by hand.
