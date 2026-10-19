# Layout and navigation patterns

Choose a composition based on the user's task. The same visual language can support monitoring, business analytics, inventory, support queues, jobs, projects, infrastructure, or content management without inheriting any one domain's fields.

## Record workspace: the email-list pattern

Use the list section of [shadcn sidebar-09](https://ui.shadcn.com/blocks/sidebar#sidebar-09) as the reference. Preserve its flat rows, separators, compact information hierarchy, and independent list scrolling. The block also contains an icon rail and account controls; include those only when the application actually has those navigation areas or account actions.

A useful row has a readable primary label, optional short identifier or secondary description, a small amount of status/time context, and at most the few values useful for choosing which record to inspect. Use domain-appropriate content. Do not add commit hashes, spending, review verdicts, or other fields simply because a different dashboard used them. Expose full truncated values in a detail view or an accessible tooltip where needed.

Keep search and state/scope filters above the scrolling list. Put actions that apply to the selected record or a comparison in a clearly scoped location. Avoid several full-width controls when one selection and one action suffice. Use an actual link for each record with `aria-current="page"` on the selected one; intercept only ordinary navigation clicks if a client router requires it.

Use the existing shadcn Sidebar, SidebarHeader, SidebarInput, SidebarContent, SidebarFooter, SidebarInset, and mobile Sheet behavior. The optional [workspace asset](../assets/DashboardWorkspace.tsx) demonstrates the layout. A desktop list width around 20–24rem is a useful starting point, not a universal fixed value.

The height/overflow chain matters: constrain the workspace to the available viewport or parent height, keep the main pane `min-w-0`, keep scrolling flex children `min-h-0`, and give each pane its own `overflow-y-auto`/SidebarContent. If the host application has a header, use its remaining-height contract rather than placing another full-screen `h-dvh` shell inside it. Tables may scroll within their own container; the entire page should not overflow horizontally.

For small screens, expose a labeled control to open the list in a drawer, then close the drawer after selection. Keep filter, sort, comparison, and selection state above the drawer: Sheet content often unmounts when closed. A render callback does not preserve state inside a component that is unmounted; the navigation itself must receive controlled state from a stable owner.

Resolve an explicit route first. If no record is specified, either select the first appropriate record once or show a neutral selection prompt, depending on the workflow. Do not select the newest item on every refresh. If a selected record disappears, explain that state and let the user choose another; do not silently show unrelated data under the old route.

Use main-pane tabs only for distinct jobs or content types. Switching a record should deliberately reset or preserve its active tab and scroll position according to the product's semantics. Avoid remounting the navigation when changing detail routes. The asset's optional `contentKey` resets only the content subtree; omit or refine it when forms or unfinished work should survive navigation.

## Aggregate overview

Start with the shared controls that define the data: time range, organization/site/project, segment, environment, or whatever the real data model uses. Explain whether a control changes the whole page or a local section.

Place a small number of decision-relevant summary measures before the visualizations. Choose charts that reveal change, distribution, or comparison; add a table of contributors, exceptions, or underlying observations for investigation. Order sections by the user's question, not by the order fields arrive from an API.

Provide drill-down links that carry relevant scope into a detail or filtered list. A global filter should not silently disappear when the user opens a contributor. Preserve existing app navigation; a dashboard overview does not need an additional sidebar just to look like an application.

## Comparison

Make the compared entities or periods explicit, with consistent units, definitions, windows, and selection scope. Label absolute changes versus percentage changes and percentage-point changes. Define which direction is favorable only when the domain supports that interpretation.

Show incompatible or missing data, including failures, instead of comparing an invisible intersection that makes an outcome look better. Provide entity/row-level contributors when they help explain the summary. A comparison view can live in the main pane of a record workspace while leaving the list available.

## Operational table or queue

Prefer a sortable/filterable table when users need to scan many entities, compare columns, or operate on a selection. Keep action scope explicit: one record, selected rows, or all matching rows. Use pagination or virtualization when actual scale requires it; show counts and preserve selection identity across sorting and filtering.

Use detail panels or routes for richer context. Do not squeeze every field and action into each row. Keep state indicators and actionable errors near the relevant record.

## Apply the pattern across domains

| Example request | Likely useful composition | Avoid carrying over |
| --- | --- | --- |
| Service health dashboard | Time-scoped overview, error/latency trends, service drill-down | Experiment reviews or an inbox list as the only landing view |
| Inventory dashboard | Searchable product/location table and selected item detail | Fixed quality metrics or model-token costs |
| Support workspace | Ticket list with conversation/detail pane and real queue controls | A chart of each ticket's status when the list already communicates it |
| Revenue analytics | Period/segment overview, trends and contributors, compatible period comparison | Treating negative adjustments as invalid or missing revenue as zero |
| Content administration | Filterable records with previews and authorized editing actions | Assumptions that every dashboard is read-only |

These are composition examples, not additional features to build without a request.
