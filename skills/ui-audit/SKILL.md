---
name: ui-audit
description: Thoroughly audit and refine an existing application's visual design and interaction details, using a coherent component system, rendered inspection, and regression verification. Use for comprehensive UI reviews, design polish, or requests to make an interface feel carefully designed; scale down for a single component.
---

# UI Audit

Make the interface feel deliberately designed at the page, component, and interaction levels. Treat the work as **design decisions plus rendered verification**, not a list of CSS adjustments. A component library provides primitives; it does not decide the page hierarchy, density, spacing, or behavior.

## Scope and working standard

Honor the requested mode: an audit produces findings; an authorized repair implements and verifies them. Do not silently turn a review into a redesign. For a targeted component, inspect its surrounding layout and affected siblings without expanding into an application-wide overhaul.

When the user requests thoroughness, assume they will notice individual gaps, mismatched baselines, awkward line breaks, inexplicable empty space, and states you did not open. Inspect those details yourself. Avoid claiming perfection or a comprehensive percentage without a defined scope and recorded evidence.

Use the project's existing design language, platform conventions, and installed component library where suitable. Do not impose the original project's palette, numbers, framework, or layout on a different product. A mobile app needs native-compatible primitives; a web-only library is not automatically a solution. Respect repository instructions and consult version-matched framework documentation before unfamiliar or version-sensitive API changes.

## 1. Establish what actually exists

- Inspect the working tree, routes, shared components, theme, dependencies, and existing audit records. Preserve unrelated changes and retain existing finding IDs.
- Open the running UI with the available browser or native inspection workflow. Prefer the user's existing signed-in preview when authorized. Load that tool's instructions before driving it.
- Inspect the user's screenshots as evidence, including the areas they did not mark. Determine whether they show the current revision before calling an issue reproduced or resolved.
- Identify primary tasks and important states, not just page names. Include public/authentication and recovery surfaces when in scope.
- Record which surfaces are live, source-only, inaccessible, or not applicable. If live access is blocked, continue useful source analysis and clearly leave visual verification open.

For a comprehensive pass, read [the inspection guide](references/inspection-guide.md) and turn its relevant prompts into a finite route/component/state matrix. Choose representative real content, including long labels, missing artwork, and populated lists. Do not replace the user's content just to make screenshots attractive.

## 2. Build the finding record before fixes blur the baseline

Use an existing project report if suitable; otherwise create a concise `UI-REVIEW.md` and an evidence folder. Keep one authoritative finding record rather than competing reports.

Record each distinct problem with:

| Field | What to capture |
|---|---|
| ID and priority | Stable ID; critical task failure, substantial usability issue, or visual polish |
| Surface and state | Route/component, viewport, content, scroll or interaction state |
| Observation | Concrete visible behavior, with screenshot or reproduction steps |
| Effect | Why it looks unconsidered or makes the task harder |
| Remedy and acceptance | Intended change and an observable success condition |
| Status and evidence | Open, implemented/unverified, verified, partial, blocked, or not applicable |

Separate observation from suspected cause. “The title is covered after scrolling” is evidence; “z-index is wrong” needs investigation. Group repeated symptoms under a shared cause when appropriate, while retaining the affected surfaces and checks. Include cosmetic flaws even when they do not prevent task completion.

For extensive work, maintain a small coverage matrix. A reviewed cell must say what was observed and by which method. Source review, visual inspection, interaction testing, and device testing are different evidence. Coverage is not a defect pass rate, and a high percentage does not excuse an untested primary flow.

## 3. Establish a coherent visual system

Before fixing individual pixels, identify the few decisions that explain the whole interface:

- Content hierarchy: what should be seen and done first; which secondary elements currently compete with it.
- Layout: content width, gutters, spacing rhythm, row density, section separation, and responsive composition.
- Type: title/body/metadata roles, line heights, weight, wrapping, and truncation recovery.
- Components: control dimensions, icon family and optical sizes, corners, borders, surfaces, and interaction states.
- Navigation: explicit destinations, active state, back behavior, and predictable location of common actions.

Write a compact set of project-specific rules or use existing tokens. Choose values because they fit this product and its data. Shared outer gutters should align; nested rows may need deliberate optical offsets. Equal numbers do not guarantee visual balance.

Prefer consolidating repeated primitives over adding page-specific exceptions. Preserve intentional hierarchy: uniform styling should not flatten primary, secondary, and destructive actions into the same emphasis. Remove redundant chrome and oversized decoration when they bury the primary task. Avoid substituting random artwork, gradients, or decorative cards for useful structure.

## 4. Repair in small, reviewable groups

Work through shared foundations, primary surfaces, detailed components, then states and recovery paths. Prioritize blockers and highly reused components, but keep the visual-polish backlog visible.

For each group:

1. Reproduce and identify the actual cause.
2. Implement the smallest coherent change in the appropriate shared layer.
3. Check behavior with tests appropriate to the change. Do not write tests that merely mirror CSS declarations.
4. Inspect the rendered result at the relevant sizes and states.
5. Recheck siblings that share the changed primitive, and log newly introduced problems as regressions.
6. Update the finding's status and evidence only after the relevant check.

Proceed with authorized reversible work. A visual audit is not permission to disconnect accounts, delete real data, submit purchases, send emails, or deploy. Prefer cancellation, local fixtures, test accounts, and reversible task-owned data for those states. Keep a cleanup record when creating test data or changing network conditions.

Do not stop at normal states. Inspect pending, failure, empty, disabled, selected, hover, keyboard focus, long-content, and overflow states where relevant. Backend readiness and external-provider success must not be inferred from attractive UI.

## 5. Use a screenshot–critique–repair loop

A successful build and plausible DOM do not establish visual quality. Capture and **view** screenshots of the actual rendered revision. Use DOM measurements and computed styles to explain discrepancies, not as a replacement for looking.

Wait for an observable stable state: the intended viewport/layout, loaded fonts, expected data, and relevant images. After resizing, verify the app has adopted the breakpoint before capturing. Observe loading separately when loading is the state under review. Label transitional captures instead of presenting them as final evidence.

Review in three passes:

- **Composition:** hierarchy, balance, density, wasted space, what is visible before scrolling, and whether the next action is obvious.
- **Components:** baselines, gutters, optical icon alignment, line breaks, targets, clipping, counts, field shapes, artwork crop, and nearby visual relationships.
- **Behavior and regression:** scroll with sticky chrome, open and close overlays, change filters, resize, navigate back, reload a detail URL, and trigger a safe failure path.

After shared-control changes, inspect both a dense page and an overlay or form. After a responsive change, inspect intermediate widths and short windows as well as standard phone/desktop sizes. A phone-width browser screenshot does not verify native safe areas, touch behavior, or software keyboards.

Treat the final pass as a search for **what the repair made worse**. New truncation, duplicated outlines, lingering tooltips, misplaced errors, route-transition blanks, or a fix applied only to one variant are findings, even when tests pass. Fix within scope and recheck the affected path.

## 6. Close with evidence and honest limits

Before declaring the repair complete:

- Run repository-required checks and behavior tests appropriate to the changes.
- Inspect final captures for the changed primary surfaces; mark superseded captures clearly.
- Account for every finding. Distinguish code implemented from visually verified and externally/device verified.
- Complete a deliberate regression sweep across changed shared components and main tasks.
- Remove only task-created test data, restore temporary network/test settings, and finish the inspection session according to the tool's workflow.
- Record remaining blockers, product gaps, verification gaps, and material tradeoffs with concrete next actions.

For broad work, link a short evidence index to final screenshots, the finding record, and relevant test results. Record viewport/state and whether evidence is intermediate. Do not publish account screenshots or private data externally without authorization.

The stopping condition is that scoped changes meet their observable acceptance criteria, relevant checks pass, and the final sweep has no unresolved in-scope defects that can be addressed with current access. When access or an external dependency prevents completion, report the exact remaining work; do not silently mark it passed or wait indefinitely.

The final response should lead with the outcome, summarize the most consequential changes and checks, link the report, and plainly state remaining limits. Do not make the user discover an unverified platform or broken recovery path after being told everything is fixed.
