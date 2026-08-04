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

  Object.assign(window, {
    BloodLedgerApi: { config, getBootstrap, login, logout, createTransfer, ingestScan },
  });
})();
