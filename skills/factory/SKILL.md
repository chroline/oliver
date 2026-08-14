---
name: factory
description: >
  Autonomous software factory for a single Linear ticket — plan with a smart
  model, blind-critique and refine the plan, comment it on the ticket, implement
  via sub-agent, open atomic stacked PRs, invoke the babysit skill until
  mergeable, then merge on user green-light. Use when the user wants /factory,
  factory, or to fully drive one Linear ticket from plan → PRs → merge.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "1.3"
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
  proof/e2e.md      # end-to-end proof log only (commands, expected vs actual, pass/fail)
  screenshots/      # all UI media: png/webp screenshots and/or mp4/webm recordings
```

Also create a sibling worktree root **outside** the repo:

```text
../.factory-worktrees/<ISSUE-ID>/
```

Never commit factory artifacts into the git repo.

**Parent proof gate (before any PR):** read `proof/e2e.md` — must exist and pass. If the diff touches UI/frontend, also require ≥1 file under `screenshots/`. Missing or failing → send implementer back; do not open PRs.

---

## PR readiness gate (canonical)

Apply this gate whenever factory opens or hands off PRs. Do not restate the full procedure elsewhere — back-reference this section.

1. Open with `gh pr create` **without** `--draft`. Do **not** use `gh stack submit` (opens drafts and drops the body)
2. Confirm `isDraft == false` via `gh pr view <n> --json isDraft`
3. If draft: `gh pr ready <n>` until ready
4. Set `meta.json` → `status: "prs_open"` only after every factory PR passes this gate
5. **Do not** invoke `babysit` / watch CI while any factory PR is still draft

---

## Steps

### 0. Preflight (fail fast)

```bash
gh --version                      # need 2.90.0+
gh auth status
gh extension install github/gh-stack   # no-op if present
gh stack view --short 2>/dev/null      # exit 9 = stacks not enabled → chained plain PRs
mkdir -p "/tmp/factory/<ISSUE-ID>/proof" "/tmp/factory/<ISSUE-ID>/screenshots"
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
9. If any UI/frontend surface changes: Storybook stories to add/update + which states to capture under `screenshots/`
10. Rollout / migration / feature-flag notes if relevant
11. Risks, open questions, and explicit "out of scope"
12. PR split proposal (atomic layers) — even if likely one PR
13. **E2E proof approach** — commands/environment/expected outcomes for `proof/e2e.md` (and which UI flows to capture in `screenshots/` when applicable)

Parent reads `plan.md`. If thin or missing diagrams where needed, send the planner back once with concrete gaps.

### 2. Blind critique ↔ update loop

Repeat until the critic returns **APPROVED** (no blocking findings) or **3 rounds** complete:

1. **Critic** — fresh `Task` with **critic** model. Blind: give **only** `plan.md` contents + the raw Linear ticket text. No planner chat, no “please be nice.” Ask for:
   - Blocking gaps / wrong assumptions / missing edge cases
   - Over-scope or under-scope vs the ticket
   - Diagram / sequencing issues
   - Test-plan + e2e-proof holes
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
- **Prove end-to-end before any PR (mandatory):** after tests are green, run the plan’s e2e proof approach. Write `/tmp/factory/<ISSUE-ID>/proof/e2e.md` with: what you ran, expected vs actual, pass/fail. **No PR until this file exists and passes.**
- **Frontend / UI changes (mandatory when applicable):**
  1. Verify in Storybook — add or update stories for every changed component/state
  2. Capture **screenshots and/or a short screen recording** of the feature (default + key variants; empty/loading/error if touched). Prefer a recording for interactive flows
  3. Save **all** UI media under `/tmp/factory/<ISSUE-ID>/screenshots/` (`button-default.png`, `checkout-flow.mp4`, etc.) — never under `proof/`
  4. Incomplete without Storybook verification **and** ≥1 file in `screenshots/`
- Do **not** open PRs yet; do **not** run `gh stack`
- Commit on the branch; push when implementation + tests + e2e proof are green
- Return: files changed, test summary, proof path, residual risks, approximate diffstat, screenshot/recording paths (if any)

Parent applies the **Parent proof gate** (Artifacts). Parent removes nothing yet — needs the branch for size check / possible split.

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
3. Each layer: own branch, own commits, own PR via `gh pr create --base <parent-branch>` (see **PR readiness gate**)
4. Parent only: `gh stack init` / `gh stack link` (same rules as OliverSpec — **never** from a sub-agent). Exit 9 → chained plain PRs with `--base`

After every `gh pr create`, run the **PR readiness gate**. Then continue.

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

## E2E proof
- Proof log: /tmp/factory/<ISSUE-ID>/proof/e2e.md (summarize commands + result here)
- [ ] Exercised end-to-end before opening this PR

## Test plan
- [ ] ...
- [ ] Storybook: stories updated + visually verified (frontend only)

## Screenshots / recordings
<!-- Required for any frontend/UI change. Embed screenshots and/or a short screen
     recording in the PR body (upload so GitHub hosts them on this PR).
     Caption each: story/feature + state. "n/a — no UI" only when zero frontend diff. -->
```

**After PRs are open — frontend proof distribution (parent):**

1. Embed media from `screenshots/` in each relevant PR description (`## Screenshots / recordings`)
2. Post a Linear issue comment that **uploads** the same files as attachments (not GitHub URLs)
3. Caption each with Storybook story id/name + state (or feature flow name for recordings)
4. If stacked, attach media on the layer that introduces the UI (and mention layer in the Linear comment)

Link PRs on the Linear issue. `meta.json` status follows the **PR readiness gate**.

### 6. Babysit until the stack is mergeable

**Delegate to the `babysit` skill** (`skills/babysit/SKILL.md` — installable / callable on its own as `/babysit`).

Pass the factory PR set (stack number and/or PR numbers from `meta.json`, plus Linear issue ID). Ensure the **PR readiness gate** already passed, then follow `babysit` end-to-end (CI + threads; no merge).

Hard blockers → pause and report (same as `babysit`). When babysit completes, continue to step 7.

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

1. Re-check CI/comments one last time; if anything regressed, re-enter step 6 (`babysit`)
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
| **Parent** | Preflight, Linear state/comments, model routing, critique loop, proof gate, PR readiness gate, size gate + split, all `gh stack`, invoke `babysit`, notify, merge |
| **Planner Task** | Code exploration + `plan.md` (+ revisions), including e2e proof approach |
| **Critic Task** | Blind `critique-N.md` only |
| **Implementer Task** | Code + tests + `proof/e2e.md` (+ `screenshots/` if UI) + commits/push; no PRs / no `gh stack` unless parent delegated a single-PR `gh pr create` under the PR readiness gate |
| **Babysit** | Own skill (`babysit`) — CI/comment loop for the factory PR set; no merge |
| **Fix Tasks** | Per-PR CI/comment fixes in isolated worktrees; push only (spawned by `babysit`) |

---

## Guardrails

- **One Linear ticket** per factory run — don’t expand into a mini-project of new tickets unless the user asks
- **Plan before code** — no implementer until critique loop settles and the Linear comment is posted
- **Blind critique** — critic never sees planner chain-of-thought; only plan file + ticket
- **TDD** — failing tests + typecheck-clean stubs, then implement backwards
- **E2E proof before PR** — Parent proof gate: `proof/e2e.md` must pass; UI diffs also need `screenshots/`
- **GitHub stacks, not Graphite** — `gh stack`; never `gt`
- **Only parent runs `gh stack`**, serially, main checkout, worktrees removed
- **PR readiness gate** — single source of truth above; never open or babysit drafts
- **Watch phase = `babysit` skill** — do not re-implement the CI/comment loop inline; load and follow `babysit` (also callable alone as `/babysit`)
- **≥1500 filtered lines ⇒ justify in the PR description or split** — no silent monoliths; a large single PR without a Size-gate justification section is not allowed
- **Frontend ⇒ Storybook + `screenshots/`** — every UI change verified in Storybook; media in the PR body **and** uploaded on a Linear comment (not GitHub links)
- **Never merge without explicit user green-light** after the mergeable notify
- **Never push to trunk** outside `gh stack merge`
- Factory files stay under `/tmp/factory/...` and `../.factory-worktrees/...`
