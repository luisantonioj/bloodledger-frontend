// pages/audit.jsx — Immutable ledger viewer

function AuditPage({ filter, onNav }) {
  const [search, setSearch] = React.useState(filter?.hash?.slice(0, 8) || "");
  const [kindFilter, setKindFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(window.AUDIT[0]);

  const filtered = window.AUDIT.filter((a) =>
    (kindFilter === "ALL" || a.kind === kindFilter) &&
    (!search || (a.actor + a.action + a.target + a.hash).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <PageHead
        eyebrow="Immutable · World state synced"
        title="Audit Ledger"
        sub="Every consequential action — dispatch, receive, override, signature, sensor breach — written to a tamper-evident block. Read by chapter staff and regulators."
        actions={
          <>
            <Btn icon="download" size="sm">Export CSV</Btn>
            <Btn icon="filter" size="sm">Date: Last 24h</Btn>
            <Btn icon="link" size="sm">Block explorer</Btn>
          </>
        }
      />

      <div className="grid-dash">
        <div className="card">
          <div className="filters">
            <div className="top-search" style={{ minWidth: 280, padding: "5px 10px" }}>
              <I name="search" size={13} />
              <input placeholder="Actor, action, ISBT, hash…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <span style={{ marginLeft: 8 }} />
            {[
              ["ALL", "All"],
              ["info", "Info"],
              ["ok", "Completed"],
              ["warn", "Warnings"],
            ].map(([k, l]) => (
              <button key={k} className={`filter-chip ${kindFilter === k ? "active" : ""}`} onClick={() => setKindFilter(k)}>{l}</button>
            ))}
            <div style={{ marginLeft: "auto" }} className="muted small">
              <span className="live-dot" /> Block 124,892 · 12 events
            </div>
          </div>
          <div className="card-b flush" style={{ maxHeight: 580, overflowY: "auto" }}>
            <table className="tbl">
              <thead><tr>
                <th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>Block</th>
              </tr></thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i} className="row-clickable" onClick={() => setSelected(a)}
                      style={selected === a ? { background: "var(--bg-2)" } : null}>
                    <td className="mono small muted">{a.ts}</td>
                    <td>
                      <div className="small" style={{ fontWeight: 500 }}>{a.actor.split("@")[0]}</div>
                      <div className="muted tiny">{a.role}</div>
                    </td>
                    <td>
                      <span className={`chip ${a.kind === "ok" ? "ok" : a.kind === "warn" ? "warn" : "neutral"}`} style={{ outline: 0 }}>
                        {a.action}
                      </span>
                    </td>
                    <td className="mono small">{a.target}</td>
                    <td className="mono small muted">#{a.block.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Transaction</h3>
            <div className="sub muted">Read-only · cryptographically anchored</div>
          </div>
          <div className="card-b">
            <div className="muted tiny" style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Hash</div>
            <div className="hash-chip" style={{ display: "block", padding: "8px 10px", marginTop: 4, fontSize: 12 }}>{selected.hash}</div>
            <div className="divider" />
            <dl className="kv">
              <dt>Block</dt><dd className="mono">#{selected.block.toLocaleString()}</dd>
              <dt>Timestamp</dt><dd className="mono small">{selected.ts}</dd>
              <dt>Actor</dt><dd className="mono small">{selected.actor}</dd>
              <dt>Role</dt><dd>{selected.role}</dd>
              <dt>Action</dt><dd><span className="chip neutral">{selected.action}</span></dd>
              <dt>Target</dt><dd className="mono small">{selected.target}</dd>
              <dt>Endorsers</dt>
              <dd>
                <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                  <Chip kind="ok" dot>MMCMSP</Chip>
                  <Chip kind="ok" dot>PRCMSP</Chip>
                </div>
              </dd>
              <dt>Channel</dt><dd className="mono small">bloodledger-mainnet</dd>
              <dt>Chaincode</dt><dd className="mono small">transfer-cc:2.4.1</dd>
            </dl>
            <div className="divider" />
            <div className="muted tiny" style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
              Geo-signature
            </div>
            <div className="card" style={{ background: "var(--bg)" }}>
              <div className="card-b tight" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <I name="pin" size={16} />
                <div>
                  <div className="mono small">13.9411°N · 121.1631°E</div>
                  <div className="muted tiny">±4 m · MMC bay door · attested by gateway</div>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Btn icon="link" kind="ghost">Open in block explorer</Btn>
              <Btn kind="ghost" onClick={() => onNav("transfers", { selectId: selected.target.startsWith("TX-") ? selected.target.split(" ")[0] : null })}>
                View transfer <I name="arrowRight" size={12} />
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuditPage });
