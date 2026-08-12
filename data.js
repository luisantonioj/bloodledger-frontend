// ========== Mock data for BloodLedger ==========
// The hospital ordering places Mary Mediatrix first because it is the
// primary operational institution used by the current prototype.

window.HOSPITALS = [
  {
    id: "MMC-LIP",
    name: "Mary Mediatrix Medical Center",
    short: "Mary Mediatrix",
    type: "Tertiary Hospital",
    is_blood_bank: true,
    distance_km: 2.1,
    peer_id: "peer0.mmc.bloodledger",
  },

  {
    id: "PRC-LIP",
    name: "PRC Lipa City Chapter",
    short: "PRC Lipa",
    type: "Red Cross Hub",
    is_blood_bank: false,
    distance_km: 0.0,
    peer_id: "peer0.prc-lipa.bloodledger",
  },

  {
    id: "LMC-LIP",
    name: "Metro Lipa Medical Center",
    short: "Metro Lipa",
    type: "Level II Hospital",
    is_blood_bank: false,
    distance_km: 3.6,
    peer_id: "peer0.metrolipa.bloodledger",
  },

  {
    id: "MDH-LIP",
    name: "Lipa Medix Medical Center",
    short: "Lipa Medix",
    type: "Level II Hospital",
    is_blood_bank: true,
    distance_km: 4.4,
    peer_id: "peer0.medix.bloodledger",
  },

  {
    id: "CLH-LIP",
    name: "N.L. Villa Memorial Medical Center",
    short: "N.L. Villa",
    type: "Level II Hospital",
    is_blood_bank: true,
    distance_km: 6.2,
    peer_id: "peer0.nlvilla.bloodledger",
  },

  {
    id: "DOH-CHD",
    name: "DOH-CHD CALABARZON",
    short: "DOH-CHD",
    type: "Regulator",
    is_blood_bank: false,
    distance_km: null,
    peer_id: "regulator0.doh.bloodledger",
  },
];


// =========================================================
// INSTITUTION-SPECIFIC ROLES
// =========================================================
//
// These roles are prototype defaults.
// They can be refined after stakeholder validation.

window.INSTITUTION_ROLES = {
  "MMC-LIP": [
    {
      id: "Medical Technologist",
      label: "Medical Technologist",
      sub: "Manage blood unit intake and inventory records.",
    },

    {
      id: "Blood Bank Head",
      label: "Blood Bank Head",
      sub: "Oversee inventory, requests, transfers, and compliance records.",
    },

    {
      id: "System Administrator",
      label: "System Administrator",
      sub: "Manage system-level access and configuration.",
    },
  ],

  "PRC-LIP": [
    {
      id: "PRC Officer",
      label: "PRC Officer",
      sub: "Review blood availability and coordinate distribution activities.",
    },

    {
      id: "PRC Administrator",
      label: "PRC Administrator",
      sub: "Oversee PRC-side BloodLedger activities and records.",
    },
  ],

  "LMC-LIP": [
    {
      id: "Medical Technologist",
      label: "Medical Technologist",
      sub: "Review blood availability and handle blood-related records.",
    },

    {
      id: "Authorized Requester",
      label: "Authorized Requester",
      sub: "Create and monitor blood requests and transfers.",
    },
  ],

  "MDH-LIP": [
    {
      id: "Medical Technologist",
      label: "Medical Technologist",
      sub: "Review blood availability and handle blood-related records.",
    },

    {
      id: "Authorized Requester",
      label: "Authorized Requester",
      sub: "Create and monitor blood requests and transfers.",
    },

    {
      id: "Blood Bank Head",
      label: "Blood Bank Head",
      sub: "Approve requests and authorize blood-unit redistribution.",
    },
  ],

  "CLH-LIP": [
    {
      id: "Medical Technologist",
      label: "Medical Technologist",
      sub: "Review blood availability and handle blood-related records.",
    },

    {
      id: "Authorized Requester",
      label: "Authorized Requester",
      sub: "Create and monitor blood requests and transfers.",
    },

    {
      id: "Blood Bank Head",
      label: "Blood Bank Head",
      sub: "Approve requests and authorize blood-unit redistribution.",
    },
  ],

  "DOH-CHD": [
    {
      id: "DOH Regulatory Officer",
      label: "DOH Regulatory Officer",
      sub: "Review compliance reports and monitor participating facilities.",
    },
  ],
};


// =========================================================
// BLOOD TYPES & COMPONENTS
// =========================================================

window.BLOOD_TYPES = [
  "O-",
  "O+",
  "A-",
  "A+",
  "B-",
  "B+",
  "AB-",
  "AB+",
];

window.COMPONENTS = [
  "PRBC",
  "Platelets",
  "FFP",
  "Whole Blood",
  "Cryo",
];


// =========================================================
// LIVE MATRIX
// Mary Mediatrix scope by default
// =========================================================

window.MATRIX = [
  {
    type: "O-",
    units: 2,
    status: "critical",
    redistributable_units: 0,
    trend: -2,
    days_cover: 1.1,
  },

  {
    type: "O+",
    units: 18,
    status: "ok",
    redistributable_units: 0,
    trend: 1,
    days_cover: 4.2,
  },

  {
    type: "A-",
    units: 4,
    status: "warn",
    redistributable_units: 0,
    trend: 0,
    days_cover: 2.0,
  },

  {
    type: "A+",
    units: 22,
    status: "surplus",
    redistributable_units: 5,
    trend: 5,
    days_cover: 8.6,
  },

  {
    type: "B-",
    units: 3,
    status: "warn",
    redistributable_units: 0,
    trend: -1,
    days_cover: 1.9,
  },

  {
    type: "B+",
    units: 14,
    status: "ok",
    redistributable_units: 0,
    trend: 2,
    days_cover: 4.8,
  },

  {
    type: "AB-",
    units: 1,
    status: "critical",
    redistributable_units: 0,
    trend: 0,
    days_cover: 0.8,
  },

  {
    type: "AB+",
    units: 9,
    status: "ok",
    redistributable_units: 0,
    trend: 1,
    days_cover: 5.3,
  },
];


// =========================================================
// CITY-WIDE MATRIX
// =========================================================

window.CITY_MATRIX = {
  "PRC-LIP": {
    "O-": 14,
    "O+": 62,
    "A-": 11,
    "A+": 48,
    "B-": 9,
    "B+": 33,
    "AB-": 5,
    "AB+": 18,
  },

  "MMC-LIP": {
    "O-": 2,
    "O+": 18,
    "A-": 4,
    "A+": 22,
    "B-": 3,
    "B+": 14,
    "AB-": 1,
    "AB+": 9,
  },

  "LMC-LIP": {
    "O-": 5,
    "O+": 21,
    "A-": 2,
    "A+": 11,
    "B-": 4,
    "B+": 9,
    "AB-": 1,
    "AB+": 4,
  },

  "MDH-LIP": {
    "O-": 1,
    "O+": 9,
    "A-": 6,
    "A+": 7,
    "B-": 1,
    "B+": 5,
    "AB-": 0,
    "AB+": 2,
  },

  "CLH-LIP": {
    "O-": 3,
    "O+": 6,
    "A-": 1,
    "A+": 4,
    "B-": 2,
    "B+": 3,
    "AB-": 0,
    "AB+": 1,
  },
};


// =========================================================
// INVENTORY UNITS
// Mary Mediatrix scope
// =========================================================

window.INVENTORY = [
  {
    isbt: "=)W0381 2509 100023",
    type: "O-",
    comp: "PRBC",
    collected: "2026-04-12",
    expires: "2026-05-23",
    days_left: 2,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-2 / A-04",
    temp: 4.1,
  },

  {
    isbt: "=)W0381 2509 100027",
    type: "AB-",
    comp: "PRBC",
    collected: "2026-04-11",
    expires: "2026-05-22",
    days_left: 1,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-2 / B-01",
    temp: 4.0,
  },

  {
    isbt: "=)W0381 2510 100041",
    type: "A-",
    comp: "PRBC",
    collected: "2026-04-14",
    expires: "2026-05-25",
    days_left: 4,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-1 / C-02",
    temp: 4.2,
  },

  {
    isbt: "=)W0381 2510 100055",
    type: "O+",
    comp: "PRBC",
    collected: "2026-04-18",
    expires: "2026-05-29",
    days_left: 8,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-1 / A-08",
    temp: 4.1,
  },

  {
    isbt: "=)W0381 2510 100062",
    type: "A+",
    comp: "PRBC",
    collected: "2026-04-22",
    expires: "2026-06-02",
    days_left: 12,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-3 / D-11",
    temp: 4.0,
  },

  {
    isbt: "=)W0381 2511 100071",
    type: "B+",
    comp: "PRBC",
    collected: "2026-04-24",
    expires: "2026-06-04",
    days_left: 14,
    status: "Reserved",
    reserved_for: "CASE-29481",
    source: "PRC-LIP",
    shelf: "R-1 / B-06",
    temp: 4.1,
  },

  {
    isbt: "=)W0381 2511 100084",
    type: "A+",
    comp: "PRBC",
    collected: "2026-04-27",
    expires: "2026-06-07",
    days_left: 17,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-3 / D-12",
    temp: 3.9,
  },

  {
    isbt: "=)W0381 2511 100092",
    type: "O+",
    comp: "PRBC",
    collected: "2026-04-29",
    expires: "2026-06-09",
    days_left: 19,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "R-1 / A-09",
    temp: 4.0,
  },

  {
    isbt: "=)W0381 2512 100111",
    type: "B-",
    comp: "Platelets",
    collected: "2026-05-19",
    expires: "2026-05-24",
    days_left: 3,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "P-1 / A-01",
    temp: 22.0,
  },

  {
    isbt: "=)W0381 2512 100117",
    type: "O-",
    comp: "Platelets",
    collected: "2026-05-20",
    expires: "2026-05-25",
    days_left: 4,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "P-1 / A-02",
    temp: 22.1,
  },

  {
    isbt: "=)W0381 2511 100098",
    type: "AB+",
    comp: "FFP",
    collected: "2025-12-04",
    expires: "2026-12-04",
    days_left: 197,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "F-1 / A-04",
    temp: -27.0,
  },

  {
    isbt: "=)W0381 2511 100102",
    type: "A+",
    comp: "FFP",
    collected: "2026-01-18",
    expires: "2027-01-18",
    days_left: 242,
    status: "Available",
    reserved_for: null,
    source: "PRC-LIP",
    shelf: "F-1 / B-02",
    temp: -27.4,
  },
];


// =========================================================
// RECENT TRANSFERS
// =========================================================

window.TRANSFERS = [
  {
    id: "REQ-2026-0502",
    type: "B+",
    component: "PRBC",
    units: 2,
    from: "MDH-LIP",
    to: "LMC-LIP",
    status: "Requested",
    initiated: "2026-08-11 09:26",
    completed: null,
    urgency: "Routine",
    note: "Requested from Lipa Medix based on consortium availability.",
    requesterName: "C. Tan",
    requesterEmployeeId: "LMC-AR-0116",
    physicianName: "Dr. A. Villanueva",
    caseReference: "CASE-LMC-260811-04",
    requiredDate: "2026-08-11T15:00",
    pickupName: "J. Ramos, RMT",
    pickupIdReference: "LMC-MT-0284",
    attachments: [
      { category: "Blood Request Form", name: "LMC-request-0502.pdf", type: "application/pdf", size: 184320 },
      { category: "Pickup Authorization", name: "LMC-pickup-0502.pdf", type: "application/pdf", size: 92160 },
    ],
    requestOnly: true,
  },
  {
    id: "REQ-2026-0501",
    type: "O+",
    units: 2,
    from: "MMC-LIP",
    to: "LMC-LIP",
    status: "Requested",
    initiated: "2026-05-21 08:15",
    completed: null,
    urgency: "Urgent",
    note: "Secondary hospital stock request.",
    requestOnly: true,
  },

  {
    id: "TX-2026-0492",
    type: "O-",
    units: 2,
    from: "PRC-LIP",
    to: "MMC-LIP",
    status: "Received",
    initiated: "2026-05-21 06:14",
    completed: "2026-05-21 07:02",
    broa: 92,
    urgency: "Emergency",
    tx_hash: "0x7a3c…91be",
  },

  {
    id: "TX-2026-0491",
    type: "AB+",
    units: 1,
    from: "LMC-LIP",
    to: "MMC-LIP",
    status: "In Transit",
    initiated: "2026-05-21 05:47",
    completed: null,
    broa: 78,
    urgency: "Urgent",
    tx_hash: "0x4d12…22ef",
  },

  {
    id: "TX-2026-0490",
    type: "A+",
    units: 4,
    from: "MMC-LIP",
    to: "MDH-LIP",
    status: "Dispatched",
    initiated: "2026-05-21 04:30",
    completed: null,
    broa: 85,
    urgency: "Routine",
    tx_hash: "0x9b18…73c1",
  },

  {
    id: "TX-2026-0489E",
    type: "B-",
    units: 2,
    from: "PRC-LIP",
    to: "LMC-LIP",
    status: "Delayed",
    initiated: "2026-05-21 03:12",
    completed: null,
    broa: 74,
    urgency: "Urgent",
    tx_hash: "0xa441...9e02",
    exception:
      "Courier ETA slipped by 24 min; cold-chain sensor still within range.",
  },

  {
    id: "TX-2026-0488E",
    type: "AB-",
    units: 1,
    from: "MDH-LIP",
    to: "MMC-LIP",
    status: "Rejected",
    initiated: "2026-05-20 21:42",
    completed: null,
    broa: 61,
    urgency: "Emergency",
    tx_hash: "0xbc19...02d1",
    exception:
      "Receiver rejected after policy mismatch; BROA re-route required.",
  },

  {
    id: "TX-2026-0487E",
    type: "O+",
    units: 1,
    from: "CLH-LIP",
    to: "MDH-LIP",
    status: "Compromised",
    initiated: "2026-05-20 19:08",
    completed: null,
    broa: 58,
    urgency: "Routine",
    tx_hash: "0xdd72...70fa",
    exception:
      "Cold-chain excursion exceeded corridor policy; quarantine logged.",
  },

  {
    id: "TX-2026-0489",
    type: "B+",
    units: 1,
    from: "PRC-LIP",
    to: "CLH-LIP",
    status: "Received",
    initiated: "2026-05-20 22:11",
    completed: "2026-05-20 23:04",
    broa: 88,
    urgency: "Urgent",
    tx_hash: "0x2f8a…44d0",
  },

  {
    id: "TX-2026-0488",
    type: "O+",
    units: 3,
    from: "PRC-LIP",
    to: "MMC-LIP",
    status: "Received",
    initiated: "2026-05-20 18:02",
    completed: "2026-05-20 18:56",
    broa: 81,
    urgency: "Routine",
    tx_hash: "0x61cd…0ab2",
  },

  {
    id: "TX-2026-0487",
    type: "O-",
    units: 1,
    from: "LMC-LIP",
    to: "MDH-LIP",
    status: "Received",
    initiated: "2026-05-20 14:21",
    completed: "2026-05-20 15:18",
    broa: 90,
    urgency: "Emergency",
    tx_hash: "0x33aa…9fde",
  },
];


// =========================================================
// ALERTS
// =========================================================

window.ALERTS = [
  {
    id: "AL-7741",
    severity: "critical",
    title: "Critical shortage — AB− PRBC",
    desc: "Stock has dropped to 1 unit.",
    when: "2 min ago",
    source: "Inventory Monitor",

    actions: [
      {
        label: "Create request",
        kind: "primary",
        goto: "transfers",

        payload: {
          type: "AB-",
          units: 2,
          urgency: "Emergency",
        },
      },

      {
        label: "Acknowledge",
        kind: "ghost",
      },
    ],
  },

  {
    id: "AL-7740",
    severity: "critical",
    title: "Expiry imminent — 1 unit O− PRBC",
    desc:
      "A blood unit is approaching its recorded expiration date.",

    when: "11 min ago",
    source: "Inventory Monitor",

    actions: [
      {
        label: "View inventory",
        kind: "ghost",
        goto: "inventory",
      },
    ],
  },

  {
    id: "AL-7739",
    severity: "warn",
    title: "Low stock — B− Platelets",
    desc:
      "Current platelet inventory for B− is low.",

    when: "38 min ago",
    source: "Inventory Monitor",

    actions: [
      {
        label: "Create request",
        kind: "primary",
        goto: "transfers",

        payload: {
          type: "B-",
          units: 4,
          urgency: "Urgent",
        },
      },
    ],
  },

  {
    id: "AL-7738",
    severity: "info",
    title: "Inventory update recorded",
    desc:
      "A recent inventory update has been recorded in the system.",

    when: "1h ago",
    source: "System",

    actions: [],
  },
];


// =========================================================
// AUDIT / ACTIVITY HISTORY
// =========================================================

window.AUDIT = [
  {
    ts: "2026-05-21 07:02:14",
    actor: "mtech.santos",
    role: "Medical Technologist",
    action: "Blood transfer received",
    scanId: "SCN-IN-2026-0318",
    requestId: "REQ-2026-0477",
    transferId: "TX-2026-0492",
    blockchainId:
      "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    target: "TX-2026-0492 · 2 × O−",
    status: "Completed",
  },

  {
    ts: "2026-05-21 06:14:08",
    actor: "bloodbank.head",
    role: "Blood Bank Head",
    action: "Blood transfer dispatched",
    scanId: "SCN-OUT-2026-0294",
    requestId: "REQ-2026-0477",
    transferId: "TX-2026-0492",
    blockchainId:
      "4d129a83a6f27cb53664728789110628fb96ac10d67f45f18c7aa17b3e5222ef",
    target: "TX-2026-0492 · 2 × O−",
    status: "Completed",
  },

  {
    ts: "2026-05-21 04:31:09",
    actor: "head.reyes",
    role: "Blood Bank Head",
    action: "Transfer approved",
    scanId: null,
    requestId: "REQ-2026-0475",
    transferId: "TX-2026-0490",
    blockchainId:
      "9b18d47fb3510e24665c7685407e463b73d6761448f1be5a5131d277f06373c1",
    target: "TX-2026-0490",
    status: "Completed",
  },

  {
    ts: "2026-05-21 04:30:42",
    actor: "mtech.santos",
    role: "Medical Technologist",
    action: "Blood request created",
    scanId: null,
    requestId: "REQ-2026-0475",
    transferId: null,
    blockchainId:
      "61cd007e5656df568230827476bc0c212313655828f325140661b252c42c0ab2",
    target: "TX-2026-0490",
    status: "Recorded",
  },

  {
    ts: "2026-05-21 03:58:00",
    actor: "scanner",
    role: "System",
    action: "Blood unit added",
    scanId: "SCN-IN-2026-0289",
    requestId: null,
    transferId: null,
    blockchainId:
      "33aa196f09a4082111777043975ce11fb7059c357e962f03903b09ca46a49fde",
    target: "ISBT =)W0381 2512 100117",
    status: "Recorded",
  },
];


// =========================================================
// EXISTING OPTIONAL MOCK DATA
// =========================================================

window.BROA_CANDIDATES = {
  "O-": [
    {
      hospital: "PRC-LIP",
      stock: 14,
      distance: 2.1,
      expiry_score: 0.78,
      fefo_isbt: "=)W0381 2509 100018",
      broa: 0.93,
    },

    {
      hospital: "LMC-LIP",
      stock: 5,
      distance: 3.6,
      expiry_score: 0.62,
      fefo_isbt: "=)W0381 2510 100008",
      broa: 0.71,
    },
  ],

  "AB-": [
    {
      hospital: "PRC-LIP",
      stock: 5,
      distance: 2.1,
      expiry_score: 0.80,
      fefo_isbt: "=)W0381 2510 100201",
      broa: 0.93,
    },
  ],

  "B-": [
    {
      hospital: "PRC-LIP",
      stock: 9,
      distance: 2.1,
      expiry_score: 0.72,
      fefo_isbt: "=)W0381 2511 100501",
      broa: 0.88,
    },
  ],

  "A+": [
    {
      hospital: "MMC-LIP",
      stock: 22,
      distance: 0.0,
      expiry_score: 0.62,
      fefo_isbt: "=)W0381 2510 100062",
      broa: 0.95,
    },
  ],
};


// Kept for backwards compatibility with existing mock-up code.
// The new Compliance Reports page does not use these KPI values.

window.REPORTING = {
  kpis: [],
  distribution: [],
  completion: [],
};

// Three participating hospital blood banks. `total` is on-hand stock while
// `available` is the quantity released for consortium redistribution.
window.CONSORTIUM_BANKS = [
  {
    facilityId: "MMC-LIP",
    status: "Online",
    lastUpdated: "2026-08-11 09:40",
    responseTime: "12 min",
    inventory: {
      "O-": { total: 2, available: 0 }, "O+": { total: 18, available: 4 },
      "A-": { total: 4, available: 0 }, "A+": { total: 22, available: 5 },
      "B-": { total: 3, available: 0 }, "B+": { total: 14, available: 3 },
      "AB-": { total: 1, available: 0 }, "AB+": { total: 9, available: 2 },
    },
  },
  {
    facilityId: "MDH-LIP",
    status: "Online",
    lastUpdated: "2026-08-11 09:37",
    responseTime: "18 min",
    inventory: {
      "O-": { total: 8, available: 1 }, "O+": { total: 24, available: 7 },
      "A-": { total: 4, available: 0 }, "A+": { total: 15, available: 3 },
      "B-": { total: 5, available: 1 }, "B+": { total: 12, available: 2 },
      "AB-": { total: 2, available: 0 }, "AB+": { total: 7, available: 1 },
    },
  },
  {
    facilityId: "CLH-LIP",
    status: "Online",
    lastUpdated: "2026-08-11 09:34",
    responseTime: "24 min",
    inventory: {
      "O-": { total: 5, available: 0 }, "O+": { total: 16, available: 4 },
      "A-": { total: 3, available: 0 }, "A+": { total: 10, available: 2 },
      "B-": { total: 4, available: 1 }, "B+": { total: 8, available: 1 },
      "AB-": { total: 1, available: 0 }, "AB+": { total: 5, available: 1 },
    },
  },
];

window.CONSORTIUM_COMPONENT_FACTORS = {
  PRBC: 1,
  Platelets: 0.32,
  FFP: 0.45,
  "Whole Blood": 0.24,
  Cryo: 0.18,
};


// =========================================================
// PROTOTYPE USER ACCOUNTS
// =========================================================
// Demo-only credentials used by the frontend mock. Production accounts and
// passwords must be managed by the authentication service, never client data.

window.MOCK_ACCOUNTS = [
  { email: "m.santos@mmc.bloodledger", password: "BloodLedger2026!", name: "M. Santos, RMT", initials: "MS", hospital: "MMC-LIP", role: "Medical Technologist" },
  { email: "r.reyes@mmc.bloodledger", password: "BloodLedger2026!", name: "Dr. R. Reyes", initials: "RR", hospital: "MMC-LIP", role: "Blood Bank Head" },
  { email: "a.garcia@mmc.bloodledger", password: "BloodLedger2026!", name: "A. Garcia", initials: "AG", hospital: "MMC-LIP", role: "System Administrator" },

  { email: "p.cruz@prc.bloodledger", password: "BloodLedger2026!", name: "P. Cruz", initials: "PC", hospital: "PRC-LIP", role: "PRC Officer" },
  { email: "l.mendoza@prc.bloodledger", password: "BloodLedger2026!", name: "L. Mendoza", initials: "LM", hospital: "PRC-LIP", role: "PRC Administrator" },

  { email: "j.ramos@metrolipa.bloodledger", password: "BloodLedger2026!", name: "J. Ramos, RMT", initials: "JR", hospital: "LMC-LIP", role: "Medical Technologist" },
  { email: "c.tan@metrolipa.bloodledger", password: "BloodLedger2026!", name: "C. Tan", initials: "CT", hospital: "LMC-LIP", role: "Authorized Requester" },

  { email: "a.lim@medix.bloodledger", password: "BloodLedger2026!", name: "A. Lim, RMT", initials: "AL", hospital: "MDH-LIP", role: "Medical Technologist" },
  { email: "s.bautista@medix.bloodledger", password: "BloodLedger2026!", name: "S. Bautista", initials: "SB", hospital: "MDH-LIP", role: "Authorized Requester" },
  { email: "m.delacruz@medix.bloodledger", password: "BloodLedger2026!", name: "Dr. M. Dela Cruz", initials: "MD", hospital: "MDH-LIP", role: "Blood Bank Head" },

  { email: "d.flores@nlvilla.bloodledger", password: "BloodLedger2026!", name: "D. Flores, RMT", initials: "DF", hospital: "CLH-LIP", role: "Medical Technologist" },
  { email: "n.aquino@nlvilla.bloodledger", password: "BloodLedger2026!", name: "N. Aquino", initials: "NA", hospital: "CLH-LIP", role: "Authorized Requester" },
  { email: "p.hernandez@nlvilla.bloodledger", password: "BloodLedger2026!", name: "Dr. P. Hernandez", initials: "PH", hospital: "CLH-LIP", role: "Blood Bank Head" },

  { email: "regional.officer@doh.bloodledger", password: "BloodLedger2026!", name: "DOH Calabarzon Officer", initials: "DO", hospital: "DOH-CHD", role: "DOH Regulatory Officer" },
];

// Approved profile details mirror the fields collected in the institutional
// application. These are prototype records and not authoritative credentials.
window.USER_PROFILE_DETAILS = {
  "r.reyes@mmc.bloodledger": { employeeId: "MMC-BBH-0042", position: "Blood Bank Head", phone: "+63 917 555 0142", professionalLicense: "PRC-MD-0084217", applicationId: "APP-2026-0142", submitted: "2026-07-10 09:16", approvedAt: "2026-07-15 10:30", approvedBy: "PRC System Administration", status: "Active", lastSignIn: "2026-08-11 09:42" },
  "m.santos@mmc.bloodledger": { employeeId: "MMC-MT-0187", position: "Medical Technologist", phone: "+63 917 555 0187", professionalLicense: "PRC-MT-0063187", applicationId: "APP-2026-0142", approvedAt: "2026-07-15 10:30", status: "Active" },
  "a.garcia@mmc.bloodledger": { employeeId: "MMC-IT-0031", position: "System Administrator", phone: "+63 917 555 0031", applicationId: "APP-2026-0142", approvedAt: "2026-07-15 10:30", status: "Active" },
  "p.cruz@prc.bloodledger": { employeeId: "PRC-LIP-0118", position: "PRC Officer", phone: "+63 917 555 0118", applicationId: "PRC-SYS-2026-001", approvedAt: "2026-07-01 08:00", status: "Active" },
  "l.mendoza@prc.bloodledger": { employeeId: "PRC-LIP-0007", position: "PRC System Administrator", phone: "+63 917 555 0007", applicationId: "PRC-SYS-2026-001", approvedAt: "2026-07-01 08:00", status: "Active" },
  "j.ramos@metrolipa.bloodledger": { employeeId: "LMC-MT-0284", position: "Medical Technologist", phone: "+63 917 555 0284", professionalLicense: "PRC-MT-0059284", applicationId: "APP-2026-0179", submitted: "2026-07-28 13:20", approvedAt: "2026-08-04 10:12", approvedBy: "L. Mendoza", status: "Active" },
  "c.tan@metrolipa.bloodledger": { employeeId: "LMC-AR-0116", position: "Authorized Requester", phone: "+63 917 555 0116", applicationId: "APP-2026-0179", approvedAt: "2026-08-04 10:12", status: "Active" },
  "a.lim@medix.bloodledger": { employeeId: "MDH-MT-0192", position: "Medical Technologist", phone: "+63 917 555 0192", professionalLicense: "PRC-MT-0057192", applicationId: "APP-2026-0178", approvedAt: "2026-08-04 09:35", status: "Active" },
  "s.bautista@medix.bloodledger": { employeeId: "MDH-AR-0088", position: "Authorized Requester", phone: "+63 917 555 0088", applicationId: "APP-2026-0178", approvedAt: "2026-08-04 09:35", status: "Active" },
  "m.delacruz@medix.bloodledger": { employeeId: "MDH-BBH-0025", position: "Blood Bank Head", phone: "+63 917 555 0025", professionalLicense: "PRC-MD-0074025", applicationId: "APP-2026-0178", approvedAt: "2026-08-04 09:35", status: "Active" },
  "d.flores@nlvilla.bloodledger": { employeeId: "CLH-MT-0127", position: "Medical Technologist", phone: "+63 917 555 0127", professionalLicense: "PRC-MT-0048127", applicationId: "APP-2026-0177", approvedAt: "2026-08-03 11:05", status: "Active" },
  "n.aquino@nlvilla.bloodledger": { employeeId: "CLH-AR-0064", position: "Authorized Requester", phone: "+63 917 555 0064", applicationId: "APP-2026-0177", approvedAt: "2026-08-03 11:05", status: "Active" },
  "p.hernandez@nlvilla.bloodledger": { employeeId: "CLH-BBH-0019", position: "Blood Bank Head", phone: "+63 917 555 0019", professionalLicense: "PRC-MD-0068019", applicationId: "APP-2026-0177", approvedAt: "2026-08-03 11:05", status: "Active" },
  "regional.officer@doh.bloodledger": { employeeId: "DOH-CHD-021", position: "Regional Regulatory Officer", phone: "+63 917 555 0021", applicationId: "DOH-SYS-2026-001", approvedAt: "2026-07-01 08:00", status: "Active" },
};

window.FACILITY_PROFILES = {
  "MMC-LIP": { legalName: "Mary Mediatrix Medical Center", participationType: "Blood Bank", facilityLevel: "Level 3 Hospital", ownership: "Private", address: "Lipa City, Batangas", facilityEmail: "bloodbank@mmc.bloodledger", phone: "+63 (43) 000 0142", hospitalLto: "DOH-HF-LTO-MMC-2026", bloodServiceLicense: "DOH-BSF-MMC-2026", bloodServiceCategory: "Blood Bank", referralFacility: "PRC Lipa City Chapter", documents: [{ name: "Hospital LTO.pdf", category: "Hospital / Health Facility LTO" }, { name: "Blood Service Facility License.pdf", category: "DOH BSF LTO" }, { name: "Facility Assessment.pdf", category: "Assessment and capability documents" }] },
  "LMC-LIP": { legalName: "Metro Lipa Medical Center", participationType: "Requestor", facilityLevel: "Level 2 Hospital", ownership: "Private", address: "Lipa City, Batangas", facilityEmail: "transfusion@metrolipa.bloodledger", phone: "+63 (43) 000 0179", hospitalLto: "DOH-HF-LTO-LMC-2026", bloodServiceLicense: "DOH-BS-ATO-LMC-2026", referralFacility: "Mary Mediatrix Medical Center", documents: [{ name: "Hospital LTO.pdf", category: "Hospital / Health Facility LTO" }, { name: "Blood Station Authorization.pdf", category: "Blood Station authority" }] },
  "MDH-LIP": { legalName: "Lipa Medix Medical Center", participationType: "Blood Bank", facilityLevel: "Level 2 Hospital", ownership: "Private", address: "Lipa City, Batangas", facilityEmail: "bloodbank@medix.bloodledger", phone: "+63 (43) 000 0178", hospitalLto: "DOH-HF-LTO-MDH-2026", bloodServiceLicense: "DOH-BSF-MDH-2026", bloodServiceCategory: "Blood Bank", referralFacility: "PRC Lipa City Chapter" },
  "CLH-LIP": { legalName: "N.L. Villa Memorial Medical Center", participationType: "Blood Bank", facilityLevel: "Level 2 Hospital", ownership: "Private", address: "Lipa City, Batangas", facilityEmail: "bloodbank@nlvilla.bloodledger", phone: "+63 (43) 000 0177", hospitalLto: "DOH-HF-LTO-CLH-2026", bloodServiceLicense: "DOH-BSF-CLH-2026", bloodServiceCategory: "Blood Bank", referralFacility: "PRC Lipa City Chapter" },
  "PRC-LIP": { legalName: "Philippine Red Cross - Lipa City Chapter", participationType: "Network Supply Partner", facilityLevel: "Red Cross Chapter", ownership: "Non-government humanitarian organization", address: "Lipa City, Batangas", facilityEmail: "bloodservices@prc.bloodledger", phone: "+63 (43) 000 0101", hospitalLto: "Not applicable", bloodServiceLicense: "PRC-BS-LIPA-2026", bloodServiceCategory: "Blood Center" },
  "DOH-CHD": { legalName: "Department of Health - Center for Health Development CALABARZON", participationType: "Regulator", facilityLevel: "Regional Health Authority", ownership: "Government", address: "CALABARZON", facilityEmail: "regulatory@doh.bloodledger", phone: "+63 (2) 000 0021", hospitalLto: "Not applicable", bloodServiceLicense: "Not applicable" },
};

// Upstream supply coordination with the Philippine Red Cross.
// These records are separate from inter-hospital blood requests.
window.PRC_SUPPLY_REQUESTS = [
  {
    id: "PRC-REQ-2026-0018",
    type: "O-",
    component: "PRBC",
    units: 4,
    urgency: "Urgent",
    neededBy: "2026-08-06T10:00",
    requestedBy: "Dr. R. Reyes",
    requestedAt: "2026-08-05 09:20",
    status: "Acknowledged",
    prcReference: "PRC-LIPA-88317",
    note: "For critical stock replenishment.",
  },
  {
    id: "PRC-REQ-2026-0017",
    type: "B-",
    component: "Platelets",
    units: 2,
    urgency: "Routine",
    neededBy: "2026-08-07T14:00",
    requestedBy: "Dr. R. Reyes",
    requestedAt: "2026-08-04 15:45",
    status: "Ready for Pickup",
    prcReference: "PRC-LIPA-88294",
    note: "Scheduled stock replenishment.",
  },
];

window.ADMIN_ACTIVITY = [
  {
    id: "ADM-2026-0088",
    timestamp: "2026-08-04 10:12:00",
    administrator: "L. Mendoza",
    action: "Approved application",
    target: "APP-2026-0179",
    details: "Requestor institution documents and primary contact verified.",
  },
  {
    id: "ADM-2026-0087",
    timestamp: "2026-08-03 14:35:00",
    administrator: "L. Mendoza",
    action: "Deleted account",
    target: "former.user@example.org",
    details: "Employment ended; access removed upon institution request.",
  },
];

window.PENDING_ACCOUNTS = [
  {
    id: "APP-2026-0184",
    name: "K. Villanueva, RMT",
    email: "k.villanueva@metrolipa.example",
    employee_id: "LMC-2841",
    hospital: "LMC-LIP",
    role: "Medical Technologist",
    applicant_type: "Requestor",
    submitted: "2026-08-04 09:18",
    status: "Pending Review",
  },
  {
    id: "APP-2026-0183",
    name: "E. Navarro",
    email: "e.navarro@medix.example",
    employee_id: "MDH-1906",
    hospital: "MDH-LIP",
    role: "Authorized Requester",
    applicant_type: "Requestor",
    submitted: "2026-08-04 08:42",
    status: "Pending Review",
  },
  {
    id: "APP-2026-0182",
    name: "L. Castillo, RMT",
    email: "l.castillo@mmc.example",
    employee_id: "MMC-3317",
    hospital: "MMC-LIP",
    role: "Medical Technologist",
    applicant_type: "Blood Bank",
    submitted: "2026-08-03 16:05",
    status: "Pending Review",
  },
];
