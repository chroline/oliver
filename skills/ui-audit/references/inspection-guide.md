# Inspection guide

Use this for a comprehensive review or as a focused reference for the affected component. Convert relevant prompts into concrete checks for this product. Do not count every prompt as an automatic requirement or mark unexercised states passed.

## Coverage matrix

A useful row is a route or component plus an interaction state, not just “Settings reviewed.” Track the actual viewport/device, evidence method, finding IDs, and result. Choose a small set of representative widths, then add the breakpoints where this UI changes composition. Include a short window; tall desktop screenshots conceal scroll and navigation problems.

Example cells:

- Populated main list: narrow phone, intermediate width, wide desktop.
- Long-title row: default, hover, focus, overflow menu, pending action.
- Settings: loading, partial load failure, confirmation, failed confirmation, cancellation.
- Detail: internal navigation, cold deep link, refresh, back.
- Global chrome: empty state, active task, scroll, modal, short landscape window.

A declared coverage percentage needs a stable denominator and exclusions. Record any discovered additions rather than shrinking the matrix to improve the percentage. Explain whether “reviewed” means source or live observation. A flow can be reviewed and still fail.

## Composition and navigation

- Does the primary content begin soon enough, or do status panels, heroes, filters, or empty controls consume the viewport?
- Do title, toolbar, rows, cards, and footer share an intentional alignment system? Does the content become absurdly wide or stranded in one corner on desktop?
- Are page title size and title-to-content gaps consistent across sibling routes?
- Are large blank regions explained by a meaningful layout decision? Could they be an unfilled grid column, hidden control, or constrained header?
- Can users find Settings and other important destinations without guessing an unrelated avatar/icon behavior?
- Are current route, selected filter, and current item visually distinct and semantically exposed?
- Is Back predictable after normal navigation and a cold detail URL? Does refresh preserve the appropriate selection?
- Does a side panel open only when intended? Does its appearance squeeze the main content below usable dimensions?

## Spacing, type, icons, and surfaces

- Compare actual baselines and edges. Check icon-to-label gaps, row padding, section spacing, trailing actions, and number alignment.
- Check short and long labels. A stable card title area can support equal rows, but excessive reserved space makes short titles look detached from metadata.
- Look for one-word wraps, squashed metadata, giant headings on narrow forms, and unnecessary ellipses caused by oversized secondary controls.
- Truncation needs recovery appropriate to the content: details, expansion, wrapping, or another clear interaction. Hover-only access is insufficient on touch devices.
- Compare icons optically: equal bounding boxes do not make different glyph families look equal. Keep provider/brand marks recognizable.
- Compare radii, borders, raised surfaces, emphasis, and text colors across siblings. Exceptions should express a role.
- Measure text contrast where questionable; do not infer compliance from a dark theme or muted token name. Check focus and disabled visibility separately.

## Rows, cards, and artwork

- Distinguish the row's primary action from save, queue, menu, and removal. Avoid nested controls that accidentally trigger the row.
- Check target sizes, crowded trailing actions, hover/press feedback, current/selected states, and blocked items.
- A disabled playback action should not unnecessarily remove unrelated management actions.
- Artwork must preserve geometry while loading or failing, and show a deliberate fallback. Check crop and aspect ratio, not just successful URL loading.
- Cards should show truthful identity and counts. Arbitrary decorative variants can look like unfinished placeholders.
- Test empty, one-item, many-item, and long-content cases. Confirm pagination appends where users can see it and lists do not mount everything unnecessarily.

## Search and filtering

- Is search scope clear? Does the user expect local content, the catalog, or the current collection? Verify it searches the claimed scope.
- Can all filters be discovered at narrow widths? Does selection shift widths, clip the chosen item, or leave a stale incompatible filter?
- Are service/order/selection conventions consistent across surfaces?
- Are unavailable-service, no-result, error, and loading states distinct? Avoid contradictory counts or multiple recovery panels for one failure.
- Check empty and populated input focus, clear-button visibility, keyboard traversal, and long queries.
- Inspect the entire field while focused: an input's native outline plus a container outline can create accidental nested rings. Keep one clear focus treatment without removing keyboard visibility.

## Dialogs, menus, and forms

- Inspect desktop maximum width, phone gutters, short-screen scrolling, content-to-action spacing, and long confirmation labels.
- Can the dialog be named and reached with a keyboard? Exercise focus entry, cycling, Escape, and return to the trigger in the actual platform.
- Are background controls still interactive? Do tooltips or menus linger behind or over the overlay?
- Does pending feedback identify the actual operation? Can a repeat click launch duplicate work?
- Does failure appear beside the action or inside the open dialog, rather than behind it? Does the dialog remain usable after failure?
- Do helper text, inline validation, and submit eligibility agree? Verify the actual enabled/disabled behavior.
- Check password visibility targets, autofill, long error messages, keyboard avoidance and scrolling on a real device when available.
- Do not submit real authentication, recovery, or destructive actions solely to obtain a screenshot. Separate visual validation from successful external delivery.

## Player or other stateful controls

Apply these to media, uploads, jobs, and other controls whose UI represents external work:

- Does “playing/running/success” reflect observed engine state or merely the user's requested intent?
- Are loading, authorization, paused, failed, and finished states distinguishable?
- Does failure offer a useful retry or alternative? Can startup remain pending forever?
- Do compact controls provide a clear way to reach omitted functions and full metadata?
- Are boundary controls disabled correctly? Are known durations, counts, and progress values shown truthfully?
- Does reload restore the appropriate state without unexpectedly restarting work?
- Are hidden embeds or helper elements named, excluded from keyboard navigation when appropriate, and prevented from leaking into the visible layout?

## Accessibility and responsive evidence

- Inspect rendered roles, names, landmarks, selected state, and numeric progress. Framework props do not guarantee the resulting DOM exposes them.
- Exercise keyboard actions; source inspection cannot establish focus containment.
- Check zoom/large text and real screen readers when in scope and available. List them as unverified otherwise.
- Web emulation checks responsive web composition. Native device checks additionally cover safe areas, software keyboards, touch targets, system theme, launcher assets, and platform-specific navigation.
- Inspect the final row/card and bottom actions while scrolling. Fixed bars, sticky headers, and nested scroll containers can hide content even when the initial viewport looks good.

## Final regression sweep

Revisit the original user screenshots and compare the same conditions where possible. Then look beyond those screenshots:

- A shared fix reached one route but missed its alternate rendering.
- A cleaner layout hid a useful action or introduced an invisible keyboard stop.
- A loading state or route change produces a blank frame, jump, or stale count.
- Shortened copy became ambiguous or still wraps at the narrowest supported width.
- A new component changed tests, focus behavior, event propagation, or native compatibility.
- Test results passed while the captured UI still had obvious visual defects.
- A report still describes an earlier implementation or treats a source-only change as verified.

Attach newly found regressions to the same record. Recheck the changed path after correcting them; broad repeated testing is only useful when the change or unresolved concern warrants it.
