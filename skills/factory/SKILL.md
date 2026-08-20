---
name: factory
description: >
  Autonomous software factory for a single Linear ticket — plan with a smart
  model, blind-critique and refine the plan, comment it on the ticket, implement
  via sub-agent, open atomic stacked PRs, then invoke the standalone babysit
  skill to fix CI/review and merge on user green-light. Use when the user wants
  /factory, factory, or to fully drive one Linear ticket from plan → PRs → merge.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "1.2"
---

Run a **single Linear ticket** end-to-end as an autonomous software factory.

No explore/propose/scope. No project-wide waves. One ticket → plan → critique loop → implement → stack if needed → invoke the standalone `babysit` skill.

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
- Instruction: produce a **concise, executable implementation plan** — not code, not a design essay
- Instruction: **explore the repo first**. Current-state bullets must cite verified paths/modules, not guesses
- The conciseness rules below, plus the full contents of `plan-template.md` from this skill directory (paste that file into the planner prompt)

**Conciseness (hard rules):**

- Target **40–80 lines**. Over ~120 lines is a design doc — cut until it isn't.
- Lists and tables only. Intro is 2–4 sentences. No restating the ticket.
- No code, pseudocode dumps, or file-by-file essays. One line per task; file paths live **only** in TASK rows.
- Do not add a "detailed design" or "Files" section. Mechanism + paths live in the task table.
- Cite ticket ACs (`AC-2`) instead of copying them.
- Omit empty optional sections (Dependencies; mermaid when the change is a single module).
- Identifiers (`REQ-001`, `TASK-001`, …) are declared once as the leading cell / bold prefix; later mentions are references.

**Plan must still cover** (one-liners / tables, not essays):

- **Mermaid diagrams** wherever they clarify (architecture, sequence, state, dependency) — at least one if the change touches >1 module; omit if single-module
- **TDD sequence:** tests first → typecheck-clean stubs → implement to green (encode that order in the task table)
- **Test plan + commands** to run
- If any UI/frontend surface changes: **Storybook** stories to add/update + which states to capture
- **Rollout / migration / feature-flag** notes if relevant
- **Risks, open questions, and explicit "out of scope"**

Follow `plan-template.md` headers exactly. Skip a section only if it would be empty.

Parent reads `plan.md`. Send the planner back **once** only if required coverage is missing (mermaid when >1 module, TDD order, test commands, Storybook on UI, rollout-or-n/a, risks/open questions/out of scope), tasks lack paths, or the file is a prose essay. Do **not** send back to add more detail.

### 2. Blind critique ↔ update loop

Repeat until the critic returns **APPROVED** (no blocking findings) or **3 rounds** complete:

1. **Critic** — fresh `Task` with **critic** model. Blind: give **only** `plan.md` contents + the raw Linear ticket text. No planner chat, no “please be nice.” Ask for:
   - Blocking gaps / wrong assumptions / missing edge cases that would make implementation fail
   - Over-scope or under-scope vs the ticket
   - Unexecutable tasks (no path, vague "implement X")
   - Diagram / sequencing issues (missing mermaid when the change touches >1 module)
   - Test-plan holes (missing command or AC untested)
   - Missing Storybook stories/states when the plan touches UI; missing rollout/migration/flag notes when relevant
   - Verdict: `APPROVED` | `REVISE` with a numbered change list
   - **Do not** request more prose or a deeper design writeup. Concise + executable is the bar. A plan that follows the template and covers the required items above is `APPROVED` even if short.
   - Write `/tmp/factory/<ISSUE-ID>/critique-<N>.md`
2. If `REVISE`: **Planner** (same planner model) updates `plan.md` addressing every numbered item **without adding length**. Prefer replacing a vague line over appending a new section. Do not dilute the critique.
3. If round 3 still `REVISE`: fold remaining blocking items into the plan as explicit risks / AC, and proceed (note them in the Linear comment).

### 3. Comment the plan on the Linear ticket

Post **one** comment on the issue with the **full** settled `plan.md` body. Prefer Linear’s issue comment API (`save_comment` / equivalent). If the body exceeds Linear limits, split into threaded comments labeled `Plan (1/N)`… and keep the files in `/tmp/factory/...` as source of truth.

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

### 6. Invoke the standalone Babysit skill

Load and execute the sibling `babysit` skill for this issue immediately after the PRs are open. This is an automatic continuation of Factory, not a suggestion for the user to run another command.

Pass it:

- The Linear issue ID and already-loaded issue context
- `/tmp/factory/<ISSUE-ID>/meta.json`
- The PR numbers / stack identity and current checkout details
- Any known CI, screenshot, or residual-risk context

Do not duplicate Babysit's loop or merge rules here. Babysit owns status snapshots, per-layer CI/review fixes, waiting for real CI, the mergeable notification, the explicit user green-light boundary, bottom-up merge, and moving Linear to Done.

If the `babysit` skill is unavailable, stop after opening/linking PRs and tell the user to install it with:

```bash
npx skills add chroline/oliver/skills/babysit
```

---

## Parent vs sub-agent

| Actor | Does |
|-------|------|
| **Parent** | Preflight, Linear state/comments, model routing, critique loop orchestration, worktree lifecycle, size gate + split, PR creation/linking, invoke `babysit` |
| **Planner Task** | Code exploration + `plan.md` (+ revisions) |
| **Critic Task** | Blind `critique-N.md` only |
| **Implementer Task** | Code + tests + commits (+ push); no PRs / no `gh stack` unless parent delegated a single-PR `gh pr create` |
| **Fix Tasks** | Per-PR CI/comment fixes in isolated worktrees; push only |

---

## Guardrails

- **One Linear ticket** per factory run — don’t expand into a mini-project of new tickets unless the user asks
- **Plan before code** — no implementer until critique loop settles and the Linear comment is posted
- **Plans are checklists, not design docs** — template + ~80 lines; critic may not demand more prose
- **Blind critique** — critic never sees planner chain-of-thought; only plan file + ticket
- **TDD** — failing tests + typecheck-clean stubs, then implement backwards
- **GitHub stacks, not Graphite** — `gh stack`; never `gt`
- **Only parent runs `gh stack`**, serially, main checkout, worktrees removed
- **≥1500 filtered lines ⇒ justify in the PR description or split** — no silent monoliths; a large single PR without a Size-gate justification section is not allowed
- **Frontend ⇒ Storybook + screenshots** — every UI change is verified in Storybook; screenshots go in the PR description **and** as **uploaded** attachments on a Linear ticket comment (not GitHub links)
- **Babysit is mandatory after PR creation** — invoke the standalone skill automatically; do not inline its workflow
- **Never merge without explicit user green-light** after Babysit's mergeable notification
- **Never push to trunk** outside Babysit's bottom-up merge
- Factory files stay under `/tmp/factory/...` and `../.factory-worktrees/...`
