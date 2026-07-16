---
name: oliverspec-babysit
description: >
  Babysit all open PRs for an OliverSpec Linear project — loop until completion
  fixing PR comments and CI failures, waiting for CI (ignoring Graphite
  mergeability). Use when the user wants to babysit, /oliverspec babysit, or
  oliverspec-babysit after apply has opened the stack.
license: MIT
metadata:
  author: oliverspec
  version: "1.0"
---

Babysit **every open PR** tied to an OliverSpec Linear project until the stack is clean.

Run the loop **to completion** — do not stop after one PR or one fix cycle unless hard-blocked (needs human judgment).

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
   - Graphite stack for known branches (`gt ls`, `gt log`)
   - `gh pr list` filtered to branches matching Linear issue git branch names from `get_issue`
4. Build the working set: **all non-merged, non-closed PRs** for those tickets (the full Graphite stack when applicable)

If no open PRs exist, stop and say so (suggest `oliverspec-apply` if tickets are still open).

---

## Completion criteria

Babysit is **done** when, for every PR in the set:

- [ ] No actionable unresolved review comments / threads remain (or each is explicitly declined with a reply explaining why)
- [ ] CI is finished and green for checks that are real CI (see exclusions below)
- [ ] Fixes from this session are pushed (`gt submit --no-edit` / stack-aware push)

Babysit is **not** waiting on:

- Human approval / CODEOWNERS sign-off
- Merge into trunk
- **Graphite mergeability** / merge queue / “Mergable by Graphite” style statuses — **ignore these entirely**; do not block the loop on them and do not treat them as CI failures

---

## The loop (run until completion)

Repeat until completion criteria are met:

### 1. Snapshot status (all PRs)

For each open PR in parallel where practical:

- `gh pr view <n> --json statusCheckRollup,reviews,reviewDecision,url,title,number,headRefName`
- Unresolved review threads / comments (filter out already-resolved threads; read comment bodies + locations only — don’t dump huge JSON)
- CI conclusions — **exclude** Graphite mergeability / merge-gate checks from the failure set

Summarize a board: PR → comments needing action / CI failing / CI pending / clean.

### 2. Fix open PR comments and CI failures

For every PR that needs work:

1. **Comments / review threads** — address valid change requests and bug reports; push fixes on the PR’s Linear/Graphite branch (`gt modify` / commit + `gt submit --no-edit`). Reply on threads when you disagree or need clarification; resolve threads when fixed.
2. **CI failures** — fix failures caused by this PR’s scope. Never gut or skip CI workflows just to go green. If a failure looks unrelated and the branch is behind its Graphite parent/trunk, restack (`gt restack`) / merge latest parent and re-run. Prefer scoped fixes; use `restack-conflict-resolution` when restacks conflict.
3. Prefer **parallel sub-agents** (1 PR → 1 agent) when multiple PRs need fixes in the same round — same aggression as apply, without collapsing the whole stack into one agent unless justified.

Bugbot / bot comments: validate before acting; skip noise; explain when declining.

### 3. Wait for CI to finish (except Graphite mergeability)

After pushing fixes (or if CI was still running):

1. Watch CI on each PR until checks **complete** (success or failure)
2. **Do not** treat Graphite mergeability / “waiting on Graphite” / merge-queue readiness as something to wait on or fix
3. If real CI fails → go back to step 2
4. If real CI is still pending → wait/poll (reasonable intervals); keep fixing other PRs in parallel while waiting

### 4. Re-enter the loop

Re-snapshot. Continue until every PR is comment-clean and real CI green, or escalate hard blockers.

---

## Hard blockers (pause and report)

Stop the loop and report when:

- Conflicting human review feedback that can’t be reconciled
- CI failure that requires changing shared pipelines / secrets / flaky infra outside the PR scope
- Missing permissions / auth for Graphite or GitHub
- Ambiguous product/design change that needs the user (offer to update PRD/TRD via propose)

---

## Output on completion

```
## OliverSpec Babysit Complete

**Project:** <name>

| PR | Ticket | Comments | CI (excl. Graphite mergeability) |
|----|--------|----------|----------------------------------|
| #n | LEM-… | clean / declined-with-reason | green |

### Remaining non-blocking
- Awaiting human review / merge (not babysit’s job)
- Graphite mergeability ignored by design
```

---

## Guardrails

- Scope = this OliverSpec project’s open PRs / Graphite stack — don’t wander into unrelated PRs
- **Ignore Graphite mergeability status** always
- Wait for **real CI** to finish; fix failures; don’t fake green
- Don’t merge PRs unless the user explicitly asks
- Prefer Graphite (`gt submit`, `gt restack`) to keep the stack intact
- Prefer parallel per-PR sub-agents when multiple PRs need work
- Don’t rewrite CI workflows solely to pass
- Keep Linear links/status sensible if you touch issues (optional: leave tickets In Review)
