---
name: factory
description: >
  Autonomous software factory for a single Linear ticket — plan with a smart
  model, blind-critique and refine the plan, comment it on the ticket, implement
  via sub-agent, open atomic stacked PRs, babysit CI/review until mergeable, then
  merge on user green-light. Use when the user wants /factory, factory, or to
  fully drive one Linear ticket from plan → PRs → merge.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "1.0"
---

Run a **single Linear ticket** end-to-end as an autonomous software factory.

No explore/propose/scope. No project-wide waves. One ticket → plan → critique loop → implement → stack if needed → babysit → wait for user → merge.

Announce: `Factory: <ISSUE-ID> — <title>`.

---

## Input

- Linear **issue ID** (e.g. `LEM-123`) — required
- Optional overrides: model picks, force-single-PR, skip-merge (stop at mergeable)

If missing, ask once for the issue ID, then start.

---

## Model routing

Pick models **once at the start** from whatever the harness advertises. Prefer these slugs when present:

| Role | Prefer | Fallback |
|------|--------|----------|
| **Planner** | `claude-opus-5-thinking-high` or `gpt-5.6-sol-medium` | best available "smart" / high-thinking model |
| **Critic** | the **other** of opus ↔ gpt-5.6-sol (swap families) | a different smart model than the planner; never the same model as planner |
| **Implementer** | best Grok (`cursor-grok-4.6-high-fast`, else newest `cursor-grok-*-high-fast`) | `claude-sonnet-5-thinking-high` or `gpt-5.6-terra-medium` |

Rules:

1. Planner and critic **must** be different model families when both are available (Opus vs GPT). If only one family exists, use two different slugs; if only one slug exists, still run a fresh blind critic agent.
2. Record the chosen triple in the session plan file: `planner`, `critic`, `implementer`.
3. Pass `model:` explicitly on every `Task` launch. Do not rely on inherit for these three roles.

---

## Artifacts

```text
/tmp/factory/<ISSUE-ID>/
  plan.md           # living plan (planner writes, parent updates after critique)
  critique-N.md     # each blind critique round
  meta.json         # models, ticket url, branch, PR numbers, status
  screenshots/      # Storybook captures for frontend changes (png/webp)
```

Also create a sibling worktree root **outside** the repo:

```text
../.factory-worktrees/<ISSUE-ID>/
```

Never commit factory artifacts into the git repo.

---

## Steps

### 0. Preflight (fail fast)

```bash
gh --version                      # need 2.90.0+
gh auth status
gh extension install github/gh-stack   # no-op if present
gh stack view --short 2>/dev/null      # exit 9 = stacks not enabled → chained plain PRs
mkdir -p "/tmp/factory/<ISSUE-ID>"
```

- Discover Linear + GitHub MCP/tool schemas before calling tools
- Load the issue (`get_issue` with relations). Mark **In Progress**
- Write `meta.json` with issue id, title, url, branch name (Linear git branch), trunk branch

### 1. Plan (smart model sub-agent)

Launch a `Task` (`generalPurpose`) with **planner** model. Prompt must include:

- Full issue title, description, acceptance criteria, labels, relations
- Repo pointers the parent already knows (paths, conventions) — keep it factual, not a solution
- Absolute path `/tmp/factory/<ISSUE-ID>/plan.md` to write
- Instruction: produce an **in-depth implementation plan**, not code

**Plan must cover:**

1. Goal + non-goals (scoped to this ticket only)
2. Current-state findings (files, modules, constraints) — explore the codebase
3. Approach + alternatives considered (and why rejected)
4. Detailed design: data model, APIs, control flow, edge cases, failure modes
5. **Mermaid diagrams** wherever they clarify (architecture, sequence, state, dependency) — at least one if the change touches >1 module
6. File-by-file change list (create/edit/delete) with intent per file
7. TDD sequence: tests first → typecheck-clean stubs → implement to green
8. Test plan + commands to run
9. If any UI/frontend surface changes: Storybook stories to add/update + which states to capture
10. Rollout / migration / feature-flag notes if relevant
11. Risks, open questions, and explicit "out of scope"
12. PR split proposal (atomic layers) — even if likely one PR

Parent reads `plan.md`. If thin or missing diagrams where needed, send the planner back once with concrete gaps.

### 2. Blind critique ↔ update loop

Repeat until the critic returns **APPROVED** (no blocking findings) or **3 rounds** complete:

1. **Critic** — fresh `Task` with **critic** model. Blind: give **only** `plan.md` contents + the raw Linear ticket text. No planner chat, no “please be nice.” Ask for:
   - Blocking gaps / wrong assumptions / missing edge cases
   - Over-scope or under-scope vs the ticket
   - Diagram / sequencing issues
   - Test-plan holes
   - Verdict: `APPROVED` | `REVISE` with a numbered change list
   - Write `/tmp/factory/<ISSUE-ID>/critique-<N>.md`
2. If `REVISE`: **Planner** (same planner model) updates `plan.md` addressing every numbered item. Do not dilute the critique.
3. If round 3 still `REVISE`: fold remaining blocking items into the plan as explicit risks / AC, and proceed (note them in the Linear comment).

### 3. Comment the plan on the Linear ticket

Post **one** comment on the issue with the **full** settled `plan.md` body (including mermaid). Prefer Linear’s issue comment API (`save_comment` / equivalent). If the body exceeds Linear limits, split into threaded comments labeled `Plan (1/N)`… and keep the files in `/tmp/factory/...` as source of truth.

Also write `meta.json` → `status: "planned"`.

### 4. Implement (implementer sub-agent)

Create an isolated worktree on the Linear branch:

```bash
git fetch origin
git worktree add "../.factory-worktrees/<ISSUE-ID>" -b <linear-branch> origin/<trunk>
```

Launch `Task` with **implementer** model. Contract:

- Cwd = that worktree only
- Follow `plan.md` + ticket ACs; TDD (red → stubs typecheck → green)
- **Frontend / UI changes (mandatory when applicable):** verify in Storybook — add or update stories for every changed component/state, run Storybook, capture screenshots of the relevant stories (default, key variants, empty/loading/error if touched). Save files under `/tmp/factory/<ISSUE-ID>/screenshots/` with stable names (`button-default.png`, etc.). No Storybook verification = frontend work is incomplete
- Do **not** open PRs yet; do **not** run `gh stack`
- Commit on the branch; push when implementation + tests are green
- Return: files changed, test summary, residual risks, approximate diffstat, screenshot paths (if any)

Parent removes nothing yet — needs the branch for size check / possible split.

### 5. Size gate → atomic stacked PRs

Measure diff vs trunk, **excluding** migrations/snapshots/generated noise:

```bash
# Example filter — adjust to repo conventions
git diff --stat origin/<trunk>...HEAD
git diff --numstat origin/<trunk>...HEAD | \
  grep -vE '(^|/)(migrations?|snapshots?|__snapshots__)/|\.(snap|lock)$|/(gen|generated)/' | \
  awk '{ add+=$1; del+=$2 } END { print add+del }'
```

Treat as **excluded**: migration folders, snapshot dirs, `*.snap`, lockfiles, obvious generated paths.

| Filtered lines | Action |
|----------------|--------|
| **< 1500** | One PR is fine |
| **≥ 1500** | Keep as one PR **only if** it is justifiably large (inseparable refactor, generated-adjacent logic that isn’t excludable, single atomic behavior). **Otherwise split** into stacked atomic PRs. A kept large PR **must** include the justification in the PR description (required section below) — no justification in the body = invalid, split instead |

**Split procedure (parent coordinates):**

1. Decompose into a linear stack of reviewable layers (tests/types → core → wiring → cleanup) matching the plan’s PR split proposal
2. Rebuild history onto stacked branches (`<linear-branch>`, `<linear-branch>-2`, …) or interactive-equivalent non-interactive splits (`git reset`, cherry-picks, or fresh worktrees per layer)
3. Each layer: own branch, own commits, own PR via `gh pr create --base <parent-branch>`
4. Parent only: `gh stack init` / `gh stack link` (same rules as OliverSpec — **never** from a sub-agent). Exit 9 → chained plain PRs with `--base`

PR title: `<ISSUE-ID>: <short title>` (add `(n/m)` when stacked).

PR body:

```markdown
## Summary
- ...

## Linear
- Fixes <ISSUE-ID>
- Plan: see Linear comment on <ISSUE-ID>

## Stack
- Base: <base branch>
- Layer: <n>/<m> — <layer intent>

## Size gate
- Filtered diff lines vs trunk: <N>
- Single large PR justification: <required when N ≥ 1500 and this is not a split — 2–4 sentences on why it cannot be atomic stacked PRs; omit or "n/a — split" only when layered>

## Acceptance Criteria
- [x] / [ ] from ticket

## Test plan
- [ ] ...
- [ ] Storybook: stories updated + visually verified (frontend only)

## Screenshots
<!-- Required for any frontend/UI change. Embed the actual images in the PR body
     (upload to the PR / paste image bytes so GitHub hosts them on this PR).
     Caption each: story name + state. "n/a — no UI" only when zero frontend diff. -->
```

**After PRs are open — frontend screenshot distribution (parent):**

1. Embed screenshots in each relevant PR description (`## Screenshots`) — images must render in the PR body
2. Post a Linear issue comment that **uploads** the same screenshot files as attachments (Linear file upload / image attach on the comment). **Do not** paste GitHub/user-content URLs as a substitute — Linear must get the binary upload
3. Caption each image with Storybook story id/name + state
4. If stacked, attach screenshots on the layer that introduces the UI (and mention layer in the Linear comment)

Link PRs on the Linear issue. `meta.json` → PR numbers + `status: "prs_open"`.

### 6. Babysit until the stack is mergeable

Loop (do not stop after one cycle):

1. Snapshot every PR: `gh pr view <n> --json statusCheckRollup,reviews,reviewDecision,mergeable,mergeStateStatus,url,title,number,headRefName,baseRefName` + unresolved threads
2. **Ignore** stack merge-readiness / merge-queue-position / “rebase stack” gates as CI failures
3. Fix real CI failures and actionable review comments (prefer 1 PR → 1 sub-agent → 1 worktree). Parent runs all `gh stack rebase|sync|push` serially from the main checkout with fix worktrees removed
4. Re-watch CI until green; re-enter loop on new failures/comments
5. Done when every PR: real CI green, no unresolved actionable threads, `mergeable` / stack is ready to merge bottom-up

Hard blockers → pause and report (permissions, flaky infra outside scope, conflicting human feedback).

### 7. Notify user — **stop for green-light**

When the stack is mergeable, **stop and notify**. Do **not** merge yet.

```
## Factory — ready to merge

**Ticket:** <ISSUE-ID> — <title> (<url>)
**Stack:** #<stack-number> (or chained PRs)
**Plan:** /tmp/factory/<ISSUE-ID>/plan.md (+ Linear comment)

| PR | Base | CI | Reviews |
|----|------|----|---------|
| #n | ... | green | clean |

Reply **merge** (or green-light) and I will merge the stack bottom-up.
```

### 8. Merge (only after explicit user approval)

On green-light (`merge`, `ship it`, `LGTM merge`, etc.):

1. Re-check CI/comments one last time; if anything regressed, return to step 6
2. `gh stack merge` bottom-up (or merge chained PRs bottom-up if stacks unavailable)
3. `gh stack sync --prune` when applicable
4. Move Linear issue to **Done**
5. `meta.json` → `status: "merged"`

```
## Factory Complete

**Ticket:** <ISSUE-ID>
**Merged:** <PR urls>
**Linear:** Done
```

---

## Parent vs sub-agent

| Actor | Does |
|-------|------|
| **Parent** | Preflight, Linear state/comments, model routing, critique loop orchestration, worktree lifecycle, size gate + split, all `gh stack` commands, babysit coordination, user notify, merge |
| **Planner Task** | Code exploration + `plan.md` (+ revisions) |
| **Critic Task** | Blind `critique-N.md` only |
| **Implementer Task** | Code + tests + commits (+ push); no PRs / no `gh stack` unless parent delegated a single-PR `gh pr create` |
| **Fix Tasks** | Per-PR CI/comment fixes in isolated worktrees; push only |

---

## Guardrails

- **One Linear ticket** per factory run — don’t expand into a mini-project of new tickets unless the user asks
- **Plan before code** — no implementer until critique loop settles and the Linear comment is posted
- **Blind critique** — critic never sees planner chain-of-thought; only plan file + ticket
- **TDD** — failing tests + typecheck-clean stubs, then implement backwards
- **GitHub stacks, not Graphite** — `gh stack`; never `gt`
- **Only parent runs `gh stack`**, serially, main checkout, worktrees removed
- **≥1500 filtered lines ⇒ justify in the PR description or split** — no silent monoliths; a large single PR without a Size-gate justification section is not allowed
- **Frontend ⇒ Storybook + screenshots** — every UI change is verified in Storybook; screenshots go in the PR description **and** as **uploaded** attachments on a Linear ticket comment (not GitHub links)
- **Never merge without explicit user green-light** after the mergeable notify
- **Never push to trunk** outside `gh stack merge`
- Factory files stay under `/tmp/factory/...` and `../.factory-worktrees/...`
- Ignore stack merge-readiness gates while babysitting; still require real CI green
