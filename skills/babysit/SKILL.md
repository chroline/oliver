---
name: babysit
description: >
  Babysit the open GitHub PR or stack for a single Linear ticket — repeatedly
  fix real CI failures and actionable review comments, ignore stack-only merge
  gates, then stop for explicit approval and merge bottom-up. Use when the user
  wants /babysit, babysit, or to take an existing ticket's PRs through merge.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "1.0"
---

Babysit the open PRs for **one Linear ticket** until they are clean, then merge only after the user explicitly approves.

Run the loop to completion. Do not stop after one snapshot or fix cycle unless hard-blocked.

Announce: `Babysit: <ISSUE-ID> — <title>`.

---

## Input

- Linear **issue ID** (for example `LEM-123`) — required unless unambiguous from the current Factory run
- Optional explicit PR numbers or Factory metadata path

If the issue ID is missing and cannot be inferred, ask once.

Factory may invoke this skill directly after opening PRs. When it does, reuse `/tmp/factory/<ISSUE-ID>/meta.json` and the already-loaded ticket context instead of rediscovering known facts.

---

## Preflight and discovery

```bash
gh --version                      # need 2.90.0+
gh auth status
gh extension install github/gh-stack   # no-op if present
gh stack view --short 2>/dev/null      # exit 9 = stacks unavailable; chained PRs are still supported
```

1. Discover Linear and GitHub MCP/tool schemas before calling them.
2. Load the Linear issue with relations and links.
3. Build the PR set from, in order:
   - PR numbers in `/tmp/factory/<ISSUE-ID>/meta.json`, when present
   - GitHub PR links attached to the Linear issue
   - Open PRs whose branches match the issue's Linear git branch and its numbered stack branches
   - The full `gh stack` containing any matched PR
4. Keep only non-merged, non-closed PRs belonging to this ticket. Include every layer of its stack, but do not pull in unrelated PRs.
5. If no open PR exists, stop and report that implementation must open one first.

When Factory metadata exists, update its `status` as the workflow progresses without deleting existing fields.

---

## Completion criteria

The stack is ready for approval when every PR has:

- Real CI finished and green
- No actionable unresolved review thread (or an explicit reply explaining why a request was declined)
- All fixes pushed
- A linear stack after lower-layer changes are propagated
- A mergeable bottom-up path, disregarding only the exclusions below

Do **not** treat these as real CI failures:

- Stack merge-readiness or whole-stack gates
- “Rebase stack” prompts
- Merge-queue position
- “All PRs below must be approved” gates

Human approval and CODEOWNERS sign-off may be reported as non-blocking unless repository rules make merging impossible after the user's green-light.

---

## Babysit loop

Repeat until the completion criteria are met or a hard blocker occurs.

### 1. Snapshot every PR

For each PR, in parallel where practical:

```bash
gh pr view <n> --json statusCheckRollup,reviews,reviewDecision,mergeable,mergeStateStatus,url,title,number,headRefName,baseRefName
```

Also query unresolved review threads and comments. Read only unresolved thread bodies and locations; avoid dumping large API responses. Summarize a board of PR → actionable comments, real CI failures, pending CI, and clean state.

### 2. Fix comments and real CI failures

For each PR needing work:

1. Fix the layer where the problem belongs. Never hide a lower-layer defect in a higher PR.
2. Address valid review requests and bug reports. Reply when declining noise or requesting clarification; resolve fixed threads.
3. Fix failures caused by the PR. Do not gut, skip, or weaken CI solely to make it green.
4. If a failure appears unrelated and the branch is behind its base or trunk, sync/rebase and rerun before changing product code.
5. For conflicts, use the `restack-conflict-resolution` workflow: combine intended behavior from both sides; never blindly choose ours/theirs.
6. Prefer one fix sub-agent per PR in an isolated worktree when multiple PRs need independent fixes.

Sub-agents commit and push only their PR branch. They never run `gh stack`.

The parent removes fix worktrees, then runs all `gh stack rebase|sync|push` commands serially from the main checkout. A lower-layer fix must be propagated upstack and pushed before status is re-evaluated.

### 3. Wait for real CI

Watch or poll pending real checks at reasonable intervals while fixing other PRs. A stack push may retrigger every layer above a changed branch; wait for those fresh runs too.

- Real CI failure → return to fixing
- New actionable review thread → return to fixing
- Pending real CI → keep waiting
- All completion criteria met → leave the loop

### 4. Re-snapshot

Always take a fresh full-stack snapshot after fixes and CI. Never declare readiness from stale status.

---

## Hard blockers

Pause and report:

- Conflicting human feedback requiring product judgment
- CI requiring shared pipeline, secret, permission, or flaky-infrastructure changes outside ticket scope
- Missing GitHub or Linear authentication/permissions
- A diverged stack that cannot be reconciled non-interactively
- An ambiguous product/design change

`gh stack` exit 9 is not itself fatal if the PRs form a valid chained stack; use plain Git and merge the chained PRs bottom-up.

---

## Notify and stop for approval

When ready, update Factory metadata to `status: "mergeable"` when applicable, then **stop**. Do not merge in the same turn that readiness is first announced.

```markdown
## Babysit — ready to merge

**Ticket:** <ISSUE-ID> — <title> (<url>)
**Stack:** #<stack-number> (or chained PRs)

| PR | Base | Real CI | Reviews |
|----|------|---------|---------|
| #n | ... | green | clean |

### Ignored by design
- Stack-only merge-readiness gates / queue position, if present

Reply **merge** (or another explicit green-light) and I will re-check and merge bottom-up.
```

---

## Merge after explicit approval

Only after the user says `merge`, `ship it`, `LGTM merge`, or equivalent:

1. Re-snapshot every PR and unresolved thread.
2. If real CI or reviews regressed, return to the babysit loop and request approval again only after the stack is ready.
3. Merge bottom-up with `gh stack merge`, or merge chained PRs bottom-up when stacks are unavailable.
4. Run `gh stack sync --prune` when applicable.
5. Move the Linear issue to **Done**.
6. Update Factory metadata to `status: "merged"` when present.

```markdown
## Babysit Complete

**Ticket:** <ISSUE-ID>
**Merged:** <PR URLs>
**Linear:** Done
```

---

## Guardrails

- Scope is one Linear ticket and its PR stack only.
- Loop until real CI is green and actionable reviews are resolved.
- Ignore stack-only merge-readiness gates, but never ignore real CI.
- GitHub stacks only: `gh stack`, never Graphite `gt`.
- Only the parent runs `gh stack`, serially, after fix worktrees are removed.
- Fix each issue in its owning layer, then propagate upward.
- Never merge without explicit user approval after the ready notification.
- Never push directly to trunk.
- Keep `/tmp/factory/...` artifacts out of git.
