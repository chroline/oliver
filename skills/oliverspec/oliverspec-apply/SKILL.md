---
name: oliverspec-apply
description: >
  Implement an OliverSpec Linear project end-to-end — work all tickets in one go,
  aggressively launching sub-agents in parallel, and open one GitHub stacked PR
  per ticket. Use when the user wants to apply, implement, /oliverspec apply, or
  oliverspec-apply for a Linear-proposed project.
license: MIT
metadata:
  author: oliverspec
  version: "2.1"
---

Implement an entire OliverSpec project from Linear in **one session**.

There is **no apply gate**: do not wait for PR review or merge between tickets. Drive the whole project to "PRs opened" in one go, **aggressively launch sub-agents in parallel**, and publish **one stacked PR per ticket**.

**Parallelism is mandatory, not optional.** Do not implement tickets yourself serially. Do not start one sub-agent, wait for it to finish, then start the next when others could run concurrently. In a single turn, fire **multiple `Task` tool calls together** — one per ready ticket — and keep the pipeline saturated.

**PRs are stacked with GitHub stacked pull requests** (`gh stack`) — not Graphite (`gt`), and not independent PRs against trunk (unless a ticket truly has no parent). Dependent tickets become upper layers stacked on their Linear `blockedBy` parents.

---

## Input

- Linear **project name** (or infer from conversation)
- Optional: subset of ticket IDs (default = all unfinished tickets in the project)

If ambiguous, `list_projects` / ask which project. Announce: `Applying OliverSpec project: <name>`.

---

## Steps

### 0. Preflight (fail fast, once, at the start)

```bash
gh --version                      # need 2.90.0 or later
gh auth status
gh extension install github/gh-stack   # no-op if already installed
gh stack view --short 2>/dev/null      # exit 9 = stacks not enabled for this repo
git worktree list
```

- `gh` older than **2.90.0** → tell the user to upgrade (`brew upgrade gh`) before continuing
- Exit code **9** from any `gh stack` command means stacked PRs are not enabled for the repo. Fall back to **chained plain PRs** (`gh pr create --base <parent-branch>`), keep every other rule in this skill, and say clearly in the final summary that the stack objects were not created
- Exit code **8** means the stack is locked by another process — you have concurrent `gh stack` calls, which this skill forbids (see step 2)

Optional but useful: `gh skill install github/gh-stack` to give agents the official command reference.

### 1. Load the project plan from Linear

1. Read Linear MCP tool schemas before calling tools
2. Resolve the project (`list_projects` / `get_project`)
3. Load the PRD and TRD (`list_documents` + `get_document`) — treat them as source of truth for intent/design
4. Load tickets (`list_issues` with `project`); for dependency edges use `get_issue` with `includeRelations: true`
5. If there are no tickets, stop and tell the user to run `oliverspec-scope` (after `oliverspec-propose` if PRD/TRD are also missing)
6. Build the dependency graph from Linear’s native `blockedBy` / `blocks` relations only — ignore dependency prose in descriptions if it conflicts; if relations are missing but the docs/graph imply them, stop and tell the user to re-run `oliverspec-scope` to wire relations
7. Set the Linear project status to **In Progress** (`save_project` with `id` = the project and `state: "In Progress"`, or the team's equivalent started state if the name differs) if it isn't already — this happens once, up front, regardless of per-ticket states

Show a short plan:

- Ticket order / parallel waves
- Chain decomposition (which tickets share a stack — see step 2)
- Which tickets get which sub-agents
- Branch names (from each Linear issue’s git branch name)

Then **start immediately** — do not wait for per-ticket approval unless the user asked to confirm first.

### 2. Map the dependency graph onto GitHub stacks

A `gh stack` is a **strictly linear chain**: each branch targets the branch below it, and `gh stack add` only appends to the top. A Linear dependency graph is a DAG. Decompose it into chains before you dispatch anything:

1. Walk the DAG in topological order. A **chain** is a maximal path where each ticket’s base is the ticket immediately before it
2. When a ticket has multiple children, the first child continues the chain; **each additional child starts a new stack** rooted at that parent’s branch (`gh stack init --base <parent-linear-branch> …`). A stack can target any branch, not just trunk
3. A ticket with multiple `blockedBy` parents cannot sit under both. Pick the parent on the longest chain as its base, and note the other dependency in the PR body under `## Linear`
4. Tickets with no `blockedBy` start chains rooted at trunk

Record the chain table in the plan — it is what step 4 assembles.

**Waves are still the unit of parallelism.** Chains are only about stack topology. Two tickets in the same wave that land in different chains are still implemented concurrently.

### 3. Execution model (aggressive **parallel** sub-agents)

**Goal:** finish the whole project in one apply run by maximizing concurrent sub-agents.

**Mapping rules:**
- **1 ticket → 1 sub-agent** by default. Do not assign a whole wave (or multiple tickets) to a single sub-agent — that usually defeats the point of sub-agents
- **1 ticket → 1 git worktree** — every ticket sub-agent must work in its **own** worktree, never the parent’s checkout. Parallel agents sharing one working tree overwrite each other’s HEAD and dirty state
- **1 wave → N sub-agents in parallel** where N = number of ready tickets in that wave. A wave is a dependency batching boundary, not a unit of work for one agent
- Multiple waves over the session are expected. A wave may legitimately contain only one ticket when the graph has a single unlock — that is fine; still give that ticket its own agent **and** worktree, then fan out the next wave in parallel once it lands
- Collapsing several tickets into one agent is **highly discouraged**, not banned — only do it when parallelism is clearly wasteful or harmful (e.g. unavoidable same-file thrash with no clean split), and say why

1. Partition tickets into waves by dependencies (wave 1 = no blockers, wave 2 = blocked only by wave 1, etc.)
2. **Before launching a wave:** for each ticket in the wave, mark it **In Progress** in Linear (`save_issue` with `state: "In Progress"` — or the team’s equivalent started state from `list_issue_statuses` if the name differs). Do this as soon as you pick the ticket up, before/as you dispatch its sub-agent — not after the PR exists
3. **Before launching a wave:** create one worktree per ticket in the wave (see below) and pass its absolute path in the Task prompt
4. **For every wave: launch one Task sub-agent per ticket, all in the same message** when N > 1 — true parallelism via multiple concurrent `Task` calls. Use `subagent_type: generalPurpose` (or `shell` for narrow git ops)
5. Independent chains in the same wave all run concurrently (separate agents, separate worktrees)
6. Do **not** pause for merge/review between waves. As soon as a wave’s agents return, tear down its worktrees, assemble the stacks (step 4), and immediately launch the next wave
7. Parent agent coordinates only: Linear state, worktree lifecycle, the parallel Task batch per wave, **all `gh stack` commands**, rebases, conflict resolution, PR linking — **parent does not implement ticket bodies by default**

**Worktrees (required for parallel apply):**

```bash
# Parent, once per ticket, before dispatch. Base = trunk, or the parent ticket's branch.
git worktree add "$WORKTREES/<ISSUE-ID>" -b <linear-branch-name> <base-ref>

# Parent, after the agent returns (before any gh stack command touches that branch)
git worktree remove "$WORKTREES/<ISSUE-ID>"
```

- Put `$WORKTREES` **outside** the repository, e.g. a sibling `../.oliverspec-worktrees/`. Worktrees nested inside the checkout make the parent’s globs and greps see every file twice
- The parent creates the branch with `-b`, so **the agent must not create it again**. The agent’s worktree is already on the right branch
- Each agent’s cwd **must** be its worktree. Never `cd` back to the parent checkout to edit application files
- On agent failure, still remove the worktree; keep the branch for inspection

**Concurrency rule — this is the one that breaks builds if you get it wrong:**

> `gh stack init`, `add`, `rebase`, `sync`, `push`, `modify`, and the navigation commands all check out branches, and git refuses to check out a branch that is already checked out in another worktree. They also take a stack-wide lock (exit code 8).
>
> **Sub-agents never run `gh stack`.** They use plain `git` plus `gh pr create` on their own branch only. The parent runs every `gh stack` command from the main checkout, serially, with the wave’s worktrees already removed.

**Discouraged (avoid unless justified):**
- One sub-agent owning multiple tickets / an entire wave when those tickets could be separate agents
- Implementing ticket bodies yourself instead of dispatching agents
- Running same-wave ticket agents strictly sequentially “to be safe” when they could run in parallel
- Waiting for one PR’s CI/review before launching the rest of a ready wave
- Two agents editing the **same** worktree / checkout
- Any `gh stack` call from inside a sub-agent

**Not an anti-pattern:** a wave with N=1 because the dependency graph only unlocked one ticket — run that one agent, then parallelize the following wave hard.

If two tickets in the same wave will hard-conflict on the same files, prefer separate agents staggered/sequenced for those two only; keep every other ready ticket’s agent running in parallel. Merging those two into one agent is a last resort — call it out.

### 4. Assemble the stack (parent only, after each wave)

Once a wave’s agents have returned and their worktrees are removed:

```bash
# Adopt the chain's branches into a local stack, bottom to top.
# Existing branches are adopted; --base roots the stack at trunk or at a parent ticket's branch.
gh stack init --base <trunk-or-parent-branch> <branch-1> <branch-2> <branch-3>

# Link the already-created PRs into a stack on GitHub, bottom to top.
# Accepts PR numbers, PR URLs, or branch names; fixes any base branch that
# does not match the chain; additive, so later waves can extend the stack.
gh stack link <pr-1> <pr-2> <pr-3>

# Extend an existing stack later without re-listing its PRs:
gh stack link <stack-number> <pr-4> <pr-5>

gh stack view --json      # verify topology
```

- `gh stack link` needs **no local tracking** and checks out nothing, so it is the safe assembly primitive. `gh stack init` is what gives you local tracking for later `gh stack rebase` / `gh stack sync`
- Do **not** use `gh stack submit` to create these PRs. In non-interactive mode it auto-generates titles and opens drafts, which loses the required PR body. Agents create the PRs; the parent links them
- If a parent branch moved after its children were cut: `gh stack rebase --upstack` from the moved branch, then `gh stack push`. On conflict, resolve, `git add`, `gh stack rebase --continue`; `gh stack rebase --abort` restores every branch

### 5. Per-ticket sub-agent contract

Each ticket agent receives a self-contained prompt including:

- Issue id + title + full description (scope + acceptance criteria)
- Relevant PRD + TRD excerpts
- Repo constraints / pointers to touch points discovered by the parent
- **Worktree path** (absolute) where all git and file operations must happen — required; never the parent checkout
- **Branch name** (the Linear issue’s git branch name from `get_issue`) — already created and checked out in that worktree
- **Base branch** for the PR: trunk for chain roots, otherwise the parent ticket’s Linear branch
- Required outputs: PR URL + number, branch name, base branch, worktree path, files changed, AC checklist result, **test summary** (what was added/updated; commands run)

**Branch naming:** use the Linear ticket’s git branch name exactly (returned by `get_issue`). Never invent `oliverspec/...` or other custom branch names.
**Worktrees:** one isolated worktree per ticket agent — no shared working directories across parallel agents.
**No `gh stack` in agents:** plain `git` + `gh pr create` only.
**TDD required (red → stubs typecheck → green):** land comprehensive failing tests first, keep the tree type-checking via stubs/fakes/interfaces, then implement until tests pass. Token smoke tests are not enough.

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
- Also depends on: <ISSUE-ID> (only when the ticket has a second blockedBy parent outside this chain)

## Stack
- Base: <base branch>

## Acceptance Criteria
- [x] / [ ] copied from the ticket (including TDD / comprehensive test ACs)

## Test plan
- [ ] Phase 1: comprehensive failing tests + typecheck-clean stubs/fakes
- [ ] Phase 2: real implementation until tests pass (work backwards from the tests)
- [ ] Coverage for this ticket’s scope (happy path, edges, failures)
- [ ] <commands run, e.g. pnpm --filter … test / type-check>
```

### TDD sequence (required per ticket)

Do **not** implement production behavior first. Work in this order:

1. **Tests first (red)** — write comprehensive automated tests that encode the acceptance criteria and TRD behavior (happy path, edges, failures). Tests should fail for the right reason (missing/incorrect behavior), not because of compile/type errors
2. **Stubs so typecheck passes** — add the minimum interfaces, types, fakes, or stub implementations so `type-check` / `tsc` is clean while tests still fail. Stubs must not pretend to satisfy the behavioral ACs
3. **Implement backwards (green)** — replace stubs with real code until the suite passes. Prefer driving design from the tests; don’t expand scope beyond the ticket
4. **Verify** — run the ticket’s test + typecheck commands; fix until both are green

Agent responsibilities:

1. `cd` to the assigned **worktree**. Confirm with `git status` that you are on the assigned branch. Every command below runs with cwd = that worktree
2. Confirm the issue is **In Progress** (if the parent hasn’t already: `save_issue` `id` + `state: "In Progress"`), then `get_issue` for full context
3. **Phase 1 — tests + stubs:** write comprehensive failing tests for the ACs, then stubs/fakes/types so typecheck passes while tests remain red. Commit this phase when practical
4. **Phase 2 — implement backwards:** replace stubs with real implementation until all new/updated tests pass and ACs are met (or clearly blocked)
5. Run the relevant automated tests and typecheck; both must pass before opening the PR
6. Commit with plain git (`git add -A && git commit -m "..."`). Prefer history that shows phase 1 then phase 2
7. Push and open the PR against the assigned base:
   ```bash
   git push -u origin <linear-branch-name>
   gh pr create --base <base-branch> --head <linear-branch-name> \
     --title "<ISSUE-ID>: <title>" --body "<body from the template above>"
   ```
8. Return PR URL + number, base branch, worktree path, test summary (phase 1/2), and residual risks. Do **not** run `gh stack`, `gh pr merge`, or touch any other ticket’s branch

Parent responsibilities:

**On pickup (when dispatching an agent for a ticket):**
1. Mark the issue **In Progress** via `save_issue` (`state: "In Progress"` or team equivalent)
2. Create the ticket’s worktree and branch, and pass the absolute path + branch + base in the Task prompt

**After each agent returns:**
1. `git worktree remove` for that ticket
2. Attach PR to the Linear issue (`save_issue` `links: [{ url, title }]`)
3. Move issue to an appropriate next state (e.g. In Review) if statuses allow
4. Record progress in the session summary

**After each wave (all worktrees for the wave removed):**
1. `gh stack init` / `gh stack link` for the affected chains (step 4)
2. `gh stack rebase` + `gh stack push` if a lower layer moved
3. `gh stack view --json` to confirm topology before launching the next wave

### 6. Keep going until the project is done

Loop until every in-scope ticket has a PR (or a hard blocker):

- No stopping after the first ticket
- No "should I continue?" between waves unless blocked
- Always prefer launching the next batch of ready tickets as **parallel** Task calls in one turn
- On agent failure: retry once with a tighter prompt **in parallel with other work**, then escalate that ticket in the final report while continuing others

### 7. Final summary

```
## OliverSpec Apply Complete

**Project:** <name> (<url>)
**PRD:** <url>
**TRD:** <url>

| Ticket | Title | PR | Stack | Base | Status |
|--------|-------|----|-------|------|--------|
| LEM-123 | ... | url | #<stack-number> | main | opened / blocked |

### Blockers
- ...

### Suggested next steps
- Run `oliverspec-babysit` to clear PR comments + CI across the stack
- Then run `oliverspec-ship` to merge the stack and move the project to Completed
- Re-run apply for any blocked tickets after resolving blockers
```

---

## Guardrails

- **Linear is the plan** — don't invent tickets; implement what's in the project
- **One PR per ticket** — no bundling multiple tickets into one PR
- **GitHub stacks, not Graphite** — assemble with `gh stack init` / `gh stack link`; never `gt`. Dependent PRs target their parent's branch, never trunk
- **Only the parent runs `gh stack`** — serially, from the main checkout, with the wave's worktrees removed. Sub-agents use plain `git` + `gh pr create`
- **Stacks are linear** — decompose the Linear DAG into chains first; fan out extra children as new stacks rooted at the parent's branch with `--base`
- **Branch names from Linear** — always use the issue's git branch name from `get_issue`; the parent creates the branch with the worktree
- **One worktree per sub-agent, outside the repo** — parallel ticket agents never share a checkout
- **No apply gate** — don't wait for review/merge to continue the project
- **Move the project to In Progress** at the start of apply (`save_project` `state`), once — separate from per-ticket state
- **Mark In Progress on pickup** — set Linear ticket state when work starts (before/as the sub-agent is dispatched), not only when the PR is opened
- **TDD required** — (1) comprehensive failing tests, (2) stubs/fakes so typecheck passes while tests stay red, (3) implement backwards until green. No production-first shortcuts
- **Parallel sub-agents by default** — parent only coordinates; prefer **1 ticket = 1 sub-agent**; each wave fans out N agents in one turn when N > 1; collapsing multiple tickets into one agent is highly discouraged (justify if you do). A single-ticket wave from real dependencies is fine
- Keep changes scoped to each ticket's acceptance criteria
- Never push to `main`/`master`; always feature branches + stacked PRs
- Don't create new Linear tickets during apply unless the user asks
- If the project has no PRD/TRD, stop and tell the user to run `oliverspec-propose`
- If the project has PRD/TRD but no tickets, stop and tell the user to run `oliverspec-scope`
