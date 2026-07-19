// pages/scanner.jsx
// Simplified BloodLedger scan / add blood unit page.
//
// This version keeps the scanning concept visible without assuming
// finalized hospital workflows, scanner hardware behavior, blockchain
// commit details, storage locations, or donor-related data fields.

function ScannerPage({ permissions, onNav }) {
  const [mode, setMode] = React.useState("Scan");
  const [scanned, setScanned] = React.useState(null);
  const [history, setHistory] = React.useState(window.SCAN_HISTORY || []);

  const simulateScan = () => {
    setScanned({
      isbt: "W0381-2512-100118",
      type: "B-",
      comp: "PRBC",
      collected: "2026-07-18",
      expires: "2026-08-29",
      status: "Available",
    });
  };

  const addUnit = () => {
    if (!scanned) return;

    const newEntry = {
      isbt: scanned.isbt,
      type: scanned.type,
      comp: scanned.comp,
      expires: scanned.expires,
      status: "Added",
      ts: new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setHistory((current) => [newEntry, ...current]);
    setScanned(null);
  };

  return (
    <div className="page">
      <PageHead
        eyebrow="BloodLedger"
        title="Scan / Add Blood Unit"
        sub="Scan a blood unit label or enter its basic information to add it to the mock inventory."
        actions={
          <>
            <Btn
              size="sm"
              kind="ghost"
              onClick={() => onNav("inventory")}
            >
              View Inventory
            </Btn>
          </>
        }
      />

      <div className="grid-dash">
        {/* Scan area */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Blood Unit Input</h3>
              <div className="sub muted">
                Choose a simple input method for the prototype.
              </div>
            </div>

            <div className="actions">
              <div
                className="row"
                style={{ gap: 6 }}
              >
                {["Scan", "Manual"].map((item) => (
                  <button
                    key={item}
                    className={`filter-chip ${
                      mode === item ? "active" : ""
                    }`}
                    onClick={() => setMode(item)}
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
                    <Btn
                      kind="primary"
                      icon="scanner"
                      onClick={simulateScan}
                    >
                      Simulate Scan
                    </Btn>
                  ) : (
                    <span className="muted small">
                      This account has view-only access.
                    </span>
                  )}

                  <Btn
                    kind="ghost"
                    icon="refresh"
                    onClick={() => setScanned(null)}
                  >
                    Reset
                  </Btn>
                </div>
              </>
            ) : (
              <div>
                <div
                  className="muted small"
                  style={{ marginBottom: 16 }}
                >
                  Manual entry is shown as a basic mock-up only. The final required
                  fields can be confirmed after stakeholder consultation.
                </div>

                <div className="kv">
                  <dt>Unit ID</dt>
                  <dd>
                    <input
                      className="input mono"
                      placeholder="Enter blood unit ID"
                    />
                  </dd>

                  <dt>Blood Type</dt>
                  <dd>
                    <select className="input">
                      {window.BLOOD_TYPES.map((type) => (
                        <option key={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </dd>

                  <dt>Component</dt>
                  <dd>
                    <select className="input">
                      {window.COMPONENTS.map((component) => (
                        <option key={component}>
                          {component}
                        </option>
                      ))}
                    </select>
                  </dd>

                  <dt>Expiration Date</dt>
                  <dd>
                    <input
                      className="input"
                      type="date"
                    />
                  </dd>
                </div>

                <div
                  className="row"
                  style={{ marginTop: 18 }}
                >
                  <Btn
                    kind="primary"
                    icon="check"
                    onClick={simulateScan}
                  >
                    Preview Entry
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>
                {scanned
                  ? "Blood Unit Preview"
                  : "Awaiting Input"}
              </h3>

              <div className="sub muted">
                Review the basic information before adding the unit.
              </div>
            </div>
          </div>

          <div className="card-b">
            {!permissions.canScan ? (
              <div
                className="muted small"
                style={{
                  padding: "32px 8px",
                  textAlign: "center",
                }}
              >
                This session has read-only access.
              </div>
            ) : !scanned ? (
              <div
                className="muted small"
                style={{
                  padding: "32px 8px",
                  textAlign: "center",
                }}
              >
                Scan a blood unit or create a manual entry to preview its
                information.
              </div>
            ) : (
              <>
                <div
                  className="row"
                  style={{
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <BloodType
                    type={scanned.type}
                    lg
                  />

                  <div>
                    <div className="mono">
                      {scanned.isbt}
                    </div>

                    <div className="muted small">
                      {scanned.comp}
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <dl className="kv">
                  <dt>Unit ID</dt>
                  <dd className="mono small">
                    {scanned.isbt}
                  </dd>

                  <dt>Blood Type</dt>
                  <dd>
                    {scanned.type}
                  </dd>

                  <dt>Component</dt>
                  <dd>
                    {scanned.comp}
                  </dd>

                  <dt>Collection Date</dt>
                  <dd className="mono small">
                    {scanned.collected || "—"}
                  </dd>

                  <dt>Expiration Date</dt>
                  <dd className="mono small">
                    {scanned.expires}
                  </dd>

                  <dt>Status</dt>
                  <dd>
                    <Chip
                      kind="ok"
                      dot
                    >
                      {scanned.status}
                    </Chip>
                  </dd>
                </dl>

                <div className="divider" />

                <div className="row">
                  <Btn
                    kind="ghost"
                    onClick={() => setScanned(null)}
                  >
                    Cancel
                  </Btn>

                  <span style={{ flex: 1 }} />

                  <Btn
                    kind="primary"
                    icon="check"
                    onClick={addUnit}
                  >
                    Add Blood Unit
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      {/* Recent intake */}
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Recently Added Units</h3>
            <div className="sub muted">
              Sample records added through the scan or manual input workflow.
            </div>
          </div>
        </div>

        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Unit ID</th>
                <th>Blood Type</th>
                <th>Component</th>
                <th>Expiration Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {history.length > 0 ? (
                history.map((item, index) => (
                  <tr key={`${item.isbt}-${index}`}>
                    <td className="mono small">
                      {item.ts || "—"}
                    </td>

                    <td className="mono small">
                      {item.isbt}
                    </td>

                    <td>
                      <BloodType type={item.type} />
                    </td>

                    <td>
                      {item.comp}
                    </td>

                    <td className="mono small">
                      {item.expires}
                    </td>

                    <td>
                      <Chip
                        kind={
                          item.status === "Added"
                            ? "ok"
                            : "info"
                        }
                        dot
                      >
                        {item.status || "Recorded"}
                      </Chip>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="muted"
                    style={{
                      textAlign: "center",
                      padding: 30,
                    }}
                  >
                    No units have been added yet.
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
          <div
            className="row"
            style={{ gap: 12 }}
          >
            <I
              name="info"
              size={16}
            />

            <div>
              <div className="small">
                Prototype workflow
              </div>

              <div className="muted tiny">
                Scanner hardware behavior, barcode data fields, required intake
                information, and validation rules are placeholders until the
                hospital workflow is confirmed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScannerPage,
});