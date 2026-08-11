// pages/transfers.jsx
// Simplified BloodLedger requests and transfers page.
//
// The Blood Request form uses self-contained styling so that it matches
// the visual design of the BloodLedger prototype without depending on
// additional CSS classes.

function TransfersPage({
  hospital,
  session,
  permissions,
  transfers,
  onNav,
  prefill,
  onCommit,
  onUpdateTransfers,
  prcSupplyRequests,
  onUpdatePrcSupplyRequests,
  alerts,
  onUpdateAlerts,
  auditRows,
  onUpdateAudit,
}) {
  const transferList = transfers || window.TRANSFERS || [];
  const scopedTransferList = permissions.secondary || permissions.bloodBank
    ? transferList.filter(
        (item) =>
          item.to === hospital?.id ||
          item.from === hospital?.id
      )
    : transferList;
  const toast = React.useContext(ToastCtx);
  const canCreateRequest = !!permissions.canCreateRequest;
  const consortiumBanks = (window.CONSORTIUM_BANKS || []).map((item) => hospitalById(item.facilityId));
  const canViewPrcSupply = permissions.bloodBank || hospital?.id === "PRC-LIP";
  const canCreatePrcRequest = permissions.bloodBank && permissions.canApprove;
  const workflowProfile = permissions.bloodBank
    ? {
        label: "Supplier workflow",
        description: "Review requests, authorize allocation, release units, and record outbound custody.",
        stages: [
          { label: "Review Request", hint: "Check request details" },
          { label: "Approve Request", hint: "Authorize allocation" },
          { label: "Prepare Transfer", hint: "Assign blood units" },
          { label: "Outbound Scan", hint: "Release custody" },
        ],
        owner: `${hospital?.short || "Participating Hospital"} Blood Bank`,
      }
    : hospital?.id === "PRC-LIP"
    ? {
        label: "PRC coordination workflow",
        description: "Acknowledge upstream requests, confirm availability, prepare supply, and issue a PRC reference.",
        stages: [
          { label: "Acknowledge", hint: "Review incoming request" },
          { label: "Confirm Stock", hint: "Verify availability" },
          { label: "Prepare Supply", hint: "Ready the blood units" },
          { label: "Release", hint: "Record PRC release" },
        ],
        owner: "PRC Lipa City Chapter",
      }
    : {
        label: "Requestor workflow",
        description: "Submit requirements, monitor approval and transit, then confirm inbound receipt.",
        stages: [
          { label: "Submit Request", hint: "Provide requirements" },
          { label: "Await Approval", hint: "Monitor the decision" },
          { label: "Track Request", hint: "Follow transfer status" },
          { label: "Receive Blood", hint: "Confirm inbound receipt" },
        ],
        owner: hospital?.short || "Requesting Facility",
      };

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

  const [component, setComponent] = React.useState(
    prefill?.component || "PRBC"
  );

  const [supplierId, setSupplierId] = React.useState(
    prefill?.supplierId ||
      (window.CONSORTIUM_BANKS || []).find((item) => item.facilityId !== hospital?.id)?.facilityId ||
      "MMC-LIP"
  );

  const [units, setUnits] = React.useState(
    prefill?.units || 1
  );

  const [urgency, setUrgency] = React.useState(
    prefill?.urgency || "Routine"
  );

  const [note, setNote] = React.useState("");
  const [requesterName, setRequesterName] = React.useState(
    session?.user?.name || ""
  );
  const [requesterEmployeeId, setRequesterEmployeeId] = React.useState("");
  const [physicianName, setPhysicianName] = React.useState("");
  const [caseReference, setCaseReference] = React.useState("");
  const [requiredDate, setRequiredDate] = React.useState("");
  const [pickupName, setPickupName] = React.useState("");
  const [pickupIdReference, setPickupIdReference] = React.useState("");
  const [requestFormFile, setRequestFormFile] = React.useState(null);
  const [pickupDocumentFile, setPickupDocumentFile] = React.useState(null);
  const [showPrcForm, setShowPrcForm] = React.useState(false);
  const [prcBloodType, setPrcBloodType] = React.useState("O-");
  const [prcComponent, setPrcComponent] = React.useState("PRBC");
  const [prcUnits, setPrcUnits] = React.useState(1);
  const [prcUrgency, setPrcUrgency] = React.useState("Routine");
  const [prcNeededBy, setPrcNeededBy] = React.useState("");
  const [prcNote, setPrcNote] = React.useState("");
  const [requestResolution, setRequestResolution] = React.useState(null);
  const [approvedCancellation, setApprovedCancellation] = React.useState(null);
  const [resolutionReason, setResolutionReason] = React.useState("");
  const [availableUnits, setAvailableUnits] = React.useState(1);

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

    if (prefill?.supplierId) setSupplierId(prefill.supplierId);

    if (prefill?.selectRequestId) {
      setSelectedRequestId(prefill.selectRequestId);
      setActiveTab("requests");
    }
  }, [prefill, canCreateRequest]);

  const requests = scopedTransferList.filter((item) => {
    return (
      item.requestOnly ||
      item.status === "Pending" ||
      item.status === "Requested"
    );
  });

  const activeTransfers = scopedTransferList.filter((item) => {
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

  const linkedTransfer = selectedRequest
    ? activeTransfers.find((item) => item.requestId === selectedRequest.id) || null
    : null;

  const linkedRequest = selectedTransfer?.requestId
    ? requests.find((item) => item.id === selectedTransfer.requestId) || null
    : null;

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

  const requestStatusKind = (status) =>
    ["Rejected", "Cancelled", "Cancelled After Approval"].includes(status)
      ? "critical"
      : status === "Approved"
      ? "ok"
      : status === "Partial Offer"
      ? "info"
      : "warn";

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
    setHeadId(`BBH-${hospital?.id || "BANK"}-2026-0042`);
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
        component: selectedRequest.component || "PRBC",
        units: selectedRequest.units,
        urgency: selectedRequest.urgency,
        from: hospital?.id,
        to: selectedRequest.to,
        status: "Approved",
        requestOnly: false,
        initiated: selectedRequest.initiated,
        requesterName: selectedRequest.requesterName,
        requesterEmployeeId: selectedRequest.requesterEmployeeId,
        physicianName: selectedRequest.physicianName,
        caseReference: selectedRequest.caseReference,
        requiredDate: selectedRequest.requiredDate,
        pickupName: selectedRequest.pickupName,
        pickupIdReference: selectedRequest.pickupIdReference,
        attachments: selectedRequest.attachments || [],
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
          outboundBy: `${hospital?.short || "Blood bank"} scanner`,
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
        text: "Blood requests are unavailable",
        sub: "This account does not have permission to submit consortium blood requests.",
      });
      return;
    }

    const requiredDetails = [
      requesterName,
      requesterEmployeeId,
      physicianName,
      caseReference,
      requiredDate,
      pickupName,
      pickupIdReference,
    ];

    if (requiredDetails.some((value) => !String(value || "").trim())) {
      toast.push({
        kind: "warn",
        text: "Complete the request details",
        sub: "Requester, clinical reference, schedule, and pickup information are required.",
      });
      return;
    }

    if (!requestFormFile || !pickupDocumentFile) {
      toast.push({
        kind: "warn",
        text: "Supporting documents required",
        sub: "Attach the blood request form and pickup authorization or valid ID.",
      });
      return;
    }

    const payload = {
      type: bloodType,
      component,
      units: Number(units),
      urgency,
      from: supplierId,
      to: hospital?.id,
      requestOnly: true,
      note,
      requesterName: requesterName.trim(),
      requesterEmployeeId: requesterEmployeeId.trim(),
      physicianName: physicianName.trim(),
      caseReference: caseReference.trim(),
      requiredDate,
      pickupName: pickupName.trim(),
      pickupIdReference: pickupIdReference.trim(),
      attachments: [requestFormFile, pickupDocumentFile],
    };

    if (onCommit) {
      await onCommit(payload);
    }

    setShowRequestForm(false);
    setNote("");
    setUnits(1);
    setUrgency("Routine");
    setPhysicianName("");
    setCaseReference("");
    setRequiredDate("");
    setPickupName("");
    setPickupIdReference("");
    setRequestFormFile(null);
    setPickupDocumentFile(null);
  };

  const documentMeta = (file, category) =>
    file
      ? {
          category,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        }
      : null;

  const submitPrcRequest = () => {
    if (!canCreatePrcRequest) return;

    if (!prcNeededBy || Number(prcUnits) < 1) {
      toast.push({
        kind: "warn",
        text: "Complete the PRC request",
        sub: "Enter a valid quantity and required date before sending.",
      });
      return;
    }

    const nextRequest = {
      id: `PRC-REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      type: prcBloodType,
      component: prcComponent,
      units: Number(prcUnits),
      urgency: prcUrgency,
      neededBy: prcNeededBy,
      requestedBy: session?.user?.name || "Blood Bank Head",
      requestedAt: nowStamp(),
      status: "Sent to PRC",
      prcReference: null,
      note: prcNote.trim(),
    };

    onUpdatePrcSupplyRequests?.([
      nextRequest,
      ...(prcSupplyRequests || []),
    ]);

    setShowPrcForm(false);
    setPrcUnits(1);
    setPrcUrgency("Routine");
    setPrcNeededBy("");
    setPrcNote("");
    toast.push({
      kind: "ok",
      text: "Request sent to PRC Lipa",
      sub: `${nextRequest.id} · ${nextRequest.units} ${nextRequest.type} ${nextRequest.component}`,
    });
  };

  const recordRequestEvent = (action, request, status, details, hospitalIds) => {
    const event = {
      ts: nowStamp(),
      actor: session?.user?.name || "System",
      role: session?.user?.role || "User",
      action,
      requestId: request.id,
      blockchainId: blockchainId(),
      details,
      status,
      hospitalIds,
    };

    onUpdateAudit?.([event, ...(auditRows || [])]);
    return event.blockchainId;
  };

  const notifyFacility = (hospitalId, title, desc, requestId, severity = "info") => {
    const alert = {
      id: `AL-${Date.now()}`,
      severity,
      title,
      desc,
      when: "Just now",
      source: "Request Coordination",
      hospitalId,
      actions: [
        {
          label: "Review request",
          goto: "transfers",
          payload: { selectRequestId: requestId },
        },
      ],
    };

    onUpdateAlerts?.([alert, ...(alerts || [])]);
  };

  const openRequestResolution = (type) => {
    setRequestResolution(type);
    setResolutionReason(
      type === "partial"
        ? "Requested quantity is not fully available."
        : "Requested blood product is currently unavailable."
    );
    setAvailableUnits(Math.max(1, Math.min((selectedRequest?.units || 2) - 1, selectedRequest?.units || 1)));
  };

  const confirmRequestResolution = () => {
    if (!selectedRequest || !permissions.canApprove || !resolutionReason.trim()) return;

    if (requestResolution === "partial") {
      const offered = Number(availableUnits);
      if (offered < 1 || offered >= Number(selectedRequest.units)) {
        toast.push({
          kind: "warn",
          text: "Enter a smaller available quantity",
          sub: `The offer must be between 1 and ${Math.max(1, Number(selectedRequest.units) - 1)} units.`,
        });
        return;
      }

      const offeredAt = nowStamp();
      const txId = recordRequestEvent(
        "Partial availability offered",
        selectedRequest,
        "Recorded",
        `${offered} of ${selectedRequest.units} unit(s) offered to the requestor.`,
        [selectedRequest.from, selectedRequest.to]
      );
      onUpdateTransfers(replaceRecord(selectedRequest.id, {
        status: "Partial Offer",
        originalUnits: selectedRequest.originalUnits || selectedRequest.units,
        offeredUnits: offered,
        offerReason: resolutionReason.trim(),
        offeredAt,
        offerTxId: txId,
      }));
      notifyFacility(
        selectedRequest.to,
        `Partial availability - ${selectedRequest.id}`,
        `${hospitalById(selectedRequest.from)?.short || "The supplying blood bank"} can provide ${offered} of ${selectedRequest.units} requested ${selectedRequest.type} unit(s). Please accept or decline the offer.`,
        selectedRequest.id,
        "warn"
      );
      toast.push({ kind: "ok", text: "Requestor notified", sub: `${offered} unit(s) offered for confirmation.` });
    } else {
      const cancelledAt = nowStamp();
      const txId = recordRequestEvent(
        "Blood request cancelled",
        selectedRequest,
        "Recorded",
        resolutionReason.trim(),
        [selectedRequest.from, selectedRequest.to]
      );
      onUpdateTransfers(replaceRecord(selectedRequest.id, {
        status: "Cancelled",
        cancellationReason: resolutionReason.trim(),
        cancelledAt,
        cancellationTxId: txId,
      }));
      notifyFacility(
        selectedRequest.to,
        `Request cancelled - ${selectedRequest.id}`,
        resolutionReason.trim(),
        selectedRequest.id,
        "critical"
      );
      toast.push({ kind: "warn", text: "Request cancelled", sub: "The requestor has been notified with the recorded reason." });
    }

    setRequestResolution(null);
    setResolutionReason("");
  };

  const respondToPartialOffer = (accept) => {
    if (!selectedRequest || selectedRequest.status !== "Partial Offer") return;

    const respondedAt = nowStamp();
    const nextStatus = accept ? "Requested" : "Cancelled";
    const details = accept
      ? `${selectedRequest.offeredUnits} unit partial offer accepted.`
      : "Partial offer declined by requestor.";
    const txId = recordRequestEvent(
      accept ? "Partial offer accepted" : "Partial offer declined",
      selectedRequest,
      "Recorded",
      details,
      [selectedRequest.from, selectedRequest.to]
    );

    onUpdateTransfers(replaceRecord(selectedRequest.id, {
      status: nextStatus,
      units: accept ? selectedRequest.offeredUnits : selectedRequest.units,
      partialAccepted: accept,
      partialResponseAt: respondedAt,
      partialResponseTxId: txId,
      cancellationReason: accept ? selectedRequest.cancellationReason : "Partial availability offer declined by requestor.",
    }));
    notifyFacility(
      selectedRequest.from,
      `${accept ? "Partial offer accepted" : "Partial offer declined"} - ${selectedRequest.id}`,
      `${hospital?.short || "The requestor"} ${accept ? `accepted ${selectedRequest.offeredUnits} unit(s)` : "declined the available quantity"}.`,
      selectedRequest.id,
      accept ? "info" : "warn"
    );
    toast.push({
      kind: accept ? "ok" : "warn",
      text: accept ? "Partial offer accepted" : "Partial offer declined",
      sub: accept ? "The request has returned to the supplying blood bank for approval." : "The request has been closed.",
    });
  };

  const openApprovedCancellation = (request, transfer) => {
    setApprovedCancellation({ request, transfer });
    setResolutionReason("Approved request cancelled before blood-unit release.");
  };

  const cancelApprovedTransaction = () => {
    if (!approvedCancellation || !resolutionReason.trim() || !permissions.canApprove) return;
    const request = approvedCancellation.request;
    const transfer = approvedCancellation.transfer;
    const cancelledAt = nowStamp();
    const cancellationTxId = recordRequestEvent(
      "Approved transfer cancelled",
      request,
      "Recorded",
      resolutionReason.trim(),
      [request.from || transfer?.from, request.to || transfer?.to]
    );

    const updated = transferList.map((item) => {
      if (item.id === request.id) {
        return {
          ...item,
          status: "Cancelled After Approval",
          cancellationReason: resolutionReason.trim(),
          cancelledAt,
          cancellationTxId,
        };
      }
      if (transfer && item.id === transfer.id) {
        return {
          ...item,
          status: "Cancelled",
          completed: cancelledAt,
          cancellationReason: resolutionReason.trim(),
          cancelledAt,
          cancellationTxId,
        };
      }
      return item;
    });

    onUpdateTransfers(updated);
    notifyFacility(
      request.to || transfer?.to,
      `Approved request cancelled - ${request.id}`,
      `${resolutionReason.trim()} The approved transfer will not proceed to outbound release.`,
      request.id,
      "critical"
    );
    toast.push({
      kind: "warn",
      text: "Approved transaction cancelled",
      sub: `${request.id}${transfer ? ` · ${transfer.id}` : ""} closed before outbound scan.`,
    });
    setApprovedCancellation(null);
    setResolutionReason("");
  };

  const openRequestForm = () => {
    if (!canCreateRequest) {
      setShowRequestForm(false);
      toast.push({
        kind: "warn",
        text: "Request creation unavailable",
        sub: "This role does not have permission to submit blood requests.",
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
                  : "This role cannot create blood requests"
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

        {canViewPrcSupply && (
          <button
            className={`filter-chip ${activeTab === "prc" ? "active" : ""}`}
            onClick={() => setActiveTab("prc")}
          >
            PRC Supply
            <span className="count">{(prcSupplyRequests || []).length}</span>
          </button>
        )}
      </div>

      <div className="workflow-profile" aria-label="Current facility workflow">
        <div className="workflow-profile-copy">
          <span className="workflow-profile-eyebrow">Current facility workflow</span>
          <strong>{workflowProfile.label}</strong>
          <p>{workflowProfile.description}</p>
        </div>
        <div className="workflow-profile-stages">
          {workflowProfile.stages.map((stage, index) => (
            <React.Fragment key={stage.label}>
              <div className="workflow-stage">
                <span>{index + 1}</span>
                <div>
                  <b>{stage.label}</b>
                  <small>{stage.hint}</small>
                </div>
              </div>
              {index < workflowProfile.stages.length - 1 && (
                <I name="chevron-right" size={14} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="workflow-profile-owner">
          <span>Workflow owner</span>
          <strong>{workflowProfile.owner}</strong>
        </div>
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

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Blood Component</label>
                  <select value={component} onChange={(event) => setComponent(event.target.value)} style={inputStyle}>
                    {(window.COMPONENTS || []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <span style={helperStyle}>Select the required blood product.</span>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Supplying Blood Bank</label>
                  <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} style={inputStyle}>
                    {consortiumBanks
                      .filter((bank) => bank?.id !== hospital?.id)
                      .map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                  </select>
                  <span style={helperStyle}>The selected Blood Bank Head will review this request.</span>
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

              <section className="request-form-section">
                <div className="request-form-section-head">
                  <div>
                    <h4>Requester & clinical details</h4>
                    <p>Identifies who placed the request and its clinical authorization.</p>
                  </div>
                  <span className="required-note">Required</span>
                </div>

                <div className="request-form-grid">
                  <label className="request-field">
                    <span>Requesting Person</span>
                    <input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} placeholder="Full name" />
                  </label>
                  <label className="request-field">
                    <span>Employee / Staff ID</span>
                    <input value={requesterEmployeeId} onChange={(event) => setRequesterEmployeeId(event.target.value)} placeholder="e.g. LMC-TECH-018" />
                  </label>
                  <label className="request-field">
                    <span>Attending Physician</span>
                    <input value={physicianName} onChange={(event) => setPhysicianName(event.target.value)} placeholder="Physician's full name" />
                  </label>
                  <label className="request-field">
                    <span>Patient / Case Reference</span>
                    <input value={caseReference} onChange={(event) => setCaseReference(event.target.value)} placeholder="Use a case reference, not a patient name" />
                  </label>
                  <label className="request-field">
                    <span>Required Date & Time</span>
                    <input type="datetime-local" value={requiredDate} onChange={(event) => setRequiredDate(event.target.value)} />
                  </label>
                </div>
              </section>

              <section className="request-form-section">
                <div className="request-form-section-head">
                  <div>
                    <h4>Authorized pickup</h4>
                    <p>Records the representative authorized to collect the blood units.</p>
                  </div>
                  <span className="required-note">Required</span>
                </div>

                <div className="request-form-grid request-form-grid-two">
                  <label className="request-field">
                    <span>Pickup Representative</span>
                    <input value={pickupName} onChange={(event) => setPickupName(event.target.value)} placeholder="Representative's full name" />
                  </label>
                  <label className="request-field">
                    <span>ID / Authorization Reference</span>
                    <input value={pickupIdReference} onChange={(event) => setPickupIdReference(event.target.value)} placeholder="ID number or authorization code" />
                  </label>
                </div>
              </section>

              <section className="request-form-section">
                <div className="request-form-section-head">
                  <div>
                    <h4>Supporting documents</h4>
                    <p>PDF, JPG, or PNG files. The prototype records file details only.</p>
                  </div>
                  <span className="required-note">2 required</span>
                </div>

                <div className="request-document-grid">
                  <label className={`request-upload ${requestFormFile ? "has-file" : ""}`}>
                    <I name="file" size={18} />
                    <span className="request-upload-copy">
                      <strong>Standard Blood Request Form</strong>
                      <small>{requestFormFile?.name || "Select signed request form"}</small>
                    </span>
                    <span className="request-upload-action">{requestFormFile ? "Replace" : "Attach"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => setRequestFormFile(documentMeta(event.target.files?.[0], "Blood Request Form"))}
                    />
                  </label>

                  <label className={`request-upload ${pickupDocumentFile ? "has-file" : ""}`}>
                    <I name="file" size={18} />
                    <span className="request-upload-copy">
                      <strong>Pickup Authorization / Valid ID</strong>
                      <small>{pickupDocumentFile?.name || "Select authorization or ID copy"}</small>
                    </span>
                    <span className="request-upload-action">{pickupDocumentFile ? "Replace" : "Attach"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => setPickupDocumentFile(documentMeta(event.target.files?.[0], "Pickup Authorization"))}
                    />
                  </label>
                </div>
              </section>

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
                    setRequestFormFile(null);
                    setPickupDocumentFile(null);
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
                          kind={requestStatusKind(item.status)}
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
                      kind={requestStatusKind(selectedRequest.status)}
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
                      {selectedRequest.type} · {selectedRequest.component || "PRBC"} · {selectedRequest.units} unit(s)
                    </dd>

                    <dt>Supplying Blood Bank</dt>
                    <dd>{hospitalById(selectedRequest.from)?.name || selectedRequest.from || "Not assigned"}</dd>

                    <dt>Priority</dt>
                    <dd>{selectedRequest.urgency || "Routine"}</dd>

                    <dt>Requested At</dt>
                    <dd className="mono small">
                      {selectedRequest.initiated || "—"}
                    </dd>

                    <dt>Required By</dt>
                    <dd className="mono small">
                      {selectedRequest.requiredDate
                        ? selectedRequest.requiredDate.replace("T", " ")
                        : "Not specified"}
                    </dd>

                    <dt>Requested By</dt>
                    <dd>
                      {selectedRequest.requesterName || "Not recorded"}
                      {selectedRequest.requesterEmployeeId && (
                        <span className="muted small"> · {selectedRequest.requesterEmployeeId}</span>
                      )}
                    </dd>

                    <dt>Attending Physician</dt>
                    <dd>{selectedRequest.physicianName || "Not recorded"}</dd>

                    <dt>Case Reference</dt>
                    <dd className="mono small">{selectedRequest.caseReference || "Not recorded"}</dd>

                    <dt>Authorized Pickup</dt>
                    <dd>
                      {selectedRequest.pickupName || "Not recorded"}
                      {selectedRequest.pickupIdReference && (
                        <span className="muted small"> · {selectedRequest.pickupIdReference}</span>
                      )}
                    </dd>

                    {selectedRequest.offeredUnits && (
                      <>
                        <dt>Available Quantity</dt>
                        <dd>
                          <strong>{selectedRequest.offeredUnits} unit(s)</strong>
                          <span className="muted small"> of {selectedRequest.originalUnits || selectedRequest.units} requested</span>
                        </dd>

                        <dt>Availability Note</dt>
                        <dd>{selectedRequest.offerReason}</dd>
                      </>
                    )}

                    {selectedRequest.cancellationReason && (
                      <>
                        <dt>Cancellation Reason</dt>
                        <dd>{selectedRequest.cancellationReason}</dd>
                      </>
                    )}

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

                  {selectedRequest.attachments?.length > 0 && (
                    <div className="request-review-documents">
                      <div className="request-review-label">Supporting Documents</div>
                      {selectedRequest.attachments.map((attachment) => (
                        <div className="request-review-document" key={`${attachment.category}-${attachment.name}`}>
                          <I name="file" size={15} />
                          <span>
                            <strong>{attachment.category}</strong>
                            <small>{attachment.name}</small>
                          </span>
                          <Chip kind="ok">Attached</Chip>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRequest.status === "Requested" &&
                    hospital?.id === selectedRequest.from &&
                    permissions.canApprove && (
                      <>
                        <div className="divider" />
                        <div className="row">
                          <Btn
                            kind="ghost"
                            onClick={() => openRequestResolution("cancel")}
                          >
                            Cancel Request
                          </Btn>

                          <span style={{ flex: 1 }} />

                          {Number(selectedRequest.units) > 1 && (
                            <Btn
                              kind="default"
                              onClick={() => openRequestResolution("partial")}
                            >
                              Offer Available Units
                            </Btn>
                          )}

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

                  {selectedRequest.status === "Approved" &&
                    linkedTransfer?.status === "Approved" &&
                    hospital?.id === selectedRequest.from &&
                    permissions.canApprove && (
                      <>
                        <div className="divider" />
                        <div className="approved-cancel-actions">
                          <div>
                            <strong>Approved, not yet released</strong>
                            <span>The request may still be cancelled before the outbound scan.</span>
                          </div>
                          <Btn
                            kind="ghost"
                            onClick={() => openApprovedCancellation(selectedRequest, linkedTransfer)}
                          >
                            Cancel Approved Request
                          </Btn>
                        </div>
                      </>
                    )}

                  {selectedRequest.status === "Partial Offer" &&
                    permissions.canCreateRequest &&
                    hospital?.id === selectedRequest.to && (
                      <div className="partial-offer-response">
                        <div>
                          <strong>{hospitalById(selectedRequest.from)?.short || "The supplying blood bank"} has offered a smaller quantity.</strong>
                          <span>Accept {selectedRequest.offeredUnits} unit(s) to continue, or decline and close this request.</span>
                        </div>
                        <div className="row">
                          <Btn kind="ghost" onClick={() => respondToPartialOffer(false)}>Decline Offer</Btn>
                          <Btn kind="primary" icon="check" onClick={() => respondToPartialOffer(true)}>Accept Available Units</Btn>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "prc" && canViewPrcSupply && (
        <div className="prc-supply-view">
          <div className="prc-connection-banner">
            <div className="prc-mark">PRC</div>
            <div>
              <strong>Philippine Red Cross - Lipa City Chapter</strong>
              <span>Upstream blood supply coordination channel</span>
            </div>
            <Chip kind="ok" dot>Connected</Chip>
            {canCreatePrcRequest && (
              <Btn kind="primary" icon="plus" onClick={() => setShowPrcForm(!showPrcForm)}>
                Request PRC Supply
              </Btn>
            )}
          </div>

          {showPrcForm && canCreatePrcRequest && (
            <div className="card prc-request-form">
              <div className="card-h">
                <div>
                  <h3>New PRC Supply Request</h3>
                  <div className="sub muted">Request replenishment directly from PRC Lipa. This is separate from consortium transfers.</div>
                </div>
              </div>
              <div className="card-b">
                <div className="prc-form-grid">
                  <label className="request-field">
                    <span>Blood Type</span>
                    <select value={prcBloodType} onChange={(event) => setPrcBloodType(event.target.value)}>
                      {window.BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </label>
                  <label className="request-field">
                    <span>Component</span>
                    <select value={prcComponent} onChange={(event) => setPrcComponent(event.target.value)}>
                      {window.COMPONENTS.map((component) => <option key={component}>{component}</option>)}
                    </select>
                  </label>
                  <label className="request-field">
                    <span>Units Needed</span>
                    <input type="number" min="1" value={prcUnits} onChange={(event) => setPrcUnits(event.target.value)} />
                  </label>
                  <label className="request-field">
                    <span>Priority</span>
                    <select value={prcUrgency} onChange={(event) => setPrcUrgency(event.target.value)}>
                      <option>Routine</option>
                      <option>Urgent</option>
                      <option>Emergency</option>
                    </select>
                  </label>
                  <label className="request-field">
                    <span>Required Date & Time</span>
                    <input type="datetime-local" value={prcNeededBy} onChange={(event) => setPrcNeededBy(event.target.value)} />
                  </label>
                </div>
                <label className="request-field prc-note-field">
                  <span>Coordination Note <span className="muted">Optional</span></span>
                  <textarea value={prcNote} onChange={(event) => setPrcNote(event.target.value)} placeholder="Add handling, pickup, or urgency details..." />
                </label>
                <div className="prc-form-footer">
                  <Btn kind="ghost" onClick={() => setShowPrcForm(false)}>Cancel</Btn>
                  <Btn kind="primary" icon="check" onClick={submitPrcRequest}>Send to PRC Lipa</Btn>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-h">
              <div>
                <h3>{hospital?.id === "PRC-LIP" ? "Incoming Supply Requests" : "PRC Supply Requests"}</h3>
                <div className="sub muted">Status and references returned through the PRC coordination channel.</div>
              </div>
            </div>
            <div className="card-b flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Product</th>
                    <th>Units</th>
                    <th>Required By</th>
                    <th>PRC Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(prcSupplyRequests || []).map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="mono small">{item.id}</div>
                        <div className="muted tiny">{item.requestedBy}</div>
                      </td>
                      <td><BloodType type={item.type} /> <span className="small">{item.component}</span></td>
                      <td className="tnum">{item.units}</td>
                      <td className="mono small">{item.neededBy?.replace("T", " ") || "-"}</td>
                      <td className="mono small">{item.prcReference || "Pending"}</td>
                      <td><Chip kind={item.status === "Ready for Pickup" ? "ok" : item.status === "Acknowledged" ? "info" : "warn"} dot>{item.status}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="info-strip">
            <I name="info" size={16} />
            <div>
              <b>Prototype integration</b>
              <div className="muted small">Final PRC data exchange, approval, pickup, and import rules remain subject to validation with the Philippine Red Cross.</div>
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
                        (selectedTransfer.status === "Received"
                          ? selectedTransfer.completed
                          : null) ||
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

                    {selectedTransfer.cancellationReason && (
                      <>
                        <dt>Cancellation Reason</dt>
                        <dd>{selectedTransfer.cancellationReason}</dd>

                        <dt>Cancelled At</dt>
                        <dd className="mono small">{selectedTransfer.cancelledAt || "—"}</dd>

                        <dt>Cancellation Ledger ID</dt>
                        <dd className="mono small" title={selectedTransfer.cancellationTxId}>
                          {shortHash(selectedTransfer.cancellationTxId)}
                        </dd>
                      </>
                    )}
                  </dl>

                  {selectedTransfer.status === "Approved" &&
                    hospital?.id === selectedTransfer.from &&
                    permissions.canScan && (
                      <>
                        <div className="divider" />
                        <div className="row approved-transfer-actions">
                          {linkedRequest && (
                            <Btn
                              kind="ghost"
                              onClick={() => openApprovedCancellation(linkedRequest, selectedTransfer)}
                            >
                              Cancel Approved Transfer
                            </Btn>
                          )}
                          <Btn
                            kind="primary"
                            icon="scanner"
                            onClick={() => setMovementAction("Outbound")}
                          >
                            Record Outbound Scan
                          </Btn>
                        </div>
                      </>
                    )}

                  {selectedTransfer.status === "In Transit" &&
                    permissions.canScan &&
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

      {requestResolution && selectedRequest && (
        <Modal
          title={requestResolution === "partial" ? "Offer Available Units" : "Cancel Blood Request"}
          sub={
            requestResolution === "partial"
              ? "Notify the requestor that only part of the requested quantity is currently available."
              : "Close the request and send the recorded reason to the requesting facility."
          }
          onClose={() => setRequestResolution(null)}
          footer={
            <>
              <Btn kind="ghost" onClick={() => setRequestResolution(null)}>Keep Request</Btn>
              <Btn
                kind={requestResolution === "partial" ? "primary" : "default"}
                icon="bell"
                onClick={confirmRequestResolution}
              >
                Notify Requestor
              </Btn>
            </>
          }
        >
          <div className="request-resolution-summary">
            <div><span>Request</span><strong className="mono">{selectedRequest.id}</strong></div>
            <div><span>Requested</span><strong>{selectedRequest.units} {selectedRequest.type} unit(s)</strong></div>
            <div><span>Facility</span><strong>{hospitalById(selectedRequest.to)?.short || selectedRequest.to}</strong></div>
          </div>

          {requestResolution === "partial" && (
            <label className="request-field request-resolution-units">
              <span>Available Units</span>
              <input
                type="number"
                min="1"
                max={Math.max(1, Number(selectedRequest.units) - 1)}
                value={availableUnits}
                onChange={(event) => setAvailableUnits(event.target.value)}
              />
              <small className="muted">Must be less than the {selectedRequest.units} units originally requested.</small>
            </label>
          )}

          <label className="request-field request-resolution-reason">
            <span>Reason sent to requestor</span>
            <select value={resolutionReason} onChange={(event) => setResolutionReason(event.target.value)}>
              <option>Requested quantity is not fully available.</option>
              <option>Requested blood product is currently unavailable.</option>
              <option>Available units do not meet the required release criteria.</option>
              <option>Request details require correction before processing.</option>
            </select>
            <textarea
              value={resolutionReason}
              onChange={(event) => setResolutionReason(event.target.value)}
              placeholder="Provide the reason shown in the requestor's alert..."
            />
          </label>
        </Modal>
      )}

      {approvedCancellation && (
        <Modal
          title="Cancel Approved Transfer"
          sub="This closes the approved request and its linked transfer before blood-unit release."
          onClose={() => setApprovedCancellation(null)}
          footer={
            <>
              <Btn kind="ghost" onClick={() => setApprovedCancellation(null)}>Keep Approved</Btn>
              <Btn kind="default" icon="bell" onClick={cancelApprovedTransaction}>
                Notify & Cancel
              </Btn>
            </>
          }
        >
          <div className="request-resolution-summary">
            <div><span>Request</span><strong className="mono">{approvedCancellation.request.id}</strong></div>
            <div><span>Transfer</span><strong className="mono">{approvedCancellation.transfer?.id || "—"}</strong></div>
            <div><span>Blood Product</span><strong>{approvedCancellation.request.type} · {approvedCancellation.request.units} unit(s)</strong></div>
            <div><span>Requestor</span><strong>{hospitalById(approvedCancellation.request.to)?.short || approvedCancellation.request.to}</strong></div>
          </div>

          <div className="approved-cancellation-warning">
            Cancellation is allowed only while the transfer is approved and no outbound scan has been recorded. The requestor will be notified and a ledger record will be created.
          </div>

          <label className="request-field request-resolution-reason">
            <span>Cancellation reason</span>
            <select value={resolutionReason} onChange={(event) => setResolutionReason(event.target.value)}>
              <option>Approved request cancelled before blood-unit release.</option>
              <option>Requestor no longer requires the approved blood product.</option>
              <option>Allocated units no longer meet release criteria.</option>
              <option>Request details changed after approval.</option>
            </select>
            <textarea
              value={resolutionReason}
              onChange={(event) => setResolutionReason(event.target.value)}
              placeholder="State the reason recorded in the audit trail and sent to the requestor..."
            />
          </label>
        </Modal>
      )}

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
              ? `This confirms that the approved blood units have left ${hospitalById(selectedTransfer.from)?.short || "the supplying blood bank"}.`
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

  if (normalized.includes("cancel")) {
    return (
      <div className="transfer-cancelled-progress">
        <I name="x" size={16} />
        <span>Cancelled before outbound release</span>
      </div>
    );
  }

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
