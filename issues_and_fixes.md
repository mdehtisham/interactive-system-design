# Issues & Fixes

Confirmed bugs encountered during development and their verified fixes.
Only append an entry after the user confirms a fix is correct.

---

## 1. Invisible Sidebar / TOC Hover and Active States

**Symptom:** Sidebar Home link, topic links, and Table of Contents active/hover
states were invisible in light mode. Clicking showed no visual feedback.

**Root cause:** shadcn/ui's `--accent` CSS variable resolves to near-white
(`hsl(240 4.8% 95.9%)`) in the default neutral light theme. Classes like
`bg-accent` and `hover:bg-accent` produced no visible colour difference against
a white background.

**Fix:** Replaced every `bg-accent` / `hover:bg-accent` reference in
`Sidebar.tsx` and `TableOfContents.tsx` with explicit Tailwind palette classes:
- Active: `bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400`
- Hover: `hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900`

**Rule:** Never use `bg-accent` or `text-accent-foreground` for interactive
states. Always use explicit palette colours. Verify all hover/active states in
light mode before marking a component done.

---

## 2. Tag Badge Colours Too Harsh / Unreadable

**Symptom:** Difficulty / frequency badge tags in `TopicHeader.tsx` used high-
saturation ring styles (`ring-rose-500/20`) that looked harsh and inconsistent
with the rest of the UI in light mode.

**Root cause:** Initial tag styles were chosen without referencing a real design
system. Ring-based badges clash with Tailwind's prose colours.

**Fix:** Adopted the MDN docs badge pattern — lighter background, darker text:
```ts
easy:   'bg-green-100  text-green-900  dark:bg-emerald-500/10 dark:text-emerald-400'
medium: 'bg-amber-50   text-amber-900  dark:bg-amber-500/10   dark:text-amber-400'
hard:   'bg-red-100    text-red-900    dark:bg-rose-500/10    dark:text-rose-400'
high:   'bg-blue-100   text-blue-900   dark:bg-violet-500/10  dark:text-violet-400'
```

**Rule:** Badge/tag styles must follow the `bg-*-100 text-*-900` (light) /
`bg-*-500/10 text-*-400` (dark) pattern. Never use ring-based badges.

---

## 3. Prose Body Text Too Light in Light Mode

**Symptom:** Paragraph text, list items, and table cells inside MDX topic pages
rendered in a light grey colour that was difficult to read in light mode.

**Root cause:** Tailwind CSS v4's typography plugin does not correctly resolve
`--tw-prose-body` from the theme's `--foreground` CSS variable. The default
prose colour falls back to a muted grey.

**Fix:** Added explicit prose modifier classes to the `<article>` in
`src/app/topics/[slug]/page.tsx`:
```tsx
prose-p:text-foreground prose-li:text-foreground prose-td:text-foreground
```

**Rule:** Always include `prose-p:text-foreground prose-li:text-foreground
prose-td:text-foreground` on every `<article>` that renders MDX prose. Do not
rely on the typography plugin to inherit `--foreground` automatically in v4.

---

## 4. React `removeChild` NotFoundError in MermaidDiagram

**Symptom:** Browser console threw `NotFoundError: Failed to execute
'removeChild' on 'Node': The node to be removed is not a child of this node`
when a Mermaid diagram finished rendering.

**Root cause:** The original `MermaidDiagram` component rendered a
`<span>Rendering…</span>` as a React-managed child of the container div, then
called `containerRef.current.innerHTML = svg` directly. Mermaid replaced the
innerHTML (removing the span), but React still tracked the span internally and
later tried to remove it from a node that no longer contained it — crash.

**Fix:** Rewrote `MermaidDiagram` (`src/components/mdx/MermaidDiagram.tsx`) to:
1. Store the rendered SVG string in React state (`useState<string | null>`)
2. Use `dangerouslySetInnerHTML={{ __html: svgContent }}` to hand SVG to React
3. Make the loading `<div>` and the SVG `<div>` mutually exclusive branches —
   they never share a DOM parent simultaneously

**Rule:** Never mix direct `innerHTML` mutation with React-managed children on
the same DOM node. If third-party code must write raw HTML, always use
`dangerouslySetInnerHTML` on a dedicated node that React controls exclusively.

---

## 5. Mermaid `chart` Prop Arrives as `undefined` in MDX

**Symptom:** Mermaid diagrams rendered an error: `Cannot read properties of
undefined (reading 'replace')`. The `chart` prop was `undefined` even though
the MDX file contained the chart string.

**Root cause:** MDX's JSX parser interprets `{` as the start of a JavaScript
expression. erDiagram syntax (`DOMAIN {`, `||--o{`) contains bare `{` characters
inside what looked like a template literal passed as a JSX prop. The parser
broke the prop value and delivered `undefined`.

**Fix:** Moved all Mermaid chart strings into dedicated TypeScript wrapper
components (e.g. `DnsErDiagram.tsx`, `DnsResolutionDiagram.tsx`). In TypeScript
files the chart string is a plain `const` — no MDX parser involvement. These
components are registered in `MDXComponents.tsx` as zero-prop JSX tags.

**Rule:** Never pass Mermaid chart strings as inline props in MDX files if the
string contains `{` or `}` characters. Always wrap them in a TypeScript
component where the chart string is a module-level `const`.

---

## 6. Tooltip Clipped by Ancestor `overflow` in PassiveFlow

**Symptom:** Hovering a node in the DNS Resolution Pipeline animation showed no
tooltip — the tooltip content was invisibly clipped above the animation card.

**Root cause:** The `NodeBox` tooltip used `position: absolute; bottom: 100%`
to render above the node. The layout's `<main>` element uses `overflow: auto`
(a scroll container), which clips all absolutely positioned descendants that
overflow its bounds — regardless of `z-index`. Removing `overflow-hidden` from
the animation card did not help because the clip was higher in the DOM tree.

**Fix:** Rewrote the tooltip in `PassiveFlow.tsx` to use a **React portal**:
1. Added `import { createPortal } from 'react-dom'`
2. Added `nodeRef = useRef<HTMLDivElement>(null)` on the `motion.div`
3. On `openTooltip`: call `nodeRef.current.getBoundingClientRect()` to get the
   node's viewport-relative position, store `{ top, left }` in state
4. Render the tooltip via `createPortal(..., document.body)` with
   `position: fixed; top: <rect.top - 8>; left: <rect.left + width/2>;
   transform: translate(-50%, -100%); z-index: 9999`

`position: fixed` is relative to the viewport, not any scroll container, so it
escapes all ancestor `overflow` constraints entirely.

**Rule:** Any tooltip, popover, or dropdown that must appear above a scroll
container or element with `overflow: hidden/auto` MUST use a React portal
rendering into `document.body` with `position: fixed` coordinates derived from
`getBoundingClientRect()`. Never rely on `z-index` alone to escape overflow.
