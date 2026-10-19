---
name: dashboard-ui
description: Build or refine functional dashboards with compact shadcn UI, useful charts, tables, and reliable navigation. Use for analytics, monitoring, operations, resource management, or record-oriented dashboards, including email-style list-and-detail workspaces. Adapt the layout to the domain rather than assuming experiments or a fixed set of metrics.
---

# Dashboard UI

Build a working dashboard that helps the user inspect data, understand changes, and take the next relevant action. This skill captures a preference for compact, utilitarian shadcn interfaces. It is a design and implementation workflow, not a particular application's schema or backend.

## Choose the structure from the task

Identify the main question, the objects being inspected, the useful level of detail, and the actions the user needs. Infer these from the request and existing application before asking questions. Distinguish a working integration from a fixture-backed prototype; label fixture data and do not present unimplemented controls as functional.

Choose the smallest useful structure:

| Primary task | Starting layout |
| --- | --- |
| Browse records and inspect one in depth | Persistent list on the left, selected record in the main pane; use the sidebar-09 email-list pattern. |
| Monitor aggregate health or trends | Overview with shared scope/time controls, a small set of meaningful metrics, charts, and drill-down tables. |
| Compare entities, periods, or configurations | Explicit comparison selectors, aligned measures, deltas, and access to underlying rows. |
| Review and act on many items | Dense filterable table or queue with selection and the domain's real actions. |
| Work across several distinct areas | Minimal navigation around the appropriate views above. |

Combine these when the workflow needs it. Do not force a record sidebar onto an aggregate dashboard, add an icon rail for nonexistent sections, or invent comparison and review workflows. Read [layout patterns](references/layouts.md) when deciding composition or implementing navigation.

## Visual defaults

- Use the user's preferred shadcn preset **`b7BFgTmLK`**: Nova/Mist, Geist, Lucide, neutral surfaces, subtle/translucent menus. This is the starting preference for a new dashboard, not authorization to replace an established application's design system. Explicit user choices take precedence.
- Use generated shadcn primitives for controls, navigation, tables, tabs, sheets, tooltips, and charts. Compose semantic HTML around them. Do not approximate a Select with a native select or restyle a homemade component until it merely resembles shadcn.
- Keep the interface functional: useful labels and section titles, no hero, marketing copy, oversized page heading, decorative slogans, or redundant introductions. Do not remove labels people need to understand controls.
- Use compact, aligned controls, restrained borders, quiet status badges, tabular numbers, and consistent spacing. Prefer small table section headings; avoid padding-heavy cards around every fragment of data.
- Treat widths and heights as deliberate layout decisions. Inputs should fit their jobs; selectors need a constrained trigger and a menu wide enough to read options. Long names and identifiers must not push the page sideways.
- Use theme tokens throughout. Check light and dark modes, including portaled menus, focus rings, chart axes, and selected rows. Use semantic emphasis rather than coloring every metric.

Read [shadcn implementation](references/shadcn.md) before installing primitives or applying the preset. Preserve the requested preset across every added component and its supporting CSS; do not mix styles from unrelated snippets.

## Build the behavior with the view

Keep data loading and routing separate from presentational views so realistic states can be rendered without production access. Reuse the project's framework, router, data client, and test conventions. This skill does not require Vite, Next.js, a particular database, a local server, or any storage provider.

For record workspaces, use real addressable links, a visible selected row, and independent pane scrolling. Keep list filters and selection in a stable owner outside a mobile Sheet's mounted content. A new response or newly discovered record must not steal the current selection. Resolve direct URLs before choosing a default record, and preserve browser back/forward behavior.

Make the distinction between initial loading, background refresh, no records, no filter matches, missing measurements, and failed requests visible. Preserve useful loaded data during refresh when appropriate. Use cancellation and stale-response guards so a slow request cannot overwrite a newer selection. Only describe data as live if the actual source refreshes; distinguish a remote snapshot from continuous updates.

Keep controls connected to real behavior. Scope filters should affect the charts and tables they claim to affect. Preserve normal modified-click/open-in-new-tab behavior for links. Use accessible names, keyboard interaction, focus states, and a workable narrow-screen navigation path. Authorized edits and writes belong to the requested workflow; a dashboard task does not by itself authorize deployment, publishing, messaging, or production mutations.

## Make charts explain something

Choose a chart because it answers a concrete question that a table or badge does not answer as clearly. Avoid decorative graphs and charts that only repeat a nearby status count. Do not require charts on every tab.

Use shadcn chart containers and tooltips with the project's chart library. Label units, scope, aggregation, and time window where they affect interpretation. Keep exact values and supporting records available through a table, detail view, or accessible equivalent. Preserve legitimate zero and negative values; missing data is not zero. Never invent trend history or telemetry to fill space.

Read [data and charts](references/data-and-charts.md) when building metrics, comparisons, or visualizations. Keep all domain formulas and thresholds specific to the current application.

## Verify the finished interface

Render the actual views, not just isolated primitives. Use Storybook when available; otherwise use the application's preview and appropriate fixtures. Inspect the states affected by the change: representative data, loading, empty/filter-empty, failure, incomplete measurements, long labels, selected records, dark mode, and narrow widths. Exercise menus, filtering, navigation, scrolling, and refresh behavior where relevant.

Test meaningful behavior and data transformations: filter consistency, selection stability, request races, aggregation, missing values, or comparison compatibility. Do not add tests that merely restate a class name or mirror a trivial visual edit. Run the project's relevant type-check/build/tests and any required documentation checks. Fix observed defects, then stop expanding validation when the requested behavior is verified.

When a local preview needs to remain available, use the environment's persistent process mechanism, record its URL and logs, and verify both the page and data endpoint. Do not claim a temporary process will stay up indefinitely.

Keep documentation with the behavior it describes. Write Markdown prose as one source line per paragraph or list item, with structural line breaks for headings, lists, tables, and code. Finish with the implemented behavior, where to see it, and concise validation evidence.

## Optional starting asset

For a list-and-detail dashboard, [DashboardWorkspace.tsx](assets/DashboardWorkspace.tsx) supplies a domain-neutral shadcn shell with a persistent desktop sidebar, mobile drawer, independent content scrolling, and a navigation-close callback. Adapt it to the project's aliases, layout ownership, router, and component APIs. It contains no record schema, API calls, metrics, or domain labels. For overview dashboards, use the layout guidance instead of copying this shell unnecessarily.
