// pages/dashboard.jsx — Live data matrix + activity

function DashboardPage({ hospital, permissions, transfers, onNav, onAct }) {
  const matrix = window.MATRIX;
  const totalUnits = matrix.reduce((s, m) => s + m.units, 0);
  const critical = matrix.filter((m) => m.status === "critical").length;
  const warn = matrix.filter((m) => m.status === "warn").length;
  const surplus = matrix.filter((m) => m.status === "surplus").length;

  return (
    <div className="page">
      <PageHead
        eyebrow={`Live · ${hospital.short}`}
        title="Data Matrix"
        sub="Real-time inventory across blood groups and components. Cells are live: pulled from your peer and reconciled against the consortium ledger every 30 seconds."
        actions={
          <>
            <Btn icon="filter" size="sm">Component: PRBC</Btn>
            <Btn icon="refresh" size="sm">Refresh</Btn>
            {permissions.canCreateTransfer && <Btn kind="primary" icon="plus" onClick={() => onNav("transfers")}>New transfer</Btn>}
          </>
        }
      />

      {/* KPIs */}
      <div className="stat-grid">
        <Stat label="On-hand units" value={totalUnits} unit="units"
          delta="+4 vs 24h ago" deltaDir="up"
          spark={<Spark data={[60, 62, 58, 64, 68, 70, 73]} color="var(--ink-2)" />} />
        <Stat label="Critical groups" value={critical} unit={critical === 1 ? "group" : "groups"}
          delta="O− and AB− at threshold" deltaDir="down" accent="critical"
          spark={<Spark data={[1,2,2,2,3,2,2]} color="var(--critical)" />} />
        <Stat label="Days of cover (median)" value="4.5" unit="days"
          delta="−0.3 day" deltaDir="down" accent="warn"
          spark={<Spark data={[5.1,5.0,4.7,4.6,4.5,4.5,4.5]} color="var(--warn)" />} />
        <Stat label="Pending transfers" value="3" unit=""
          delta="2 inbound · 1 outbound" deltaDir="neutral" accent="info" />
      </div>

      <div style={{ height: 18 }} />

      {/* Matrix card */}
      <div className="card">
        <div className="card-h">
          <h3>Inventory matrix — PRBC</h3>
          <div className="sub muted">Click any group to drill into FEFO-sequenced units.</div>
          <div className="actions">
            <Chip kind="critical" dot>{critical} critical</Chip>
            <Chip kind="warn" dot>{warn} low</Chip>
            <Chip kind="info" dot>{surplus} surplus</Chip>
          </div>
        </div>
        <div className="card-b">
          <div className="matrix">
            {matrix.map((m) => (
              <button key={m.type}
                className={`matrix-cell s-${m.status}`}
                onClick={() => onNav("inventory", { type: m.type })}>
                <div className="indicator" />
                <div className="head">
                  <BloodType type={m.type} />
                  <span className="muted tiny mono">
                    {m.trend > 0 ? `+${m.trend}` : m.trend} 24h
                  </span>
                </div>
                <div className="units serif tnum">{m.units}</div>
                <div className="unit-suffix">{m.days_cover.toFixed(1)} d cover</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      {/* Bottom row: priority alerts + activity */}
      <div className="grid-dash">
        <div className="card">
          <div className="card-h">
            <h3>Priority alerts</h3>
            <div className="sub muted">From BROA · Blood Recommendation & Optimization Agent</div>
            <div className="actions">
              <Btn size="sm" kind="ghost" onClick={() => onNav("alerts")}>View all <I name="arrowRight" size={12} /></Btn>
            </div>
          </div>
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {window.ALERTS.slice(0, 3).map((a) => (
              <div key={a.id} className={`alert-card ${a.severity}`}>
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <span className={`chip ${a.severity === "critical" ? "solid-critical" : a.severity === "warn" ? "warn" : "info"}`}
                          style={a.severity === "critical" ? { color: "#fff" } : null}>
                      {a.severity.toUpperCase()}
                    </span>
                    <div className="title">{a.title}</div>
                  </div>
                  <div className="desc">{a.desc}</div>
                  <div className="meta">
                    <span><I name="clock" size={11} /> {a.when}</span>
                    <span>· {a.source}</span>
                  </div>
                </div>
                <div className="quick">
                  {a.actions.filter((act) => permissions.canCreateTransfer || act.kind !== "primary").map((act, i) => (
                    <Btn key={i} kind={act.kind === "primary" ? "primary" : "ghost"} size="sm"
                         onClick={() => act.goto && onAct(act)}>
                      {act.label}
                    </Btn>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Network activity</h3>
            <div className="sub muted"><span className="live-dot" /> Live from consortium</div>
          </div>
          <div className="card-b flush">
            <table className="tbl">
              <thead><tr>
                <th>Tx</th><th>Type</th><th className="right">Units</th><th>Route</th><th>Status</th>
              </tr></thead>
              <tbody>
                {(transfers || window.TRANSFERS).slice(0, 6).map((t) => (
                  <tr key={t.id} className="row-clickable" onClick={() => onNav("transfers", { selectId: t.id })}>
                    <td className="mono">{t.id}</td>
                    <td><BloodType type={t.type} /></td>
                    <td className="right tnum">{t.units}</td>
                    <td className="small">
                      {hospitalById(t.from).short}
                      <I name="arrowRight" size={11} />
                      {hospitalById(t.to).short}
                    </td>
                    <td>
                      <Chip kind={transferStatusKind(t.status)} dot>
                        {t.status}
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });
