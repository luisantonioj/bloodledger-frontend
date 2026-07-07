// pages/scanner.jsx — Scan & intake new units (IoT edge device)

function ScannerPage({ permissions, onNav }) {
  const [mode, setMode] = React.useState("ISBT");
  const [scanned, setScanned] = React.useState(null);
  const [committed, setCommitted] = React.useState(window.SCAN_HISTORY);
  const [online, setOnline] = React.useState(typeof navigator === "undefined" ? true : navigator.onLine);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  React.useEffect(() => {
    if (!online) return;
    setCommitted((rows) => rows.map((row) => row.status === "Buffered"
      ? { ...row, status: "Committed", block: row.block || 124894 }
      : row));
  }, [online]);

  const fakeScan = () => {
    const next = {
      isbt: "=)W0381 2512 100118",
      type: "B-",
      comp: "PRBC",
      donor_hash: "0xdb9f…40c1",
      collected: "2026-05-21",
      expires: "2026-07-02",
      source: "PRC Lipa City Chapter",
      temp_at_intake: 4.0,
    };
    setScanned(next);
  };
  const commit = async () => {
    const result = await BloodLedgerApi.ingestScan(scanned, { offline: !online });
    setCommitted((c) => [{ isbt: scanned.isbt, type: scanned.type, comp: scanned.comp,
      expires: scanned.expires, status: result.status, ts: new Date().toLocaleTimeString("en-PH", { hour12: false }),
      block: result.block }, ...c]);
    setScanned(null);
  };
  const buffered = committed.filter((row) => row.status === "Buffered").length;

  return (
    <div className="page">
      <PageHead
        eyebrow="IoT edge · MMC-A scanner"
        title="Scan & Intake"
        sub="Decode an ISBT-128 label, write the unit to your peer, and stage it for the next chaincode block. Operations are buffered locally and replayed if the network blinks."
        actions={
          <>
            <Btn icon="upload" size="sm">Manual entry</Btn>
            <Btn icon="settings" size="sm">Scanner status</Btn>
          </>
        }
      />

      <div className="grid-dash">
        <div className="card">
          <div className="card-h">
            <h3>Camera</h3>
            <div className="actions">
              <div className="row" style={{ gap: 6 }}>
                {["ISBT", "QR", "Manual"].map((m) => (
                  <button key={m} className={`filter-chip ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>{m}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="card-b">
            <div className="scanner-view">
              <div className="scanner-grid" />
              <div className="scanline" />
              <div className="scanner-meta"><span className="rec-dot" /> LIVE · ISBT-128 · 60 fps</div>
              <div style={{ position: "absolute", bottom: 16, left: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                MMC-A · serial 02-9F-43-AA · firmware 1.4.2
              </div>
              <div style={{ textAlign: "center", padding: 24, color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                Align label within the dashed frame
              </div>
            </div>
            <div style={{ height: 12 }} />
            <div className="row">
              {permissions.canScan && <Btn kind="primary" icon="scanner" onClick={fakeScan}>Simulate scan</Btn>}
              <Btn icon="refresh">Reset</Btn>
              <div style={{ marginLeft: "auto" }} className="muted small">
                <span className="live-dot" /> Buffered ops: {buffered} · {online ? "peer reachable" : "offline buffer active"}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>{scanned ? "Decoded unit · ready to commit" : "Awaiting scan"}</h3>
            <div className="sub muted">Chaincode: <span className="mono">unit-cc v1.7</span></div>
          </div>
          <div className="card-b">
            {!permissions.canScan ? (
              <div className="muted small" style={{ padding: "32px 8px", textAlign: "center" }}>
                This session is read-only for scan intake. Inventory writes are limited to the Mary Mediatrix primary node.
              </div>
            ) : !scanned ? (
              <div className="muted small" style={{ padding: "32px 8px", textAlign: "center" }}>
                Scan a unit's ISBT-128 label or paste its hash to decode.
              </div>
            ) : (
              <>
                <div className="row" style={{ gap: 14, alignItems: "center" }}>
                  <BloodType type={scanned.type} lg />
                  <div>
                    <div className="mono">{scanned.isbt}</div>
                    <div className="muted small">{scanned.comp} · collected {scanned.collected}</div>
                  </div>
                </div>
                <div className="divider" />
                <dl className="kv">
                  <dt>Donor</dt><dd className="mono small">{scanned.donor_hash} <Chip kind="ok" dot>Consent verified</Chip></dd>
                  <dt>Source</dt><dd>{scanned.source}</dd>
                  <dt>Expires</dt><dd className="mono small">{scanned.expires}</dd>
                  <dt>Temp at intake</dt><dd className="mono small">{scanned.temp_at_intake.toFixed(1)}°C <Chip kind="ok" dot>Within range</Chip></dd>
                  <dt>Shelf assignment</dt>
                  <dd className="mono small">R-2 / A-05 <span className="muted">(auto)</span></dd>
                  <dt>Endorsement</dt><dd className="mono small">MMCMSP.member</dd>
                </dl>
                <div className="divider" />
                <div className="row">
                  <Btn kind="ghost" onClick={() => setScanned(null)}>Reject</Btn>
                  <Btn icon="refresh" onClick={fakeScan}>Re-scan</Btn>
                  <span style={{ flex: 1 }} />
                  <Btn kind="primary" icon="check" onClick={commit}>{online ? "Commit to ledger" : "Buffer locally"}</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="card-h">
          <h3>Today's intake</h3>
          <div className="sub muted">{committed.length} unit{committed.length !== 1 ? "s" : ""} committed since 00:00</div>
          <div className="actions"><Btn size="sm" icon="download">Export</Btn></div>
        </div>
        <div className="card-b flush">
          <table className="tbl">
            <thead><tr>
              <th>Time</th><th>ISBT</th><th>Type</th><th>Component</th><th>Expires</th><th>Block</th><th>Status</th>
            </tr></thead>
            <tbody>
              {committed.map((c, i) => (
                <tr key={c.isbt + i}>
                  <td className="mono small">{c.ts}</td>
                  <td className="mono small">{c.isbt}</td>
                  <td><BloodType type={c.type} /></td>
                  <td>{c.comp}</td>
                  <td className="mono small">{c.expires}</td>
                  <td className="mono small">{c.block ? `#${c.block}` : "—"}</td>
                  <td>
                    <Chip kind={transferStatusKind(c.status)} dot>{c.status}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScannerPage });
