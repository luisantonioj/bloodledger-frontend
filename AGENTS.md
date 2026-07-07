# agents.md — Guidelines for AI-Assisted Development on BloodLedger Frontend

This file tells any AI coding assistant (and any human) exactly how this codebase is built so changes stay consistent with the existing mock frontend. Read `readme.md` and `context.md` first for the "what" and "why" — this file is the "how."

## Ground rule: preserve the existing UI/UX

This mock frontend is the **accepted design baseline**. It was built, reviewed, and is being used as the prototype the thesis panel expects to see working. Unless a task explicitly asks for a visual or interaction change:

- Do not restyle existing components, change layout, change copy tone, or swap the color/typography system.
- Do not introduce a CSS framework (Tailwind, Bootstrap, etc.), a component library (MUI, Chakra, shadcn, etc.), or a charting library — this codebase deliberately hand-rolls all of it (see `design.md`).
- Do not introduce React Router, Redux, Zustand, or any state/routing library. Navigation is a single `page` string in `App`'s `useState`; state is local `useState`/`useContext`. Keep new work inside that pattern.
- Prefer extending an existing component/pattern over inventing a new one. If `Chip`, `Stat`, `Modal`, `Btn`, `PageHead`, or `Chip`/`StatusChip` already express what a new UI element needs, reuse it.
- Match the codebase's tone throughout the app: terse, operational, blockchain/lab-technical (block numbers, tx hashes, chaincode names, mono-spaced identifiers). Don't soften or "consumerize" copy.

## Module system and file loading

There are **no ES module imports/exports**. Every `.jsx`/`.js` file is loaded as a plain `<script>` (Babel-transpiled in-browser for `.jsx`) and shares one global `window` scope. Each file explicitly attaches what it wants to expose:

```js
Object.assign(window, { DashboardPage });
```

Rules when adding or editing a file:

1. **Read from `window`, write to `window`.** Reference shared data (`window.HOSPITALS`, `window.INVENTORY`, etc.) and shared components (`Sidebar`, `Btn`, `I`, ...) as bare identifiers — they're already global once their script has loaded. Don't add `import`/`export` statements; Babel Standalone here is configured for plain script transforms, not ES modules, and `index.html` has no `type="module"`.
2. **Respect load order in `index.html`.** A new page script must be added as a new `<script type="text/babel" data-presets="react" src="pages/yourpage.jsx">` line **after** `components.jsx` (and `tweaks-panel.jsx` if you use tweak controls) and **before** `app.jsx`, since `app.jsx` references every page component directly.
3. **One page = one file** in `pages/`, following the existing `pages/<name>.jsx` → `<Name>Page` component naming (see Naming conventions below). Multi-part pages can define helper components in the same file (see `transfers.jsx`'s `TransferDetail` and `TransferWizard` alongside `TransfersPage`) and export all of them via the same `Object.assign(window, {...})` call at the bottom.
4. **Shared UI goes in `components.jsx`**, not duplicated per page. If two pages need the same visual pattern, extract it there.
5. **Mock data goes in `data.js`**, assigned to `window`, never inlined ad hoc in a page component — this keeps the eventual backend swap (see "Preparing for backend integration" below) a single-file concern.

## Naming conventions

| Thing | Convention | Examples from the codebase |
|---|---|---|
| React components | PascalCase, `<Name>Page` suffix for full pages | `DashboardPage`, `TransfersPage`, `LoginPage` |
| Sub-components within a page file | PascalCase, no forced suffix | `TransferDetail`, `TransferWizard`, `NetworkMap` |
| Shared/chrome components | PascalCase, short | `Sidebar`, `Topbar`, `PageHead`, `Stat`, `Chip`, `Btn`, `Modal` |
| Hooks | camelCase, `use` prefix | `useTweaks` |
| Event handlers / callbacks (props) | camelCase, `on` prefix | `onNav`, `onAct`, `onCommit`, `onSearch`, `onClose` |
| Local handler functions (inside components) | camelCase, verb-first | `navigate`, `handleAlertAction`, `handleCommit`, `commit`, `next`, `prev` |
| Global mock data | `window.SCREAMING_SNAKE_CASE`, plural where it's a collection | `window.HOSPITALS`, `window.INVENTORY`, `window.TRANSFERS`, `window.BROA_CANDIDATES` |
| CSS custom properties | `--kebab-case`, grouped by purpose (surfaces, ink, lines, accents, status, type, radii) | `--bg`, `--ink-3`, `--blood`, `--critical-bg`, `--font-display`, `--r-md` |
| CSS classes | kebab-case, component-scoped prefixes for compound widgets (`matrix-cell`, `alert-card`, `hash-chip`) | `.matrix-cell.s-critical`, `.alert-card.warn`, `.filter-chip.active` |
| Data record fields (mock data shape) | camelCase for JS-facing computed fields, but source fields mirror domain terms directly (`isbt`, `broa`, `fefo_isbt`, `days_left`) — **follow the existing field names exactly**, don't rename them for "consistency" | see `data.js` |
| IDs in mock data | Domain-prefixed, zero-padded where relevant | `TX-2026-0492` (transfers), `AL-7741` (alerts), `=)W0381 2509 100023` (ISBT-128 unit) |

When adding a new mock record type, follow the closest existing shape rather than inventing new field-naming style (e.g. a new "requests" collection should look like `TRANSFERS`, not introduce camelCase where the rest of the file uses snake_case for domain fields like `tx_hash`, `days_cover`, `broa_candidates`).

## Component and styling rules

- **Icons**: add new icons to the `ICONS` map in `components.jsx` as a single SVG path string (1.5–1.6 stroke width, 24×24 viewBox, `currentColor`), then reference via `<I name="yourIcon" />`. Don't pull in an icon package.
- **Colors**: never hardcode a hex value in a component. Use the CSS custom properties defined in `styles.css`'s `:root` (and `.theme-dark` overrides). If a new semantic color is needed (e.g. a new status), add it as a token following the existing `--<name>` / `--<name>-bg` pairing pattern, not as an inline style hex.
- **Typography**: `serif` class (`--font-display`, Newsreader) for headings/large numerals, default sans (`--font-sans`, Inter) for body/UI, `mono` class (`--font-mono`, JetBrains Mono) for identifiers, hashes, timestamps, block numbers, and tabular numeric data. Don't mix these in ways the rest of the app doesn't already do — see `design.md` for the full rationale.
- **Layout primitives**: reuse `.card`/`.card-h`/`.card-b`, `.page`, `.page-head`, `.grid-dash`, `.grid-3`, `.grid-2`, `.stat-grid`, `.row`, `.col` utility classes already defined in `styles.css` instead of writing new one-off flex/grid CSS per component.
- **Density and theme**: any new component must work under both `density-compact`/`density-regular` and light/`.theme-dark` — check `styles.css`'s bottom sections before shipping a new component and add the equivalent overrides if the component introduces new background/border colors.
- **No inline hex/pixel magic numbers duplicated from the token system.** Small one-off `style={{ height: 18 }}` spacer divs (as already used throughout for section gaps) are acceptable and consistent with existing usage; introducing a new hardcoded color or font-size is not.

## State and data rules

- Keep state as close to where it's used as possible; only lift to `App` what genuinely needs to be shared across pages (session, current page/pageState, search, transfers — see `app.jsx`).
- Mutations to shared mock collections currently happen by calling `setTransfers` **and** reassigning `window.TRANSFERS` in the same handler (see `handleCommit` in `app.jsx`). This dual-write is a stopgap for a global-scope app with no store; when a real API layer is introduced, replace both writes with a single API call + local state update, and remove the `window.*` mutation.
- Don't introduce `localStorage`/`sessionStorage`/cookies for app state in this codebase — there is no persistence layer yet, and the eventual persistence will be the backend/blockchain, not browser storage.

## The tweaks panel (`tweaks-panel.jsx`)

This file implements a floating design-preview control panel (dark mode, accent color, density, "show login screen") plus a host communication protocol (`postMessage` calls like `__edit_mode_available`) used by the design-prototyping tool this mock was built in. It is **not part of the product** — it's a development/demo convenience.

- Do not extend product functionality through the tweaks panel (e.g. don't add a "role" switcher here as a substitute for real auth/role-gating).
- When preparing this codebase for real deployment, `tweaks-panel.jsx` and its `<script>` tag in `index.html`, along with the `TWEAK_DEFAULTS`/`Tweaks` wiring in `app.jsx`, should be removed or gated behind a dev-only build flag. Track this as an explicit deployment-prep task (see `tasks.md`).

## Preparing for backend integration (frontend-side rules)

The frontend does not yet call any real API. When backend integration work begins:

- Replace `window.*` mock collections in `data.js` with `fetch`/API-client calls, but **keep the same field shapes** wherever possible so page components need minimal changes — page components should be agnostic to whether their data came from `data.js` or a network call.
- Introduce loading and error states for anything that becomes an async call (tables, matrix, wizard candidate lists) — the current prototype has no loading/error UI anywhere because everything is synchronous mock data; don't skip this when wiring real calls.
- Respect the "real-time" requirement (NFR-06, 5-second reflect time) — prefer short-interval polling or a subscription mechanism over manual refresh-only, but do not block this documentation pass on choosing that mechanism; it's a task for `tasks.md`, not a decision to make silently mid-edit.
- Role-based UI gating (hiding write actions for read-only DOH/PRC/secondary-hospital sessions) does not exist yet — the login page collects a role but `app.jsx` doesn't branch on it. This is a known, tracked gap (see `tasks.md`), not something to silently "fix" as a side effect of an unrelated change.

## General repo hygiene

- No trailing dead code, commented-out blocks, or TODOs left without a corresponding entry in `tasks.md`.
- Keep each page file self-contained and readable top-to-bottom in the order it renders (header/PageHead first, primary content, secondary panels) — this is the existing convention in every `pages/*.jsx` file.
- When a change touches shared data shapes in `data.js`, check every page/component that reads that collection (`grep` for the `window.NAME` reference) before committing — there is no type system in this codebase to catch a missed consumer.
- Keep commit-sized changes scoped to one page or one shared concern at a time; this codebase's lack of modules/bundler means a broad multi-file change is harder to review and easier to break silently (a typo in a global reference fails at runtime, not at build time).
