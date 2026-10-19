# Data, charts, and refresh behavior

## Establish metric meaning

Before wiring a visual, identify the entity being counted, numerator/denominator where applicable, unit, aggregation, window, selected population, and definition of missing/partial data. Do not fabricate data contracts; use the application's source or explicitly labeled prototype fixtures.

Keep legitimate zero, missing, incomplete, stale, estimated, and failed measurements distinguishable when these distinctions exist. Negative values may be valid for balances, temperatures, corrections, and deltas; a nonnegative filter from another domain is not a general numeric validator. Format small values with enough precision to avoid implying a nonzero observation is exactly zero.

Derive aggregates from the correct underlying totals or domain-approved weighting. Do not average percentages, percentiles, or already aggregated summaries without understanding the denominator and population. Label sums of durations separately from elapsed wall time. If retries, corrections, refunds, or other repeated observations exist, define whether a chart shows the latest state, unique entities, or all events; avoid both silent omission and double-counting.

## Choose a visual by question

| Question | Useful starting visual |
| --- | --- |
| What changed over time? | Line chart with a real time axis and visible gaps for missing periods |
| Which groups contribute or differ? | Sorted horizontal bars, with a consistent scale for comparable measures |
| How are observations distributed? | Histogram or box plot, with explicit bins or quantile definitions |
| How does composition change? | Stacked bars/areas when totals and categories are interpretable |
| Are two measures associated? | Scatter plot with units and an appropriate sampling/aggregation explanation |
| What exactly happened? | Table or event timeline, often more useful than a chart |

Use familiar, readable charts before adding novel encodings. Keep status badges and simple counts as text when a chart adds no useful information. A single observation, all-zero values, or all-missing data should still render honestly; do not pad the series with invented points.

Use shadcn ChartContainer/ChartTooltipContent with the appropriate chart library. Label series, units, relevant coverage, and meaningful tooltips. Preserve stable category ordering and color identity across refreshes. Keep bar baselines at zero where length encodes magnitude; make any other axis choice explicit. Use integer ticks for counts and fixed comparable domains for bounded proportions.

Treat missing values as unavailable markers or gaps, not zero-length bars with an implied successful measurement. Some chart libraries omit labels for zero-width bars; verify that a real zero and an unknown value remain distinguishable. Use empty-state copy when an entire series is unavailable.

For distributions, specify boundary inclusion and the open-ended tail. Count each eligible observation in exactly one bucket and account for excluded/unknown values. Show outliers or expose them in supporting data rather than silently clipping them. Filtered charts and their tables must reconcile to the same intended population.

Keep exact values, supporting rows, and metric definitions available through a table, detail view, or accessible equivalent. Tooltips should enrich the chart, not be the sole way to retrieve essential data.

## Refresh and selection

Use the project's existing query/subscription tools when possible. A polling implementation needs cleanup, abort handling, stale-response protection, and a sensible refresh rate. Do not hard-code a two-second interval for every data source. Resume or back off according to the application's actual data and error behavior.

Keep list discovery independent of the user's selected record. Populate the first record once only if the product calls for it. When the user selects B while A's request is pending, an eventual response for A must not replace B. Treat route changes, unmounts, and browser navigation consistently.

Avoid clearing successful data merely because a refresh has started. Show an error/freshness state when old data is still displayed; distinguish that from an empty result. Scope filters must be reflected in the request or derived data, and in chart/table captions where ambiguity matters.

For a local preview, distinguish browser assets, a development proxy, and the underlying API when diagnosing availability. A page returning 200 does not prove its data endpoint works. Use persistent processes and explicit logs when the preview should remain available beyond the current tool session.

## Evidence to check

Test the transformations and interactions that could mislead the user: missing versus zero, valid negatives, aggregate reconciliation, filter consistency, histogram boundaries, compatible comparison scope, initial discovery, selection stability, and stale response races. Use actual fixtures with failure and partial-data states. Visually inspect labels, long category names, axis precision, tooltips, responsiveness, dark colors, and a single-value/all-missing case for the charts you implement.
