---
name: oliverspec-propose
description: >
  Propose a change via OliverSpec — create or update a Linear project with a PRD
  and a detailed TRD as Linear documents. Does NOT create tickets or write
  proposal artifacts to the git repo. Use when the user wants to propose,
  /oliverspec propose, oliverspec-propose, or turn explored decisions into a
  Linear PRD + TRD.
license: MIT
metadata:
  author: oliverspec
  version: "1.0"
---

Propose a change into **Linear only**. Never write OpenSpec folders, `openspec/changes/`, or other proposal markdown into the repository.

Artifacts created:
- Linear **Project** (create or reuse)
- Linear **Document** — **PRD** written from a **product perspective** (who/why/what experience)
- Linear **Document** — **TRD** written from a **deeply technical perspective** (how/where/with what systems)

**Do not create Linear issues/tickets in this skill.** Scoping into tickets is `oliverspec-scope`.

When PRD + TRD are ready: run `oliverspec-scope`, then `oliverspec-apply`.

---

## Document voices (strict)

| Doc | Voice | Audience | Contains | Does not contain |
|-----|-------|----------|----------|------------------|
| **PRD** | Product | PMs, design, eng reading for intent | Problem, users, jobs-to-be-done, UX/behavior, success metrics, product risks | Schemas, API shapes, class/file names, infra, algorithms |
| **TRD** | Deeply technical | Engineers implementing | Architecture, data model, APIs, codepaths, failure modes, migrations, rollout | Soft product copy, marketing framing, vague “make it better” goals without mechanism |

If a sentence could only matter to an engineer implementing the change, it belongs in the **TRD**. If it could be read by product/design to judge whether we built the right thing, it belongs in the **PRD**.
---

## Defaults

| Setting | Default |
|---------|---------|
| Linear team | **Engineering** (override only if user specifies another team) |
| Persistence | Linear only — **no repo writes** for proposals |
| PRD | Linear Document on the project via `save_document` |
| TRD | Linear Document on the project via `save_document` |

---

## Input

Need from conversation or user:

1. **What to build** — problem, approach, scope (from explore or the request)
2. **Project name** — Linear project to create or reuse (ask if missing)

Optional: team override (default Engineering), priority, initiative.

**IMPORTANT:** Do not proceed without understanding what to build.

---

## Steps

### 1. Crystallize the proposal (in chat first)

Before calling Linear, draft and show the user:

1. **PRD outline** (product voice — see template below)
2. **TRD outline** (deeply technical voice — see template below) — detailed enough to implement from without re-deriving design
3. **Mermaid diagrams** — product flows may appear lightly in the PRD; architecture / data / sequence diagrams belong in the TRD (never ASCII)

**Ask the user to confirm before creating or updating anything in Linear.**

Do **not** draft a ticket list here — that belongs to `oliverspec-scope` after the docs exist.

### 2. Resolve Linear project + team

1. Read Linear MCP tool schemas before calling tools
2. Default team: `Engineering` unless user specified otherwise
3. `list_projects` with the project name query
   - If a clear match exists → reuse it (confirm with user if ambiguous)
   - If none → `save_project` with `name`, `setTeams: ["Engineering"]` (or override), and a short `summary`
4. Note the project name/id for subsequent calls

### 3. Create or update the PRD document

Use `save_document` with `project` set to the Linear project.

- If a PRD doc already exists for this project (`list_documents`), update it by `id`
- Otherwise create: title like `PRD: <feature name>`

Write the PRD **only from a product perspective**: problem, users, outcomes, and observable product behavior. No implementation detail.

#### PRD template

```markdown
# PRD: <Feature Name>

## Problem
<What hurts today, who feels it, and why it matters now>

## Goals
- <User/business outcomes — not engineering tasks>

## Non-goals
- <Explicit product boundaries>

## Users & use cases
- <Personas / roles and the jobs they need to complete>

## Product behavior
<End-to-end experience: happy path, edge cases, empty/error states — described as the user sees them>

## UX / interaction notes
<Screens, flows, copy intent, permissions as product rules — not component trees>

## Success metrics
- <How we know this worked for users/business>

## Risks & open questions
- <Product risks, unresolved product decisions>

## References
- TRD: <title / link filled after create>
```

**PRD anti-patterns:** tables of DB columns, endpoint lists, library choices, “we’ll use Redis”, file paths, Temporal workflow names. Those go in the TRD.

### 4. Create or update the TRD document

Use `save_document` with `project` set to the same Linear project.

- If a TRD doc already exists (`list_documents`), update it by `id`
- Otherwise create: title like `TRD: <feature name>`

Write the TRD **from a deeply technical perspective**. Assume the reader is an engineer who will implement and review the change. Be concrete: services, stores, schemas, APIs, control flow, failure modes. An implementer (or `oliverspec-scope` / `oliverspec-apply`) should not need to re-derive the design.

#### TRD template

```markdown
# TRD: <Feature Name>

## Overview
<Technical summary — how we will build what the PRD requires>

## Current state
<Relevant systems, schemas, codepaths, ownership boundaries today — cite packages/services>

## Proposed architecture
<Components, boundaries, responsibilities, trust boundaries>
<!-- Mermaid: system / sequence / state diagrams -->

## Data model
<Schemas, migrations, stores (Postgres / ClickHouse / etc.), indexes, backwards compatibility, backfills>

## APIs & interfaces
<Routes, events, contracts, authz, idempotency, versioning>

## Detailed design
<Step-by-step control flow, algorithms, state transitions, concurrency, failure/retry modes>

## Integration points
<Existing services, workers, queues, third parties, config/env>

## Observability & ops
<Logging, metrics, tracing, alerts, feature flags, rollout / migrate / rollback>

## Testing strategy
<Unit / integration / e2e expectations tied to concrete modules>

## Risks, tradeoffs & alternatives considered
- <Technical tradeoffs with rationale>

## Open technical questions
- ...

## References
- PRD: <title / link>
```

**TRD anti-patterns:** restating the PRD in engineer voice without mechanisms; “make it scalable” without a design; product roadmap language.
Cross-link PRD ↔ TRD in both documents after create (update with URLs/titles).

### 5. Done — hand off

Summarize:

- Project name + URL
- PRD document title + URL
- TRD document title + URL
- Prompt: "Run `oliverspec-scope` to break the PRD/TRD into Linear tickets, then `oliverspec-apply` to implement."

---

## Guardrails

- **No git/repo proposal artifacts** — Linear only
- **No tickets in propose** — PRD + TRD documents only; `oliverspec-scope` owns issue creation
- **Confirm plan before creating** Linear objects
- **Default team Engineering**
- **Diagrams in Mermaid only** — architecture / flow sketches use Mermaid, not ASCII
- **PRD = product voice** — who/why/what experience; no implementation detail
- **TRD = deeply technical voice** — how/where/with what systems; concrete enough to implement
- **TRD must not be a thin restatement of the PRD**
- Prefer updating an existing project/PRD/TRD over duplicating when the user is iterating
- Read Linear tool descriptors before first MCP call in the session
- Do not start implementation or ticket slicing in this skill
