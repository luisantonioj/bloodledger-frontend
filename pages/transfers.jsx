// pages/transfers.jsx
// Simplified BloodLedger requests and transfers page.
//
// The Blood Request form uses self-contained styling so that it matches
// the visual design of the BloodLedger prototype without depending on
// additional CSS classes.

function TransfersPage({
  hospital,
  permissions,
  transfers,
  onNav,
  prefill,
  onCommit,
}) {
  const transferList = transfers || window.TRANSFERS || [];

  const [activeTab, setActiveTab] = React.useState("requests");
  const [showRequestForm, setShowRequestForm] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(
    prefill?.selectId || null
  );

  const [bloodType, setBloodType] = React.useState(
    prefill?.type || "O+"
  );

  const [units, setUnits] = React.useState(
    prefill?.units || 1
  );

  const [urgency, setUrgency] = React.useState(
    prefill?.urgency || "Routine"
  );

  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (prefill?.selectId) {
      setSelectedId(prefill.selectId);
      setActiveTab("transfers");
    }

    if (prefill?.type || prefill?.units) {
      setShowRequestForm(true);
    }
  }, [prefill]);

  const requests = transferList.filter((item) => {
    return (
      item.requestOnly ||
      item.status === "Pending" ||
      item.status === "Requested"
    );
  });

  const activeTransfers = transferList.filter((item) => {
    return !item.requestOnly;
  });

  const selectedTransfer =
    activeTransfers.find((item) => item.id === selectedId) ||
    activeTransfers[0] ||
    null;

  const createRequest = async () => {
    const payload = {
      type: bloodType,
      units: Number(units),
      urgency,
      to: hospital?.id,
      requestOnly: true,
      note,
    };

    if (onCommit) {
      await onCommit(payload);
    }

    setShowRequestForm(false);
    setNote("");
    setUnits(1);
    setUrgency("Routine");
  };

  /*
   * Self-contained form styles.
   * These use explicit colors so the form remains styled even if
   * the existing global stylesheet does not define form control classes.
   */

  const formCardStyle = {
    background: "#ffffff",
    border: "1px solid #e3ded5",
    borderRadius: "12px",
    overflow: "hidden",
  };

  const formHeaderStyle = {
    padding: "20px 22px",
    borderBottom: "1px solid #ebe6de",
    background: "#ffffff",
  };

  const formBodyStyle = {
    padding: "24px 22px",
    background: "#fdfcf9",
  };

  const fieldsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  };

  const fieldGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#4f4a44",
    letterSpacing: "0.02em",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    background: "#ffffff",
    color: "#1f1d1b",
    border: "1px solid #d9d3ca",
    borderRadius: "8px",
    fontFamily: "inherit",
    fontSize: "14px",
    lineHeight: "1.4",
    outline: "none",
    minHeight: "42px",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "96px",
    resize: "vertical",
  };

  const helperStyle = {
    fontSize: "11px",
    color: "#888078",
    lineHeight: "1.4",
  };

  const footerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #ebe6de",
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={hospital ? hospital.short : "BloodLedger"}
        title="Blood Requests & Transfers"
        sub="View blood requests and track the movement of blood units between participating facilities."
        actions={
          <>
            {permissions.canCreateTransfer && (
              <Btn
                icon="plus"
                onClick={() => setShowRequestForm(true)}
              >
                New Blood Request
              </Btn>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div
        className="row"
        style={{
          gap: 8,
          marginBottom: 18,
        }}
      >
        <button
          className={`filter-chip ${
            activeTab === "requests" ? "active" : ""
          }`}
          onClick={() => setActiveTab("requests")}
        >
          Blood Requests
          <span className="count">
            {requests.length}
          </span>
        </button>

        <button
          className={`filter-chip ${
            activeTab === "transfers" ? "active" : ""
          }`}
          onClick={() => setActiveTab("transfers")}
        >
          Transfers
          <span className="count">
            {activeTransfers.length}
          </span>
        </button>
      </div>

      {/* ======================================================
          NEW BLOOD REQUEST FORM
          ====================================================== */}

      {showRequestForm && (
        <>
          <div style={formCardStyle}>
            {/* Form header */}
            <div style={formHeaderStyle}>
              <h3
                style={{
                  margin: 0,
                  marginBottom: 4,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#161412",
                }}
              >
                Create Blood Request
              </h3>

              <div
                style={{
                  fontSize: "13px",
                  color: "#7b746c",
                }}
              >
                Enter the basic details of the requested blood supply.
              </div>
            </div>

            {/* Form body */}
            <div style={formBodyStyle}>
              <div style={fieldsGridStyle}>
                {/* Blood Type */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Blood Type
                  </label>

                  <select
                    value={bloodType}
                    onChange={(e) =>
                      setBloodType(e.target.value)
                    }
                    style={inputStyle}
                  >
                    {window.BLOOD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <span style={helperStyle}>
                    Select the required blood type.
                  </span>
                </div>

                {/* Units */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Units Needed
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={units}
                    onChange={(e) =>
                      setUnits(e.target.value)
                    }
                    style={inputStyle}
                  />

                  <span style={helperStyle}>
                    Enter the number of units requested.
                  </span>
                </div>

                {/* Priority */}
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Priority
                  </label>

                  <select
                    value={urgency}
                    onChange={(e) =>
                      setUrgency(e.target.value)
                    }
                    style={inputStyle}
                  >
                    <option value="Routine">
                      Routine
                    </option>

                    <option value="Urgent">
                      Urgent
                    </option>

                    <option value="Emergency">
                      Emergency
                    </option>
                  </select>

                  <span style={helperStyle}>
                    Select the request priority.
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div
                style={{
                  ...fieldGroupStyle,
                  marginTop: "22px",
                }}
              >
                <label style={labelStyle}>
                  Notes
                  <span
                    style={{
                      marginLeft: "5px",
                      fontWeight: "400",
                      color: "#999189",
                    }}
                  >
                    Optional
                  </span>
                </label>

                <textarea
                  placeholder="Add any additional information about this request..."
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
                  }
                  style={textareaStyle}
                />
              </div>

              {/* Form footer */}
              <div style={footerStyle}>
                <Btn
                  kind="ghost"
                  onClick={() => {
                    setShowRequestForm(false);
                    setNote("");
                  }}
                >
                  Cancel
                </Btn>

                <Btn
                  kind="primary"
                  icon="check"
                  onClick={createRequest}
                >
                  Submit Request
                </Btn>
              </div>
            </div>
          </div>

          <div style={{ height: 18 }} />
        </>
      )}

      {/* ======================================================
          BLOOD REQUESTS
          ====================================================== */}

      {activeTab === "requests" && (
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Blood Requests</h3>

              <div className="sub muted">
                Current requests recorded in the prototype.
              </div>
            </div>
          </div>

          <div className="card-b flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Blood Type</th>
                  <th>Units</th>
                  <th>Priority</th>
                  <th>Requesting Facility</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {requests.length > 0 ? (
                  requests.map((item) => (
                    <tr key={item.id}>
                      <td className="mono small">
                        {item.id}
                      </td>

                      <td>
                        <BloodType
                          type={item.type}
                        />
                      </td>

                      <td className="tnum">
                        {item.units}
                      </td>

                      <td>
                        {item.urgency || "Routine"}
                      </td>

                      <td>
                        {item.to
                          ? hospitalById(item.to)?.short ||
                            item.to
                          : hospital?.short || "—"}
                      </td>

                      <td>
                        <Chip
                          kind={
                            item.status === "Rejected"
                              ? "critical"
                              : item.status === "Approved"
                              ? "ok"
                              : "warn"
                          }
                          dot
                        >
                          {item.status || "Pending"}
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
                        padding: 32,
                      }}
                    >
                      No blood requests to display.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          TRANSFERS
          ====================================================== */}

      {activeTab === "transfers" && (
        <div className="grid-dash">
          {/* Transfer list */}
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Transfers</h3>

                <div className="sub muted">
                  Active and recent blood transfers.
                </div>
              </div>
            </div>

            <div className="card-b flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>Blood Type</th>
                    <th>Units</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {activeTransfers.length > 0 ? (
                    activeTransfers.map((item) => (
                      <tr
                        key={item.id}
                        className="row-clickable"
                        style={
                          selectedTransfer?.id === item.id
                            ? {
                                background: "#faf7f2",
                              }
                            : null
                        }
                        onClick={() =>
                          setSelectedId(item.id)
                        }
                      >
                        <td className="mono small">
                          {item.id}
                        </td>

                        <td>
                          <BloodType
                            type={item.type}
                          />
                        </td>

                        <td className="tnum">
                          {item.units}
                        </td>

                        <td>
                          {item.from
                            ? hospitalById(item.from)?.short ||
                              item.from
                            : "—"}
                        </td>

                        <td>
                          {item.to
                            ? hospitalById(item.to)?.short ||
                              item.to
                            : "—"}
                        </td>

                        <td>
                          <Chip
                            kind={transferStatusKind(
                              item.status
                            )}
                            dot
                          >
                            {item.status}
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
                          padding: 32,
                        }}
                      >
                        No transfers to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfer details */}
          <div className="card">
            <div className="card-h">
              <div>
                <h3>Transfer Details</h3>

                <div className="sub muted">
                  Basic information for the selected transfer.
                </div>
              </div>
            </div>

            <div className="card-b">
              {!selectedTransfer ? (
                <div
                  className="muted"
                  style={{
                    textAlign: "center",
                    padding: 30,
                  }}
                >
                  Select a transfer to view its details.
                </div>
              ) : (
                <>
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div className="mono">
                        {selectedTransfer.id}
                      </div>

                      <div className="muted small">
                        Transfer record
                      </div>
                    </div>

                    <Chip
                      kind={transferStatusKind(
                        selectedTransfer.status
                      )}
                      dot
                    >
                      {selectedTransfer.status}
                    </Chip>
                  </div>

                  <div className="divider" />

                  <dl className="kv">
                    <dt>Blood Type</dt>

                    <dd>
                      <BloodType
                        type={selectedTransfer.type}
                      />
                    </dd>

                    <dt>Units</dt>

                    <dd>
                      {selectedTransfer.units}
                    </dd>

                    <dt>From</dt>

                    <dd>
                      {selectedTransfer.from
                        ? hospitalById(
                            selectedTransfer.from
                          )?.name ||
                          selectedTransfer.from
                        : "—"}
                    </dd>

                    <dt>To</dt>

                    <dd>
                      {selectedTransfer.to
                        ? hospitalById(
                            selectedTransfer.to
                          )?.name ||
                          selectedTransfer.to
                        : "—"}
                    </dd>

                    <dt>Priority</dt>

                    <dd>
                      {selectedTransfer.urgency ||
                        "Routine"}
                    </dd>

                    <dt>Started</dt>

                    <dd className="mono small">
                      {selectedTransfer.initiated ||
                        "—"}
                    </dd>

                    <dt>Completed</dt>

                    <dd className="mono small">
                      {selectedTransfer.completed ||
                        "—"}
                    </dd>
                  </dl>

                  <div className="divider" />

                  <div>
                    <div
                      className="small"
                      style={{
                        marginBottom: 10,
                      }}
                    >
                      Transfer Progress
                    </div>

                    <SimpleTransferProgress
                      status={selectedTransfer.status}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 18 }} />

      {/* Prototype notice */}
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
                Request approval rules, transfer responsibilities,
                prioritization logic, routing decisions, and
                hospital-specific procedures will be refined after
                stakeholder validation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SIMPLE TRANSFER PROGRESS
   ========================================================= */

function SimpleTransferProgress({ status }) {
  const normalized = String(status || "").toLowerCase();

  let currentStep = 1;

  if (
    normalized.includes("approved") ||
    normalized.includes("dispatch")
  ) {
    currentStep = 2;
  }

  if (
    normalized.includes("transit") ||
    normalized.includes("delayed")
  ) {
    currentStep = 3;
  }

  if (
    normalized.includes("received") ||
    normalized.includes("completed")
  ) {
    currentStep = 4;
  }

  const steps = [
    "Requested",
    "Approved",
    "In Transit",
    "Received",
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
      }}
    >
      {steps.map((step, index) => {
        const done = index + 1 <= currentStep;

        return (
          <div
            key={step}
            style={{
              padding: "10px 8px",
              border: done
                ? "1px solid #cfc6bc"
                : "1px solid #e4dfd8",
              borderRadius: 8,
              background: done
                ? "#f7f3ee"
                : "#ffffff",
              textAlign: "center",
            }}
          >
            <div
              className="small"
              style={{
                fontWeight: done ? 600 : 400,
                color: done
                  ? "#36312d"
                  : "#948c84",
              }}
            >
              {done ? "✓ " : ""}
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
}


Object.assign(window, {
  TransfersPage,
  SimpleTransferProgress,
});