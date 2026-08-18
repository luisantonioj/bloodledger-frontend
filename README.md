# BloodLedger — Frontend Prototype

Web dashboard for **BloodLedger: An IoT-Enabled Consortium Blockchain Framework for Inter-Hospital Blood Inventory and Redistribution Management in Lipa City**, a De La Salle Lipa CITE thesis (Buno, Jopia, Lat). This repository contains the **frontend only** — the client that operational and regulatory users interact with. It does not implement the Hyperledger Fabric network, chaincode, REST API, or ML forecasting microservice described in the research proposal; it currently simulates all of that with static mock data so the UI/UX can be reviewed, tested, and demoed independently of the backend build-out.

The current codebase is a **high-fidelity mock/prototype**, not yet wired to any real backend. It is the accepted visual and interaction baseline: every subsequent build task exists to make this UI real (swap mock data for live API/blockchain data) without changing how it looks or behaves.

## What BloodLedger is

A permissioned consortium blockchain (Hyperledger Fabric) synchronizes blood inventory across Mary Mediatrix Medical Center (the sole primary blockchain node for this deployment phase), the Philippine Red Cross Lipa Chapter, other Lipa City hospitals (secondary/read-only nodes), and DOH-CHD Calabarzon (regulator, read-only). Barcode/QR IoT scanning removes manual data entry, a Blood Redistribution Optimization Algorithm (BROA) combines FEFO unit sequencing with Simple Additive Weighting across urgency/shortage/surplus/distance to recommend inter-hospital transfers, and a machine learning demand-forecasting microservice predicts daily consumption to compute a Predicted Distributable Surplus. This frontend is the console that Medical Technologists, Blood Bank Heads, PRC officers, and DOH regulators use to see and act on all of that.

See `context.md` for target users, features, and flows; `design.md` for the visual system; `agents.md` for coding rules; `tasks.md` for the build plan.

## Tech stack

The prototype intentionally uses **no build step** — everything runs from static files loaded directly by the browser, transpiled in-browser. This keeps the thesis prototype trivial to run and demo on any machine with no Node toolchain installed.

| Layer | Choice | Notes |
|---|---|---|
| UI library | React 18.3.1 (UMD build) | Loaded via `<script>` tag from unpkg, no npm install |
| JSX transpilation | Babel Standalone 7.29 | Compiles `type="text/babel"` scripts in the browser at load time |
| Styling | Hand-written CSS, `styles.css` | CSS custom properties for theming; no CSS framework, no Tailwind |
| Fonts | Google Fonts: Newsreader (serif/display), Inter (sans/UI), JetBrains Mono (mono/data) | Loaded via `<link>` in `index.html` |
| State | React hooks only (`useState`, `useEffect`, `useContext`) | No Redux/Zustand/Context library; one root `App` component owns navigation and session state |
| Mock data | `data.js`, assigned onto `window` | Stand-in for the future REST/blockchain-backed API |
| OCR | Tesseract.js 6.0.1 + English model | Pinned local browser assets; recognizes printed ISBT-128 donation serials without a cloud OCR call |
| Icons | Hand-drawn inline SVG paths (`ICONS` map in `components.jsx`) | No icon package dependency |
| Charts | Hand-rolled inline SVG (`Spark`, bar rows, heatmap cells, network topology map) | No charting library |

This is a deliberate simplicity choice for a thesis prototype, not a long-term architecture recommendation — see `tasks.md` for the migration path to a bundled build once the frontend needs to talk to a real backend.

### Why no build tooling yet

- Zero install friction for panel demos and thesis defense — clone, open `index.html`, done.
- No compiled output to keep in sync; every file on disk is the file the browser runs.
- Matches the "frontend only" scope of this documentation pass: we are not introducing a bundler decision until the team is ready to wire in real API calls (see Task 0 in `tasks.md`).

## Project structure

```
bloodledger-frontend/
├── index.html            # Entry point. Loads fonts, React/ReactDOM/Babel CDN scripts,
│                          # data.js, then every page script, then app.jsx, in load order.
├── data.js               # All mock/seed data, assigned to window.* globals:
│                          # HOSPITALS, BLOOD_TYPES, COMPONENTS, MATRIX, CITY_MATRIX,
│                          # INVENTORY, TRANSFERS, ALERTS, AUDIT, BROA_CANDIDATES,
│                          # REPORTING, SCAN_HISTORY. This is the file a backend
│                          # integration replaces piece by piece.
├── components.jsx         # Shared chrome & primitives: Icon/ICONS, BloodType, Chip,
│                          # StatusChip, Btn, Sidebar, Topbar, PageHead, Stat, Spark,
│                          # Modal, Toast/ToastProvider, and helpers (hospitalById, fmtDate).
├── app.jsx                 # Root <App/> component: session state, in-page router
│                          # (no react-router — page is a string in useState),
│                          # theme/accent tweak wiring, renders Sidebar/Topbar/page body.
├── tweaks-panel.jsx        # Design-preview-only floating panel (dark mode / accent /
│                          # density / show-login toggles). Prototyping tool, not part
│                          # of the production app — see design.md and agents.md.
├── styles.css              # All CSS. Design tokens in :root, then component styles,
│                          # then density and dark-theme overrides at the bottom.
├── pages/
│   ├── login.jsx            # Hospital chapter + role sign-in screen
│   ├── dashboard.jsx         # Live inventory matrix, priority alerts, network activity
│   ├── inventory.jsx         # FEFO-sequenced unit list, surplus/expiry/cold-chain panels
│   ├── transfers.jsx          # Active transfers table, transfer detail, BROA transfer wizard
│   ├── alerts.jsx             # Alert center (critical/low-cover/informational)
│   ├── scanner.jsx             # Mobile OCR capture, inbound/outbound preview and transaction log
│   ├── consortium.jsx          # Cross-hospital heatmap, network topology map, peer table
│   ├── audit.jsx                # Immutable ledger / audit trail viewer
│   └── reporting.jsx             # DOH/PRC read-only KPI and filings view
├── vendor/ocr/             # Pinned Tesseract browser runtime, worker, core, and English model
└── uploads/                # Reference materials only (e.g. manuscript PDF) — not app assets
```

Every `pages/*.jsx` and `components.jsx`/`tweaks-panel.jsx`/`app.jsx` file assigns its top-level functions onto `window` at the bottom (`Object.assign(window, {...})`). There are no ES module imports/exports anywhere in the current codebase — every script shares one global scope, and `index.html`'s `<script>` order is the dependency order. Keep this in mind before adding new files: a new page script must load after `components.jsx` and before `app.jsx`.

## Running the prototype locally

No install step is required.

1. Serve the folder over HTTP (opening `index.html` directly via `file://` will work in most browsers for this app, but a local server avoids any CORS/module edge cases and is required once real `fetch()` calls to a backend are added):
   ```bash
   npx serve .
   # or
   python3 -m http.server 5500
   ```
2. Open the printed local URL in a browser.
3. The app boots straight into the dashboard as **Dr. R. Reyes, Blood Bank Head, Mary Mediatrix Medical Center** (see `app.jsx`'s initial `session` state). Use the floating tweaks panel (bottom-right) → **Demo → Show login screen** to see the login page.

The mobile scanner is available from **Blood Unit Transactions**. The desktop page is a transaction hub; **Open Mobile Scanner** opens the responsive phone simulation without changing the URL. Camera capture requires HTTPS on a phone, or `localhost` during development. **Try Demo Label** exercises the same local OCR worker without requesting camera permission.

No environment variables, `.env` files, OCR API keys, or cloud recognition service are needed at this stage. The OCR runtime and English model are served from `vendor/ocr`; the remaining network-loaded assets are the existing UI libraries and Google Fonts.

## What this documentation set covers

| File | Purpose |
|---|---|
| `readme.md` | This file — what the project is, how to run it, how it's laid out |
| `context.md` | Product vision, target users/roles, core features, user flows, constraints |
| `agents.md` | Coding standards, naming conventions, repo rules for anyone (human or AI) editing this codebase |
| `design.md` | UI/UX direction: layout system, components, color/type tokens, interaction and responsiveness rules |
| `tasks.md` | Prioritized frontend work breakdown, page/component checklist, testing notes, deployment prep |

All five documents describe **this exact frontend** as it exists today and the path to turning it into the deployed proof-of-concept described in the Updated Research Proposal — they do not propose a redesign.
