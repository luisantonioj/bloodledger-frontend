// pages/inventory.jsx — FEFO-sequenced unit list

function InventoryPage({ hospital, permissions, filter, onNav }) {
  const [activeType, setActiveType] = React.useState(filter?.type || "ALL");
  const [comp, setComp] = React.useState("ALL");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (filter?.type) setActiveType(filter.type);
  }, [filter?.type]);

  const counts = {};
  window.INVENTORY.forEach((u) => { counts[u.type] = (counts[u.type] || 0) + 1; });
  const compCounts = {};
  window.INVENTORY.forEach((u) => { compCounts[u.comp] = (compCounts[u.comp] || 0) + 1; });

  const filtered = window.INVENTORY.filter((u) =>
    (activeType === "ALL" || u.type === activeType) &&
    (comp === "ALL" || u.comp === comp) &&
    (!search || u.isbt.toLowerCase().includes(search.toLowerCase()))
  );
  // FEFO sort
  filtered.sort((a, b) => a.days_left - b.days_left);

  return (
    <div className="page">
      <PageHead
        eyebrow="Inventory · FEFO sequenced"
        title="Blood Unit Inventory"
        sub="Every unit on your shelf, with provenance back to the donor on the consortium ledger. Sorted first-expiry-first-out by default."
        actions={
          <>
            <Btn icon="download" size="sm">Export</Btn>
            {permissions.canScan && <Btn icon="scanner" onClick={() => onNav("scanner")}>Scan & Intake</Btn>}
            {permissions.canCreateTransfer && <Btn kind="primary" icon="plus" onClick={() => onNav("transfers")}>New transfer</Btn>}
          </>
        }
      />

      <div className="card">
        <div className="filters">
          <span className="muted tiny" style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginRight: 4 }}>Group</span>
          <button className={`filter-chip ${activeType === "ALL" ? "active" : ""}`} onClick={() => setActiveType("ALL")}>
            All <span className="count">{window.INVENTORY.length}</span>
          </button>
          {BLOOD_TYPES.map((t) => (
            <button key={t} className={`filter-chip ${activeType === t ? "active" : ""}`} onClick={() => setActiveType(t)}>
              {t} <span className="count">{counts[t] || 0}</span>
            </button>
          ))}
          <span style={{ width: 16 }} />
          <span className="muted tiny" style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginRight: 4 }}>Component</span>
          {["ALL", ...window.COMPONENTS].map((c) => (
            <button key={c} className={`filter-chip ${comp === c ? "active" : ""}`} onClick={() => setComp(c)}>
              {c === "ALL" ? "All" : c} {c !== "ALL" && <span className="count">{compCounts[c] || 0}</span>}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <div className="top-search" style={{ minWidth: 220, padding: "5px 10px" }}>
              <I name="search" size={13} />
              <input placeholder="Find ISBT…" value={search} onChange={(e) => setSearch(e.target.value)} className="mono" />
            </div>
          </div>
        </div>

        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>ISBT-128</th>
                <th>Type</th>
                <th>Component</th>
                <th>Source</th>
                <th>Collected</th>
                <th>Expires</th>
                <th>Time to expiry</th>
                <th>Temp</th>
                <th>Shelf</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const exp = u.days_left;
                const expClass = exp <= 3 ? "critical" : exp <= 7 ? "warn" : "";
                const shelfLife = u.comp === "Platelets" ? 5 : u.comp === "PRBC" ? 42 : 365;
                const pct = Math.max(0, Math.min(100, (exp / shelfLife) * 100));
                return (
                  <tr key={u.isbt} className="row-clickable">
                    <td className="mono small">{u.isbt}</td>
                    <td><BloodType type={u.type} /></td>
                    <td>{u.comp}</td>
                    <td className="small">{hospitalById(u.source).short}</td>
                    <td className="mono small muted">{u.collected}</td>
                    <td className="mono small">{u.expires}</td>
                    <td>
                      <div className={`expiry-bar ${expClass}`}>
                        <span style={{ width: 36 }} className="tnum">{exp}d</span>
                        <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
                      </div>
                    </td>
                    <td className="mono small">{u.temp.toFixed(1)}°C</td>
                    <td className="mono small">{u.shelf}</td>
                    <td>
                      {u.status === "Reserved"
                        ? <Chip kind="warn" dot>Reserved · {u.reserved_for}</Chip>
                        : <Chip kind="ok" dot>{u.status}</Chip>}
                    </td>
                    <td>
                      {permissions.canCreateTransfer && <Btn size="sm" kind="ghost" icon="chevron" title="Create transfer from unit" onClick={() => onNav("transfers", { unit: u })} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="grid-3">
        <div className="card">
          <div className="card-h">
            <h3>Surplus opportunities</h3>
            <div className="sub muted">A+ above 6-day cover</div>
          </div>
          <div className="card-b">
            <div className="row" style={{ gap: 14 }}>
              <BloodType type="A+" lg />
              <div>
                <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>22 units</div>
                <div className="muted small">8.6 days cover · 4 units above threshold</div>
              </div>
            </div>
            <div className="divider" />
            <div className="muted small">
              Metro Doctors holds 2.4 d cover of A+. Pre-approved standing offer is ready.
            </div>
            <div style={{ marginTop: 12 }}>
              {permissions.canFullTransfer && <Btn kind="primary" icon="upload" onClick={() => onNav("transfers", { surplus: true })}>Offer to network</Btn>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Expiry watchlist</h3><div className="sub muted">≤ 3 days remaining</div></div>
          <div className="card-b">
            {window.INVENTORY.filter((u) => u.days_left <= 3).sort((a,b)=>a.days_left-b.days_left).map((u) => (
              <div key={u.isbt} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line-2)" }}>
                <BloodType type={u.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono small">{u.isbt}</div>
                  <div className="muted tiny">{u.comp} · expires {u.expires}</div>
                </div>
                <Chip kind="critical" dot>{u.days_left}d</Chip>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Cold-chain</h3><div className="sub muted">Live from reefer sensors</div></div>
          <div className="card-b">
            {[
              { name: "Reefer R-1 · PRBC bay", temp: 4.1, target: "2 – 6°C", ok: true },
              { name: "Reefer R-2 · PRBC bay", temp: 4.0, target: "2 – 6°C", ok: true },
              { name: "Reefer R-3 · PRBC bay", temp: 3.9, target: "2 – 6°C", ok: true },
              { name: "Incubator P-1 · Platelets", temp: 22.1, target: "20 – 24°C", ok: true },
              { name: "Freezer F-1 · FFP", temp: -27.0, target: "≤ −18°C", ok: true },
            ].map((r, i) => (
              <div key={i} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line-2)" }}>
                <I name="thermo" size={14} />
                <div style={{ flex: 1 }}>
                  <div className="small">{r.name}</div>
                  <div className="muted tiny">Target {r.target}</div>
                </div>
                <span className="mono small">{r.temp.toFixed(1)}°C</span>
                <Chip kind="ok" dot>OK</Chip>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InventoryPage });
