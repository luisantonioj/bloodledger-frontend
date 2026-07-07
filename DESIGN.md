# design.md — BloodLedger UI/UX System

This documents the visual and interaction system **as built** in the mock frontend. It is a reference for staying consistent, not a proposal — every value below is taken directly from `styles.css`, `components.jsx`, and the page files.

## Design direction

BloodLedger reads as a **clinical operations console with editorial polish** — closer to a lab information system or a trading desk than a consumer health app. The intent is trustworthiness and precision: a serif display face for numbers and headings gives it gravity, a warm paper-toned background (not clinical white, not dark-mode-by-default) keeps it human, and a deep blood-red accent is used sparingly and deliberately for the brand mark and primary actions — never decoratively.

Three qualities every new screen should preserve:
- **Density with hierarchy.** Lots of real operational data (tables, matrices, ledgers) fits on screen at once, but page heads, stat tiles, and card headers create clear scan points.
- **Provenance everywhere.** Any data point that could be questioned (a stock count, an alert, a transfer) is one click from its source — an ISBT number, a tx hash, a block number, a geo-signature. The UI should always feel auditable.
- **Calm urgency.** Critical/warn states are color-coded and immediate, but never alarmist — no red flashing, no modal interruptions for non-critical events; alerts live in a dedicated, scannable list.

## Color system

All color is defined as CSS custom properties in `styles.css`'s `:root`, with a parallel `.theme-dark` override block. **Never hardcode hex values in components** — reference tokens.

### Surfaces
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F4F1EB` | App background (warm paper) |
| `--bg-2` | `#ECE7DD` | Secondary/selected-row background |
| `--surface` | `#FFFFFF` | Card backgrounds |
| `--surface-2` | `#FAF8F3` | Secondary surface |
| `--chrome` | `#0F1620` | Sidebar background (near-black navy) |
| `--chrome-2` / `--chrome-hover` | `#1A2230` / `#232C3D` | Sidebar depth/hover |

### Ink (text)
`--ink` `#0E1218` (primary text) → `--ink-2` `#3A4250` → `--ink-3` `#6B7383` (muted) → `--ink-4` `#9098A6` (faint), plus `--ink-on-chrome` / `--ink-on-chrome-2` for text on the dark sidebar.

### Lines
`--line` `#DCD6C8`, `--line-2` `#E8E3D8` (lighter, for table rows), `--line-strong` `#B9B2A1`, `--line-chrome` `#232C3D` (sidebar borders).

### Brand accent
| Token | Value | Use |
|---|---|---|
| `--blood` | `#9A1B1B` | Primary accent — brand mark, primary buttons, "live" indicators |
| `--blood-deep` | `#6F0F0F` | Hover/pressed state of primary accent |
| `--blood-tint` | `#F6E5E5` | Subtle accent backgrounds |

The accent is **tweakable** in the prototype (tweaks panel offers `#9A1B1B`, `#7A3E2E`, `#4A6E5B`, `#234F9E` as alternates, applied by rewriting `--blood`/`--blood-deep` at runtime) — this exists for design review only; production ships with the single deep-red brand accent.

### Status colors
Every status chip, matrix cell, and alert severity maps to one of four semantic pairs (foreground + background):

| Status | Foreground | Background | Meaning |
|---|---|---|---|
| Critical | `--critical` `#C12F2F` | `--critical-bg` `#FBE7E7` | Out-of-stock / expiry ≤ threshold / severe alert |
| Warn | `--warn` `#B0660C` | `--warn-bg` `#FBEFD8` | Low stock / near-expiry / caution |
| OK | `--ok` `#2E7D5C` | `--ok-bg` `#E1F0E7` | Sufficient stock / completed / healthy |
| Info | `--info` `#234F9E` | `--info-bg` `#E2EAF8` | Surplus / informational / read-only regulator context |

Neutral chips use `--neutral-bg` `#ECE7DD`. **These four statuses are the entire status vocabulary of the app** — don't introduce a fifth color for a new state; map new states onto this scale (e.g. "Pending" → info or neutral, "Rejected"/"Compromised" → critical) so users can reason about severity at a glance regardless of the page.

## Typography

Three typefaces, each with one job — do not use a font outside its assigned role.

| Family | CSS var | Role | Applied via |
|---|---|---|---|
| **Newsreader** (serif) | `--font-display` | Page titles, hero headings, large numerals/KPI values, login hero copy | `.serif` class |
| **Inter** (sans) | `--font-sans` | All UI chrome, labels, body text, buttons, table content — the default | base `body` font |
| **JetBrains Mono** | `--font-mono` | IDs, hashes, timestamps, block numbers, ISBT codes, PINs, any tabular/numeric data that benefits from fixed-width alignment | `.mono` class, `.tnum` for tabular-figure numeric alignment |

Base body size is `14px` at `1.45` line-height. Serif headings use tight letter-spacing (`-0.01em` to `-0.02em`) for a refined, editorial numeral look, especially in `Stat` tiles and Reporting's large KPI numbers (`font-size: 56px`). Eyebrow/label text (`.page-eyebrow`, `.muted.tiny`, section labels) is small-caps-style: uppercase, `10–11px`, wide letter-spacing (`0.12–0.16em`).

## Layout system

### App shell
A two-column CSS grid: fixed `232px` sidebar + fluid `1fr` main content (`.app { grid-template-columns: 232px 1fr; }`). The login screen collapses this to a single column (`.app.login-mode`). Sidebar is `position: sticky; top: 0; height: 100vh` — it never scrolls with content.

### Sidebar (`Sidebar` in `components.jsx`)
Dark chrome background, top-to-bottom: brand mark + name → "Acting as" hospital pill (current chapter + truncated peer ID) → grouped nav (three fixed sections: **Operations** [Dashboard, Inventory, Transfers, Alerts], **Field & Network** [Scan & Intake, Consortium], **Compliance** [Audit Ledger, Reporting]) → user footer (avatar initials, name, role, sign-out). Nav items carry optional numeric badges (transfer count, critical alert count).

### Topbar (`Topbar` in `components.jsx`)
Breadcrumb trail on the left (derived from `crumbsByPage` in `app.jsx`, two levels: section / page), global search input center-right (`⌘K` hint, non-functional placeholder in the mock), a "Chain" status pill showing the current block number, and a page-specific `right` slot (currently used for the alerts bell button).

### Page body pattern
Every page follows the same skeleton, and new pages should too:
1. `PageHead` — eyebrow (small caps context line), serif `h1` title, one-sentence `sub` description, right-aligned `actions` (buttons).
2. Primary content — usually a `.card` containing a table or matrix, sometimes preceded by a `.stat-grid` of KPI tiles.
3. Secondary content — a `.grid-dash` (2-column dashboard-style grid) or `.grid-3` row of supporting cards.
4. `18px` spacer divs (`<div style={{ height: 18 }} />`) separate major sections — this is the established rhythm, not arbitrary.

### Cards
`.card` → `.card-h` (header: title `h3`, optional `.sub.muted` description, optional `.actions` slot) → `.card-b` (body, padded; `.card-b.flush` removes padding for edge-to-edge tables) is the universal content container. Nearly everything on every page lives inside one.

### Tables
`.tbl` is the standard data-table class: sans-serif body, `.mono` for identifier columns, `.right` for numeric right-alignment, `.row-clickable` for interactive rows (used to select/drill into a record — transfers, audit entries, inventory units all do this instead of a separate "view" page).

## Core components

| Component | Purpose | Key variants/props |
|---|---|---|
| `Btn` | All buttons | `kind`: default / `primary` (solid blood-red) / `ghost` (borderless); `size`: `sm` / default / `lg`; optional leading icon |
| `Chip` / `StatusChip` | Small status/category labels | `kind`: critical/warn/ok/info/neutral; `dot` for a leading status dot; `outline` variant |
| `BloodType` | Blood type badge (O−, AB+, etc.) | `lg` for large display size; auto-colors positive vs. negative |
| `Stat` | KPI tile | label, big serif value + unit, optional delta (up/down/neutral arrow) and inline `Spark` sparkline; `accent` for critical/warn/ok/info tinted background |
| `Spark` | Minimal inline sparkline (SVG polyline) | takes a numeric array |
| `Modal` | Centered dialog with scrim | `wide` variant for the transfer wizard; closes on Escape or scrim click |
| `Toast` / `ToastProvider` | Bottom-right transient confirmation | `kind: ok`; auto-dismiss (default 3.6s) via `ToastCtx` |
| `PageHead` | Standard page header (see Layout above) | eyebrow / title / sub / actions |
| `I` / `Icon` / `ICONS` | Inline SVG icon system | 24×24 viewBox, `currentColor` stroke, 1.6 default stroke width |

Page-specific composite components worth knowing before building something similar: `TransferWizard` + `TransferDetail` (transfers.jsx) for multi-step flows with a stepper; `NetworkMap` (consortium.jsx) for the animated SVG topology diagram; the inventory matrix cell grid (dashboard.jsx's `.matrix`/`.matrix-cell`) for the blood-type-by-status grid pattern reused conceptually (not componentized yet) across dashboard and consortium heatmap.

## Interaction patterns

- **Navigation is state, not routes.** Clicking a sidebar item, a table row, an alert action, or a "View on ledger" link calls `onNav(pageId, optionalState)`, which sets `page` and `pageState` in `App`. There is no URL routing — refreshing the browser resets to the dashboard. (See `agents.md` for why no router is introduced yet.)
- **Drill-down over separate detail pages.** Clicking an inventory matrix cell, a transfer row, or an audit row updates a filter/selection in place rather than navigating to a new URL-addressable page.
- **Wizards are modals with a step index**, not multi-page flows — see `TransferWizard`'s `STEPS` array and `step` state.
- **Destructive/committing actions require explicit confirmation.** The transfer wizard's final "Sign" step always requires PIN entry before commit; there is no one-click "approve" for a transfer.
- **Toasts confirm writes**, not reads — only actions that change ledger state (like `handleCommit`) trigger a toast.
- **Live/streaming language is used consistently**: pulsing `.live-dot`/`.peer-dot` indicators, "Streaming from peer0.mmc," block numbers in the topbar — any new real-time-feeling data should adopt this same visual vocabulary rather than a generic loading spinner.

## Responsiveness

**The current prototype has no responsive breakpoints** — there is no `@media` query anywhere in `styles.css`. The two-column `232px` + `1fr` grid, dense tables, and multi-column card grids (`.grid-dash`, `.grid-3`) are built and tested for desktop/laptop viewports only. This matches its intended users: hospital blood bank terminals and admin desks, not mobile field use.

Rules going forward:
- Do not assume mobile support exists; don't add mobile-only components or touch gestures without an explicit task for it.
- If/when responsive support is scoped (see `tasks.md`), the two natural breakpoints to design toward are: (1) collapsing the fixed sidebar into an overlay/drawer below ~960px, and (2) stacking `.grid-dash`/`.grid-3` into single columns below ~720px. Treat this as new work, not an assumed baseline.
- The Scanner page's camera view and the login page's two-column hero/form split are the two layouts most likely to need early mobile attention if field-device use is ever scoped (barcode scanning at a shelf), but this is explicitly out of the current proposal's scope (RFID/mobile scanning hardware is excluded per Scopes and Limitations) — don't build for it speculatively.

## Density and theme modes

Two independent runtime toggles exist today (via the tweaks panel, `app.jsx`'s `TWEAK_DEFAULTS`):
- **Density**: `regular` (default) vs. `compact` — compact reduces table cell padding, stat tile padding/font-size, page padding, and matrix cell sizing (`.app.density-compact` rules at the bottom of `styles.css`).
- **Theme**: light (default) vs. `.theme-dark` — dark mode redefines the same token set with darker surfaces and adjusted status-tinted gradients for matrix cells, stat accents, and alert cards.

Any new component with a background/border color must be checked against both density states and both themes before being considered complete — see `agents.md`'s component rules.

## Design rules — quick checklist for new UI

1. Use existing tokens (color, font, radius) — never a new hardcoded value.
2. Use an existing layout primitive (`.card`, `.page`, `.grid-*`, `.stat-grid`) before writing new CSS.
3. Map any new status to the existing critical/warn/ok/info four-color vocabulary.
4. Serif for headings/big numbers, sans for UI text, mono for identifiers/data — no exceptions.
5. Confirm destructive/committing actions explicitly; toast only on writes.
6. Test in both density modes and both themes.
7. Assume desktop-only unless a task explicitly scopes responsive work.
8. When in doubt, find the closest existing page/component and mirror its structure rather than inventing a new pattern.
