# BloodLedger — Product Context

This document orients anyone (or any AI assistant) working on the frontend around *why* the product exists, *who* it's for, *what* it must do, and *what it must never do*. It is derived from the Updated Research Proposal and the panel's Summary of Revisions, and is scoped strictly to the frontend prototype described in `readme.md`.

## Vision

Blood is perishable, unevenly distributed across hospitals, and today tracked in Lipa City through static twice-daily manual ledger entries, phone calls, and messaging apps. Once a unit leaves the Philippine Red Cross Lipa Chapter, digital visibility ends — hospitals can't see each other's stock, near-expiry units get discarded that a neighboring hospital could have used, and "ghost stock" (recorded inventory that no longer physically exists) causes dangerous discrepancies.

BloodLedger's frontend exists to give every consortium member **one shared, real-time, tamper-evident view** of blood inventory and transfers, and to make redistributing a near-expiry or surplus unit to the hospital that needs it a **one-click, algorithm-guided action** instead of a phone call and a physical courier run with no paper trail. The interface should feel like the operational nerve center of a blood bank — calm, information-dense, fast to scan, and trustworthy — not a consumer app.

## Target users

The prototype uses organizational accounts rather than personal hospital logins. A Facility Account establishes the institution and its permissions; an Active operator selected during a mutable workflow establishes who performed the action. PRC and DOH retain separate organizational access.

| Role | Institution type | What they need from the UI | Access level |
|---|---|---|---|
| **Blood-bank Facility Account** | Mary Mediatrix, Lipa Medix, or N.L. Villa | Inventory, inbound/outbound transactions, request processing, transfers, institution Analytics, exports, and staff attribution | Full operational access within its institution |
| **Requestor Facility Account** | Metro Lipa or another approved non-blood-bank facility | View availability, submit and track requests, confirm inbound receipts, and export its own records | Request and inbound-receipt scope only |
| **PRC Administrator** | Philippine Red Cross Lipa Chapter (system administrator and supply hub) | Review institutional applications, manage accounts, monitor blood-bank shortages, and coordinate replenishment | Consortium administration plus read-only supply coordination |
| **Regulator (DOH)** | DOH-CHD Calabarzon | See which blood banks met required reporting checkpoints and review compliance exceptions | Read-only Dashboard, Alerts, and Compliance Reports; no operational inventory or write actions |

Blood-bank Staff Directories use the classifications **Blood Bank Head** and **Blood Bank Staff**. Requestor directories use **Facility Administrator** and **Requestor Staff**. These classifications govern administration and attribution but are not separate login accounts. Routine blood operations do not require Head approval, but every facility ledger-changing action requires the selected operator's fresh personal PIN. Heads and Facility Administrators use a separate administrative PIN for protected Staff Directory changes in Profile. Duty scheduling is intentionally outside the prototype.

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
| **Analytics** | Authorized blood-bank demand history and PRC consortium comparisons, plus clearly marked simulation-only redistribution assessments | Forecasting objective; decision support only |
| **Reporting** | Compliance checkpoints and role-scoped fixed-layout PDF exports from relevant operational modules | Stakeholder reporting access, automated report generation objective |

BROA (Blood Recommendation & Optimization Agent, referred to in the UI copy) is the throughline across Dashboard, Alerts, and Transfers: it ranks candidate source hospitals by stock, distance, expiry/FEFO score, and produces the score shown as "BROA score" throughout. Requestors submit one request without choosing a hospital; the prototype assigns the strongest eligible source from current redistributable availability. The production recommendation remains a backend/chaincode responsibility.

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
4. The user reviews blood type, component, dates, source/destination, purpose, and OCR confidence, then selects an Active operator and enters that operator's fresh personal PIN in the confirmation sheet.
5. The app creates scan and transaction identifiers, records a truncated mock blockchain identifier while online, updates the relevant mock inventory state, and adds an Activity History entry. Offline records are marked **Buffered** for a future backend synchronization layer.

### 3. Investigating an audit event
1. From any page that references a transaction (Transfer detail's "View on ledger," an alert's "View on ledger," a cold-chain resolution note), user lands on Audit with a pre-applied filter/search.
2. User selects a row to see full transaction detail: hash, block, actor, role, action, target, endorsers, channel, chaincode version, and geo-signature (lat/long, accuracy, attesting gateway).
3. User can jump back to the related transfer via "View transfer."

### 4. Regulatory and PRC administration review
1. A PRC Administrator opens the supply dashboard for a blood-type bar chart, shortage alerts, replenishment records, and account administration.
2. A DOH regulator opens a dashboard containing only compliance-report and alert summaries, with dedicated Alerts and Compliance Reports tabs for full review.
3. No operational write actions are available in either oversight flow; only PRC account and institutional-application administration is actionable.

### 5. Signing in
1. User signs in with the approved Facility Account, PRC account, or DOH account.
2. On submit, the app renders navigation appropriate to the institution and authorized scope. Facility staff attribution and personal PIN verification occur only when an action changes ledger state.

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
- **Institution identity and operator attribution are separate.** Hospitals use one Facility Account. Every mutable event requires a fresh personal operator PIN and must retain facility ID plus the verified Active staff member's ID, name, classification at action time, timestamp, and audit/ledger identifier. PINs and PIN hashes never enter the ledger. Staff becoming Inactive must not rewrite history.
- **Analytics is read-only decision support.** Access requires both eligible institution type and permission. Forecasts and surplus assessments are synthetic, backend-shaped fixtures and must remain visibly labeled as simulation-only—not authorization to redistribute.
- **PDF exports follow the viewer's authorized scope.** Generate only the currently filtered records and never include credentials, PINs, patient information, diagnoses, treatments, clinical free text, private attachments, or another institution's unauthorized data. Prototype checksums describe the exported data but do not make a client-generated PDF cryptographically signed.
- **This is a proof-of-concept for one city consortium**, not a provincial/regional/national system. Avoid scope creep in copy or features (e.g. no multi-region switching, no non-Lipa hospitals) — the six-node consortium in `data.js` (`HOSPITALS`) is the intended scale for this phase.
