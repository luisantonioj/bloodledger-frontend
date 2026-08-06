// pages/scanner.jsx
// BloodLedger inbound / outbound blood unit transaction workflow.

function ScannerPage({ hospital, permissions, onNav }) {
  const inboundOnly = Boolean(permissions?.secondary);
  const emptyForm = {
    isbt: "",
    type: window.BLOOD_TYPES[0] || "O+",
    comp: window.COMPONENTS[0] || "PRBC",
    collected: "",
    expires: "",
    facilityId: "",
    purpose: "",
  };

  const [direction, setDirection] = React.useState("Inbound");
  const [mode, setMode] = React.useState("Scan");
  const [preview, setPreview] = React.useState(null);
  const [form, setForm] = React.useState(emptyForm);
  const [confirming, setConfirming] = React.useState(false);
  const [history, setHistory] = React.useState(window.SCAN_HISTORY || []);
  const toast = React.useContext(ToastCtx);
  const availableDirections = inboundOnly ? ["Inbound"] : ["Inbound", "Outbound"];
  const visibleHistory = inboundOnly
    ? history.filter((item) => (item.direction || "Inbound") === "Inbound")
    : history;

  React.useEffect(() => {
    if (inboundOnly && direction !== "Inbound") {
      setDirection("Inbound");
      setPreview(null);
      setConfirming(false);
    }
  }, [inboundOnly, direction]);

  const otherFacilities = (window.HOSPITALS || []).filter(
    (item) => item.id !== hospital?.id && item.id !== "DOH-CHD"
  );

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetEntry = () => {
    setPreview(null);
    setConfirming(false);
    setForm(emptyForm);
  };

  const changeDirection = (nextDirection) => {
    if (inboundOnly && nextDirection !== "Inbound") return;
    setDirection(nextDirection);
    resetEntry();
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setPreview(null);
  };

  const buildScanPreview = () => {
    const facility =
      otherFacilities[direction === "Inbound" ? 0 : 1] ||
      otherFacilities[0] ||
      null;

    const scannedUnitId =
      direction === "Inbound"
        ? "=)W0381 2512 100118"
        : "=)W0381 2509 100023";
    const registeredUnit = (window.INVENTORY || []).find(
      (unit) => unit.isbt === scannedUnitId
    );

    return {
      direction,
      method: "Scan",
      isbt: scannedUnitId,
      type: registeredUnit?.type || (direction === "Inbound" ? "B-" : "O-"),
      comp: registeredUnit?.comp || "PRBC",
      collected: registeredUnit?.collected || (direction === "Inbound" ? "2026-07-18" : "2026-04-12"),
      expires: registeredUnit?.expires || (direction === "Inbound" ? "2026-08-29" : "2026-05-23"),
      facilityId: facility?.id || "",
      facilityName: facility?.name || "External facility",
      purpose:
        direction === "Inbound"
          ? "Inventory receipt"
          : "Approved blood transfer",
      status: direction === "Inbound" ? "Ready to receive" : "Ready to release",
    };
  };

  const buildManualPreview = () => {
    const facility = otherFacilities.find(
      (item) => item.id === form.facilityId
    );

    return {
      ...form,
      direction,
      method: "Manual",
      facilityName: facility?.name || "Not specified",
      purpose:
        form.purpose ||
        (direction === "Inbound"
          ? "Inventory receipt"
          : "Approved blood transfer"),
      status: direction === "Inbound" ? "Ready to receive" : "Ready to release",
    };
  };

  const previewScan = () => {
    const scanned = buildScanPreview();
    const registered = (window.INVENTORY || []).some(
      (unit) => unit.isbt === scanned.isbt
    );

    if (!registered) {
      toast.push({
        kind: "warn",
        text: "Blood unit is not registered",
        sub: `${scanned.isbt} must be imported or manually entered before it can be scanned.`,
      });
      return;
    }

    setPreview(scanned);
  };

  const previewManual = () => {
    if (!form.isbt.trim() || !form.expires) {
      toast.push({
        kind: "warn",
        text: "Complete the required fields",
        sub: "Unit ID and expiration date are required before previewing.",
      });
      return;
    }

    if (
      direction === "Outbound" &&
      !(window.INVENTORY || []).some((unit) => unit.isbt === form.isbt.trim())
    ) {
      toast.push({
        kind: "warn",
        text: "Blood unit is not registered",
        sub: "Only blood units currently recorded in inventory can be released.",
      });
      return;
    }

    setPreview(buildManualPreview());
  };

  const createBlockchainId = () => {
    const stamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(16).slice(2, 10).toUpperCase();
    return `TX-${stamp}-${random}`;
  };

  const confirmTransaction = () => {
    if (!preview) return;

    if (inboundOnly && direction !== "Inbound") {
      toast.push({
        kind: "warn",
        text: "Outbound scanning is unavailable",
        sub: "Requestor facilities can only confirm inbound blood receipts.",
      });
      return;
    }

    const transaction = {
      ...preview,
      txId: createBlockchainId(),
      status: direction === "Inbound" ? "Received" : "Released",
      ts: new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      recordedAt: new Date().toISOString(),
    };

    const nextHistory = [transaction, ...history];

    const currentInventory = window.INVENTORY || [];

    if (direction === "Inbound") {
      const expiryTime = new Date(`${preview.expires}T00:00:00`).getTime();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysLeft = Number.isNaN(expiryTime)
        ? null
        : Math.ceil((expiryTime - today.getTime()) / 86400000);
      const receivedUnit = {
        isbt: preview.isbt,
        type: preview.type,
        comp: preview.comp,
        collected: preview.collected,
        expires: preview.expires,
        days_left: daysLeft,
        status: "Available",
        reserved_for: null,
        source: preview.facilityId || "External",
        shelf: "Pending assignment",
        temp: null,
      };

      window.INVENTORY = [
        receivedUnit,
        ...currentInventory.filter((unit) => unit.isbt !== receivedUnit.isbt),
      ];
    } else {
      window.INVENTORY = currentInventory.filter(
        (unit) => unit.isbt !== preview.isbt
      );
    }

    setHistory(nextHistory);
    window.SCAN_HISTORY = nextHistory;
    setConfirming(false);
    setPreview(null);

    toast.push({
      kind: "ok",
      text: `${direction} transaction recorded`,
      sub: `Blockchain ID ${transaction.txId}`,
    });
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="BloodLedger"
        title={inboundOnly ? "Blood Unit Receipt" : "Blood Unit Transactions"}
        sub={
          inboundOnly
            ? "Scan and confirm blood units received by this requestor facility."
            : "Preview and confirm inbound or outbound blood unit transactions."
        }
        actions={
          <Btn size="sm" kind="ghost" onClick={() => onNav("inventory")}>
            View Inventory
          </Btn>
        }
      />

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-h">
          <div>
            <h3>Transaction Type</h3>
            <div className="sub muted">
              {inboundOnly
                ? "Requestor facilities record inbound receipts only."
                : "Select whether the blood unit is entering or leaving this facility."}
            </div>
          </div>

          <div className="row" style={{ gap: 6 }}>
            {availableDirections.map((item) => (
              <button
                key={item}
                className={`filter-chip ${
                  direction === item ? "active" : ""
                }`}
                onClick={() => changeDirection(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-dash">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>{direction} Blood Unit Input</h3>
              <div className="sub muted">
                Use a simulated scan or enter the unit details manually.
              </div>
            </div>

            <div className="actions">
              <div className="row" style={{ gap: 6 }}>
                {["Scan", "Manual"].map((item) => (
                  <button
                    key={item}
                    className={`filter-chip ${mode === item ? "active" : ""}`}
                    onClick={() => changeMode(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-b">
            {mode === "Scan" ? (
              <>
                <div className="scanner-view">
                  <div className="scanner-grid" />
                  <div className="scanline" />

                  <div
                    style={{
                      textAlign: "center",
                      padding: 30,
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 13,
                    }}
                  >
                    Position the blood unit label within the scanning area
                  </div>
                </div>

                <div style={{ height: 14 }} />

                <div className="row">
                  {permissions.canScan ? (
                    <>
                      <Btn kind="ghost" icon="scanner" onClick={previewScan}>
                        Simulate Scan
                      </Btn>

                      <Btn kind="primary" icon="check" onClick={previewScan}>
                        Preview Entry
                      </Btn>
                    </>
                  ) : (
                    <span className="muted small">
                      This account has view-only access.
                    </span>
                  )}

                  <Btn kind="ghost" icon="refresh" onClick={resetEntry}>
                    Reset
                  </Btn>
                </div>
              </>
            ) : (
              <div>
                <div className="muted small" style={{ marginBottom: 16 }}>
                  Enter the basic {direction.toLowerCase()} transaction details.
                  Unit ID and expiration date are required.
                </div>

                <dl className="kv">
                  <dt>Unit ID</dt>
                  <dd>
                    <input
                      className="input mono"
                      value={form.isbt}
                      placeholder="Enter ISBT-128 unit ID"
                      onChange={(event) =>
                        updateForm("isbt", event.target.value)
                      }
                    />
                  </dd>

                  <dt>Blood Type</dt>
                  <dd>
                    <select
                      className="input"
                      value={form.type}
                      onChange={(event) =>
                        updateForm("type", event.target.value)
                      }
                    >
                      {window.BLOOD_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </dd>

                  <dt>Component</dt>
                  <dd>
                    <select
                      className="input"
                      value={form.comp}
                      onChange={(event) =>
                        updateForm("comp", event.target.value)
                      }
                    >
                      {window.COMPONENTS.map((component) => (
                        <option key={component}>{component}</option>
                      ))}
                    </select>
                  </dd>

                  <dt>Collection Date</dt>
                  <dd>
                    <input
                      className="input"
                      type="date"
                      value={form.collected}
                      onChange={(event) =>
                        updateForm("collected", event.target.value)
                      }
                    />
                  </dd>

                  <dt>Expiration Date</dt>
                  <dd>
                    <input
                      className="input"
                      type="date"
                      value={form.expires}
                      onChange={(event) =>
                        updateForm("expires", event.target.value)
                      }
                    />
                  </dd>

                  <dt>
                    {direction === "Inbound"
                      ? "Source Facility"
                      : "Destination Facility"}
                  </dt>
                  <dd>
                    <select
                      className="input"
                      value={form.facilityId}
                      onChange={(event) =>
                        updateForm("facilityId", event.target.value)
                      }
                    >
                      <option value="">Select facility</option>
                      {otherFacilities.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </dd>

                  <dt>Purpose</dt>
                  <dd>
                    <input
                      className="input"
                      value={form.purpose}
                      placeholder={
                        direction === "Inbound"
                          ? "e.g. Inventory receipt"
                          : "e.g. Approved blood transfer"
                      }
                      onChange={(event) =>
                        updateForm("purpose", event.target.value)
                      }
                    />
                  </dd>
                </dl>

                <div className="row" style={{ marginTop: 18 }}>
                  <Btn kind="primary" icon="check" onClick={previewManual}>
                    Preview Entry
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>{preview ? `${direction} Preview` : "Awaiting Input"}</h3>
              <div className="sub muted">
                Review the information before confirming the transaction.
              </div>
            </div>
          </div>

          <div className="card-b">
            {!permissions.canScan ? (
              <div
                className="muted small"
                style={{ padding: "32px 8px", textAlign: "center" }}
              >
                This session has read-only access.
              </div>
            ) : !preview ? (
              <div
                className="muted small"
                style={{ padding: "32px 8px", textAlign: "center" }}
              >
                Preview a scanned or manually entered {direction.toLowerCase()}{" "}
                transaction to review its details.
              </div>
            ) : (
              <>
                <div className="row" style={{ gap: 14, alignItems: "center" }}>
                  <BloodType type={preview.type} lg />

                  <div>
                    <div className="mono">{preview.isbt}</div>
                    <div className="muted small">
                      {preview.comp} · {preview.method}
                    </div>
                  </div>

                  <span style={{ flex: 1 }} />

                  <Chip kind={direction === "Inbound" ? "ok" : "warn"} dot>
                    {direction}
                  </Chip>
                </div>

                <div className="divider" />

                <dl className="kv">
                  <dt>Transaction</dt>
                  <dd>{preview.direction}</dd>

                  <dt>Input Method</dt>
                  <dd>{preview.method}</dd>

                  <dt>Unit ID</dt>
                  <dd className="mono small">{preview.isbt}</dd>

                  <dt>Blood Type</dt>
                  <dd>{preview.type}</dd>

                  <dt>Component</dt>
                  <dd>{preview.comp}</dd>

                  <dt>Collection Date</dt>
                  <dd className="mono small">{preview.collected || "—"}</dd>

                  <dt>Expiration Date</dt>
                  <dd className="mono small">{preview.expires || "—"}</dd>

                  <dt>
                    {direction === "Inbound"
                      ? "Source Facility"
                      : "Destination Facility"}
                  </dt>
                  <dd>{preview.facilityName}</dd>

                  <dt>Purpose</dt>
                  <dd>{preview.purpose}</dd>

                  <dt>Status</dt>
                  <dd>
                    <Chip kind="info" dot>
                      {preview.status}
                    </Chip>
                  </dd>
                </dl>

                <div className="divider" />

                <div className="row">
                  <Btn kind="ghost" onClick={resetEntry}>
                    Cancel
                  </Btn>

                  <span style={{ flex: 1 }} />

                  <Btn
                    kind="primary"
                    icon="check"
                    onClick={() => setConfirming(true)}
                  >
                    Confirm Details
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="card-h">
          <div>
            <h3>Recent Blood Unit Transactions</h3>
            <div className="sub muted">
              {inboundOnly
                ? "Confirmed inbound receipts with mock blockchain IDs."
                : "Confirmed inbound and outbound entries with mock blockchain IDs."}
            </div>
          </div>
        </div>

        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Unit ID</th>
                <th>Blood</th>
                <th>Method</th>
                <th>Status</th>
                <th>Blockchain ID</th>
              </tr>
            </thead>

            <tbody>
              {visibleHistory.length > 0 ? (
                visibleHistory.map((item, index) => (
                  <tr key={`${item.txId || item.isbt}-${index}`}>
                    <td className="mono small">{item.ts || "—"}</td>
                    <td>
                      <Chip
                        kind={
                          item.direction === "Outbound" ? "warn" : "ok"
                        }
                        dot
                      >
                        {item.direction || "Inbound"}
                      </Chip>
                    </td>
                    <td className="mono small">{item.isbt}</td>
                    <td>
                      <BloodType type={item.type} /> {item.comp}
                    </td>
                    <td>{item.method || "Scan"}</td>
                    <td>
                      <Chip kind="info" dot>
                        {item.status || "Recorded"}
                      </Chip>
                    </td>
                    <td className="mono tiny">{item.txId || "Legacy record"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="muted"
                    style={{ textAlign: "center", padding: 30 }}
                  >
                    {inboundOnly
                      ? "No inbound receipts have been recorded yet."
                      : "No inbound or outbound transactions have been recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="card-b">
          <div className="row" style={{ gap: 12 }}>
            <I name="info" size={16} />
            <div>
              <div className="small">Prototype workflow</div>
              <div className="muted tiny">
                Scanner hardware, blockchain writes, and final hospital
                validation rules are simulated until backend and stakeholder
                requirements are confirmed.
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirming && preview && (
        <Modal
          title={`Confirm ${direction} Transaction`}
          sub="Verify that the details are correct before recording this transaction."
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Btn kind="ghost" onClick={() => setConfirming(false)}>
                Go Back
              </Btn>
              <Btn kind="primary" icon="check" onClick={confirmTransaction}>
                Confirm & Record
              </Btn>
            </>
          }
        >
          <dl className="kv">
            <dt>Transaction Type</dt>
            <dd>
              <Chip kind={direction === "Inbound" ? "ok" : "warn"} dot>
                {direction}
              </Chip>
            </dd>

            <dt>Input Method</dt>
            <dd>{preview.method}</dd>

            <dt>Unit ID</dt>
            <dd className="mono small">{preview.isbt}</dd>

            <dt>Blood Product</dt>
            <dd>
              {preview.type} · {preview.comp}
            </dd>

            <dt>
              {direction === "Inbound"
                ? "Source Facility"
                : "Destination Facility"}
            </dt>
            <dd>{preview.facilityName}</dd>

            <dt>Expiration Date</dt>
            <dd className="mono small">{preview.expires || "—"}</dd>

            <dt>Purpose</dt>
            <dd>{preview.purpose}</dd>
          </dl>

          <div className="divider" />

          <div className="muted small">
            Confirming creates a mock blockchain transaction ID and adds this
            entry to the recent transaction log.
          </div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, {
  ScannerPage,
});
