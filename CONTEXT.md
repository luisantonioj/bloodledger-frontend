# BloodLedger — Product Context

This document orients anyone (or any AI assistant) working on the frontend around *why* the product exists, *who* it's for, *what* it must do, and *what it must never do*. It is derived from the Updated Research Proposal and the panel's Summary of Revisions, and is scoped strictly to the frontend prototype described in `readme.md`.

## Vision

Blood is perishable, unevenly distributed across hospitals, and today tracked in Lipa City through static twice-daily manual ledger entries, phone calls, and messaging apps. Once a unit leaves the Philippine Red Cross Lipa Chapter, digital visibility ends — hospitals can't see each other's stock, near-expiry units get discarded that a neighboring hospital could have used, and "ghost stock" (recorded inventory that no longer physically exists) causes dangerous discrepancies.

BloodLedger's frontend exists to give every consortium member **one shared, real-time, tamper-evident view** of blood inventory and transfers, and to make redistributing a near-expiry or surplus unit to the hospital that needs it a **one-click, algorithm-guided action** instead of a phone call and a physical courier run with no paper trail. The interface should feel like the operational nerve center of a blood bank — calm, information-dense, fast to scan, and trustworthy — not a consumer app.

## Target users

The proposal defines a tiered stakeholder network. The frontend must serve all four, though not all with the same access level. The current prototype's default session represents the first row; the login page's role picker represents all four.

| Role | Institution type | What they need from the UI | Access level |
|---|---|---|---|
| **Medical Technologist** | Mary Mediatrix Medical Center (primary node) | Scan units in, initiate/dispatch/receive transfers, see the live matrix and alerts | Full operational access at their node |
| **Blood Bank Head** | Mary Mediatrix Medical Center (primary node) | Everything a Med Technologist can do, plus approve/override/reconcile transfers, sign off with a PIN | Full operational + approval access |
| **PRC Officer** | Philippine Red Cross Lipa Chapter (regulatory/hub node) | Hub-level distribution visibility, city-wide post-dispatch tracking | Full blockchain node; read-only city-wide view after dispatch |
| **Regulator (DOH)** | DOH-CHD Calabarzon | City-wide audit trail, aggregated reporting/KPIs for compliance filings | Read-only dashboard, reporting, and audit access; no write actions anywhere |
| *(Participating blood banks — Lipa Medix Medical Center and N.L. Villa Memorial Medical Center)* | Consortium blood-bank institutions | Share approved stock availability, authorize requests, and track transfers | Access depends on the assigned institutional role |
| *(Secondary requestors — Metro Lipa Medical Center and other approved facilities)* | Recipient institutions without a consortium blood bank | View redistributable availability, submit requests, and track receipt | Dashboard summary and request workflow; no inventory-write access |

The login screen (`pages/login.jsx`) is the canonical reference for these four roles and their one-line descriptions — keep any future role-permission work consistent with that copy.

## Core features (mapped to the functional requirements)

Each page in the app corresponds to functionality the research proposal specifies. When extending a page, check its requirement so new work doesn't drift from the thesis scope.

| Page | Core feature | Backing requirement(s) |
|---|---|---|
| **Dashboard** | Live per-blood-type inventory matrix with status (critical/warn/ok/surplus), KPI tiles, priority alerts, recent network activity | FR-03, FR-04 |
| **Inventory** | FEFO-sequenced full unit list (ISBT-128 id, component, source, expiry countdown, cold-chain temp, shelf location), surplus/expiry/cold-chain side panels | FR-01, FR-02, FR-04 |
| **Transfers** | Active/recent transfer table, transfer detail with multi-signature stepper, and the **BROA-guided transfer wizard** (Request → Source ranking → Validate → Confirm → Sign → Track) | FR-05, FR-06, FR-07, FR-11 |
| **Alerts** | Critical/low-cover/informational alert center, each with a BROA recommendation and a one-click "Create transfer" action pre-filled into the wizard | FR-08, FR-09 |
| **Scanner** | Mobile rear-camera or uploaded-photo OCR of the printed ISBT-128 donation serial → human review → inbound/outbound transaction record; offline entries are visibly buffered | FR-01, FR-13 |
| **Consortium** | Cross-hospital inventory heatmap, network topology map (live vs. read-only links), peer/node health table | FR-03, stakeholder network |
| **Audit** | Immutable, filterable ledger of every action (dispatch, receive, override, signature, sensor event) with hash/block/geo-signature detail | FR-10, FR-11, NFR-02 |
| **Reporting** | Read-only KPI dashboard for DOH/PRC: consortium totals, distribution by chapter, completion rate by route, wastage, fulfillment time, donor consent compliance, ready-to-file DOH reports | Stakeholder read-only access, automated report generation objective |

BROA (Blood Recommendation & Optimization Agent, referred to in the UI copy) is the throughline across Dashboard, Alerts, and Transfers: it is what ranks candidate source hospitals by stock, distance, expiry/FEFO score, and produces the score shown as "BROA score" throughout. The frontend's job is to *display* BROA's output and let a human commit to it — not to compute it (that's the smart-contract/chaincode layer).

## Key user flows

### 1. Redistributing a near-expiry or shortage unit (the core happy path)
1. An alert fires on the Dashboard or Alert Center ("Critical shortage — AB− PRBC" / "Expiry imminent — 1 unit O− PRBC").
2. User clicks **Create transfer**, which navigates to Transfers with the alert's type/units/urgency/hospital pre-filled and opens the wizard.
3. Wizard step **Request**: confirm blood type, units, urgency, purpose/case reference.
4. Wizard step **Source**: BROA-ranked candidate hospitals (stock, distance, FEFO ISBT, expiry score, BROA score) — user picks one (or accepts the top-ranked default).
5. Wizard step **Validate**: automated smart-contract pre-flight checks (consent flag, crossmatch policy, cold-chain corridor, stock sufficiency, no conflicting reservation, receiver capacity) all shown as pass/fail.
6. Wizard step **Confirm**: full review of product, route, FEFO unit, urgency, BROA score, purpose, courier ETA, chaincode version.
7. Wizard step **Sign**: role PIN entry; endorsement policy shown (`AND('MMCMSP.member', 'PRCMSP.member')`).
8. Wizard step **Track**: commit confirmation with tx ID, block number, hash, next steps.
9. On commit, a toast confirms the ledger write; the new transfer appears at the top of Transfers and Dashboard's network activity table with status "Dispatched."

### 2. Recording a blood-unit transaction
1. An authorized user opens **Blood Unit Transactions** and launches its mobile scanner simulation. They select inbound or outbound; secondary requestors are restricted to inbound.
2. The user opens the rear camera, uploads a label photo, or enters details manually. OCR reads the printed ISBT-128 donation serial; it does not scan a barcode or QR code.
3. The recognized serial remains editable and is matched to the prototype unit catalog. Unknown serials continue to manual product-detail entry instead of silently inventing data.
4. The user reviews blood type, component, dates, source/destination, purpose, and OCR confidence, then confirms through a modal.
5. The app creates scan and transaction identifiers, records a truncated mock blockchain identifier while online, updates the relevant mock inventory state, and adds an Activity History entry. Offline records are marked **Buffered** for a future backend synchronization layer.

### 3. Investigating an audit event
1. From any page that references a transaction (Transfer detail's "View on ledger," an alert's "View on ledger," a cold-chain resolution note), user lands on Audit with a pre-applied filter/search.
2. User selects a row to see full transaction detail: hash, block, actor, role, action, target, endorsers, channel, chaincode version, and geo-signature (lat/long, accuracy, attesting gateway).
3. User can jump back to the related transfer via "View transfer."

### 4. Regulatory/oversight review (DOH, PRC)
1. Read-only user opens Consortium to see the cross-hospital heatmap and network topology, or Reporting for aggregated KPIs.
2. No write actions are available anywhere in this flow — no "New transfer," no scan, no commit buttons should ever render for a read-only role (see `agents.md` for how role-gating should be implemented once real auth exists; the current prototype does not yet gate UI by role).

### 5. Signing in
1. User selects their hospital chapter and role on the login screen, enters username/PIN.
2. On submit, session is set and the app renders the full authenticated shell (Sidebar + Topbar + page body).

## Constraints (do not violate these when extending the UI)

These map directly to the proposal's Scopes and Limitations and Non-Functional Requirements — they are product constraints, not just backend concerns, because several of them shape what the frontend is allowed to show or collect.

- **No patient data, ever.** The system does not collect, store, or display patient medical records, donor names, or any personally identifiable health information (NFR-01). Only blood unit identifiers, component type, and inventory lifecycle/transaction data are ever shown. If a future field looks like it might carry patient-identifiable information (e.g. a free-text "purpose" field), keep it generic/operational (see the existing "OR Schedule · Case 29481 · trauma laparotomy" mock value — a case reference, not a patient name).
- **Single primary node.** Mary Mediatrix Medical Center is the sole primary blockchain node for this deployment phase; all other hospitals besides PRC (regulatory/hub) are secondary, read-only, request-only nodes. Don't design flows that assume every hospital has full scan/inventory-write capability — the architecture is explicitly built to expand to more primary nodes later, but that is out of scope now.
- **ISBT-128 compliance.** Any unit-identifier field or scan format must be presented as ISBT-128 (see the `isbt` values in `data.js`, formatted like `=)W0381 2509 100023`), for compatibility with PRC-issued labels (NFR-04).
- **Offline resilience is a first-class state, not an edge case.** The proposal requires local buffering during connectivity loss with delayed sync (FR-13, NFR-05). The Scanner page already has UI language for this ("Buffered ops: 0 · peer reachable" and a "Buffered" status in the intake table) — any new scan/write flow should account for a buffered/pending state, not just success/failure.
- **BROA is decision-support, not autonomous action.** Per panelist feedback in the Summary of Revisions, BROA recommends; a human always confirms and signs. Never design a flow where a redistribution transfer commits without an explicit human confirm+sign step.
- **Transfer states must include exception paths.** Per panel feedback, transfers need pending/delayed/rejected/compromised states in addition to the happy path (Dispatched → In Transit → Received). The current prototype only implements the happy path in its status stepper — this is a known gap tracked in `tasks.md`, not a design decision to preserve.
- **Dashboard data must read as "real-time."** NFR-06 requires inventory changes to reflect within 5 seconds of a scan event under normal conditions. This doesn't change frontend visuals, but it does mean any future data-fetching implementation needs to poll or subscribe frequently enough that the UI's "Live," pulsing dots, and "block 124,892"-style status indicators remain honest once real data is wired in.
- **On-premise / Philippine Data Privacy Act compliance (NFR-07).** Not a frontend concern to render, but relevant if the frontend ever needs to describe data residency to a user (e.g. in the login screen's compliance footnote, which already references DOH Administrative Order 2008-0008 — keep this kind of regulatory copy accurate rather than inventing new claims).
- **Four role tiers, not more.** Don't introduce additional roles beyond Medical Technologist, Hospital Admin (Blood Bank Head in the UI), DOH/PRC (read-only), and System Administrator (FR-12) without checking against the proposal.
- **This is a proof-of-concept for one city consortium**, not a provincial/regional/national system. Avoid scope creep in copy or features (e.g. no multi-region switching, no non-Lipa hospitals) — the six-node consortium in `data.js` (`HOSPITALS`) is the intended scale for this phase.
