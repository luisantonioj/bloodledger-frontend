// ========== Mock data for Bloodledger ==========
// All shapes are intentionally close to what the manuscript describes.

window.HOSPITALS = [
  { id: "PRC-LIP", name: "PRC Lipa City Chapter", short: "PRC Lipa", type: "Red Cross Hub", distance_km: 0.0, peer_id: "peer0.prc-lipa.bloodledger" },
  { id: "MMC-LIP", name: "Mary Mediatrix Medical Center", short: "Mary Mediatrix", type: "Tertiary Hospital", distance_km: 2.1, peer_id: "peer0.mmc.bloodledger" },
  { id: "LMC-LIP", name: "Lipa Medix Medical Center", short: "Lipa Medix", type: "Level II Hospital", distance_km: 3.6, peer_id: "peer0.lmc.bloodledger" },
  { id: "MDH-LIP", name: "Metro Lipa Doctors Hospital", short: "Metro Doctors", type: "Level II Hospital", distance_km: 4.4, peer_id: "peer0.mdh.bloodledger" },
  { id: "CLH-LIP", name: "C. Laurel Memorial Hospital", short: "C. Laurel Memorial", type: "Level I Hospital", distance_km: 6.2, peer_id: "peer0.clh.bloodledger" },
  { id: "DOH-CHD", name: "DOH-CHD Calabarzon", short: "DOH-CHD", type: "Regulator", distance_km: null, peer_id: "regulator0.doh.bloodledger" },
];

window.BLOOD_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
window.COMPONENTS = ["PRBC", "Platelets", "FFP", "Whole Blood", "Cryo"];

// Live matrix for current hospital (Mary Mediatrix by default)
// status: critical | warn | ok | surplus
window.MATRIX = [
  { type: "O-",  units: 2,  status: "critical", trend: -2, days_cover: 1.1 },
  { type: "O+",  units: 18, status: "ok",       trend: 1,  days_cover: 4.2 },
  { type: "A-",  units: 4,  status: "warn",     trend: 0,  days_cover: 2.0 },
  { type: "A+",  units: 22, status: "surplus",  trend: 5,  days_cover: 8.6 },
  { type: "B-",  units: 3,  status: "warn",     trend: -1, days_cover: 1.9 },
  { type: "B+",  units: 14, status: "ok",       trend: 2,  days_cover: 4.8 },
  { type: "AB-", units: 1,  status: "critical", trend: 0,  days_cover: 0.8 },
  { type: "AB+", units: 9,  status: "ok",       trend: 1,  days_cover: 5.3 },
];

// City-wide matrix used in the consortium view
window.CITY_MATRIX = {
  "PRC-LIP":  { "O-": 14, "O+": 62, "A-": 11, "A+": 48, "B-": 9,  "B+": 33, "AB-": 5, "AB+": 18 },
  "MMC-LIP":  { "O-": 2,  "O+": 18, "A-": 4,  "A+": 22, "B-": 3,  "B+": 14, "AB-": 1, "AB+": 9 },
  "LMC-LIP":  { "O-": 5,  "O+": 21, "A-": 2,  "A+": 11, "B-": 4,  "B+": 9,  "AB-": 1, "AB+": 4 },
  "MDH-LIP":  { "O-": 1,  "O+": 9,  "A-": 6,  "A+": 7,  "B-": 1,  "B+": 5,  "AB-": 0, "AB+": 2 },
  "CLH-LIP":  { "O-": 3,  "O+": 6,  "A-": 1,  "A+": 4,  "B-": 2,  "B+": 3,  "AB-": 0, "AB+": 1 },
};

// Inventory units (Mary Mediatrix scope)
window.INVENTORY = [
  { isbt: "=)W0381 2509 100023", type: "O-",  comp: "PRBC",      collected: "2026-04-12", expires: "2026-05-23", days_left: 2,  status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-2 / A-04", temp: 4.1 },
  { isbt: "=)W0381 2509 100027", type: "AB-", comp: "PRBC",      collected: "2026-04-11", expires: "2026-05-22", days_left: 1,  status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-2 / B-01", temp: 4.0 },
  { isbt: "=)W0381 2510 100041", type: "A-",  comp: "PRBC",      collected: "2026-04-14", expires: "2026-05-25", days_left: 4,  status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-1 / C-02", temp: 4.2 },
  { isbt: "=)W0381 2510 100055", type: "O+",  comp: "PRBC",      collected: "2026-04-18", expires: "2026-05-29", days_left: 8,  status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-1 / A-08", temp: 4.1 },
  { isbt: "=)W0381 2510 100062", type: "A+",  comp: "PRBC",      collected: "2026-04-22", expires: "2026-06-02", days_left: 12, status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-3 / D-11", temp: 4.0 },
  { isbt: "=)W0381 2511 100071", type: "B+",  comp: "PRBC",      collected: "2026-04-24", expires: "2026-06-04", days_left: 14, status: "Reserved",  reserved_for: "CASE-29481", source: "PRC-LIP", shelf: "R-1 / B-06", temp: 4.1 },
  { isbt: "=)W0381 2511 100084", type: "A+",  comp: "PRBC",      collected: "2026-04-27", expires: "2026-06-07", days_left: 17, status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-3 / D-12", temp: 3.9 },
  { isbt: "=)W0381 2511 100092", type: "O+",  comp: "PRBC",      collected: "2026-04-29", expires: "2026-06-09", days_left: 19, status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "R-1 / A-09", temp: 4.0 },
  { isbt: "=)W0381 2512 100111", type: "B-",  comp: "Platelets", collected: "2026-05-19", expires: "2026-05-24", days_left: 3,  status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "P-1 / A-01", temp: 22.0 },
  { isbt: "=)W0381 2512 100117", type: "O-",  comp: "Platelets", collected: "2026-05-20", expires: "2026-05-25", days_left: 4,  status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "P-1 / A-02", temp: 22.1 },
  { isbt: "=)W0381 2511 100098", type: "AB+", comp: "FFP",       collected: "2025-12-04", expires: "2026-12-04", days_left: 197,status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "F-1 / A-04", temp: -27.0 },
  { isbt: "=)W0381 2511 100102", type: "A+",  comp: "FFP",       collected: "2026-01-18", expires: "2027-01-18", days_left: 242,status: "Available", reserved_for: null,    source: "PRC-LIP", shelf: "F-1 / B-02", temp: -27.4 },
];

// Recent transfers
window.TRANSFERS = [
  { id: "TX-2026-0492", type: "O-",  units: 2, from: "PRC-LIP", to: "MMC-LIP", status: "Received",  initiated: "2026-05-21 06:14", completed: "2026-05-21 07:02", broa: 92, urgency: "Emergency", tx_hash: "0x7a3c…91be" },
  { id: "TX-2026-0491", type: "AB+", units: 1, from: "LMC-LIP", to: "MMC-LIP", status: "In Transit", initiated: "2026-05-21 05:47", completed: null,                broa: 78, urgency: "Urgent",    tx_hash: "0x4d12…22ef" },
  { id: "TX-2026-0490", type: "A+",  units: 4, from: "MMC-LIP", to: "MDH-LIP", status: "Dispatched", initiated: "2026-05-21 04:30", completed: null,                broa: 85, urgency: "Routine",   tx_hash: "0x9b18…73c1" },
  { id: "TX-2026-0489E", type: "B-",  units: 2, from: "PRC-LIP", to: "LMC-LIP", status: "Delayed", initiated: "2026-05-21 03:12", completed: null, broa: 74, urgency: "Urgent", tx_hash: "0xa441...9e02", exception: "Courier ETA slipped by 24 min; cold-chain sensor still within range." },
  { id: "TX-2026-0488E", type: "AB-", units: 1, from: "MDH-LIP", to: "MMC-LIP", status: "Rejected", initiated: "2026-05-20 21:42", completed: null, broa: 61, urgency: "Emergency", tx_hash: "0xbc19...02d1", exception: "Receiver rejected after policy mismatch; BROA re-route required." },
  { id: "TX-2026-0487E", type: "O+",  units: 1, from: "CLH-LIP", to: "MDH-LIP", status: "Compromised", initiated: "2026-05-20 19:08", completed: null, broa: 58, urgency: "Routine", tx_hash: "0xdd72...70fa", exception: "Cold-chain excursion exceeded corridor policy; quarantine logged." },
  { id: "TX-2026-0489", type: "B+",  units: 1, from: "PRC-LIP", to: "CLH-LIP", status: "Received",  initiated: "2026-05-20 22:11", completed: "2026-05-20 23:04", broa: 88, urgency: "Urgent",    tx_hash: "0x2f8a…44d0" },
  { id: "TX-2026-0488", type: "O+",  units: 3, from: "PRC-LIP", to: "MMC-LIP", status: "Received",  initiated: "2026-05-20 18:02", completed: "2026-05-20 18:56", broa: 81, urgency: "Routine",   tx_hash: "0x61cd…0ab2" },
  { id: "TX-2026-0487", type: "O-",  units: 1, from: "LMC-LIP", to: "MDH-LIP", status: "Received",  initiated: "2026-05-20 14:21", completed: "2026-05-20 15:18", broa: 90, urgency: "Emergency", tx_hash: "0x33aa…9fde" },
];

// Alerts
window.ALERTS = [
  {
    id: "AL-7741",
    severity: "critical",
    title: "Critical shortage — AB− PRBC",
    desc: "Stock has dropped to 1 unit (≤ 1 day cover). Forecasted demand of 3 within the next 24h.",
    when: "2 min ago",
    source: "Expiry Monitor",
    rec_label: "BROA suggests",
    rec: "Request 2 units AB− PRBC from PRC Lipa (12 units on hand, 2.1 km, score 0.93).",
    actions: [{ label: "Create transfer", kind: "primary", goto: "transfers", payload: { type: "AB-", units: 2, from: "PRC-LIP", urgency: "Emergency" } }, { label: "Acknowledge", kind: "ghost" }]
  },
  {
    id: "AL-7740",
    severity: "critical",
    title: "Expiry imminent — 1 unit O− PRBC",
    desc: "ISBT =)W0381 2509 100023 expires in 47 hours. FEFO sequencing has flagged this for priority dispatch.",
    when: "11 min ago",
    source: "Smart Contract · Inventory",
    rec_label: "BROA suggests",
    rec: "Route to Metro Doctors (low O− stock, 4.4 km, score 0.88) within 6h to prevent wastage.",
    actions: [{ label: "Create transfer", kind: "primary", goto: "transfers", payload: { type: "O-", units: 1, to: "MDH-LIP", urgency: "Routine" } }, { label: "Hold for crossmatch", kind: "ghost" }]
  },
  {
    id: "AL-7739",
    severity: "warn",
    title: "Low cover — B− Platelets",
    desc: "Only 3 platelet units (1.9 days cover). Component perishes in 5 days from collection.",
    when: "38 min ago",
    source: "Threshold Monitor",
    rec_label: "BROA suggests",
    rec: "Place standing request with PRC Lipa for 4 platelet units before 18:00.",
    actions: [{ label: "Create transfer", kind: "primary", goto: "transfers", payload: { type: "B-", units: 4, from: "PRC-LIP", urgency: "Urgent" } }, { label: "Snooze 2h", kind: "ghost" }]
  },
  {
    id: "AL-7738",
    severity: "info",
    title: "Surplus rebalance opportunity — A+ PRBC",
    desc: "Mary Mediatrix holds 22 units A+ (8.6 days cover, above 6-day threshold). 2 other nodes report low cover.",
    when: "1h ago",
    source: "BROA · Surplus Engine",
    rec_label: "Suggested action",
    rec: "Offer 4 units A+ to Metro Doctors (2.4 days cover) — pre-approved by Blood Bank Head.",
    actions: [{ label: "Offer to network", kind: "primary", goto: "transfers", payload: { type: "A+", units: 4, to: "MDH-LIP", urgency: "Routine", direction: "outbound" } }, { label: "Dismiss", kind: "ghost" }]
  },
  {
    id: "AL-7737",
    severity: "info",
    title: "Cold-chain breach cleared — Reefer R-2",
    desc: "Temperature returned to 4.0°C after a 6-minute excursion to 7.1°C. No units flagged for quarantine.",
    when: "2h ago",
    source: "IoT · Refrigeration",
    rec_label: "Status",
    rec: "Auto-resolved by Cold-Chain chaincode. Logged to ledger (tx 0x82a1…11cc).",
    actions: [{ label: "View on ledger", kind: "ghost", goto: "audit" }]
  },
];

// Audit log
window.AUDIT = [
  { ts: "2026-05-21 07:02:14", actor: "mtech.santos@mmc.bloodledger", role: "Med Technologist", action: "ReceiveWithGeoTag", target: "TX-2026-0492 · 2 × O−", hash: "0x7a3c91be4f...", block: 124891, kind: "ok" },
  { ts: "2026-05-21 06:14:08", actor: "head.cruz@prc-lipa.bloodledger",  role: "Blood Bank Head",   action: "DispatchWithGeoTag", target: "TX-2026-0492 · 2 × O−", hash: "0x7a3c91be4f...", block: 124889, kind: "info" },
  { ts: "2026-05-21 06:13:51", actor: "head.cruz@prc-lipa.bloodledger",  role: "Blood Bank Head",   action: "ValidateSignatures", target: "TX-2026-0492",        hash: "0x7a3c91be4f...", block: 124888, kind: "info" },
  { ts: "2026-05-21 06:13:02", actor: "mtech.dela@mmc.bloodledger",  role: "Med Technologist", action: "InitiateTransfer",   target: "TX-2026-0492",        hash: "0x7a3c91be4f...", block: 124887, kind: "info" },
  { ts: "2026-05-21 05:47:39", actor: "mtech.lim@lmc.bloodledger",   role: "Med Technologist", action: "DispatchWithGeoTag", target: "TX-2026-0491 · 1 × AB+", hash: "0x4d1222ef9a...", block: 124883, kind: "info" },
  { ts: "2026-05-21 05:32:11", actor: "system.broa",                 role: "Smart Contract",   action: "TriggerExpiryAlert", target: "ISBT =)W0381 2509 100023", hash: "0xa9c2…8a11", block: 124880, kind: "warn" },
  { ts: "2026-05-21 04:31:09", actor: "head.reyes@mmc.bloodledger",  role: "Blood Bank Head",   action: "ApproveTransfer",   target: "TX-2026-0490",        hash: "0x9b1873c1ab...", block: 124871, kind: "ok" },
  { ts: "2026-05-21 04:30:42", actor: "mtech.santos@mmc.bloodledger", role: "Med Technologist", action: "InitiateTransfer",   target: "TX-2026-0490",        hash: "0x9b1873c1ab...", block: 124870, kind: "info" },
  { ts: "2026-05-21 03:58:00", actor: "iot.scanner.MMC-A",           role: "IoT Edge Device",  action: "CreateBloodUnit",    target: "ISBT =)W0381 2512 100117", hash: "0x12bd…aa01", block: 124862, kind: "info" },
  { ts: "2026-05-21 02:14:23", actor: "iot.reefer.MMC-R2",           role: "IoT Sensor",       action: "ColdChainResolved",  target: "Reefer R-2 · 6m excursion", hash: "0x82a111cc02...", block: 124854, kind: "ok" },
  { ts: "2026-05-20 23:04:51", actor: "mtech.cruz@clh.bloodledger",  role: "Med Technologist", action: "ReceiveWithGeoTag",  target: "TX-2026-0489",        hash: "0x2f8a44d018...", block: 124826, kind: "ok" },
  { ts: "2026-05-20 22:11:18", actor: "head.cruz@prc-lipa.bloodledger", role: "Blood Bank Head", action: "DispatchWithGeoTag", target: "TX-2026-0489",        hash: "0x2f8a44d018...", block: 124822, kind: "info" },
];

// BROA candidate sources for transfer wizard
window.BROA_CANDIDATES = {
  "O-": [
    { hospital: "PRC-LIP", stock: 14, distance: 2.1, expiry_score: 0.78, fefo_isbt: "=)W0381 2509 100018", broa: 0.93 },
    { hospital: "LMC-LIP", stock: 5,  distance: 3.6, expiry_score: 0.62, fefo_isbt: "=)W0381 2510 100008", broa: 0.71 },
    { hospital: "MDH-LIP", stock: 1,  distance: 4.4, expiry_score: 0.41, fefo_isbt: "=)W0381 2511 100002", broa: 0.34 },
  ],
  "AB-": [
    { hospital: "PRC-LIP", stock: 5,  distance: 2.1, expiry_score: 0.80, fefo_isbt: "=)W0381 2510 100201", broa: 0.93 },
    { hospital: "LMC-LIP", stock: 1,  distance: 3.6, expiry_score: 0.55, fefo_isbt: "=)W0381 2510 100212", broa: 0.51 },
  ],
  "B-": [
    { hospital: "PRC-LIP", stock: 9,  distance: 2.1, expiry_score: 0.72, fefo_isbt: "=)W0381 2511 100501", broa: 0.88 },
    { hospital: "LMC-LIP", stock: 4,  distance: 3.6, expiry_score: 0.60, fefo_isbt: "=)W0381 2511 100517", broa: 0.66 },
  ],
  "A+": [
    { hospital: "MMC-LIP", stock: 22, distance: 0.0, expiry_score: 0.62, fefo_isbt: "=)W0381 2510 100062", broa: 0.95 },
    { hospital: "PRC-LIP", stock: 48, distance: 2.1, expiry_score: 0.70, fefo_isbt: "=)W0381 2510 100388", broa: 0.83 },
  ],
};

// Reporting KPIs (DOH/PRC view)
window.REPORTING = {
  kpis: [
    { label: "Consortium units on hand",  value: 462, unit: "units", delta: "+18 wk", positive: true },
    { label: "Avg transfer fulfillment",   value: 41,  unit: "min",   delta: "−9 min vs Q1", positive: true },
    { label: "Units rescued from expiry",  value: 87,  unit: "units", delta: "+22 vs Q1", positive: true },
    { label: "Wastage rate",               value: 1.4, unit: "%",     delta: "−2.6 pts", positive: true },
  ],
  distribution: [
    { hospital: "PRC Lipa City Chapter",     dispatched: 312, received: 0 },
    { hospital: "Mary Mediatrix Medical",    dispatched: 41,  received: 118 },
    { hospital: "Lipa Medix Medical",        dispatched: 22,  received: 84 },
    { hospital: "Metro Lipa Doctors",        dispatched: 9,   received: 71 },
    { hospital: "C. Laurel Memorial",        dispatched: 4,   received: 38 },
  ],
  completion: [
    { route: "PRC Lipa → Mary Mediatrix",      rate: 99 },
    { route: "PRC Lipa → Lipa Medix",          rate: 97 },
    { route: "PRC Lipa → Metro Doctors",       rate: 96 },
    { route: "PRC Lipa → C. Laurel Memorial",  rate: 94 },
    { route: "Mary Mediatrix → Metro Doctors", rate: 92 },
    { route: "Lipa Medix → Mary Mediatrix",    rate: 90 },
  ],
};

window.SCAN_HISTORY = [
  { isbt: "=)W0381 2512 100117", type: "O-",  comp: "Platelets", expires: "2026-05-25", status: "Committed", ts: "07:14:08", block: 124892 },
  { isbt: "=)W0381 2512 100116", type: "A+",  comp: "PRBC",      expires: "2026-06-22", status: "Committed", ts: "07:12:51", block: 124889 },
  { isbt: "=)W0381 2512 100115", type: "B+",  comp: "PRBC",      expires: "2026-06-21", status: "Committed", ts: "07:11:14", block: 124887 },
  { isbt: "=)W0381 2512 100114", type: "O+",  comp: "PRBC",      expires: "2026-06-20", status: "Buffered",  ts: "07:08:02", block: null   },
];
