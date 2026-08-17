# <one-line goal>

<2–4 sentences: what changes and where.>

**Current state** (verified paths/modules only):
- `path` — <what it does today>

**Non-goals:**
- ...

<!-- Mermaid: one architecture/sequence/state/dependency diagram if the change touches >1 module. Omit this fence otherwise. -->

## 1. Requirements & Constraints

- **REQ-001**: ...
- **CON-001**: ...

## 2. Implementation

TDD: tests first → typecheck-clean stubs → implement to green.

### Phase 1

- GOAL-001: <phase outcome>

| Task | Description | Completed |
|------|-------------|-----------|
| TASK-001 | <one sentence + path(s); tests-first> | |
| TASK-002 | ... | |

### Phase 2

- GOAL-002: ...

| Task | Description | Completed |
|------|-------------|-----------|
| TASK-003 | ... | |

## 3. Alternatives

- **ALT-001**: <rejected approach> — <why, one clause>

## 4. Testing

- **TEST-001**: <what to prove> — `command`
- Storybook: <story id + states to capture> (or `n/a — no UI`)

## 5. Rollout

- Migration / feature-flag / rollout notes, or `n/a`

## 6. Risks & Assumptions

- **RISK-001**: ...
- **ASSUMPTION-001**: ...
- Open questions: ...
- Out of scope: ...

## 7. PR split

- 1/1 — <intent>   (or stacked layers: tests/types → core → wiring)

## Dependencies

<!-- Omit this section if none. -->
- **DEP-001**: ...
