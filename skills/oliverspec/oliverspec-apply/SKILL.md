---
name: oliverspec-apply
description: >
  Implement an OliverSpec Linear project end-to-end — work all tickets in one go,
  aggressively launching sub-agents in parallel, and open one Graphite-stacked PR
  per ticket. Use when the user wants to apply, implement, /oliverspec apply, or
  oliverspec-apply for a Linear-proposed project.
license: MIT
metadata:
  author: oliverspec
  version: "1.0"
---

Implement an entire OliverSpec project from Linear in **one session**.

There is **no apply gate**: do not wait for PR review or merge between tickets. Drive the whole project to "PRs opened" in one go, **aggressively launch sub-agents in parallel**, and publish **one Graphite-stacked PR per ticket**.

**Parallelism is mandatory, not optional.** Do not implement tickets yourself serially. Do not start one sub-agent, wait for it to finish, then start the next when others could run concurrently. In a single turn, fire **multiple `Task` tool calls together** — one per ready ticket — and keep the pipeline saturated.

**PRs must be stacked with Graphite** (`gt`) — not opened as independent `gh pr create` PRs against trunk (unless a ticket truly has no parent in the stack). Dependent tickets become upstack PRs on their Linear `blockedBy` parents.

---

## Input

- Linear **project name** (or infer from conversation)
- Optional: subset of ticket IDs (default = all unfinished tickets in the project)

If ambiguous, `list_projects` / ask which project. Announce: `Applying OliverSpec project: <name>`.

---

## Steps

### 1. Load the project plan from Linear

1. Read Linear MCP tool schemas before calling tools
2. Resolve the project (`list_projects` / `get_project`)
3. Load the PRD and TRD (`list_documents` + `get_document`) — treat them as source of truth for intent/design
4. Load tickets (`list_issues` with `project`); for dependency edges use `get_issue` with `includeRelations: true`
5. If there are no tickets, stop and tell the user to run `oliverspec-scope` (after `oliverspec-propose` if PRD/TRD are also missing)
6. Build the dependency graph from Linear’s native `blockedBy` / `blocks` relations only — ignore dependency prose in descriptions if it conflicts; if relations are missing but the docs/graph imply them, stop and tell the user to re-run `oliverspec-scope` to wire relations

Show a short plan:

- Ticket order / parallel waves
- Which tickets get which sub-agents
- Branch names (from each Linear issue’s git branch name)

Then **start immediately** — do not wait for per-ticket approval unless the user asked to confirm first.

### 2. Execution model (aggressive **parallel** sub-agents)

**Goal:** finish the whole project in one apply run by maximizing concurrent sub-agents.

**Mapping rules:**
- **1 ticket → 1 sub-agent** by default. Do not assign a whole wave (or multiple tickets) to a single sub-agent — that usually defeats the point of sub-agents
- **1 ticket → 1 git worktree** — every ticket sub-agent must work in its **own** worktree (never the parent’s checkout). Parallel agents sharing one working tree cause overlapping dirty state and false conflicts
- **1 wave → N sub-agents in parallel** where N = number of ready tickets in that wave. A wave is a dependency batching boundary, not a unit of work for one agent
- Multiple waves over the session are expected. A wave may legitimately contain only one ticket when the graph has a single unlock (e.g. everything waits on one parent) — that is fine; still give that ticket its own agent **and** worktree, then fan out the next wave in parallel once it lands
- Collapsing several tickets into one agent is **highly discouraged**, not banned — only do it when parallelism is clearly wasteful or harmful (e.g. unavoidable same-file thrash with no clean split), and say why

1. Partition tickets into waves by dependencies (wave 1 = no blockers, wave 2 = blocked only by wave 1, etc.)
2. **Before launching a wave:** for each ticket in the wave, mark it **In Progress** in Linear (`save_issue` with `state: "In Progress"` — or the team’s equivalent started state from `list_issue_statuses` if the name differs). Do this as soon as you pick the ticket up, before/as you dispatch its sub-agent — not after the PR exists
3. **For every wave: launch one Task sub-agent per ticket, all in the same message** when N > 1 — true parallelism via multiple concurrent `Task` calls. Default bias: **max parallel fan-out** across that wave’s tickets. Prefer `subagent_type: "best-of-n-runner"` when available (isolated worktree built-in); otherwise `generalPurpose` / `shell` with an explicit worktree path the parent created
4. Independent stacks/chains in the same wave all run concurrently (separate agents + separate worktrees). For a linear chain `A blocks B`, B’s agent starts in the next wave as soon as A’s branch exists — still as **its own** agent/worktree unless you’ve explicitly justified collapsing
5. Do **not** pause for merge/review between waves. As soon as a wave’s agents finish (branches + stacked PRs exist), immediately launch the next wave’s parallel set of ticket agents (or the single unlocked ticket, then the wider fan-out after that)
6. For dependent tickets, stack with Graphite on the parent ticket’s branch — `gt create <linear-branch-name> --onto <parent-linear-branch>` (or checkout parent then `gt create`), then `gt submit` — never wait for merge and never open a free-floating PR against trunk for a blocked ticket
7. Parent agent coordinates only: set In Progress on pickup, create/assign worktrees, dispatch the parallel Task batch per wave, Graphite restacks (`gt restack`) when parents move, conflict resolution (see restack-conflict-resolution skill), PR linking, Linear status updates, worktree cleanup — **parent does not implement ticket bodies by default**

**Worktrees (required for parallel apply):**
- Parent (or each agent at start) creates a dedicated worktree per ticket, e.g. `git worktree add <repo>/.worktrees/<issue-id> -b <linear-branch-name> <base-ref>` (or `git worktree add … <existing-linear-branch>` when the branch already exists)
- Put worktrees outside the main checkout’s dirty path (commonly `<repo>/.worktrees/…` or a sibling directory). Add `.worktrees/` to local ignore if needed; don’t commit worktree contents
- Each agent’s cwd **must** be its worktree. Never `cd` back to the parent checkout to edit application files
- After PR submit (or on failure), remove the worktree: `git worktree remove <path>` (parent may batch-clean)

Use `Task` with `subagent_type: "best-of-n-runner"` when the environment supports isolated worktrees; otherwise `generalPurpose` (or `shell` for narrow git/`gt` ops) **with the worktree path in the prompt**.

**Discouraged (avoid unless justified):**
- One sub-agent owning multiple tickets / an entire wave when those tickets could be separate agents
- Implementing ticket bodies yourself instead of dispatching agents
- Running same-wave ticket agents strictly sequentially “to be safe” when they could run in parallel
- Waiting for one PR’s CI/review before launching the rest of a ready wave
- Two agents editing the **same** worktree / checkout

**Not an anti-pattern:** a wave with N=1 because the dependency graph only unlocked one ticket — run that one agent, then parallelize the following wave hard.

If two tickets in the same wave will hard-conflict on the same files, prefer separate agents staggered/sequenced for those two only; keep every other ready ticket’s agent running in parallel; keep Graphite stack topology intact. Merging those two into one agent is a last resort — call it out.

### 3. Per-ticket sub-agent contract

Each ticket agent receives a self-contained prompt including:

- Issue id + title + full description (scope + acceptance criteria)
- Relevant PRD + TRD excerpts
- Repo constraints / pointers to touch points discovered by the parent
- Base branch / Graphite parent: trunk for roots; otherwise the parent ticket’s Linear branch (downstack)
- The Linear issue’s **git branch name** (from `get_issue` — required; do not invent a different name)
- **Worktree path** (absolute) where all git/`gt`/file edits must happen — required; do not use the parent checkout
- Required outputs: worktree path used, branch name used, Graphite PR URL, stack position (parent/children), summary of files changed, AC checklist result, **test summary** (what was added/updated; commands run)

**Branch naming:** use the Linear ticket’s git branch name exactly (returned by `get_issue`). Never invent `oliverspec/...` or other custom branch names.  
**Worktrees:** one isolated worktree per ticket agent — no shared working directories across parallel agents.  
**TDD required:** implement each ticket test-first. Tests must be comprehensive enough to lock a full implementation of that ticket’s scope (not a token smoke test).  
**PR stacking:** Graphite only — create/submit with `gt`, not standalone `gh pr create` for stack members.  
PR title: `<ISSUE-ID>: <ticket title>`  
PR body must include:

```markdown
## Summary
- ...

## Linear
- Fixes <ISSUE-ID> (or Links <ISSUE-ID>)
- Project: <project name>
- PRD: <url>
- TRD: <url>

## Acceptance Criteria
- [x] / [ ] copied from the ticket (including TDD / comprehensive test ACs)

## Test plan
- [ ] TDD: tests landed first (or in the same PR with clear red→green history)
- [ ] Comprehensive coverage for this ticket’s scope (happy path, edges, failures)
- [ ] <commands run, e.g. pnpm --filter … test>
```

Agent responsibilities:

1. Confirm the issue is **In Progress** (if the parent hasn’t already: `save_issue` `id` + `state: "In Progress"`). Enter the assigned **worktree** (create it if the parent didn’t: `git worktree add …` for the Linear branch / base). All subsequent commands run with cwd = that worktree
2. `get_issue` for the ticket; create/checkout the issue’s Linear git branch via **Graphite** inside the worktree:
   - Root ticket (no `blockedBy`): `gt create <linear-branch-name>` from trunk (or ensure branch exists and is tracked in the stack)
   - Dependent ticket: stack on parent with `gt create <linear-branch-name> --onto <parent-linear-branch>` (branch name must match Linear)
3. **TDD — write tests first** for the acceptance criteria (failing/red), then implement until green. Expand tests until they comprehensively cover this ticket’s full scope: happy path, edge cases, and failure modes from the AC/TRD. Do not ship implementation with missing or token-only tests
4. Implement until acceptance criteria are met (or clearly blocked), keeping tests as the source of truth for done
5. Run the relevant automated tests (and typecheck/lint when practical) and fix failures before submit
6. Commit onto that branch (`gt modify -am "..."` or commit then ensure Graphite metadata is intact). Prefer commit history that reflects red→green when practical (tests commit, then implementation), or one PR that clearly includes comprehensive tests
7. Submit the stack with Graphite: `gt submit --no-edit` (use `--stack` / submit downstack as needed so parents exist on the remote). Do **not** use `gh pr create` for these PRs unless Graphite submit is unavailable — then say so explicitly
8. Return PR URL + stack parent + worktree path + test summary + residual risks (parent removes the worktree unless you already did)
Parent responsibilities:

**On pickup (when dispatching an agent for a ticket):**
1. Mark the issue **In Progress** via `save_issue` (`state: "In Progress"` or team equivalent)
2. Ensure a dedicated worktree exists (or instruct `best-of-n-runner` / the agent to create one) and pass its absolute path in the Task prompt

**After each agent returns:**
1. Attach PR to the Linear issue (`save_issue` `links: [{ url, title }]`)
2. Move issue to an appropriate next state (e.g. In Review) if statuses allow
3. `gt restack` / fix stack gaps if children were submitted before parents settled
4. `git worktree remove` (and prune) for that ticket’s worktree when safe
5. Record progress in the session summary

### 4. Keep going until the project is done

Loop until every in-scope ticket has a PR (or a hard blocker):

- No stopping after the first ticket
- No "should I continue?" between waves unless blocked
- Always prefer launching the next batch of ready tickets as **parallel** Task calls in one turn
- On agent failure: retry once with a tighter prompt **in parallel with other work**, then escalate that ticket in the final report while continuing others

### 5. Final summary

```
## OliverSpec Apply Complete

**Project:** <name> (<url>)
**PRD:** <url>
**TRD:** <url>

| Ticket | Title | PR | Status |
|--------|-------|----|--------|
| LEM-123 | ... | url | opened / blocked |

### Blockers
- ...

### Suggested next steps
- Run `oliverspec-babysit` to clear PR comments + CI across the stack (ignores Graphite mergeability)
- Review/merge the Graphite stack in dependency order (downstack first)
- `gt restack` / re-submit if trunk moved
- Re-run apply for any blocked tickets after resolving blockers
```

---

## Guardrails

- **Linear is the plan** — don't invent tickets; implement what's in the project
- **One PR per ticket** — no bundling multiple tickets into one PR
- **Graphite stacks required** — dependent PRs are stacked with `gt create` / `gt submit`; do not open independent trunk PRs for blocked tickets
- **Branch names from Linear** — always use the issue’s git branch name from `get_issue`
- **No apply gate** — don't wait for review/merge to continue the project
- **Mark In Progress on pickup** — set Linear state when work starts (before/as the sub-agent is dispatched), not only when the PR is opened
- **One worktree per sub-agent** — parallel ticket agents never share a checkout; prefer `best-of-n-runner` or explicit `git worktree add`
- **TDD required** — tests first; comprehensive automated tests for each ticket’s full scope before calling the PR done
- **Parallel sub-agents by default** — parent only coordinates; prefer **1 ticket = 1 sub-agent**; each wave fans out N agents in one turn when N > 1; collapsing multiple tickets into one agent is highly discouraged (justify if you do). A single-ticket wave from real dependencies is fine
- **Stack, don't stall** — dependent work is Graphite-upstack of parent branches
- Keep changes scoped to each ticket's acceptance criteria
- Never push to `main`/`master`; always feature branches + Graphite PRs
- Don't create new Linear tickets during apply unless the user asks
- If the project has no PRD/TRD, stop and tell the user to run `oliverspec-propose`
- If the project has PRD/TRD but no tickets, stop and tell the user to run `oliverspec-scope`
