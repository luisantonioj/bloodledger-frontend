// api.js - static-friendly API facade with mock fallback.
// Replace BloodLedgerApi.config.baseUrl when the Express REST API is ready.

(function () {
  const config = {
    baseUrl: window.BLOODLEDGER_API_BASE || "",
    mock: !window.BLOODLEDGER_API_BASE,
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function request(path, options) {
    if (config.mock) return null;
    const res = await fetch(`${config.baseUrl}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...(options || {}),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    if (res.status === 204) return null;
    return res.json();
  }

  function nextTransferId() {
    const ids = (window.TRANSFERS || [])
      .map((t) => Number(String(t.id || "").split("-").pop()))
      .filter(Boolean);
    return `TX-2026-${String(Math.max(...ids, 492) + 1).padStart(4, "0")}`;
  }

  async function getBootstrap() {
    if (!config.mock) return request("/bootstrap");
    return {
      hospitals: window.HOSPITALS,
      bloodTypes: window.BLOOD_TYPES,
      components: window.COMPONENTS,
      matrix: window.MATRIX,
      cityMatrix: window.CITY_MATRIX,
      inventory: window.INVENTORY,
      transfers: window.TRANSFERS,
      alerts: window.ALERTS,
      audit: window.AUDIT,
      broaCandidates: window.BROA_CANDIDATES,
      reporting: window.REPORTING,
      scanHistory: window.SCAN_HISTORY,
    };
  }

  async function login({ email, password, hospital, role, username }) {
    if (!config.mock) {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    }
    const normalizedEmail = String(email || username || "").trim().toLowerCase();
    const account = (window.MOCK_ACCOUNTS || []).find(
      (item) => item.email.toLowerCase() === normalizedEmail
    );

    await wait(180);

    if (!account || (password != null && password !== account.password)) {
      throw new Error("The email address or password is incorrect.");
    }

    const nextHospital = hospital || account.hospital;
    const nextRole = role || account.role;
    const h = (window.HOSPITALS || []).find((item) => item.id === nextHospital);
    return {
      hospital: h,
      user: {
        name: account.name,
        initials: account.initials,
        role: nextRole.toUpperCase(),
        username: account.email,
      },
    };
  }

  async function logout() {
    if (!config.mock) return request("/auth/logout", { method: "POST" });
    return wait(80);
  }

  async function createTransfer(payload) {
    if (!config.mock) {
      return request("/transfers", { method: "POST", body: JSON.stringify(payload) });
    }
    await wait(220);
    return {
      id: payload.id || nextTransferId(),
      status: payload.requestOnly ? "Pending" : "Dispatched",
      tx_hash: "0xfc81...aa92",
      block: 124893,
      completed: null,
    };
  }

  async function ingestScan(unit, options) {
    if (!config.mock) {
      return request("/scan-ingest", { method: "POST", body: JSON.stringify(unit) });
    }
    await wait(160);
    if (options && options.offline) {
      return { status: "Buffered", block: null };
    }
    return { status: "Committed", block: 124893 };
  }

  async function getAnalytics(scope, filters) {
    if (!config.mock) {
      const query = new URLSearchParams(filters || {}).toString();
      return request(`/analytics/${encodeURIComponent(scope.facilityId || scope.type)}?${query}`);
    }
    await wait(180);
    const isPrc = scope?.type === "prc";
    const allowedFacilities = isPrc
      ? (window.HOSPITALS || []).filter((item) => item.is_blood_bank).map((item) => item.id)
      : [scope?.facilityId];
    const demand = (window.ANALYTICS_DEMAND || []).filter((row) => {
      if (!allowedFacilities.includes(row.facilityId)) return false;
      if (filters?.dateFrom && `${row.month}-28` < filters.dateFrom) return false;
      if (filters?.dateTo && `${row.month}-01` > filters.dateTo) return false;
      if (filters?.bloodType && filters.bloodType !== "All" && row.bloodType !== filters.bloodType) return false;
      if (filters?.component && filters.component !== "All" && row.component !== filters.component) return false;
      if (!isPrc && filters?.group && filters.group !== "All" && row.department !== filters.group) return false;
      if (isPrc && filters?.group && filters.group !== "All" && row.requestingFacilityId !== filters.group) return false;
      return true;
    });
    const assessments = (window.ANALYTICS_ASSESSMENTS || []).filter((row) =>
      allowedFacilities.includes(row.facilityId) &&
      (!filters?.bloodType || filters.bloodType === "All" || row.bloodType === filters.bloodType) &&
      (!filters?.component || filters.component === "All" || row.component === filters.component)
    );
    return { demand, assessments, meta: window.ANALYTICS_META, scope, confirmedUseAvailable: false };
  }

  Object.assign(window, {
    BloodLedgerApi: { config, getBootstrap, login, logout, createTransfer, ingestScan, getAnalytics },
  });
})();
