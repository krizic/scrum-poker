---
name: github-issues
description: 'Create and update GitHub issues on the origin repository via the GitHub MCP server. Use when asked to open/file/create an issue, update/edit/close/reopen an issue, add a comment, apply labels/assignees/milestone, or turn a bug/TODO/feature request into a tracked GitHub issue. Targets the repo pointed to by the git "origin" remote (krizic/scrum-poker).'
argument-hint: 'e.g. "create an issue for the IPv6 localhost bug" or "close issue #12 with a comment"'
---

# GitHub Issues (via GitHub MCP)

Create and update issues on the **origin** GitHub repository using the GitHub MCP server. This skill covers filing new issues, editing/closing/reopening existing ones, commenting, and setting labels/assignees/milestones.

## When to Use
- "Create/open/file an issue for …", "turn this bug/TODO into an issue".
- "Update/edit issue #N", "close/reopen #N", "comment on #N".
- "Label / assign / add to milestone" an issue.

## Prerequisites
- The GitHub MCP server must be available (tools like `create_issue`, `update_issue`, `get_issue`, `list_issues`, `add_issue_comment`, `search_issues`). If these tools are not loaded, load/enable the GitHub MCP server first; do not fall back to guessing the GitHub REST API by hand.
- Determine the target repo from the `origin` remote instead of assuming:
  - Run `git remote get-url origin` and parse `owner/repo`.
  - For this workspace that is **owner `krizic`, repo `scrum-poker`**. Always confirm at runtime in case the remote changed.

## Procedure

### 1. Resolve the repository
- Get `owner` and `repo` from `git remote get-url origin` (strip `https://github.com/` and trailing `.git`).

### 2. Avoid duplicates (create only)
- Before creating, search existing issues: `search_issues` (or `list_issues`) with the key terms from the request.
- If a matching open issue exists, prefer updating/commenting on it over creating a duplicate. Surface the match to the user and ask which they want.

### 3. Create an issue
- Call `create_issue` with `owner`, `repo`, and:
  - `title`: concise, imperative summary (e.g. "Fix IPv6 `localhost` mismatch breaking PouchDB fetch").
  - `body`: use the template below.
  - Optional: `labels`, `assignees`, `milestone` when specified or clearly implied.
- Only apply labels/assignees/milestones that already exist; if unsure, `list_labels`/`list_milestones` (or omit and mention it).

### 4. Update / close / reopen an issue
- Fetch current state first with `get_issue` (confirm the number and that it's the right issue).
- Use `update_issue` for `title`, `body`, `state` (`open`/`closed`), `labels`, `assignees`, `milestone`.
- Editing the body: preserve existing content unless asked to replace it; append or amend rather than silently overwriting.
- For a status change plus context, set `state` AND add an explanatory comment (step 5).

### 5. Comment
- Use `add_issue_comment` for progress notes, closing rationale, or linking a fix/PR/commit.

### 6. Confirm
- Report back the issue number and URL, and summarize exactly what was created or changed.

## Issue body template
```markdown
## Summary
<one- or two-sentence description of the problem or request>

## Context
- Repo area / files: <paths, e.g. src/api/index.ts>
- Environment: <if relevant — OS, browser, versions>

## Steps to Reproduce (bugs)
1. …
2. …

## Expected vs Actual
- Expected: …
- Actual: …

## Proposed / Acceptance Criteria
- [ ] …

## References
- Related: #<issue>, <commit/PR/url>
```

## Guardrails
- CONFIRM before creating or closing an issue if the request is ambiguous, or if closing an issue that isn't clearly resolved.
- DO NOT invent issue numbers, labels, assignees, or milestones — verify they exist first.
- DO NOT include secrets, tokens, or private env values (e.g. from `development.env`) in issue titles, bodies, or comments.
- Keep titles imperative and specific; keep bodies scannable using the template.
- Never create duplicate issues without flagging the existing match to the user.
