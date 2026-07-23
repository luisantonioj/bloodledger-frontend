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
  onUpdateTransfers,
}) {
  const transferList = transfers || window.TRANSFERS || [];
  const toast = React.useContext(ToastCtx);
  const canCreateRequest = !!permissions.canCreateRequest;

  const [activeTab, setActiveTab] = React.useState("requests");
  const [showRequestForm, setShowRequestForm] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(
    prefill?.selectId || null
  );
  const [selectedRequestId, setSelectedRequestId] = React.useState(null);
  const [decision, setDecision] = React.useState(null);
  const [authMode, setAuthMode] = React.useState("Scan");
  const [headId, setHeadId] = React.useState("");
  const [movementAction, setMovementAction] = React.useState(null);

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

    if (
      canCreateRequest &&
      (prefill?.type || prefill?.units)
    ) {
      setShowRequestForm(true);
    }
  }, [prefill, canCreateRequest]);

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

  const selectedRequest =
    requests.find((item) => item.id === selectedRequestId) ||
    requests[0] ||
    null;

  const nowStamp = () =>
    new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

  const blockchainId = () => {
    const bytes = new Uint8Array(32);

    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256);
      }
    }

    return Array.from(bytes)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  };

  const shortHash = (value) =>
    value ? `${value.slice(0, 6)}…` : "—";

  const replaceRecord = (id, changes) =>
    transferList.map((item) =>
      item.id === id
        ? {
            ...item,
            ...changes,
          }
        : item
    );

  const openDecision = (nextDecision) => {
    setDecision(nextDecision);
    setAuthMode("Scan");
    setHeadId("");
  };

  const simulateHeadIdScan = () => {
    setHeadId("BBH-MMC-2026-0042");
  };

  const confirmDecision = () => {
    if (!selectedRequest || !permissions.canApprove) return;

    if (!headId.trim()) {
      toast.push({
        kind: "warn",
        text: "Blood Bank Head ID required",
        sub: "Scan the authorized ID or enter it manually to continue.",
      });
      return;
    }

    const decidedAt = nowStamp();
    const decisionTxId = blockchainId();

    if (decision === "Reject") {
      onUpdateTransfers(
        replaceRecord(selectedRequest.id, {
          status: "Rejected",
          rejectedBy: headId.trim(),
          rejectedAt: decidedAt,
          decisionTxId,
        })
      );

      toast.push({
        kind: "warn",
        text: "Blood request rejected",
        sub: `Ledger transaction ${shortHash(decisionTxId)}`,
      });
    } else {
      const approvedRequest = {
        ...selectedRequest,
        status: "Approved",
        approvedBy: headId.trim(),
        approvedAt: decidedAt,
        decisionTxId,
      };

      const transfer = {
        id: `TX-${Date.now()}`,
        requestId: selectedRequest.id,
        type: selectedRequest.type,
        units: selectedRequest.units,
        urgency: selectedRequest.urgency,
        from: "MMC-LIP",
        to: selectedRequest.to,
        status: "Approved",
        requestOnly: false,
        initiated: selectedRequest.initiated,
        approvedBy: headId.trim(),
        approvedAt: decidedAt,
        approvalTxId: decisionTxId,
        completed: null,
      };

      const updated = transferList.map((item) =>
        item.id === selectedRequest.id ? approvedRequest : item
      );

      onUpdateTransfers([transfer, ...updated]);
      setSelectedId(transfer.id);

      toast.push({
        kind: "ok",
        text: "Blood request approved",
        sub: `Transfer created · ${shortHash(decisionTxId)}`,
      });
    }

    setDecision(null);
    setHeadId("");
  };

  const confirmMovement = () => {
    if (!selectedTransfer || !movementAction) return;

    const actionAt = nowStamp();
    const actionTxId = blockchainId();

    if (movementAction === "Outbound") {
      onUpdateTransfers(
        replaceRecord(selectedTransfer.id, {
          status: "In Transit",
          outboundAt: actionAt,
          outboundBy: "MMMC scanner",
          outboundTxId: actionTxId,
        })
      );

      toast.push({
        kind: "ok",
        text: "Outbound scan recorded",
        sub: `Transfer is now In Transit · ${shortHash(actionTxId)}`,
      });
    } else {
      onUpdateTransfers(
        replaceRecord(selectedTransfer.id, {
          status: "Received",
          receivedAt: actionAt,
          completed: actionAt,
          receivedBy: `${hospital?.short || "Receiver"} scanner`,
          receiptTxId: actionTxId,
        })
      );

      toast.push({
        kind: "ok",
        text: "Inbound receipt confirmed",
        sub: `Transfer marked Received · ${shortHash(actionTxId)}`,
      });
    }

    setMovementAction(null);
  };

  const transitDuration = (item) => {
    if (!item?.outboundAt || !item?.receivedAt) return "—";

    const start = new Date(item.outboundAt.replace(" ", "T"));
    const end = new Date(item.receivedAt.replace(" ", "T"));
    const minutes = Math.max(0, Math.round((end - start) / 60000));
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;

    return `${hours}h ${remainder}m`;
  };

  const createRequest = async () => {
    if (!canCreateRequest) {
      setShowRequestForm(false);
      toast.push({
        kind: "warn",
        text: "Available to secondary requesters only",
        sub: "Blood requests from Mary Mediatrix are planned as a future feature.",
      });
      return;
    }

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

  const openRequestForm = () => {
    if (!canCreateRequest) {
      setShowRequestForm(false);
      toast.push({
        kind: "warn",
        text: "Future feature",
        sub:
          hospital?.id === "MMC-LIP"
            ? "Mary Mediatrix is currently the BloodLedger supplier. Requesting blood from other hospitals will be enabled in a future phase."
            : "New blood requests are currently enabled for secondary requester hospitals only.",
      });
      return;
    }

    setShowRequestForm(true);
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
            <button
              type="button"
              className={`btn ${
                canCreateRequest ? "" : "btn-restricted"
              }`}
              data-restricted={!canCreateRequest}
              title={
                canCreateRequest
                  ? "Create a blood request"
                  : "Available to secondary requester hospitals only"
              }
              onClick={openRequestForm}
            >
              <I name="plus" size={14} />
              New Blood Request
            </button>
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
        <div className="grid-dash">
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
                    <tr
                      key={item.id}
                      className="row-clickable"
                      onClick={() => setSelectedRequestId(item.id)}
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
                          {item.status || "Requested"}
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

          <div className="card">
            <div className="card-h">
              <div>
                <h3>Request Review</h3>
                <div className="sub muted">
                  Blood Bank Head approval is required before transfer preparation.
                </div>
              </div>
            </div>

            <div className="card-b">
              {!selectedRequest ? (
                <div
                  className="muted"
                  style={{ textAlign: "center", padding: 30 }}
                >
                  Select a blood request to review.
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
                      <div className="mono">{selectedRequest.id}</div>
                      <div className="muted small">
                        Secondary hospital request
                      </div>
                    </div>

                    <Chip
                      kind={
                        selectedRequest.status === "Rejected"
                          ? "critical"
                          : selectedRequest.status === "Approved"
                          ? "ok"
                          : "warn"
                      }
                      dot
                    >
                      {selectedRequest.status || "Requested"}
                    </Chip>
                  </div>

                  <div className="divider" />

                  <dl className="kv">
                    <dt>Requesting Facility</dt>
                    <dd>
                      {hospitalById(selectedRequest.to)?.name ||
                        selectedRequest.to ||
                        "—"}
                    </dd>

                    <dt>Blood Product</dt>
                    <dd>
                      {selectedRequest.type} · {selectedRequest.units} unit(s)
                    </dd>

                    <dt>Priority</dt>
                    <dd>{selectedRequest.urgency || "Routine"}</dd>

                    <dt>Requested At</dt>
                    <dd className="mono small">
                      {selectedRequest.initiated || "—"}
                    </dd>

                    <dt>Notes</dt>
                    <dd>{selectedRequest.note || "No additional notes."}</dd>

                    {selectedRequest.approvedBy && (
                      <>
                        <dt>Approved By</dt>
                        <dd className="mono small">
                          {selectedRequest.approvedBy}
                        </dd>

                        <dt>Approval Ledger ID</dt>
                        <dd
                          className="mono small"
                          title={selectedRequest.decisionTxId}
                        >
                          {shortHash(selectedRequest.decisionTxId)}
                        </dd>
                      </>
                    )}

                    {selectedRequest.rejectedBy && (
                      <>
                        <dt>Rejected By</dt>
                        <dd className="mono small">
                          {selectedRequest.rejectedBy}
                        </dd>
                      </>
                    )}
                  </dl>

                  {selectedRequest.status === "Requested" &&
                    hospital?.id === "MMC-LIP" &&
                    permissions.canApprove && (
                      <>
                        <div className="divider" />
                        <div className="row">
                          <Btn
                            kind="ghost"
                            onClick={() => openDecision("Reject")}
                          >
                            Reject Request
                          </Btn>

                          <span style={{ flex: 1 }} />

                          <Btn
                            kind="primary"
                            icon="check"
                            onClick={() => openDecision("Approve")}
                          >
                            Approve Transfer
                          </Btn>
                        </div>
                      </>
                    )}
                </>
              )}
            </div>
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

                  <div className="divider" />

                  <div className="small" style={{ marginBottom: 10 }}>
                    Transfer Lifecycle Summary
                  </div>

                  <dl className="kv">
                    <dt>Request Reference</dt>
                    <dd className="mono small">
                      {selectedTransfer.requestId || "—"}
                    </dd>

                    <dt>Approved By</dt>
                    <dd className="mono small">
                      {selectedTransfer.approvedBy || "—"}
                    </dd>

                    <dt>Approved At</dt>
                    <dd className="mono small">
                      {selectedTransfer.approvedAt || "—"}
                    </dd>

                    <dt>Outbound Scan</dt>
                    <dd className="mono small">
                      {selectedTransfer.outboundAt || "Not recorded"}
                    </dd>

                    <dt>In Transit</dt>
                    <dd className="mono small">
                      {selectedTransfer.receivedAt
                        ? transitDuration(selectedTransfer)
                        : selectedTransfer.outboundAt
                        ? "Active"
                        : "Not started"}
                    </dd>

                    <dt>Received At</dt>
                    <dd className="mono small">
                      {selectedTransfer.receivedAt ||
                        selectedTransfer.completed ||
                        "Not received"}
                    </dd>

                    <dt>Approval Ledger ID</dt>
                    <dd
                      className="mono small"
                      title={selectedTransfer.approvalTxId}
                    >
                      {shortHash(selectedTransfer.approvalTxId)}
                    </dd>

                    <dt>Outbound Ledger ID</dt>
                    <dd
                      className="mono small"
                      title={selectedTransfer.outboundTxId}
                    >
                      {shortHash(selectedTransfer.outboundTxId)}
                    </dd>

                    <dt>Receipt Ledger ID</dt>
                    <dd
                      className="mono small"
                      title={selectedTransfer.receiptTxId}
                    >
                      {shortHash(selectedTransfer.receiptTxId)}
                    </dd>
                  </dl>

                  {selectedTransfer.status === "Approved" &&
                    hospital?.id === "MMC-LIP" &&
                    permissions.canScan && (
                      <>
                        <div className="divider" />
                        <Btn
                          kind="primary"
                          icon="scanner"
                          onClick={() => setMovementAction("Outbound")}
                        >
                          Record Outbound Scan
                        </Btn>
                      </>
                    )}

                  {selectedTransfer.status === "In Transit" &&
                    permissions.secondary &&
                    hospital?.id === selectedTransfer.to && (
                      <>
                        <div className="divider" />
                        <Btn
                          kind="primary"
                          icon="scanner"
                          onClick={() => setMovementAction("Inbound")}
                        >
                          Confirm Inbound Receipt
                        </Btn>
                      </>
                    )}
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

      {decision && selectedRequest && (
        <Modal
          title={`${decision} Blood Request`}
          sub="Authenticate the Blood Bank Head before recording this decision."
          onClose={() => setDecision(null)}
          footer={
            <>
              <Btn kind="ghost" onClick={() => setDecision(null)}>
                Cancel
              </Btn>

              <Btn
                kind={decision === "Approve" ? "primary" : "default"}
                icon="check"
                onClick={confirmDecision}
              >
                Confirm {decision}
              </Btn>
            </>
          }
        >
          <div className="row" style={{ gap: 6, marginBottom: 18 }}>
            {["Scan", "Manual"].map((item) => (
              <button
                key={item}
                className={`filter-chip ${
                  authMode === item ? "active" : ""
                }`}
                onClick={() => {
                  setAuthMode(item);
                  setHeadId("");
                }}
              >
                {item} ID
              </button>
            ))}
          </div>

          {authMode === "Scan" ? (
            <div className="card">
              <div className="card-b" style={{ textAlign: "center" }}>
                <I name="scanner" size={28} />
                <div style={{ height: 10 }} />
                <div>Scan Blood Bank Head ID</div>
                <div className="muted small" style={{ marginTop: 4 }}>
                  Use the authorized staff barcode or QR credential.
                </div>
                <div style={{ height: 16 }} />

                <Btn
                  kind="primary"
                  icon="scanner"
                  onClick={simulateHeadIdScan}
                >
                  Simulate ID Scan
                </Btn>
              </div>
            </div>
          ) : (
            <div>
              <label className="small">Blood Bank Head ID</label>
              <input
                className="input mono"
                value={headId}
                placeholder="Enter authorized ID"
                onChange={(event) => setHeadId(event.target.value)}
              />
            </div>
          )}

          {headId && (
            <>
              <div className="divider" />
              <dl className="kv">
                <dt>Authenticated ID</dt>
                <dd className="mono small">{headId}</dd>
                <dt>Decision</dt>
                <dd>
                  <Chip
                    kind={decision === "Approve" ? "ok" : "critical"}
                    dot
                  >
                    {decision}
                  </Chip>
                </dd>
                <dt>Request</dt>
                <dd className="mono small">{selectedRequest.id}</dd>
              </dl>
            </>
          )}

          <div className="divider" />
          <div className="muted small">
            Confirming records the decision on the mock ledger and generates a
            unique blockchain transaction ID.
          </div>
        </Modal>
      )}

      {movementAction && selectedTransfer && (
        <Modal
          title={
            movementAction === "Outbound"
              ? "Confirm Outbound Scan"
              : "Confirm Inbound Receipt"
          }
          sub={
            movementAction === "Outbound"
              ? "This confirms that the approved blood units have left Mary Mediatrix."
              : "This confirms that the receiving hospital has accepted the blood units."
          }
          onClose={() => setMovementAction(null)}
          footer={
            <>
              <Btn kind="ghost" onClick={() => setMovementAction(null)}>
                Cancel
              </Btn>
              <Btn kind="primary" icon="check" onClick={confirmMovement}>
                Confirm Scan
              </Btn>
            </>
          }
        >
          <dl className="kv">
            <dt>Transfer ID</dt>
            <dd className="mono small">{selectedTransfer.id}</dd>
            <dt>Blood Product</dt>
            <dd>
              {selectedTransfer.type} · {selectedTransfer.units} unit(s)
            </dd>
            <dt>From</dt>
            <dd>
              {hospitalById(selectedTransfer.from)?.name ||
                selectedTransfer.from}
            </dd>
            <dt>To</dt>
            <dd>
              {hospitalById(selectedTransfer.to)?.name ||
                selectedTransfer.to}
            </dd>
            <dt>Next Status</dt>
            <dd>
              <Chip kind="info" dot>
                {movementAction === "Outbound" ? "In Transit" : "Received"}
              </Chip>
            </dd>
          </dl>
        </Modal>
      )}
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
