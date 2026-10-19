# shadcn implementation

## Preserve the design source

The preferred new-dashboard preset is **`b7BFgTmLK`**. Its intended combination is Nova/Mist, Geist, Lucide, default radius, and subtle/translucent menus. Existing dashboard configuration should remain authoritative unless the user asks to replace it.

Before applying a preset, inspect the current `components.json`, CSS theme, font loading, package versions, aliases, and component sources. Use the installed/current shadcn CLI's help and official documentation to verify the supported preset workflow; CLI commands and registry output can change. Use the actual preset generator instead of approximating colors or mixing files from a different style. For an existing project, do not blindly run initialization over customized components.

The relevant configuration produced for this preference has used `style: "radix-nova"`, `baseColor: "mist"`, `cssVariables: true`, `iconLibrary: "lucide"`, `menuColor: "default-translucent"`, and `menuAccent: "subtle"`. Verify the current generator's result rather than treating these values as a replacement for all generated styles. Set the hooks alias consistently with the generated hook location; a generated import such as `@/components/hooks/use-mobile` must not point at a hook actually installed under `@/hooks/use-mobile`.

Add only needed primitives through the registry. For example, an existing pnpm application with the CLI installed can use `pnpm exec shadcn add sidebar` or `pnpm exec shadcn add chart`. Inspect generated diffs and dependency/lockfile changes. Resolve overwrite prompts deliberately; preserve unrelated customizations. An overwrite flag is not a substitute for reviewing existing component behavior.

References: [shadcn documentation](https://ui.shadcn.com/docs), [sidebar-09](https://ui.shadcn.com/blocks/sidebar#sidebar-09), [charts](https://ui.shadcn.com/docs/components/chart). Read the relevant current source when APIs or style behavior are uncertain.

## Composition details that prevent divergence

- Start from the installed component's variants and size props before adding wrapper overrides. Keep source primitives reusable; put feature-specific composition in the feature view.
- Use a real shadcn Select/Combobox for choices. Give the trigger an explicit usable width, `min-w-0`, and a truncating selected label. The menu can be wider than its trigger, but must remain within the viewport and accommodate long options. Use a second line for an identifier when names alone are ambiguous.
- Use compact table sections with a small title, optional scope/coverage note, and the table directly below. Do not style a table heading like a marketing card title. Use borders/backgrounds from the preset rather than improvised shadows and gradients.
- Give search inputs a deliberate width appropriate to their container and placeholder. Do not assume a full-width input will fit in a wrapping toolbar beside several large selectors. Allow the layout to stack coherently at narrow widths.
- Keep portaled menus and drawers in the same font/theme. Wrap tooltip use with the required TooltipProvider. Use the generated Sheet's focus/escape behavior rather than implementing a bespoke overlay.
- In the record-list pattern, use full-width flat rows separated by borders and a clear selected background. Use semantic links or shadcn Button with `asChild` as appropriate. Avoid nested interactive controls inside an anchor/button.
- Confirm prop forwarding against the primitive API. A visual progress track must receive its value at the accessible root as well as display a fill; an accordion's animation height must correspond to its primitive's actual CSS variable.
- Generated chart CSS may target selectors that differ from the installed chart-library version. Inspect actual axis/tick/tooltip elements in the browser if theme colors do not apply. Fix the observed selector mismatch rather than stacking competing text-color rules.

Use the host project's styling conventions. The dimensions in a reference are starting points: readable hierarchy, compact rhythm, consistent controls, and working responsive behavior matter more than copying every pixel.
