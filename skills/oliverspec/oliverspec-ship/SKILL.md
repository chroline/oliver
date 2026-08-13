---
name: oliverspec-ship
description: >
  Ship a babysat OliverSpec project — merge every PR in its GitHub stack
  bottom-up and move the Linear project to Completed. Use when the user
  wants to ship, finish, close out, merge, /oliverspec ship, or
  oliverspec-ship after oliverspec-babysit has cleared the stack.
license: MIT
metadata:
  author: oliverspec
  version: "1.0"
---

**Ship** a finished OliverSpec project: merge its GitHub stack bottom-up and mark the Linear project **Completed**.

This is the **last** step of the workflow — it commits to trunk and closes the Linear project. Only run it once the stack is actually clean.

Stacks are **GitHub stacked pull requests** (`gh stack`), not Graphite.

---

## Input

- Linear **project name** (or infer from conversation / recent apply/babysit)
- Optional: subset of PR numbers (default = the project's full open stack)

Announce: `Shipping OliverSpec project: <name>`.

---

## Steps

### 1. Discover the PR set

1. Resolve the Linear project (`list_projects` / `get_project`)
2. Load tickets (`list_issues` with `project`); for each, `get_issue` to find its git branch name and any linked PR
3. Collect open PRs: issue `links` / attachments pointing at GitHub PRs, `gh pr list` filtered to those branches, and `gh stack view --json` (or `gh stack checkout <stack-number>` first if the stack isn't checked out locally)
4. Build the working set: all non-merged, non-closed PRs for this project's tickets

If no open PRs exist but the project has unmerged work, say so and stop. If everything is already merged, skip straight to step 4 (project status).

### 2. Verify the stack is actually ready

For every PR in the set, `gh pr view <n> --json statusCheckRollup,reviews,reviewDecision,mergeable,mergeStateStatus`:

- [ ] No unresolved actionable review threads
- [ ] Real CI is green (stack merge-readiness / merge-queue-position statuses don't count either way)
- [ ] `mergeable` is true and there are no pending rebase/conflict states

If anything fails this check, **stop** — report which PRs aren't ready and tell the user to run `oliverspec-babysit` first. Do not force a merge past red CI or unresolved comments.

### 3. Confirm and merge bottom-up

1. Show the merge plan: stack number, PR order bottom-to-top, base branch each targets
2. Merge with `gh stack merge` starting from the bottom of the stack — a mid-stack merge always takes everything below it with it, so merging the top PR merges the whole stack in one call when it's all ready
3. If the stack should only partially ship (user asked for a subset), merge the deepest ready contiguous group only, and report which PRs remain open
4. After merges, `gh stack sync --prune` to fast-forward trunk and clean up merged local branches/worktrees
5. Verify: `gh pr list` for the affected branches should show them merged; `git worktree list` should have no leftover worktrees for merged branches

### 4. Close out Linear

1. For each ticket whose PR just merged, `save_issue` to move it to **Done** (or the team's completed-equivalent from `list_issue_statuses` if the name differs)
2. Move the Linear **project** status to **Completed** (`save_project` with `id` = the project and `state: "Completed"`) — only when every in-scope ticket is merged/Done. If some tickets remain open (partial ship), leave the project at its current state and say why
3. Optionally add a closing comment/link on the project or PRD/TRD noting the shipped PRs

### 5. Final summary

```
## OliverSpec Ship Complete

**Project:** <name> (<url>) — status: Completed
**Stack:** #<stack-number>

| Ticket | Title | PR | Merged into |
|--------|-------|----|--------------|
| LEM-123 | ... | url | main |

### Not shipped (if partial)
- <ticket/PR — reason>
```

---

## Guardrails

- **Verify before merging** — CI green and comments clean, same bar as `oliverspec-babysit`'s completion criteria. If unsure, re-run babysit instead of forcing it
- **Merge bottom-up with `gh stack merge`** — never merge PRs individually out of order; a mid-stack merge takes everything below it
- **GitHub stacks, not Graphite** — never `gt`
- **`gh stack sync --prune` after merging** to fast-forward trunk and remove stale branches/worktrees
- **Move tickets to Done, then the project to Completed** — only mark the project Completed when its in-scope tickets are actually merged; a partial ship leaves the project status alone
- **Never push directly to trunk** outside of `gh stack merge`'s own merge commits
- If the stack isn't ready, stop and hand back to `oliverspec-babysit` rather than merging anyway
- Ask before merging if the user only asked to "check" or "review" status rather than explicitly ship/merge/finish
