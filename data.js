// ========== Mock data for BloodLedger ==========
// The hospital ordering places Mary Mediatrix first because it is the
// primary operational institution used by the current prototype.

window.HOSPITALS = [
  {
    id: "MMC-LIP",
    name: "Mary Mediatrix Medical Center",
    short: "Mary Mediatrix",
    type: "Tertiary Hospital",
    distance_km: 2.1,
    peer_id: "peer0.mmc.bloodledger",
  },

  {
    id: "PRC-LIP",
    name: "PRC Lipa City Chapter",
    short: "PRC Lipa",
    type: "Red Cross Hub",
    distance_km: 0.0,
    peer_id: "peer0.prc-lipa.bloodledger",
  },

  {
    id: "LMC-LIP",
    name: "Lipa Medix Medical Center",
    short: "Lipa Medix",
    type: "Level II Hospital",
    distance_km: 3.6,
    peer_id: "peer0.lmc.bloodledger",
  },

  {
    id: "MDH-LIP",
    name: "Metro Lipa Doctors Hospital",
    short: "Metro Doctors",
    type: "Level II Hospital",
    distance_km: 4.4,
    peer_id: "peer0.mdh.bloodledger",
  },

  {
    id: "CLH-LIP",
    name: "C. Laurel Memorial Hospital",
    short: "C. Laurel Memorial",
    type: "Level I Hospital",
    distance_km: 6.2,
    peer_id: "peer0.clh.bloodledger",
  },

  {
    id: "DOH-CHD",
    name: "DOH-CHD CALABARZON",
    short: "DOH-CHD",
    type: "Regulator",
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
    id: "REQ-2026-0501",
    type: "O+",
    units: 2,
    from: null,
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

  { email: "j.ramos@lmc.bloodledger", password: "BloodLedger2026!", name: "J. Ramos, RMT", initials: "JR", hospital: "LMC-LIP", role: "Medical Technologist" },
  { email: "c.tan@lmc.bloodledger", password: "BloodLedger2026!", name: "C. Tan", initials: "CT", hospital: "LMC-LIP", role: "Authorized Requester" },

  { email: "a.lim@mdh.bloodledger", password: "BloodLedger2026!", name: "A. Lim, RMT", initials: "AL", hospital: "MDH-LIP", role: "Medical Technologist" },
  { email: "s.bautista@mdh.bloodledger", password: "BloodLedger2026!", name: "S. Bautista", initials: "SB", hospital: "MDH-LIP", role: "Authorized Requester" },

  { email: "d.flores@clh.bloodledger", password: "BloodLedger2026!", name: "D. Flores, RMT", initials: "DF", hospital: "CLH-LIP", role: "Medical Technologist" },
  { email: "n.aquino@clh.bloodledger", password: "BloodLedger2026!", name: "N. Aquino", initials: "NA", hospital: "CLH-LIP", role: "Authorized Requester" },

  { email: "regional.officer@doh.bloodledger", password: "BloodLedger2026!", name: "DOH Calabarzon Officer", initials: "DO", hospital: "DOH-CHD", role: "DOH Regulatory Officer" },
];

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
    email: "k.villanueva@lmc.example",
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
    email: "e.navarro@mdh.example",
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
