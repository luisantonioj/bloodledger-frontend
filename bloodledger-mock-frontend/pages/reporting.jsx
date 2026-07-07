// pages/reporting.jsx — DOH / PRC summary view

function ReportingPage({ onNav }) {
  const r = window.REPORTING;
  const maxDispatched = Math.max(...r.distribution.map((d) => d.dispatched + d.received));

  return (
    <div className="page">
      <PageHead
        eyebrow="Read-only · DOH-CHD Calabarzon · Q2 2026"
        title="Reporting"
        sub="Aggregated, de-identified consortium metrics for regulators and chapter heads. Pulled directly from the ledger — no manual reconciliation."
        actions={
          <>
            <Btn icon="filter" size="sm">Quarter: Q2 2026</Btn>
            <Btn icon="download">Export PDF</Btn>
            <Btn kind="primary" icon="upload">File DOH Form 2A</Btn>
          </>
        }
      />

      <div className="stat-grid">
        {r.kpis.map((k, i) => (
          <Stat key={i} label={k.label} value={k.value} unit={k.unit} delta={k.delta} deltaDir={k.positive ? "up" : "down"}
                accent={i === 0 ? "info" : i === 1 ? "ok" : i === 2 ? "ok" : "ok"} />
        ))}
      </div>

      <div style={{ height: 18 }} />

      <div className="grid-dash">
        <div className="card">
          <div className="card-h">
            <h3>Distribution by chapter</h3>
            <div className="sub muted">Units dispatched ▰ vs. received ▱ · year-to-date</div>
          </div>
          <div className="card-b">
            {r.distribution.map((d, i) => {
              const total = d.dispatched + d.received;
              const w1 = (d.dispatched / maxDispatched) * 100;
              const w2 = (d.received / maxDispatched) * 100;
              return (
                <div key={i} className="bar-row" style={{ gridTemplateColumns: "200px 1fr 80px" }}>
                  <div className="name">{d.hospital}</div>
                  <div className="bar" style={{ background: "transparent", display: "flex", gap: 2, height: 26 }}>
                    <div className="bar-fill" style={{ width: `${w1}%`, background: "var(--blood)" }}>
                      {d.dispatched > 10 && <span>{d.dispatched}</span>}
                    </div>
                    <div className="bar-fill alt" style={{ width: `${w2}%`, background: "var(--ink-2)" }}>
                      {d.received > 10 && <span>{d.received}</span>}
                    </div>
                  </div>
                  <div className="v">{total}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Completion rate by route</h3>
            <div className="sub muted">% transfers fulfilled within SLA</div>
          </div>
          <div className="card-b">
            {r.completion.map((c, i) => (
              <div key={i} className="bar-row">
                <div className="name small">{c.route}</div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${c.rate}%` }}>
                    {c.rate}%
                  </div>
                </div>
                <div className="v">{c.rate}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="grid-3">
        <div className="card">
          <div className="card-h"><h3>Wastage</h3><div className="sub muted">Last 90 days</div></div>
          <div className="card-b">
            <div className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
              1.4<span style={{ fontSize: 22, color: "var(--ink-3)" }}>%</span>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>
              Down from 4.0% pre-consortium. <strong>87 units rescued</strong> by FEFO redistribution.
            </div>
            <div className="divider" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted tiny" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>vs. national avg</span>
              <Chip kind="ok" dot>3.4 pts better</Chip>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Time to fulfillment</h3><div className="sub muted">From initiation → received</div></div>
          <div className="card-b">
            <div className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
              41<span style={{ fontSize: 22, color: "var(--ink-3)" }}> min</span>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>
              Median across 312 transfers. Emergency cases: <strong>17 min</strong> median.
            </div>
            <div className="divider" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted tiny" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>SLA target</span>
              <Chip kind="ok" dot>Within 60 min</Chip>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Donor consent</h3><div className="sub muted">Ledger-verified</div></div>
          <div className="card-b">
            <div className="serif" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1 }}>
              100<span style={{ fontSize: 22, color: "var(--ink-3)" }}>%</span>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>
              Every dispatched unit traceable to a consent flag on the donor record.
            </div>
            <div className="divider" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted tiny" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>DPA 2012 status</span>
              <Chip kind="ok" dot>Compliant</Chip>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="card-h">
          <h3>Filings ready for submission</h3>
          <div className="sub muted">Auto-generated from on-chain data</div>
        </div>
        <div className="card-b flush">
          <table className="tbl">
            <thead><tr><th>Document</th><th>Coverage</th><th>Generated</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {[
                { d: "DOH Form 2A · Blood Inventory & Distribution", c: "Apr 1 – Jun 21, 2026", g: "2026-05-21 06:00", s: "Ready", k: "ok" },
                { d: "PRC Quarterly Distribution Report", c: "Q2 2026", g: "2026-05-21 06:00", s: "Ready", k: "ok" },
                { d: "Cold-chain Compliance Report", c: "May 2026", g: "2026-05-21 03:14", s: "1 excursion noted", k: "warn" },
                { d: "Inter-facility Audit Pack", c: "Year-to-date", g: "2026-05-20 22:00", s: "Submitted", k: "info" },
              ].map((row, i) => (
                <tr key={i}>
                  <td>{row.d}</td>
                  <td className="small">{row.c}</td>
                  <td className="mono small muted">{row.g}</td>
                  <td><Chip kind={row.k} dot>{row.s}</Chip></td>
                  <td><Btn size="sm" icon="download">Download</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReportingPage });
