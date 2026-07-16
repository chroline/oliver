# OliverSpec

Run Linear-backed changes the way I do: explore, propose, scope, apply, then babysit. OliverSpec mirrors [OpenSpec](https://openspec.dev/)’s shape without writing proposal files into the git repo.

I keep the plan in Linear (project, documents, tickets) and ship work as Graphite-stacked pull requests, one PR per ticket.

```mermaid
flowchart LR
  explore --> propose --> scope --> apply --> babysit
```

## Install OliverSpec

Install the full OliverSpec suite with:

```bash
npx skills add chroline/oliver/skills/oliverspec
```

OliverSpec is one suite inside [Oliver](../../). Browse it on [skills.sh/chroline/oliver](https://skills.sh/chroline/oliver).

## Skills in the suite

Each skill covers one stage of the workflow:

| Skill | What it does |
|-------|----------------|
| [`oliverspec-explore`](./oliverspec-explore/SKILL.md) | Think through the problem. Read code, draw diagrams, challenge assumptions. No implementation. No Linear writes unless you ask to capture. |
| [`oliverspec-propose`](./oliverspec-propose/SKILL.md) | Create or update a Linear project with a product PRD and a deeply technical TRD. Does not create tickets. |
| [`oliverspec-scope`](./oliverspec-scope/SKILL.md) | Turn the PRD and TRD into Linear tickets with acceptance criteria (including comprehensive TDD test expectations) and explicit `blockedBy` / `blocks` relations. |
| [`oliverspec-apply`](./oliverspec-apply/SKILL.md) | Implement the project in one session via TDD (failing tests + typecheck-clean stubs, then implement backwards). Fan out parallel sub-agents (1 ticket → 1 agent → 1 worktree), mark tickets In Progress, open one Graphite-stacked PR per ticket. |
| [`oliverspec-babysit`](./oliverspec-babysit/SKILL.md) | Clear open PR comments and CI failures across the stack. Wait for real CI. Ignore Graphite mergeability. |

## How I write the PRD and TRD

I keep product and engineering voices separate so each doc stays useful:

| Doc | Voice | Put here | Keep out |
|-----|-------|----------|----------|
| **PRD** | Product | Problem, users, outcomes, UX behavior, success metrics | Schemas, APIs, file paths, infra choices |
| **TRD** | Deeply technical | Architecture, data model, APIs, control flow, failure modes, rollout | Soft product copy, goals with no mechanism |

## Defaults I expect

These are the defaults unless you override them:

| Setting | Default |
|---------|---------|
| Linear team | Engineering |
| Persistence | Linear only. No `openspec/changes/` (or similar) in the repo |
| Branch names | The Linear issue git branch name from `get_issue` |
| PRs | Graphite stacks via `gt create` / `gt submit`, one PR per ticket |
| Apply parallelism | Parallel `Task` sub-agents for every ready ticket in a wave, each in its own git worktree |
| Implementation style | TDD: failing tests + typecheck-clean stubs first, then implement backwards to green |

## What you need installed

OliverSpec depends on these tools:

- **Linear MCP**: propose, scope, apply, and babysit ([Linear](https://linear.app))
- **Graphite CLI (`gt`)**: apply and babysit stacks ([Graphite](https://graphite.dev))
- **GitHub CLI (`gh`)**: babysit PR and CI inspection ([GitHub CLI](https://cli.github.com))

## Run a change end to end

Work the stages in order:

1. **Explore** until the problem and approach are clear
2. **Propose**: confirm the PRD and TRD, then write them to Linear
3. **Scope**: confirm the ticket breakdown and Mermaid dependency graph, then create issues and wire relations
4. **Apply**: let parallel agents open the Graphite stack
5. **Babysit**: clear comments and get real CI green across the stack
