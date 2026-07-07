// app.jsx — Root + simple in-page router

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#9A1B1B",
  "density": "regular",
  "showLogin": false
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ["#9A1B1B", "#7A3E2E", "#4A6E5B", "#234F9E"];
const SHOW_TWEAKS = !window.BLOODLEDGER_PRODUCTION;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply tweak side effects
  React.useEffect(() => {
    document.body.classList.toggle("theme-dark", !!t.dark);
    document.documentElement.style.setProperty("--blood", t.accent);
    document.documentElement.style.setProperty("--blood-deep",
      shade(t.accent, -0.18));
  }, [t.dark, t.accent]);

  const [authed, setAuthed] = React.useState(true);
  const [session, setSession] = React.useState({
    hospital: HOSPITALS[1],
    user: { name: "Dr. R. Reyes", initials: "RR", role: "BLOOD BANK HEAD" },
  });

  const [page, setPage] = React.useState("dashboard");
  const [pageState, setPageState] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [transfers, setTransfers] = React.useState(window.TRANSFERS);
  const permissions = buildPermissions(session);

  const toast = React.useContext(ToastCtx);

  const navigate = (id, state) => {
    setPage(id);
    setPageState(state || null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleAlertAction = (action) => {
    if (action.goto) navigate(action.goto, action.payload || null);
  };

  const handleCommit = async (payload) => {
    if (!permissions.canCreateTransfer) {
      toast.push({ kind: "warn", text: "Read-only session", sub: "This role can review ledger data but cannot write transfer records." });
      return;
    }
    const result = await BloodLedgerApi.createTransfer(payload);
    const tx = {
      id: result.id || payload.id,
      type: payload.type,
      units: payload.units,
      from: payload.from,
      to: payload.to,
      status: result.status || "Dispatched",
      initiated: new Date().toISOString().slice(0, 16).replace("T", " "),
      completed: result.completed || null,
      broa: Math.round(payload.broa * 100),
      urgency: payload.urgency,
      tx_hash: result.tx_hash || "0xfc81...aa92",
      requestOnly: !!payload.requestOnly,
    };
    setTransfers((x) => [tx, ...x]);
    window.TRANSFERS = [tx, ...window.TRANSFERS];
    toast.push({
      kind: "ok",
      text: payload.requestOnly ? `${tx.id} request queued` : `${tx.id} committed to ledger`,
      sub: `Block ${result.block || 124893} · ${tx.units}x ${tx.type}`,
    });
    return tx;
  };

  const handleLogin = async (s) => {
    const next = await BloodLedgerApi.login(s);
    setSession(next);
    setAuthed(true);
    setTweak("showLogin", false);
  };

  const handleLogout = async () => {
    await BloodLedgerApi.logout();
    setAuthed(false);
  };

  if (t.showLogin || !authed) {
    return (
      <div className="app login-mode">
        <LoginPage onLogin={handleLogin} />
        {SHOW_TWEAKS && <Tweaks t={t} setTweak={setTweak} />}
      </div>
    );
  }

  const pageProps = { hospital: session.hospital, session, permissions, transfers, onNav: navigate, onAct: handleAlertAction, onCommit: handleCommit };
  const crumbsByPage = {
    dashboard: ["Operations", "Dashboard"],
    inventory: ["Operations", "Inventory"],
    transfers: ["Operations", "Transfers"],
    alerts: ["Operations", "Alerts"],
    scanner: ["Field & Network", "Scan & Intake"],
    consortium: ["Field & Network", "Consortium"],
    audit: ["Compliance", "Audit Ledger"],
    reporting: ["Compliance", "Reporting"],
  };

  let PageBody = null;
  if (page === "dashboard") PageBody = <DashboardPage {...pageProps} />;
  else if (page === "inventory") PageBody = <InventoryPage {...pageProps} filter={pageState} />;
  else if (page === "transfers") PageBody = <TransfersPage {...pageProps} prefill={pageState} />;
  else if (page === "alerts") PageBody = <AlertsPage {...pageProps} />;
  else if (page === "scanner") PageBody = <ScannerPage {...pageProps} />;
  else if (page === "consortium") PageBody = <ConsortiumPage {...pageProps} />;
  else if (page === "audit") PageBody = <AuditPage {...pageProps} filter={pageState} />;
  else if (page === "reporting") PageBody = <ReportingPage {...pageProps} />;

  const badges = {
    transfers: transfers.filter((x) => x.status !== "Received").length,
    alerts: window.ALERTS.filter((a) => a.severity === "critical").length,
  };

  return (
    <div className={`app density-${t.density}`}>
      <Sidebar
        active={page}
        onNav={navigate}
        hospital={session.hospital}
        user={{ ...session.user, onLogout: handleLogout }}
        badges={badges}
      />
      <div className="main">
        <Topbar
          crumbs={crumbsByPage[page] || ["Bloodledger"]}
          search={search}
          onSearch={setSearch}
          right={
            <Btn icon="bell" size="sm" onClick={() => navigate("alerts")}>
              {badges.alerts} <span className="muted" style={{ marginLeft: 4 }}>alerts</span>
            </Btn>
          }
        />
        {PageBody}
      </div>
      {SHOW_TWEAKS && <Tweaks t={t} setTweak={setTweak} />}
    </div>
  );
}

// ───── Tweaks panel ──────────────────────────────────────────────────────
function Tweaks({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Theme" />
      <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
      <TweakColor label="Accent" value={t.accent} options={ACCENT_OPTIONS}
                  onChange={(v) => setTweak("accent", v)} />
      <TweakSection label="Layout" />
      <TweakRadio label="Density" value={t.density} options={["compact", "regular"]}
                  onChange={(v) => setTweak("density", v)} />
      <TweakSection label="Demo" />
      <TweakToggle label="Show login screen" value={!!t.showLogin}
                   onChange={(v) => setTweak("showLogin", v)} />
    </TweaksPanel>
  );
}

// Lighten / darken a hex color
function shade(hex, amt) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + Math.round(255 * amt)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amt)));
  const b = Math.max(0, Math.min(255, (n & 0xff) + Math.round(255 * amt)));
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
