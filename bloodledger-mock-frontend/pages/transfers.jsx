// pages/transfers.jsx — Active transfers list + BROA-guided wizard

function TransfersPage({ hospital, permissions, transfers, onNav, prefill, onCommit }) {
  const [openWizard, setOpenWizard] = React.useState(!!prefill);
  const [selectedId, setSelectedId] = React.useState(prefill?.selectId || null);
  const [filterStatus, setFilterStatus] = React.useState("ALL");
  const transferList = transfers || window.TRANSFERS;

  React.useEffect(() => {
    if (prefill && (prefill.type || prefill.unit || prefill.surplus)) setOpenWizard(true);
    if (prefill?.selectId) setSelectedId(prefill.selectId);
  }, [prefill]);

  const filtered = transferList.filter((t) => filterStatus === "ALL" || t.status === filterStatus);
  const selected = transferList.find((t) => t.id === selectedId) || transferList[0];

  return (
    <div className="page">
      <PageHead
        eyebrow="Network · 5 peers"
        title="Transfers"
        sub="Multi-signature requests across the consortium. BROA — the Blood Recommendation & Optimization Agent — ranks candidate sources by stock, distance, expiry score and chain reliability."
        actions={
          <>
            <Btn icon="filter" size="sm">All routes</Btn>
            {permissions.canCreateTransfer && (
              <Btn kind="primary" icon="plus" onClick={() => setOpenWizard(true)}>
                {permissions.canFullTransfer ? "New transfer" : "New request"}
              </Btn>
            )}
          </>
        }
      />

      <div className="grid-dash">
        <div className="card">
          <div className="card-h">
            <h3>Active & recent</h3>
            <div className="actions row" style={{ gap: 6 }}>
              {["ALL", "Pending", "Dispatched", "In Transit", "Delayed", "Rejected", "Compromised", "Received"].map((s) => (
                <button key={s} className={`filter-chip ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
                  {s === "ALL" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
          <div className="card-b flush">
            <table className="tbl">
              <thead><tr>
                <th>Tx ID</th><th>Type</th><th className="right">Units</th><th>From</th><th>To</th>
                <th>Urgency</th><th>BROA</th><th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="row-clickable" onClick={() => setSelectedId(t.id)}
                      style={selected.id === t.id ? { background: "var(--bg-2)" } : null}>
                    <td className="mono small">{t.id}</td>
                    <td><BloodType type={t.type} /></td>
                    <td className="right tnum">{t.units}</td>
                    <td className="small">{hospitalById(t.from).short}</td>
                    <td className="small">{hospitalById(t.to).short}</td>
                    <td>
                      <Chip kind={t.urgency === "Emergency" ? "critical" : t.urgency === "Urgent" ? "warn" : "neutral"} dot>
                        {t.urgency}
                      </Chip>
                    </td>
                    <td><span className="mono tnum">{t.broa}</span></td>
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

        <TransferDetail tx={selected} permissions={permissions} onNav={onNav} />
      </div>

      {openWizard && (
        <TransferWizard
          hospital={hospital}
          permissions={permissions}
          prefill={prefill}
          onClose={() => setOpenWizard(false)}
          onCommit={(payload) => {
            return onCommit && onCommit(payload);
          }}
        />
      )}
    </div>
  );
}

function TransferDetail({ tx, permissions, onNav }) {
  const route = `${hospitalById(tx.from).short} → ${hospitalById(tx.to).short}`;
  const statusKind = transferStatusKind(tx.status);
  const exceptionLabel = ["Delayed", "Rejected", "Compromised", "Pending"].includes(tx.status) ? tx.status : null;
  const exceptionKind = statusKind === "critical" ? "exception-critical" : statusKind === "warn" ? "exception-warn" : "exception-info";
  return (
    <div className="card">
      <div className="card-h">
        <h3 className="mono" style={{ fontFamily: "var(--font-mono)" }}>{tx.id}</h3>
        <div className="actions">
          <Chip kind={statusKind} dot>{tx.status}</Chip>
        </div>
      </div>
      <div className="card-b">
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <BloodType type={tx.type} lg />
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1 }}>
              {tx.units} units
            </div>
            <div className="muted small" style={{ marginTop: 4 }}>{route}</div>
          </div>
        </div>

        <div className="divider" />

        <div className="stepper" style={{ marginBottom: 14 }}>
            {[
              { num: 1, nm: "Initiated", done: true },
              { num: 2, nm: "Approved", done: ["Dispatched", "In Transit", "Delayed", "Received", "Compromised"].includes(tx.status) },
              { num: 3, nm: "Dispatched", done: ["Dispatched", "In Transit", "Delayed", "Received", "Compromised"].includes(tx.status), active: tx.status === "Dispatched" },
              { num: 4, nm: exceptionLabel || "In transit", done: ["Received"].includes(tx.status), active: ["In Transit", "Pending", "Delayed", "Rejected", "Compromised"].includes(tx.status), exception: exceptionLabel },
              { num: 5, nm: "Received", done: tx.status === "Received", active: false },
            ].map((s, i) => (
            <div key={i} className={`step ${s.done ? "done" : ""} ${s.active ? "active" : ""} ${s.exception ? exceptionKind : ""}`}>
              <div className="num">{s.done ? "✓" : s.num}</div>
              <div className="nm">{s.nm}</div>
            </div>
          ))}
        </div>

        {exceptionLabel && (
          <div className={`alert-card ${statusKind === "critical" ? "critical" : statusKind === "warn" ? "warn" : "info"}`} style={{ marginBottom: 14 }}>
            <div>
              <div className="title">Exception state: {exceptionLabel}</div>
              <div className="desc">{tx.exception || (tx.status === "Pending" ? "Request queued for BROA review and source confirmation." : "Operational review required before this transfer can continue.")}</div>
              <div className="meta"><span className="mono">{tx.tx_hash}</span></div>
            </div>
            <div className="quick">
              {permissions.canFullTransfer && tx.status === "Rejected" && <Btn size="sm" kind="primary" icon="refresh" onClick={() => onNav("transfers", { type: tx.type, units: tx.units, urgency: tx.urgency })}>Re-route via BROA</Btn>}
              {permissions.canFullTransfer && tx.status === "Delayed" && <Btn size="sm" icon="clock">Update ETA</Btn>}
              {permissions.canApprove && tx.status === "Compromised" && <Btn size="sm" kind="primary" icon="shield">Quarantine sign-off</Btn>}
            </div>
          </div>
        )}

        <dl className="kv">
          <dt>Urgency</dt><dd><Chip kind={tx.urgency === "Emergency" ? "critical" : tx.urgency === "Urgent" ? "warn" : "neutral"} dot>{tx.urgency}</Chip></dd>
          <dt>BROA score</dt><dd className="mono tnum">{tx.broa} <span className="muted tiny">/ 1.00</span></dd>
          <dt>Initiated</dt><dd className="mono small">{tx.initiated}</dd>
          <dt>Completed</dt><dd className="mono small">{tx.completed || "—"}</dd>
          <dt>Tx hash</dt>
          <dd><span className="hash-chip">{tx.tx_hash}</span> <Btn size="sm" kind="ghost" icon="link" onClick={() => onNav("audit", { hash: tx.tx_hash })}>View on ledger</Btn></dd>
          <dt>Signatures</dt>
          <dd>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <Chip kind="ok" dot>Initiator · mtech.dela</Chip>
              <Chip kind="ok" dot>Sender head · head.cruz</Chip>
              {tx.status === "Received" && <Chip kind="ok" dot>Receiver · mtech.santos</Chip>}
            </div>
          </dd>
        </dl>
      </div>
    </div>
  );
}

// ───── Wizard ────────────────────────────────────────────────────────────
function TransferWizard({ hospital, permissions, prefill, onClose, onCommit }) {
  const requestOnly = !permissions.canFullTransfer;
  const STEPS = requestOnly ? ["Request", "Confirm", "Sign", "Track"] : ["Request", "Source", "Validate", "Confirm", "Sign", "Track"];
  const [step, setStep] = React.useState(0);
  const [type, setType] = React.useState(prefill?.type || "O-");
  const [units, setUnits] = React.useState(prefill?.units || 2);
  const [urgency, setUrgency] = React.useState(prefill?.urgency || "Emergency");
  const candidates = window.BROA_CANDIDATES[type] || window.BROA_CANDIDATES["O-"];
  const [source, setSource] = React.useState(prefill?.from || candidates[0].hospital);
  const [purpose, setPurpose] = React.useState("OR Schedule · Case 29481 · trauma laparotomy");
  const [pin, setPin] = React.useState("");
  const [submitted, setSubmitted] = React.useState(null);

  const cand = candidates.find((c) => c.hospital === source) || candidates[0];
  const confirmStep = requestOnly ? 1 : 3;
  const signStep = requestOnly ? 2 : 4;
  const trackStep = requestOnly ? 3 : 5;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const commit = async () => {
    const tx = await onCommit({
      type, units, urgency,
      from: requestOnly ? "PRC-LIP" : source,
      to: hospital.id,
      broa: cand.broa,
      requestOnly,
    });
    setSubmitted(tx);
    setStep(trackStep);
  };

  return (
    <Modal
      wide
      title={step === STEPS.length - 1 ? (requestOnly ? "Transfer request queued" : "Transfer committed to ledger") : "New transfer request"}
      sub={step === STEPS.length - 1 ? null : `Step ${step + 1} of ${STEPS.length - 1} · ${requestOnly ? "request-only" : "BROA-guided"}`}
      onClose={onClose}
      footer={
        step === STEPS.length - 1 ? (
          <Btn kind="primary" onClick={onClose}>Done</Btn>
        ) : (
          <>
            <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
            {step > 0 && <Btn icon="chevronLeft" onClick={prev}>Back</Btn>}
            {step < signStep && <Btn kind="primary" onClick={next} icon="arrowRight">Continue</Btn>}
            {step === signStep && (
              <Btn kind="primary" disabled={pin.length !== 6} onClick={commit}>
                {requestOnly ? "Sign & queue request" : "Sign & submit"}
              </Btn>
            )}
          </>
        )
      }
    >
      <div className="stepper" style={{ marginBottom: 18 }}>
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}>
            <div className="num">{i < step ? "✓" : i + 1}</div>
            <div className="nm">{s}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="grid-2">
            <div className="field">
              <label>Blood type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Units</label>
              <input type="number" min="1" max="20" value={units} onChange={(e) => setUnits(+e.target.value)} className="mono" />
            </div>
          </div>
          <div style={{ height: 12 }} />
          <div className="field">
            <label>Urgency</label>
            <div className="option-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              {["Routine", "Urgent", "Emergency"].map((u) => (
                <button type="button" key={u} className={`option ${urgency === u ? "selected" : ""}`} onClick={() => setUrgency(u)}>
                  <div className="nm">{u}</div>
                  <div className="sub">{u === "Emergency" ? "≤ 1h commit" : u === "Urgent" ? "≤ 4h commit" : "next routine batch"}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 12 }} />
          <div className="field">
            <label>Purpose / case reference</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            <div className="hint">Links this request to your HIS case record. Stored as private metadata.</div>
          </div>
        </>
      )}

      {step === 1 && !requestOnly && (
        <>
          <div className="muted small" style={{ marginBottom: 10 }}>
            BROA scored {candidates.length} candidate{candidates.length > 1 ? "s" : ""} for {units} × <BloodType type={type} /> by stock, distance, expiry FEFO and chain reliability.
          </div>
          <table className="tbl" style={{ border: "1px solid var(--line)", borderRadius: 6 }}>
            <thead>
              <tr>
                <th></th><th>Chapter</th><th className="right">Stock</th><th className="right">Distance</th>
                <th>FEFO ISBT</th><th className="right">Expiry score</th><th className="right">BROA</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.hospital} className="row-clickable" onClick={() => setSource(c.hospital)}
                    style={source === c.hospital ? { background: "var(--bg-2)" } : null}>
                  <td>
                    <input type="radio" name="src" checked={source === c.hospital} onChange={() => setSource(c.hospital)} />
                  </td>
                  <td>{hospitalById(c.hospital).short}</td>
                  <td className="right tnum">{c.stock}</td>
                  <td className="right tnum">{c.distance.toFixed(1)} km</td>
                  <td className="mono small">{c.fefo_isbt}</td>
                  <td className="right tnum">{c.expiry_score.toFixed(2)}</td>
                  <td className="right">
                    <span className="mono tnum" style={{ fontWeight: 600 }}>{c.broa.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {step === 2 && !requestOnly && (
        <>
          <div className="card" style={{ background: "var(--bg)", borderStyle: "dashed" }}>
            <div className="card-b">
              <div className="row" style={{ gap: 12 }}>
                <I name="shield" size={20} />
                <div>
                  <div style={{ fontWeight: 600 }}>Pre-flight checks</div>
                  <div className="muted small">Each runs as smart-contract validation before submission.</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ height: 12 }} />
          <div className="col" style={{ gap: 8 }}>
            {[
              ["Donor consent flag on source unit", true],
              ["Crossmatch policy: deferred to receiving lab", true],
              [`Cold-chain corridor available (${hospitalById(source).short} → ${hospital.short})`, true],
              ["Source chapter holds ≥ requested units after dispatch", true],
              ["No conflicting reservation on FEFO ISBT", true],
              ["Receiver storage capacity confirmed", true],
            ].map(([l, ok], i) => (
              <div key={i} className="row" style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 6, background: "var(--surface)" }}>
                <I name="check" size={14} />
                <span style={{ flex: 1 }}>{l}</span>
                <Chip kind="ok" dot>Pass</Chip>
              </div>
            ))}
          </div>
        </>
      )}

      {step === confirmStep && (
        <>
          <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", marginBottom: 8 }}>
            Review and confirm
          </div>
          <dl className="kv">
            <dt>Product</dt><dd><BloodType type={type} /> · {units} units PRBC</dd>
            <dt>From</dt><dd>{requestOnly ? "BROA queue · source pending" : hospitalById(source).name}</dd>
            <dt>To</dt><dd>{hospital.name}</dd>
            <dt>FEFO unit</dt><dd className="mono small">{requestOnly ? "Assigned after source confirmation" : cand.fefo_isbt}</dd>
            <dt>Urgency</dt><dd><Chip kind={urgency === "Emergency" ? "critical" : urgency === "Urgent" ? "warn" : "neutral"} dot>{urgency}</Chip></dd>
            <dt>BROA score</dt><dd className="mono tnum">{requestOnly ? "Pending BROA run" : `${cand.broa.toFixed(2)} / 1.00`}</dd>
            <dt>Purpose</dt><dd className="small">{purpose}</dd>
            <dt>Couriers</dt><dd>{requestOnly ? "Assigned by primary node after approval" : "PRC Lipa · ID #2 · ETA 38 min"}</dd>
            <dt>Chaincode</dt><dd className="mono small">transfer-cc · v2.4.1</dd>
          </dl>
        </>
      )}

      {step === signStep && (
        <>
          <div className="muted small" style={{ marginBottom: 12 }}>
            {requestOnly
              ? "Authorize with your role PIN. This queues a request for the primary node and BROA review; it does not reserve stock directly."
              : "Authorize with your role PIN. As Blood Bank Head this submits the transaction to the ordering service; the source chapter will be notified to co-sign."}
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Signer</label>
              <input value="head.reyes@mmc.bloodledger" readOnly />
            </div>
            <div className="field">
              <label>6-digit PIN</label>
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                     className="mono" placeholder="• • • • • •" autoFocus />
            </div>
          </div>
          <div style={{ height: 12 }} />
          <div className="card" style={{ background: "var(--bg)" }}>
            <div className="card-b">
              <div className="muted tiny" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Endorsement policy</div>
              <div className="mono small" style={{ marginTop: 4 }}>
                AND( 'MMCMSP.member', 'PRCMSP.member' ) — both peers must endorse.
              </div>
            </div>
          </div>
        </>
      )}

      {step === trackStep && (
        <>
          <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
            <div className="brand-mark" style={{ width: 40, height: 40, fontSize: 22, background: "var(--ok)" }}>✓</div>
            <div>
              <div className="serif" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em" }}>
                {requestOnly ? "Request queued." : "Committed to ledger."}
              </div>
              <div className="muted">Block 124,893 · tx 0xfc81…aa92</div>
            </div>
          </div>
          <div style={{ height: 14 }} />
          <dl className="kv">
            <dt>Tx ID</dt><dd className="mono">{submitted?.id || "Pending"}</dd>
            <dt>Status</dt><dd><Chip kind="info" dot>{requestOnly ? "Pending" : "Awaiting dispatch"}</Chip></dd>
            <dt>Notified</dt><dd>{requestOnly ? "Mary Mediatrix primary node · BROA queue" : "head.cruz@prc-lipa.bloodledger · courier dispatch"}</dd>
            <dt>ETA</dt><dd>{requestOnly ? "Assigned after approval" : "~ 38 minutes"}</dd>
          </dl>
        </>
      )}
    </Modal>
  );
}

Object.assign(window, { TransfersPage, TransferWizard });
