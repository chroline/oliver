---
name: oliverspec-factory
description: >
  Autonomous software factory for one unit of work — a Linear ticket or any
  plain user request (Linear is optional) — ask
  the human every open design question up front, plan with the smartest model,
  critique the plan against the original requirements, implement with a
  sub-agent, critique the implementation against the acceptance criteria, run the repo's code
  review loop, open a PR, fix CI until green, then merge. Use when the user
  wants /oliverspec-factory, oliverspec-factory, /factory, or factory, or to
  fully drive one ticket or request from plan → PR → merge.
disable-model-invocation: true
license: MIT
metadata:
  author: chroline
  version: "2.3"
---

Run **one unit of work** end-to-end as an autonomous software factory. It can be a Linear ticket or a plain user request; **Linear is optional.** Without a ticket, skip every step marked "Linear ticket:" and use a short slug as `<ID>`.

One unit of work → questions → plan ↔ critique → implement ↔ critique → code review → PR → CI → merge.

Announce: `Factory: <ID> — <title>`.

---

## Input

- A free-form user request (no ticket needed), **or** a Linear **issue ID** (e.g. `LEM-123`)
- Optional overrides: model picks, skip-merge (stop when CI is green)

If neither is given, ask once, then start.

The **original requirements** are the ticket (title, description, acceptance criteria, comments) or the user's request verbatim, plus the human's answers from step 1. Every critique compares against these. Never paraphrase them when passing them to a critic; paste them.

---

## Model routing

Pick models **once at the start** from whatever the harness advertises. Use the newest model in each family.

| Role | Use | Fallback |
|------|-----|----------|
| **Planner** | Opus or Sol | the smartest model available |
| **Plan critic** | any capable model; a fresh agent each round | — |
| **Implementer** | Sonnet or Terra | the smartest model available |
| **Implementation critic** | the implementer's model | — |
| **Code reviewer** | whatever the repo's review process specifies | a fresh code-review agent on a capable model |

Record the choices in `meta.json`. Pass the model explicitly on every sub-agent launch; do not rely on inherit.

---

## Artifacts

```text
/tmp/oliverspec-factory/<ID>/      # <ID> = Linear issue ID, or a short slug for a request
  requirements.md   # original requirements, verbatim
  decisions.md      # every open question and the human's answer
  plan.md           # living plan
  plan-critique-N.md
  impl-critique-N.md
  review-N.md       # code review findings + how each was addressed
  meta.json         # models, ticket url, branch, PR number, status
  proof/e2e.md      # end-to-end proof log: commands, expected vs actual, pass/fail
  screenshots/      # all UI media: png/webp screenshots and/or mp4/webm recordings
```

Worktree root **outside** the repo: `../.factory-worktrees/<ID>/`.

Never commit factory artifacts into the git repo.

---

## Steps

### 0. Preflight

```bash
gh auth status
mkdir -p "/tmp/oliverspec-factory/<ID>/proof" "/tmp/oliverspec-factory/<ID>/screenshots"
```

- Read the repo's agent instructions (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, or equivalent). Note its rules for tickets, branches, code review, PRs, and merging. Repo rules override this skill where they conflict.
- Linear ticket: discover the Linear tool schemas, load the issue with relations and comments, and mark it **In Progress**.
- Write `requirements.md` (verbatim) and `meta.json`.

### 1. Ask every open question (human makes all design decisions)

Before any planning, the parent explores the repo enough to find every open question in the requirements:

- Ambiguous or missing behavior, edge cases, and error handling
- Design choices with more than one reasonable answer (data model, API shape, where logic lives, naming that is visible to users, UX)
- Scope boundaries, rollout, migrations, feature flags, compatibility
- Anything the requirements contradict or leave implicit

Ask the human **all** of them in one batch, using the harness's question tool when one exists. For each question, give the options you found and a recommendation. Do not proceed until every question is answered. Write the questions and answers to `decisions.md`.

No agent makes a design decision. The planner, critics, and implementer apply `decisions.md`; they do not extend it. If a later step surfaces a design question that `decisions.md` does not answer, **stop and ask the human**, append the answer to `decisions.md`, then continue.

### 2. Plan (planner sub-agent)

Launch a sub-agent on the **planner** model. Its prompt includes:

- `requirements.md` and `decisions.md`, verbatim
- Repo pointers the parent already knows (paths, conventions), as facts and not a solution
- The absolute path to `plan.md`
- The full contents of `plan-template.md` from this skill directory
- Instructions: explore the repo first, cite only verified paths, and produce a **concise, executable** plan, not code and not a design essay

**Conciseness rules:**

- Aim for 40–80 lines. Over ~120 lines is a design doc; cut it.
- Lists and tables only. A 2–4 sentence intro. Do not restate the requirements; cite them (`AC-2`, `DEC-3`).
- One line per task. File paths appear only in task rows.
- Omit empty optional sections.

**The plan must cover:**

- A Mermaid diagram when the change touches more than one module
- Test-first order: failing tests → typecheck-clean stubs → implement to green
- Test commands
- **E2E proof approach**: the commands, environment, and expected outcomes that prove the change works end to end (for `proof/e2e.md`), and which UI flows to capture in `screenshots/`
- Storybook stories and states for any UI change
- Rollout, migration, or feature-flag notes, or `n/a`
- Risks and out-of-scope items

### 3. Plan critique loop

Repeat until the critic returns **APPROVED** or 3 rounds complete:

1. **Critic**: a fresh sub-agent. Give it only `requirements.md`, `decisions.md`, and `plan.md`. No planner conversation. It checks the plan **against the original requirements**:
   - Every requirement and acceptance criterion maps to at least one task and one test. List any that do not.
   - Every decision in `decisions.md` is applied as written.
   - Anything in the plan that the requirements did not ask for (over-scope)
   - Wrong assumptions about the code, unexecutable tasks (no path, vague "implement X"), ordering problems
   - Test-plan and e2e-proof holes, missing Storybook coverage for UI, missing rollout notes
   - Any design question the plan answers on its own that `decisions.md` does not cover
   - Verdict: `APPROVED` or `REVISE` with a numbered list. It must not ask for more prose.
   - It writes `plan-critique-<N>.md`.
2. If the critique names an unanswered design question, ask the human (step 1 rule) before revising.
3. If `REVISE`: the planner updates `plan.md` to address every item without making it longer.
4. If round 3 is still `REVISE`: show the human the remaining items and ask how to proceed.

Linear ticket: post the settled `plan.md` as one comment on the issue (split into `Plan (1/N)` comments if it exceeds limits).

### 4. Implement (implementer sub-agent)

Create an isolated worktree on the branch the repo's rules call for: the Linear issue's git branch when there is a ticket, otherwise a short descriptive branch from the slug (unless the repo requires a ticket, in which case follow its rules):

```bash
git fetch origin
git worktree add "../.factory-worktrees/<ID>" -b <branch> origin/<trunk>
```

Launch a sub-agent on the **implementer** model. Contract:

- Work only in that worktree
- Follow `plan.md`, `requirements.md`, and `decisions.md`; work test-first
- **Prove it end to end (mandatory):** after tests pass, run the plan's e2e proof approach against the real running code. Write `proof/e2e.md`: what you ran, expected vs actual, pass/fail.
- **Frontend changes (mandatory when applicable):**
  1. Add or update Storybook stories for every changed component and state, and run Storybook
  2. Capture screenshots and/or a short screen recording (default + key variants; empty/loading/error if touched). Prefer a recording for interactive flows
  3. Save all UI media under `screenshots/` with stable names (`button-default.png`, `checkout-flow.mp4`), never under `proof/`
- Commit on the branch. Do not open a PR.
- Return files changed, test results, the proof path, screenshot/recording paths, and residual risks

### 5. Implementation critique loop

Repeat until the critic returns **APPROVED** or 3 rounds complete:

1. **Critic**: a fresh sub-agent on the **implementer's model**. Give it `requirements.md`, `decisions.md`, `plan.md`, the worktree path, and the diff against trunk. It checks the implementation **against the acceptance criteria**:
   - **Original acceptance criteria first.** Take them from `requirements.md`: the ticket's acceptance criteria, or, for a user request (or a ticket without explicit criteria), each behavior the original message or ticket asks for. Mark each done, partial, or missing, with file and test evidence. These are the source of truth; a plan item that drops or weakens one does not excuse it.
   - **Then the plan's criteria.** Each `REQ`, `CON`, `TASK`, and `TEST` item: done, partial, or missing, with file evidence
   - Any conflict between the plan and the original criteria (flag it; if it is a design question, the parent asks the human)
   - Each decision applied as written
   - Behavior or files the plan did not call for
   - Tests that exist but do not prove the requirement, and commands that do not pass (it runs them)
   - `proof/e2e.md` missing, failing, or not actually exercising the change end to end; UI diffs with nothing in `screenshots/`
   - Verdict: `APPROVED` or `REVISE` with a numbered list
   - It writes `impl-critique-<N>.md`.
2. If `REVISE`: send the list to the implementer (same model, same worktree) to fix and commit.
3. If round 3 is still `REVISE`: show the human the remaining items and ask how to proceed.

**Proof gate (parent):** before moving on, read `proof/e2e.md` yourself. It must exist and pass. If the diff touches UI, `screenshots/` must hold at least one file. Otherwise send the implementer back.

### 6. Code review loop

Find the repo's review process in its agent instructions (for example, a review skill it requires before a PR). If it defines one, follow it exactly, including how to launch the reviewer and what to pass on later rounds. If it defines none, launch a fresh code-review sub-agent that reviews the worktree diff against trunk for correctness, security, error handling, tests, and repo conventions, and returns findings without editing files.

Loop:

1. Run the review. Write findings to `review-<N>.md`.
2. Fix every blocking finding through the implementer (same worktree). Record how each finding was addressed or why it was not.
3. Re-run the review after any change to the diff, passing earlier findings and their dispositions if the repo's process asks for that.
4. Stop when the review returns no blocking findings. If findings raise a design question, ask the human first.

### 7. Open the PR

Only after the code review loop is clean and the proof gate still passes (re-run the proof if review fixes changed behavior):

- Push the branch and open one **ready** PR with `gh pr create`, without `--draft`, following the repo's title and body rules.
- Confirm it is not a draft: `gh pr view <PR> --json isDraft`. If it is, run `gh pr ready <PR>`. Do not start the CI loop on a draft.
- Default title: `<ID>: <short title>` with a ticket; just `<short title>` without one.
- Default body: Summary, Linear link (`Fixes <ID>`, ticket only), acceptance criteria checklist, test plan, **E2E proof** (summary of `proof/e2e.md`: commands and result), and **Screenshots / recordings** for any UI change (embedded so they render, each captioned with story or flow + state). Add any sections the repo requires.
- Linear ticket: link the PR and upload the same screenshots/recordings to an issue comment as attachments (not GitHub links).
- `meta.json` → PR number, `status: "pr_open"`.

### 8. CI loop

```bash
gh pr checks <PR> --watch --fail-fast
```

- Wait for real CI. Do not treat queued or pending checks as passing.
- On failure: read the failing job's logs (`gh run view <run-id> --log-failed`), find the root cause, fix it through the implementer in the worktree, and push.
- If the fix changes the diff and the repo's review process requires a re-review, run step 6 again before pushing.
- Repeat until every required check passes. Address any review comments that arrive on the PR the same way.
- Never skip, disable, or weaken a check or test to get green. If a failure is unrelated to the change (flaky or broken on trunk), re-run it once; if it still fails, tell the human.

### 9. Merge

When every required check is green:

- Merge with the repo's merge method (`gh pr merge <PR> --squash --delete-branch` if the repo states none).
- Never use `--admin` or bypass branch protection. If the merge is blocked (required approvals, merge queue), report it and stop.
- Linear ticket: move it to **Done**.
- Remove the worktree: `git worktree remove "../.factory-worktrees/<ID>"`.
- `meta.json` → `status: "merged"`.

With `skip-merge`, stop after step 8 and report the PR as ready.

---

## Parent vs sub-agent

| Actor | Does |
|-------|------|
| **Parent** | Preflight, questions to the human, model routing, every loop, proof gate, worktree lifecycle, Linear updates, PR creation, CI watching, merge |
| **Planner** | Repo exploration and `plan.md` revisions |
| **Plan critic** | `plan-critique-N.md` only |
| **Implementer** | Code, tests, `proof/e2e.md`, UI media, commits, and fixes from critiques, reviews, and CI |
| **Implementation critic** | `impl-critique-N.md` only; runs tests, edits nothing |
| **Code reviewer** | Findings only; edits nothing |

---

## Guardrails

- **One ticket or request per run.** Do not expand it into new tickets unless the human asks.
- **The human makes every design decision.** Ask all open questions before the plan loop; stop and ask if a new one appears later.
- **Critics compare against the source.** The plan critic checks the original requirements; the implementation critic checks the original acceptance criteria (from the ticket or user message) and the plan's criteria, with the original winning.
- **Order is fixed:** questions → plan loop → implement → implementation loop → proof gate → code review loop → PR → CI loop → merge. No PR before the review is clean.
- **Test-first:** failing tests and typecheck-clean stubs, then implement to green.
- **Prove it end to end before the PR.** `proof/e2e.md` must exist and pass.
- **Ready PRs only.** Never open a draft or watch CI on one.
- **Frontend ⇒ Storybook + screenshots and/or recordings**, in the PR body (and uploaded to the Linear ticket when there is one).
- **Linear is optional.** Every Linear step applies only when the run started from a ticket.
- **Repo rules win** over this skill where they conflict.
- **Never bypass CI or branch protection** to merge.
- Factory files stay under `/tmp/oliverspec-factory/...` and `../.factory-worktrees/...`.
