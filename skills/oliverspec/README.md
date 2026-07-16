# OliverSpec

Linear-backed change workflow — OpenSpec-shaped (`explore` → `propose` → `scope` → `apply` → `babysit`), without writing proposal artifacts into the git repo.

Plans live in **Linear** (project + documents + tickets). Implementation ships as **Graphite-stacked PRs**, one per ticket.

```mermaid
flowchart LR
  explore --> propose --> scope --> apply --> babysit
```

## Install

```bash
npx skills add chroline/oliver/skills/oliverspec
```

Part of the [Oliver](../../) skill suite. Browse on [skills.sh](https://skills.sh/chroline/oliver).

## Skills

| Skill | Role |
|-------|------|
| [`oliverspec-explore`](./oliverspec-explore/SKILL.md) | Think through a problem — read code, diagram, challenge assumptions. No implementation, no Linear writes unless you ask to capture. |
| [`oliverspec-propose`](./oliverspec-propose/SKILL.md) | Create/update a Linear project with a **PRD** (product voice) and a detailed **TRD** (deeply technical voice). No tickets. |
| [`oliverspec-scope`](./oliverspec-scope/SKILL.md) | Break the PRD/TRD into Linear tickets with acceptance criteria and explicit `blockedBy` / `blocks` relations. |
| [`oliverspec-apply`](./oliverspec-apply/SKILL.md) | Implement the whole project in one go — parallel sub-agents (1 ticket → 1 agent), mark tickets In Progress, one Graphite-stacked PR per ticket. |
| [`oliverspec-babysit`](./oliverspec-babysit/SKILL.md) | Loop across the stack: fix PR comments + CI failures, wait for real CI. Ignores Graphite mergeability. |

## Document voices

| Doc | Perspective | Contains | Avoids |
|-----|-------------|----------|--------|
| **PRD** | Product | Problem, users, outcomes, UX/behavior, success metrics | Schemas, APIs, file paths, infra choices |
| **TRD** | Deeply technical | Architecture, data model, APIs, control flow, failure modes, rollout | Soft product copy, vague goals without mechanism |

## Defaults

| Setting | Default |
|---------|---------|
| Linear team | Engineering (override if specified) |
| Persistence | Linear only — no `openspec/changes/` (or similar) in the repo |
| Branch names | Linear issue git branch name from `get_issue` |
| PRs | Graphite stacks (`gt create` / `gt submit`) — one PR per ticket |
| Apply parallelism | Fan out parallel `Task` sub-agents per ready wave |

## Requirements

- [Linear MCP](https://linear.app) — propose / scope / apply / babysit
- [Graphite CLI](https://graphite.dev) `gt` — apply / babysit stacks
- [GitHub CLI](https://cli.github.com) `gh` — babysit PR/CI inspection

## Typical flow

1. **Explore** until the problem and approach are clear  
2. **Propose** → confirm PRD + TRD → write to Linear  
3. **Scope** → confirm ticket breakdown + Mermaid deps → create issues + wire relations  
4. **Apply** → parallel agents open the Graphite stack  
5. **Babysit** → comments + CI green across the stack  
