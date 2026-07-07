// pages/alerts.jsx — Alert center, wired to Transfers

function AlertsPage({ permissions, onAct, onNav }) {
  const [filter, setFilter] = React.useState("all");
  const counts = window.ALERTS.reduce((a, c) => ((a[c.severity] = (a[c.severity] || 0) + 1), a), {});
  const filtered = filter === "all" ? window.ALERTS : window.ALERTS.filter((a) => a.severity === filter);

  return (
    <div className="page">
      <PageHead
        eyebrow="BROA · Threshold monitors · Cold-chain"
        title="Alert Center"
        sub="Smart-contract alerts from your peer and the consortium. Each recommendation is one click away from a multi-sig transfer."
        actions={
          <>
            <Btn icon="bell" size="sm">Subscriptions</Btn>
            <Btn icon="settings" size="sm">Threshold rules</Btn>
          </>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filters">
          {[
            ["all", "All", window.ALERTS.length],
            ["critical", "Critical", counts.critical || 0],
            ["warn", "Low cover", counts.warn || 0],
            ["info", "Informational", counts.info || 0],
          ].map(([k, l, n]) => (
            <button key={k} className={`filter-chip ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>
              {l} <span className="count">{n}</span>
            </button>
          ))}
          <div style={{ marginLeft: "auto" }} className="muted small">
            <span className="live-dot" /> Streaming from <span className="mono">peer0.mmc</span>
          </div>
        </div>
      </div>

      <div className="col" style={{ gap: 12 }}>
        {filtered.map((a) => (
          <div key={a.id} className={`alert-card ${a.severity}`}>
            <div>
              <div className="row" style={{ gap: 10, alignItems: "center" }}>
                <span className={`chip ${a.severity === "critical" ? "solid-critical" : a.severity === "warn" ? "warn" : a.severity === "ok" ? "ok" : "info"}`}
                      style={a.severity === "critical" ? { color: "#fff" } : null}>
                  {a.severity.toUpperCase()}
                </span>
                <span className="mono tiny muted">{a.id}</span>
                <span className="muted small">·</span>
                <span className="muted small"><I name="clock" size={11} /> {a.when}</span>
              </div>
              <div className="title" style={{ fontSize: 16, marginTop: 8, fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                {a.title}
              </div>
              <div className="desc">{a.desc}</div>
              <div className="meta">
                <span>{a.source}</span>
              </div>
              <div className="rec">
                <strong>{a.rec_label}.</strong> {a.rec}
              </div>
            </div>
            <div className="quick">
              {a.actions.filter((act) => {
                if (act.kind === "primary") return permissions.canCreateTransfer;
                return permissions.canAcknowledge;
              }).map((act, i) => (
                <Btn key={i} kind={act.kind === "primary" ? "primary" : "ghost"} size="sm" icon={act.kind === "primary" ? "arrowRight" : undefined}
                     onClick={() => act.goto ? onAct(act) : null}>
                  {act.label}
                </Btn>
              ))}
              <Btn size="sm" kind="ghost" onClick={() => onNav("audit", { alert: a.id })}>View on ledger</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AlertsPage });
