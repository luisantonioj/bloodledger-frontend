// pages/consortium.jsx — Network view across the 5 hospitals + regulator

function ConsortiumPage({ onNav }) {
  const matrix = window.CITY_MATRIX;
  const hospitals = HOSPITALS.filter((h) => h.type !== "Regulator");

  // sum per blood type across consortium
  const totals = {};
  BLOOD_TYPES.forEach((t) => {
    totals[t] = hospitals.reduce((s, h) => s + (matrix[h.id]?.[t] || 0), 0);
  });
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  // status by total
  const statusFor = (t) => {
    const v = totals[t];
    if (v < 8) return "critical";
    if (v < 20) return "warn";
    if (v > 60) return "surplus";
    return "ok";
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="Network · Lipa City consortium"
        title="Consortium View"
        sub="Cross-chapter inventory and live routes. Cells display the latest committed block from each peer; data leaves your chapter only as encrypted endorsements."
        actions={
          <>
            <Btn icon="filter" size="sm">PRBC</Btn>
            <Btn icon="download" size="sm">Export consortium</Btn>
          </>
        }
      />

      <div className="grid-dash">
        {/* Heatmap */}
        <div className="card">
          <div className="card-h">
            <h3>Inventory heatmap</h3>
            <div className="sub muted">PRBC units · by chapter × group</div>
            <div className="actions row" style={{ gap: 6 }}>
              <Chip kind="critical" dot>Critical</Chip>
              <Chip kind="warn" dot>Low</Chip>
              <Chip kind="ok" dot>Sufficient</Chip>
              <Chip kind="info" dot>Surplus</Chip>
            </div>
          </div>
          <div className="card-b flush" style={{ overflow: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Chapter</th>
                  {BLOOD_TYPES.map((t) => <th key={t} className="right">{t}</th>)}
                  <th className="right">Total</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h) => {
                  const row = matrix[h.id] || {};
                  const total = Object.values(row).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={h.id}>
                      <td>
                        <div className="row">
                          <span className={`peer-dot`} style={{ background: "var(--ok)" }} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{h.short}</div>
                            <div className="muted tiny">{h.type} · {h.distance_km.toFixed(1)} km</div>
                          </div>
                        </div>
                      </td>
                      {BLOOD_TYPES.map((t) => {
                        const v = row[t] || 0;
                        const bg = v === 0 ? "transparent"
                          : v < 3 ? "rgba(193,47,47,0.16)"
                          : v < 8 ? "rgba(176,102,12,0.16)"
                          : v > 30 ? "rgba(35,79,158,0.14)"
                          : "rgba(46,125,92,0.13)";
                        return (
                          <td key={t} className="right tnum mono" style={{ background: bg, fontWeight: v > 30 ? 600 : 500 }}>
                            {v}
                          </td>
                        );
                      })}
                      <td className="right tnum" style={{ fontWeight: 600 }}>{total}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: "var(--bg-2)" }}>
                  <td style={{ fontWeight: 600 }}>Consortium total</td>
                  {BLOOD_TYPES.map((t) => (
                    <td key={t} className="right tnum mono" style={{ fontWeight: 600 }}>
                      {totals[t]}
                      <div><Chip kind={statusFor(t) === "critical" ? "critical" : statusFor(t) === "warn" ? "warn" : statusFor(t) === "surplus" ? "info" : "ok"} dot>{statusFor(t)}</Chip></div>
                    </td>
                  ))}
                  <td className="right tnum" style={{ fontWeight: 700 }}>{grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Map / topology */}
        <div className="card">
          <div className="card-h">
            <h3>Network topology</h3>
            <div className="sub muted">5 peers + regulator · Lipa City</div>
          </div>
          <div className="card-b" style={{ padding: 0 }}>
            <NetworkMap onNav={onNav} />
            <div style={{ padding: 14 }}>
              <div className="muted tiny" style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
                Live routes
              </div>
              {window.TRANSFERS.filter((t) => t.status !== "Received").map((t) => (
                <div key={t.id} className="row" style={{ padding: "8px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <Chip kind={t.status === "In Transit" ? "warn" : "info"} dot>{t.status}</Chip>
                  <div className="small" style={{ flex: 1 }}>
                    {hospitalById(t.from).short} <I name="arrowRight" size={11} /> {hospitalById(t.to).short}
                  </div>
                  <BloodType type={t.type} />
                  <span className="mono small">×{t.units}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="card-h">
          <h3>Channel peers</h3>
          <div className="sub muted">bloodledger-mainnet · Hyperledger Fabric 2.5</div>
        </div>
        <div className="card-b flush">
          <table className="tbl">
            <thead><tr>
              <th>Peer</th><th>Organization</th><th>Endorsement</th><th>Latest block</th><th>Latency</th><th>Status</th><th>Anchor</th>
            </tr></thead>
            <tbody>
              {[
                { p: "peer0.prc-lipa", o: "PRC Lipa Chapter", e: "Endorser, Anchor", b: 124892, lat: "12 ms", s: "Healthy", a: true },
                { p: "peer0.mmc", o: "Mary Mediatrix", e: "Endorser", b: 124892, lat: "8 ms", s: "Healthy", a: false },
                { p: "peer0.lmc", o: "Lipa Medix", e: "Endorser", b: 124892, lat: "14 ms", s: "Healthy", a: false },
                { p: "peer0.mdh", o: "Metro Doctors", e: "Endorser", b: 124891, lat: "22 ms", s: "Catching up", a: false },
                { p: "peer0.clh", o: "C. Laurel Memorial", e: "Endorser", b: 124892, lat: "18 ms", s: "Healthy", a: false },
                { p: "regulator0.doh", o: "DOH-CHD Calabarzon", e: "Read-only", b: 124892, lat: "31 ms", s: "Healthy", a: true },
              ].map((r) => (
                <tr key={r.p}>
                  <td className="mono small">{r.p}</td>
                  <td>{r.o}</td>
                  <td className="small">{r.e}</td>
                  <td className="mono small">#{r.b.toLocaleString()}</td>
                  <td className="mono small">{r.lat}</td>
                  <td>{r.s === "Healthy" ? <Chip kind="ok" dot>{r.s}</Chip> : <Chip kind="warn" dot>{r.s}</Chip>}</td>
                  <td>{r.a ? <Chip kind="info" dot>Anchor</Chip> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NetworkMap({ onNav }) {
  // Positions chosen by hand for a clean schematic; SVG viewBox 0 0 600 360.
  const nodes = [
    { id: "PRC-LIP", x: 300, y: 90,  label: "PRC Lipa", role: "Hub", color: "var(--blood)" },
    { id: "MMC-LIP", x: 160, y: 200, label: "Mary Mediatrix", role: "Tertiary", color: "var(--ink)", self: true },
    { id: "LMC-LIP", x: 440, y: 200, label: "Lipa Medix", role: "Level II", color: "var(--ink)" },
    { id: "MDH-LIP", x: 230, y: 310, label: "Metro Doctors", role: "Level II", color: "var(--ink)" },
    { id: "CLH-LIP", x: 380, y: 310, label: "C. Laurel", role: "Level I", color: "var(--ink)" },
    { id: "DOH-CHD", x: 540, y: 60,  label: "DOH-CHD", role: "Regulator", color: "var(--info)" },
  ];
  const links = [
    ["PRC-LIP", "MMC-LIP", "live"],
    ["PRC-LIP", "LMC-LIP"],
    ["PRC-LIP", "MDH-LIP"],
    ["PRC-LIP", "CLH-LIP"],
    ["MMC-LIP", "MDH-LIP", "live"],
    ["MMC-LIP", "LMC-LIP"],
    ["LMC-LIP", "MMC-LIP", "live"],
    ["DOH-CHD", "PRC-LIP", "read"],
  ];
  const nById = (id) => nodes.find((n) => n.id === id);
  return (
    <svg viewBox="0 0 600 380" style={{ width: "100%", height: 280, background: "var(--bg)" }}>
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="600" height="380" fill="url(#grid)" />
      {links.map(([a, b, kind], i) => {
        const A = nById(a), B = nById(b);
        const stroke = kind === "live" ? "var(--blood)" : kind === "read" ? "var(--info)" : "var(--line-strong)";
        const dash = kind === "read" ? "4 4" : "";
        const sw = kind === "live" ? 2 : 1;
        return (
          <g key={i}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dash} opacity={kind === "live" ? 1 : 0.6} />
            {kind === "live" && (
              <circle r="4" fill="var(--blood)">
                <animateMotion dur="2.2s" repeatCount="indefinite"
                  path={`M${A.x},${A.y} L${B.x},${B.y}`} />
              </circle>
            )}
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id} onClick={() => onNav("inventory")} style={{ cursor: "pointer" }}>
          <circle cx={n.x} cy={n.y} r={n.self ? 22 : 16} fill={n.self ? "#fff" : n.color} stroke={n.self ? "var(--blood)" : "var(--ink)"} strokeWidth={n.self ? 2 : 1} />
          {n.self && <circle cx={n.x} cy={n.y} r="6" fill="var(--blood)" />}
          {!n.self && <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="#fff">{n.id.split("-")[0].slice(0, 3)}</text>}
          <text x={n.x} y={n.y + (n.y > 200 ? 36 : -26)} textAnchor="middle" fontSize="11.5" fontFamily="var(--font-display)" fill="var(--ink)" fontWeight="500">{n.label}</text>
          <text x={n.x} y={n.y + (n.y > 200 ? 50 : -12)} textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" letterSpacing="0.08em" textTransform="uppercase">{n.role.toUpperCase()}</text>
        </g>
      ))}
    </svg>
  );
}

Object.assign(window, { ConsortiumPage, NetworkMap });
