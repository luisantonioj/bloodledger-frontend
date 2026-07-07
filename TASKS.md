# tasks.md â€” BloodLedger Frontend Development Plan

This is the frontend work breakdown for turning the current mock into the deployed proof-of-concept described in the Updated Research Proposal, **without changing the accepted UI/UX** documented in `design.md`. Tasks are grouped by priority. Check off items as they land; anything that changes a data shape or a page's behavior should be cross-checked against `context.md`'s constraints and `agents.md`'s rules before merging.

## How to use this file

- **P0** = blocks a working, demoable, backend-connected prototype. Do these first, in order.
- **P1** = required to satisfy the panel's revision feedback (Summary of Revisions) and the proposal's non-functional requirements.
- **P2** = polish, robustness, and deployment hardening â€” needed before the final defense/deployment, not before a working demo.
- Each task lists the file(s) most likely touched, so scope stays contained per `agents.md`'s "commit-sized changes" rule.

---

## P0 â€” Backend connectivity (make the mock real)

Goal: every page renders the same UI, but reads/writes real data instead of `window.*` mock objects.

- [x] **0.1 Introduce a data-access layer.** Create a single module (e.g. `api.js`) that wraps `fetch` calls to the Node.js/Express REST API described in the proposal's Technical Architecture. Do not scatter `fetch` calls inside page components.
- [ ] **0.2 Replace `data.js` collections one at a time**, keeping field shapes identical wherever possible so page components need minimal changes:
  - [ ] `HOSPITALS`, `BLOOD_TYPES`, `COMPONENTS` (near-static reference data â€” lowest risk, do first)
  - [ ] `MATRIX` / `CITY_MATRIX` â†’ Dashboard, Consortium
  - [ ] `INVENTORY` â†’ Inventory page
  - [ ] `TRANSFERS` / `BROA_CANDIDATES` â†’ Transfers page + wizard
  - [ ] `ALERTS` â†’ Alerts page + Dashboard's priority alerts card
  - [ ] `AUDIT` â†’ Audit page
  - [ ] `REPORTING` â†’ Reporting page
  - [ ] `SCAN_HISTORY` â†’ Scanner page
- [ ] **0.3 Add loading and error states** for every table/matrix/card that becomes async (none exist today â€” see `agents.md`). Match the existing visual language (skeleton or muted placeholder text, not a spinner overlay that breaks the dense-table layout).
- [x] **0.4 Wire the Scanner "Simulate scan" action to a real scan-ingest endpoint** (FR-01), including a genuine buffered/offline state (not just the static "Buffered ops: 0" label) â€” see task 1.2 below for the full offline-resilience requirement. Frontend now calls `BloodLedgerApi.ingestScan`; backend endpoint remains to be supplied.
- [x] **0.5 Wire the Transfer Wizard's commit step** to the real transfer-initiation endpoint; replace the hardcoded `newId = "TX-2026-0493"` and fixed `tx_hash`/block number in `app.jsx`'s `handleCommit` with values returned from the backend. Frontend now calls `BloodLedgerApi.createTransfer`; backend endpoint remains to be supplied.
- [ ] **0.6 Remove the dual-write pattern** in `handleCommit` (`setTransfers` + `window.TRANSFERS = ...`) once transfers are backend-sourced; replace with a single state update after a successful API call (see `agents.md`).
- [ ] **0.7 Real-time refresh.** Implement polling (interval-based re-fetch, simplest option for this scope) or a subscription mechanism so the dashboard, alerts, and matrix reflect changes within ~5 seconds per NFR-06. Confirm the choice doesn't require introducing a new state-management library.

## P0 â€” Authentication and session

- [x] **0.8 Wire `LoginPage`'s submit handler** to a real authentication endpoint (username + PIN) instead of synthesizing a session client-side. Frontend now submits through `BloodLedgerApi.login`; backend endpoint remains to be supplied.
- [ ] **0.9 Persist session across reload** (currently lost on refresh since there's no router/storage) â€” decide the mechanism (session cookie handled by backend is preferred over any client-side token storage, to avoid introducing new client dependencies) and document the decision here once made.
- [x] **0.10 Sign-out** should call a real endpoint to invalidate the session, not just flip local `authed` state. Frontend now calls `BloodLedgerApi.logout`; backend endpoint remains to be supplied.

## P1 â€” Role-based access (panel/proposal requirement, currently missing)

The login screen already collects a role, but nothing in `app.jsx` or any page branches on it. FR-12 requires four enforced tiers: Medical Technologist, Hospital Admin (Blood Bank Head), DOH/PRC (read-only), System Administrator.

- [x] **1.1 Gate write actions by role.** Every button that creates/mutates state â€” "New transfer," "Simulate scan"/"Commit to ledger," "Approve," wizard's "Sign" step, "Offer to network," alert "Create transfer"/"Acknowledge" â€” must not render (or must render disabled) for read-only sessions (DOH regulator, PRC officer post-dispatch view, secondary-hospital users). Reference `context.md`'s access-level table for exactly which role gets which capability.
- [x] **1.2 Secondary-hospital users need a request-only Transfers experience**, not the full wizard with source-hospital selection â€” per the proposal, secondary nodes "submit digital requests" and "receive redistributed units," they do not select a BROA source hospital directly. Scope a reduced wizard variant (likely just the Request step + a submit-and-wait state) rather than hiding steps of the existing wizard.
- [x] **1.3 Confirm Consortium and Reporting are already read-only-safe** for all roles (they currently have no write actions) â€” verify and note in this file once checked, since these are the natural home pages for DOH/PRC sessions. Verified: no write actions were added to either page.

## P1 â€” Offline resilience (panel feedback + FR-13/NFR-05)

The panel explicitly asked how scanning stays reliable during network interruptions; the accepted answer was local caching + delayed sync.

- [x] **2.1 Implement a real buffered-scan queue on Scanner**, backed by whatever local persistence the backend architecture uses (per the proposal, local PostgreSQL buffering happens server-side/on the edge device â€” the frontend's job is to reflect buffered vs. synced state accurately and let a user see what's pending). Frontend queue visibility is implemented; durable server-side/edge persistence remains a backend integration concern.
- [x] **2.2 Add a connectivity indicator** distinct from the existing static "peer reachable" copy â€” should reflect actual reachability, and should visually match the existing `.live-dot`/`chain-status` vocabulary rather than introducing a new pattern (see `design.md`).
- [ ] **2.3 Handle wizard/commit actions attempted while offline** â€” currently unhandled; decide and implement whether these queue locally or block with a clear message, consistent with the calm-not-alarmist tone in `design.md`.

## P1 â€” Transfer status completeness (panel feedback)

Panel feedback explicitly asked how interrupted/delayed/rejected/compromised transfers are handled; the current stepper (`TransferDetail` in `transfers.jsx`) only models the happy path (Initiated â†’ Approved â†’ Dispatched â†’ In transit â†’ Received).

- [x] **3.1 Extend the transfer status model** to include Pending, Delayed, Rejected, and Compromised states in both the data shape and `TransferDetail`'s stepper UI. Map each new state onto the existing four-color status vocabulary (see `design.md`): Delayed â†’ warn, Rejected/Compromised â†’ critical, Pending â†’ info/neutral.
- [x] **3.2 Reflect these states in the Transfers list filter chips** (`["ALL", "Dispatched", "In Transit", "Received"]` in `transfers.jsx`) and in Dashboard's badge counts.
- [x] **3.3 Add appropriate actions for exception states** (e.g. a rejected transfer might offer "Re-route via BROA," a delayed one might surface updated ETA) â€” keep new actions inside the existing `Btn`/`Chip` vocabulary, don't invent new button styles.

## P1 â€” Geo-tagging surface

- [ ] **4.1 Wire real GPS/geo-tag capture** at dispatch and receipt scan events (currently the Audit page's geo-signature block shows one static coordinate). Confirm with the backend team how geo data arrives at the frontend (likely already attached to the audit/transfer record) rather than the frontend capturing raw device GPS itself, per NFR-04/FR-10 being smart-contract/chaincode responsibilities.
- [ ] **4.2 Surface geo-signature confidence/accuracy consistently** wherever a dispatch/receipt event is shown, not just on the Audit detail panel.

## P1 â€” Demand forecasting surface

The ML module and its Predicted Distributable Surplus output are core to BROA's second trigger tier but have no dedicated UI yet â€” currently "surplus" status in the matrix is static mock data, not a rendered forecast.

- [ ] **5.1 Design a small, consistent way to surface Predicted Distributable Surplus and Shortage Risk Score per blood type** on the Dashboard matrix and/or Inventory's surplus panel, once the ML microservice exposes this via the backend. Reuse `Stat`/`Chip`/`Spark` rather than building new visualization components â€” confirm approach against `design.md` before implementing.
- [ ] **5.2 Reflect that BROA's second tier is now triggered by ML-predicted surplus (not a static overstock threshold)** in any copy that currently implies a fixed threshold (e.g. Inventory page's "8.6 days cover Â· 4 units above threshold" language is illustrative mock copy and should be replaced with real forecast-derived text once available).

## P2 â€” Deployment preparation

- [x] **6.1 Remove or gate the tweaks panel** (`tweaks-panel.jsx`, its `<script>` tag, and the `TWEAK_DEFAULTS`/`Tweaks` wiring in `app.jsx`) from the production build â€” see `agents.md`. Simplest approach: strip the script tag and the `<Tweaks .../>` render call for the deployed build; keep the file in the repo for design iteration if desired.
- [ ] **6.2 Decide on a build step.** The current no-bundler, CDN-script approach (see `readme.md`) is fine for local demos but has real costs at deployment: no minification, no dependency pinning beyond CDN URLs, slower cold load (multiple round-trips for React/ReactDOM/Babel from unpkg), and in-browser Babel transpilation is not meant for production. Evaluate introducing a minimal Vite build (React + JSX, no other framework changes) that produces the *same rendered output* â€” this is a packaging change, not a UI change, and must not alter any page's markup/behavior.
- [ ] **6.3 Environment configuration.** Once a backend API exists, add environment-based API base URL configuration (e.g. `.env` consumed by the build tool from 6.2) rather than hardcoding endpoints.
- [ ] **6.4 Basic accessibility pass.** Check color contrast for status chips/text against both light and dark themes (some status backgrounds are pale â€” verify `--critical`/`--warn`/`--ok`/`--info` text-on-background pairs meet WCAG AA), verify all icon-only buttons (`Btn` with no children, e.g. sidebar sign-out) have a `title`/`aria-label`, and confirm modal focus trapping/keyboard nav in `Modal` (currently only Escape-to-close is implemented).
- [ ] **6.5 Cross-browser/device smoke test** on the primary deployment target (hospital admin desks â€” assume modern Chrome/Edge on Windows) before defense/deployment, given no CI or automated test suite currently exists.
- [ ] **6.6 Responsive scope decision.** Per `design.md`, no breakpoints exist today. Explicitly decide whether the deployed proof-of-concept needs any responsive support (likely no, given desktop-terminal target users per `context.md`) and record the decision here rather than leaving it ambiguous.

## P2 â€” Search and export functionality

Several existing buttons are currently non-functional placeholders (present in the mock for visual completeness): the global `âŒ˜K` topbar search, "Export"/"Export CSV"/"Export consortium"/"Export PDF" buttons across Inventory/Audit/Consortium/Reporting/Scanner, "Threshold rules"/"Subscriptions" on Alerts, "Manual entry"/"Scanner status" on Scanner, "File DOH Form 2A" on Reporting.

- [ ] **7.1 Inventory list this file's exact set of placeholder buttons per page** (audit each `pages/*.jsx` for `onClick`-less `Btn`s) and confirm with stakeholders which are in scope for this deployment phase vs. future work.
- [ ] **7.2 Implement global search** (topbar) against real transfer/alert/ISBT data once backend search/filter endpoints exist â€” keep the existing `âŒ˜K` UI treatment.
- [ ] **7.3 Implement CSV/PDF export** for the tables that advertise it, backed by real data once available (this is explicitly part of the proposal's "automate report generation" objective for Reporting in particular).

---

## Page/component breakdown reference

Use this to scope any task above to the right file(s) quickly.

| Page/Component | File(s) | Depends on shared |
|---|---|---|
| Login | `pages/login.jsx` | `HOSPITALS`, `hospitalById` |
| Dashboard | `pages/dashboard.jsx` | `MATRIX`, `ALERTS`, `TRANSFERS`, `Stat`, `Spark`, `Chip` |
| Inventory | `pages/inventory.jsx` | `INVENTORY`, `BLOOD_TYPES`, `COMPONENTS`, `hospitalById` |
| Transfers (list + detail + wizard) | `pages/transfers.jsx` | `TRANSFERS`, `BROA_CANDIDATES`, `Modal`, `hospitalById` |
| Alerts | `pages/alerts.jsx` | `ALERTS` |
| Scanner | `pages/scanner.jsx` | `SCAN_HISTORY` |
| Consortium (heatmap + `NetworkMap`) | `pages/consortium.jsx` | `CITY_MATRIX`, `HOSPITALS`, `TRANSFERS` |
| Audit | `pages/audit.jsx` | `AUDIT` |
| Reporting | `pages/reporting.jsx` | `REPORTING` |
| App shell / routing / session | `app.jsx` | every page component, `Sidebar`, `Topbar`, `ToastCtx` |
| Shared chrome & primitives | `components.jsx` | â€” (base layer) |
| Design-preview tooling | `tweaks-panel.jsx` | scheduled for removal, task 6.1 |
| Mock data | `data.js` | scheduled for phased replacement, task 0.2 |
| Design tokens & all styling | `styles.css` | referenced by every component |

## Testing notes

No automated test suite exists yet. Until one is introduced, use this manual pass for any change:

- **Visual regression by eye**: compare the changed page against `design.md`'s component/layout rules and against a screenshot of the page before your change, in both density modes and both themes (light/dark).
- **Data-shape regression**: if a task touches `data.js`, re-open every page listed in the breakdown table above that consumes the changed collection and confirm nothing renders `undefined`/blank (no type system will catch this â€” see `agents.md`).
- **Flow regression for the transfer wizard**: after any change touching `transfers.jsx`, walk the full six-step wizard (Request â†’ Source â†’ Validate â†’ Confirm â†’ Sign â†’ Track) end to end, including from a pre-filled entry point (an Alert's "Create transfer" button) and from a cold start ("New transfer" button), since prefill state (`prefill` prop) branches wizard initialization.
- **Role-gating regression** (once P1 role tasks land): verify each of the four roles sees the correct write/read affordances per `context.md`'s access table â€” this should become a standing manual checklist until automated tests exist.
- **Offline-state regression** (once P1 offline tasks land): simulate connectivity loss (e.g. via browser devtools network throttling/offline mode) during a scan and during a transfer commit; confirm buffered state is visible and nothing silently fails.
- Once a build step exists (task 6.2), evaluate introducing component-level tests (e.g. React Testing Library) â€” out of scope until then, since there is currently no test runner or module system to host them.

## Suggested build order across sprints

Given the Agile process the proposal commits to, a reasonable sprint grouping:

1. **Sprint A**: Tasks 0.1â€“0.3, 0.8â€“0.10 â€” read-only real data + real auth, no writes yet.
2. **Sprint B**: Tasks 0.4â€“0.7 â€” real writes (scan commit, transfer commit), real-time refresh.
3. **Sprint C**: Tasks 1.1â€“1.3, 3.1â€“3.3 â€” role gating + transfer exception states (directly answers panel feedback).
4. **Sprint D**: Tasks 2.1â€“2.3, 4.1â€“4.2 â€” offline resilience + geo-tagging (directly answers panel feedback).
5. **Sprint E**: Tasks 5.1â€“5.2 â€” demand forecasting surface (depends on ML microservice being ready).
6. **Sprint F**: Tasks 6.1â€“6.6, 7.1â€“7.3 â€” deployment hardening + remaining placeholder functionality, immediately before defense/deployment.

Adjust ordering if the ML microservice (Sprint E) or the chaincode/Fabric network lags behind the REST API layer â€” the frontend can demo convincingly through Sprint D on REST-backed data alone, with blockchain/ML specifics still mocked at the API boundary if needed.

