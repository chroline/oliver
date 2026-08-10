---
name: oliverspec-babysit
description: >
  Babysit all open PRs for an OliverSpec Linear project — loop until completion
  fixing PR comments and CI failures, waiting for real CI (ignoring stack
  merge-readiness gates). Use when the user wants to babysit, /oliverspec
  babysit, or oliverspec-babysit after apply has opened the stack.
license: MIT
metadata:
  author: oliverspec
  version: "2.0"
---

Babysit **every open PR** tied to an OliverSpec Linear project until the stack is clean.

Run the loop **to completion** — do not stop after one PR or one fix cycle unless hard-blocked (needs human judgment).

Stacks are **GitHub stacked pull requests** (`gh stack`), not Graphite.

---

## Input

- Linear **project name** (or infer from conversation / recent apply)
- Optional: subset of ticket IDs or PR numbers

Announce: `Babysitting OliverSpec project: <name>`.

---

## Discover the PR set

1. Resolve the Linear project (`list_projects` / `get_project`)
2. Load tickets (`list_issues` with `project`)
3. Collect open PRs for the project:
   - Issue `links` / attachments pointing at GitHub PRs
   - `gh pr list` filtered to branches matching Linear issue git branch names from `get_issue`
   - The stack itself: `gh stack view --json` when a stack is checked out, or `gh stack checkout <stack-number>` to pull a remote stack down locally first
4. Build the working set: **all non-merged, non-closed PRs** for those tickets (the full stack when applicable)

If no open PRs exist, stop and say so (suggest `oliverspec-apply` if tickets are still open).

---

## Completion criteria

Babysit is **done** when, for every PR in the set:

- [ ] No actionable unresolved review comments / threads remain (or each is explicitly declined with a reply explaining why)
- [ ] CI is finished and green for checks that are real CI (see exclusions below)
- [ ] Fixes from this session are pushed and the stack is linear (`gh stack rebase` + `gh stack push` where a lower layer moved)

Babysit is **not** waiting on:

- Human approval / CODEOWNERS sign-off
- Merge into trunk
- **Stack merge-readiness gates** — the merge box reporting on the whole stack, "Rebase stack" prompts, merge queue position, or "all PRs below must be approved". **Ignore these entirely**; do not block the loop on them and do not treat them as CI failures

---

## The loop (run until completion)

Repeat until completion criteria are met:

### 1. Snapshot status (all PRs)

For each open PR in parallel where practical:

- `gh pr view <n> --json statusCheckRollup,reviews,reviewDecision,url,title,number,headRefName,baseRefName`
- Unresolved review threads / comments (filter out already-resolved threads; read comment bodies + locations only — don’t dump huge JSON)
- CI conclusions — **exclude** stack merge-readiness / merge-gate statuses from the failure set

Summarize a board: PR → comments needing action / CI failing / CI pending / clean.

### 2. Fix open PR comments and CI failures

For every PR that needs work:

1. **Fix the layer the problem belongs to.** A change that belongs in a lower PR goes in that PR's branch, not worked around in a higher one. Then carry it upward with `gh stack rebase --upstack` from that branch, followed by `gh stack push`
2. **Comments / review threads** — address valid change requests and bug reports; commit and push on the PR's own branch. Reply on threads when you disagree or need clarification; resolve threads when fixed
3. **CI failures** — fix failures caused by this PR's scope. Never gut or skip CI workflows just to go green. If a failure looks unrelated and the branch is behind its base or trunk, run `gh stack sync` (or `gh stack rebase` + `gh stack push`) and re-run. Prefer scoped fixes
4. **Rebase conflicts** — resolve the markers, `git add` the files, then `gh stack rebase --continue`. `gh stack rebase --abort` restores every branch to its pre-rebase state. Use `restack-conflict-resolution` for the resolution method itself (combine both sides; do not blindly take one)
5. Prefer **parallel sub-agents** (1 PR → 1 agent → 1 worktree) when multiple PRs need fixes in the same round — same aggression as apply, without collapsing the whole stack into one agent unless justified

**Concurrency rule (same as apply):** `gh stack` commands check out branches and take a stack-wide lock (exit code 8), and git refuses a branch already checked out in another worktree. **Sub-agents never run `gh stack`** — they commit and `git push` on their own branch inside their own worktree. The parent removes the worktrees, then runs `gh stack rebase` / `sync` / `push` serially from the main checkout.

Bugbot / bot comments: validate before acting; skip noise; explain when declining.

### 3. Wait for CI to finish (except stack merge-readiness)

After pushing fixes (or if CI was still running):

1. Watch CI on each PR until checks **complete** (success or failure)
2. **Do not** treat stack merge-readiness, "Rebase stack" prompts, or merge-queue position as something to wait on or fix
3. If real CI fails → go back to step 2
4. If real CI is still pending → wait/poll (reasonable intervals); keep fixing other PRs in parallel while waiting

Note: a `gh stack push` force-pushes rebased branches with `--force-with-lease`, which re-triggers CI on every branch above the change. Expect a fresh round of pending checks after any rebase.

### 4. Re-enter the loop

Re-snapshot. Continue until every PR is comment-clean and real CI green, or escalate hard blockers.

---

## Hard blockers (pause and report)

Stop the loop and report when:

- Conflicting human review feedback that can’t be reconciled
- CI failure that requires changing shared pipelines / secrets / flaky infra outside the PR scope
- Missing permissions / auth for GitHub, or `gh stack` exiting **9** (stacked PRs not enabled for the repo)
- A diverged stack that `gh stack sync` cannot reconcile non-interactively — report it rather than unstacking on your own
- Ambiguous product/design change that needs the user (offer to update PRD/TRD via propose)

---

## Output on completion

```
## OliverSpec Babysit Complete

**Project:** <name>
**Stack:** #<stack-number>

| PR | Ticket | Base | Comments | CI (excl. stack merge gates) |
|----|--------|------|----------|------------------------------|
| #n | LEM-… | <branch> | clean / declined-with-reason | green |

### Remaining non-blocking
- Awaiting human review / merge (not babysit’s job)
- Stack merge-readiness ignored by design
```

---

## Guardrails

- Scope = this OliverSpec project’s open PRs / stack — don’t wander into unrelated PRs
- **Ignore stack merge-readiness status** always
- Wait for **real CI** to finish; fix failures; don’t fake green
- **GitHub stacks, not Graphite** — `gh stack rebase` / `sync` / `push`, never `gt`
- **Only the parent runs `gh stack`**, serially, from the main checkout with worktrees removed
- Fix each problem in the layer it belongs to, then propagate with `gh stack rebase --upstack`
- Don’t merge PRs unless the user explicitly asks. When asked, merge bottom-up with `gh stack merge` — a mid-stack PR always merges everything below it, and auto-merge is not supported for stacks
- Prefer parallel per-PR sub-agents when multiple PRs need work, each in its own git worktree outside the repo
- Don’t rewrite CI workflows solely to pass
- Keep Linear links/status sensible if you touch issues (optional: leave tickets In Review)
