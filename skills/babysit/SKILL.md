---
name: babysit
description: >
  Babysit open GitHub PRs (single PR, chain, or gh stack) until real CI is green
  and review threads are clean — ready (non-draft) only, ignore stack merge-readiness
  gates, fix via per-PR worktrees, do not merge. Use when the user wants /babysit,
  babysit, or to watch/fix CI and PR comments on an already-open stack without
  running factory or OliverSpec.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "1.0"
---

Babysit **open GitHub PRs** until they are mergeable from a CI + comments perspective.

Callable **on its own** (not only from Factory). Run the loop **to completion** — do not stop after one PR or one fix cycle unless hard-blocked.

Stacks are **GitHub stacked pull requests** (`gh stack`), not Graphite. **Never merge** — hand back a clean stack; merging is the caller's job (`factory` green-light, `oliverspec-ship`, or the user).

Announce: `Babysitting: <PR set summary>`.

---

## Input

Accept any of (ask once if none given):

- One or more **PR numbers** / URLs
- A **`gh stack` number** (or "current stack" / checked-out stack)
- A Linear **issue ID** (resolve linked PRs / Linear git branch → open PRs)
- Branch names that have open PRs

Optional: stop when CI green only (still clear actionable threads unless user says skip-comments).

---

## Discover the PR set

1. Resolve inputs to open PR numbers (`gh pr view`, `gh pr list`, issue links, `gh stack view --json` / `gh stack checkout <n>`)
2. Working set = **all non-merged, non-closed** PRs in that set (full stack when applicable)
3. If empty → stop and say so

Write a short board: PR → base → draft? → CI → threads.

---

## Precondition — ready (not draft)

**Before watching CI:**

1. For each PR: `gh pr view <n> --json isDraft,url,number,title`
2. If draft → `gh pr ready <n>` (or equivalent) until `isDraft == false`
3. **Do not** enter the babysit loop while any PR in the set is still draft

---

## Completion criteria

Babysit is **done** when every PR in the set:

- [ ] Is **ready** (not draft)
- [ ] Has no actionable unresolved review comments / threads (or each is explicitly declined with a reply explaining why)
- [ ] Has **real CI** finished and green (see exclusions)
- [ ] Has fixes from this session pushed; stack linear if stacked (`gh stack rebase` + `gh stack push` when a lower layer moved)
- [ ] Is mergeable enough to ship bottom-up (ignore stack merge-readiness UI; require real CI + clean threads)

Babysit is **not** waiting on:

- Human approval / CODEOWNERS sign-off
- Merge into trunk
- **Stack merge-readiness gates** — merge box for the whole stack, "Rebase stack" prompts, merge queue position, or "all PRs below must be approved". **Ignore these entirely**

---

## The loop (run until completion)

Repeat until completion criteria are met:

### 1. Snapshot status (all PRs)

For each open PR (parallel where practical):

- `gh pr view <n> --json isDraft,statusCheckRollup,reviews,reviewDecision,mergeable,mergeStateStatus,url,title,number,headRefName,baseRefName`
- Unresolved review threads / comments (bodies + locations only — don't dump huge JSON)
- CI conclusions — **exclude** stack merge-readiness / merge-gate statuses from the failure set

Board: PR → comments needing action / CI failing / CI pending / clean.

### 2. Fix open PR comments and CI failures

For every PR that needs work:

1. **Fix the layer the problem belongs to.** A change that belongs in a lower PR goes on that PR's branch, then carry upward with `gh stack rebase --upstack` + `gh stack push`
2. **Comments / review threads** — address valid requests; commit and push on the PR's own branch. Reply when declining; resolve when fixed
3. **CI failures** — fix failures in this PR's scope. Never gut or skip CI workflows just to go green. If unrelated and the branch is behind base/trunk → `gh stack sync` (or rebase + push) and re-run
4. **Rebase conflicts** — resolve markers, `git add`, `gh stack rebase --continue`. Abort restores pre-rebase state. Prefer `restack-conflict-resolution` (combine both sides)
5. Prefer **parallel sub-agents** (1 PR → 1 agent → 1 worktree) when multiple PRs need fixes

**Concurrency:** `gh stack` checks out branches and takes a stack-wide lock (exit code 8). **Sub-agents never run `gh stack`** — they commit and `git push` in their own worktree. Parent removes worktrees, then runs `gh stack rebase` / `sync` / `push` **serially** from the main checkout.

Bugbot / bot comments: validate before acting; skip noise; explain when declining.

### 3. Wait for CI to finish (except stack merge-readiness)

After pushing (or if CI was still running):

1. Watch each PR until real checks **complete** (success or failure)
2. **Do not** treat stack merge-readiness / "Rebase stack" / merge-queue position as something to wait on or fix
3. Real CI fails → step 2
4. Real CI pending → poll; keep fixing other PRs in parallel

Note: `gh stack push` force-pushes with `--force-with-lease` and re-triggers CI upstack.

### 4. Re-enter the loop

Re-snapshot. Continue until every PR is ready, comment-clean, and real-CI green — or escalate hard blockers.

---

## Hard blockers (pause and report)

Stop and report when:

- Conflicting human review feedback that can’t be reconciled
- CI failure that requires shared pipelines / secrets / flaky infra outside PR scope
- Missing GitHub permissions, or `gh stack` exit **9** (stacked PRs not enabled — fall back to chained plain PRs; keep other rules)
- A diverged stack that `gh stack sync` cannot reconcile non-interactively
- Ambiguous product/design change that needs the user

---

## Output on completion

```
## Babysit Complete

**Set:** <PRs / stack # / issue>
**Stack:** #<stack-number> (or chained PRs)

| PR | Base | Draft | Comments | CI (excl. stack merge gates) |
|----|------|-------|----------|------------------------------|
| #n | <branch> | ready | clean / declined-with-reason | green |

### Remaining non-blocking
- Awaiting human review / merge (not babysit’s job)
- Stack merge-readiness ignored by design

### Suggested next step
- Factory run: reply **merge** / green-light to the factory parent
- OliverSpec project: run `oliverspec-ship`
- Otherwise: merge bottom-up when you are ready
```

---

## Guardrails

- Scope = the resolved PR set / stack only — don’t wander into unrelated PRs
- **Ready PRs only** — mark draft → ready before watching CI
- **Ignore stack merge-readiness status** always
- Wait for **real CI**; fix failures; don’t fake green
- **GitHub stacks, not Graphite** — `gh stack`; never `gt`
- **Only the parent runs `gh stack`**, serially, main checkout, worktrees removed
- Fix each problem in the layer it belongs to, then propagate upstack
- **Don’t merge** — babysit ends at clean + green
- Prefer parallel per-PR sub-agents in isolated worktrees outside the repo
- Don’t rewrite CI workflows solely to pass
