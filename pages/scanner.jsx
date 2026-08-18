// pages/scanner.jsx
// BloodLedger inbound / outbound blood unit transaction workflow.

function compactSerial(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function serialEditDistance(left, right) {
  const source = compactSerial(left);
  const target = compactSerial(right);
  const row = Array.from({ length: target.length + 1 }, (_, index) => index);

  for (let sourceIndex = 1; sourceIndex <= source.length; sourceIndex += 1) {
    let diagonal = row[0];
    row[0] = sourceIndex;
    for (let targetIndex = 1; targetIndex <= target.length; targetIndex += 1) {
      const previous = row[targetIndex];
      row[targetIndex] = Math.min(
        row[targetIndex] + 1,
        row[targetIndex - 1] + 1,
        diagonal + (source[sourceIndex - 1] === target[targetIndex - 1] ? 0 : 1)
      );
      diagonal = previous;
    }
  }

  return row[target.length];
}

function formatBloodUnitSerial(value) {
  const cleaned = String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9=)\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compact = compactSerial(cleaned);
  const possibleDin = compact.match(/([A-Z])([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{6})/);

  if (!possibleDin) return cleaned;

  const fixDigits = (part) =>
    part
      .replace(/[OQ]/g, "0")
      .replace(/[IL]/g, "1")
      .replace(/Z/g, "2")
      .replace(/S/g, "5")
      .replace(/B/g, "8");

  return `=)${possibleDin[1]}${fixDigits(possibleDin[2])} ${fixDigits(
    possibleDin[3]
  )} ${fixDigits(possibleDin[4])}`;
}

function scannerCatalog(inventory) {
  const catalog = [
    ...(inventory || []),
    ...(window.OCR_UNIT_CATALOG || []),
  ];
  return catalog.filter(
    (unit, index) =>
      catalog.findIndex(
        (candidate) => compactSerial(candidate.isbt) === compactSerial(unit.isbt)
      ) === index
  );
}

function ScannerPage({
  hospital,
  permissions,
  session,
  onNav,
  auditRows,
  onUpdateAudit,
}) {
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
  const [cameraStatus, setCameraStatus] = React.useState("idle");
  const [cameraError, setCameraError] = React.useState("");
  const [capturedImage, setCapturedImage] = React.useState("");
  const [ocrStatus, setOcrStatus] = React.useState("idle");
  const [ocrProgress, setOcrProgress] = React.useState(0);
  const [ocrRaw, setOcrRaw] = React.useState("");
  const [ocrConfidence, setOcrConfidence] = React.useState(null);
  const [recognizedId, setRecognizedId] = React.useState("");
  const [showMobileScanner, setShowMobileScanner] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const workerRef = React.useRef(null);
  const launcherRef = React.useRef(null);
  const closeScannerRef = React.useRef(null);
  const toast = React.useContext(ToastCtx);
  const scanInventory = permissions?.bloodBank
    ? facilityInventory(hospital)
    : window.INVENTORY || [];
  const availableDirections = inboundOnly ? ["Inbound"] : ["Inbound", "Outbound"];
  const visibleHistory = inboundOnly
    ? history.filter((item) => (item.direction || "Inbound") === "Inbound")
    : history;
  const unitCatalog = scannerCatalog(scanInventory);

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStatus((current) => (current === "live" ? "idle" : current));
  }, []);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopCamera();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [stopCamera]);

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
    stopCamera();
    setPreview(null);
    setConfirming(false);
    setForm(emptyForm);
    setCapturedImage("");
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrRaw("");
    setOcrConfidence(null);
    setRecognizedId("");
    setCameraError("");
  };

  const changeDirection = (nextDirection) => {
    if (inboundOnly && nextDirection !== "Inbound") return;
    setDirection(nextDirection);
    resetEntry();
  };

  const changeMode = (nextMode) => {
    if (nextMode !== "Scan") stopCamera();
    setMode(nextMode);
    setPreview(null);
  };

  const openMobileScanner = () => {
    setShowMobileScanner(true);
  };

  const closeMobileScanner = () => {
    resetEntry();
    setShowMobileScanner(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  };

  React.useEffect(() => {
    if (!showMobileScanner) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeScannerRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMobileScanner();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMobileScanner]);

  const resolveCatalogUnit = (serial) =>
    unitCatalog.find(
      (unit) => compactSerial(unit.isbt) === compactSerial(serial)
    );

  const buildScanPreview = (serial) => {
    const registeredUnit = resolveCatalogUnit(serial);
    const sourceFacility = registeredUnit?.source
      ? hospitalById(registeredUnit.source)
      : null;
    const facility =
      sourceFacility ||
      otherFacilities[direction === "Inbound" ? 0 : 1] ||
      otherFacilities[0] ||
      null;

    return {
      direction,
      method: "OCR Scan",
      isbt: registeredUnit?.isbt || serial,
      type: registeredUnit?.type || "O+",
      comp: registeredUnit?.comp || "PRBC",
      collected: registeredUnit?.collected || "",
      expires: registeredUnit?.expires || "",
      facilityId: facility?.id || "",
      facilityName: facility?.name || "External facility",
      purpose:
        direction === "Inbound"
          ? "Inventory receipt"
          : "Approved blood transfer",
      status: direction === "Inbound" ? "Ready to receive" : "Ready to release",
      scanConfidence: ocrConfidence,
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

  const startCamera = async () => {
    setCameraError("");
    setCapturedImage("");
    setOcrStatus("idle");
    setRecognizedId("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unavailable");
      setCameraError(
        "Camera access requires HTTPS on a phone. You can still upload a label photo."
      );
      return;
    }

    try {
      setCameraStatus("starting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("live");
    } catch (error) {
      setCameraStatus("unavailable");
      setCameraError(
        error?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access or upload a label photo."
          : "The camera could not be opened. Upload a label photo instead."
      );
    }
  };

  const prepareCrop = (source, sourceWidth, sourceHeight) => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceWidth || !sourceHeight) return null;

    const cropWidth = sourceWidth * 0.86;
    const cropHeight = Math.min(sourceHeight * 0.3, cropWidth / 3.4);
    const cropX = (sourceWidth - cropWidth) / 2;
    const cropY = (sourceHeight - cropHeight) / 2;
    const outputWidth = 1500;
    const outputHeight = Math.round(outputWidth * (cropHeight / cropWidth));
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, outputWidth, outputHeight);
    context.filter = "grayscale(1) contrast(1.65) brightness(1.08)";
    context.drawImage(
      source,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );
    context.filter = "none";
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.94));
    return canvas;
  };

  const recognizeCanvas = async (canvas) => {
    if (!canvas) return;
    if (!window.Tesseract) {
      setOcrStatus("error");
      setCameraError(
        "The local OCR engine could not start. Reload the scanner and try again."
      );
      return;
    }

    setOcrStatus("loading");
    setOcrProgress(0);
    setOcrRaw("");
    setOcrConfidence(null);
    setRecognizedId("");

    try {
      if (!workerRef.current) {
        workerRef.current = await Tesseract.createWorker(
          "eng",
          Tesseract.OEM.LSTM_ONLY,
          {
            workerPath: "/vendor/ocr/worker.min.js",
            corePath: "/vendor/ocr/tesseract-core-lstm.wasm.js",
            langPath: "/vendor/ocr",
            logger: (message) => {
              if (message.status === "recognizing text") {
                setOcrStatus("recognizing");
                setOcrProgress(Math.round((message.progress || 0) * 100));
              }
            },
          }
        );
        await workerRef.current.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789=)- ",
          preserve_interword_spaces: "1",
        });
      }

      const result = await workerRef.current.recognize(canvas);
      const rawText = result?.data?.text?.trim() || "";
      const formatted = formatBloodUnitSerial(rawText);
      const catalogMatch = scannerCatalog(scanInventory)
        .map((unit) => ({
          unit,
          distance: serialEditDistance(rawText, unit.isbt),
        }))
        .sort((left, right) => left.distance - right.distance)[0];
      const matchedSerial =
        catalogMatch && catalogMatch.distance <= 3
          ? catalogMatch.unit.isbt
          : formatted;
      setOcrRaw(rawText);
      setOcrConfidence(Math.round(result?.data?.confidence || 0));
      setRecognizedId(matchedSerial);
      setOcrStatus(matchedSerial ? "complete" : "error");
      if (!matchedSerial) {
        setCameraError(
          "No serial number was detected. Move closer, avoid glare, and retake the image."
        );
      }
    } catch (error) {
      setOcrStatus("error");
      setCameraError(
        "OCR could not process this image. Retake it in better lighting or enter the serial manually."
      );
    }
  };

  const captureCamera = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = prepareCrop(video, video.videoWidth, video.videoHeight);
    stopCamera();
    await recognizeCanvas(canvas);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    stopCamera();
    setCameraError("");

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = async () => {
      const canvas = prepareCrop(image, image.naturalWidth, image.naturalHeight);
      URL.revokeObjectURL(objectUrl);
      await recognizeCanvas(canvas);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setOcrStatus("error");
      setCameraError("The selected image could not be opened.");
    };
    image.src = objectUrl;
    event.target.value = "";
  };

  const runDemoOcr = async () => {
    stopCamera();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 1500;
    canvas.height = 420;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "lightgray";
    context.lineWidth = 5;
    context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
    context.fillStyle = "black";
    context.font = "600 105px monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("=)W0381 2512 100118", canvas.width / 2, 225);
    context.font = "32px sans-serif";
    context.fillStyle = "gray";
    context.fillText("ISBT-128 DONATION IDENTIFICATION NUMBER", canvas.width / 2, 330);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.94));
    await recognizeCanvas(canvas);
  };

  const previewScan = () => {
    const serial = formatBloodUnitSerial(recognizedId);
    const registeredUnit = resolveCatalogUnit(serial);
    const locallyRegistered = scanInventory.some(
      (unit) => compactSerial(unit.isbt) === compactSerial(serial)
    );

    if (!serial || compactSerial(serial).length < 12) {
      toast.push({
        kind: "warn",
        text: "Check the recognized serial number",
        sub: "The serial number is incomplete. Correct it or capture the label again.",
      });
      return;
    }

    if (!registeredUnit) {
      toast.push({
        kind: "warn",
        text: "Serial recognized; product details are required",
        sub: "Continue with manual entry to complete blood type, component, and expiration details.",
      });
      setForm((current) => ({ ...current, isbt: serial }));
      setMode("Manual");
      return;
    }

    if (direction === "Outbound" && !locallyRegistered) {
      toast.push({
        kind: "warn",
        text: "Blood unit is not in local inventory",
        sub: "Only units currently registered at this facility can be released.",
      });
      return;
    }

    setRecognizedId(registeredUnit.isbt);
    setPreview(buildScanPreview(registeredUnit.isbt));
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
      !scanInventory.some((unit) => unit.isbt === form.isbt.trim())
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
    const bytes = new Uint8Array(32);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  };

  const createRecordId = (prefix) =>
    `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

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

    const now = new Date();
    const transactionId = createRecordId("TX");
    const scanId = createRecordId(direction === "Inbound" ? "SCN-IN" : "SCN-OUT");
    const blockchainId = isOnline ? createBlockchainId() : null;
    const transaction = {
      ...preview,
      txId: transactionId,
      scanId,
      blockchainId,
      status: isOnline
        ? direction === "Inbound"
          ? "Received"
          : "Released"
        : "Buffered",
      ts: now.toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      recordedAt: now.toISOString(),
    };

    const nextHistory = [transaction, ...history];

    const currentInventory = scanInventory;

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

      const nextInventory = [
        receivedUnit,
        ...currentInventory.filter((unit) => unit.isbt !== receivedUnit.isbt),
      ];
      if (hospital?.id === "MMC-LIP") window.INVENTORY = nextInventory;
      else window.INVENTORY_BY_FACILITY = { ...(window.INVENTORY_BY_FACILITY || {}), [hospital?.id]: nextInventory };
    } else {
      const nextInventory = currentInventory.filter(
        (unit) => unit.isbt !== preview.isbt
      );
      if (hospital?.id === "MMC-LIP") window.INVENTORY = nextInventory;
      else window.INVENTORY_BY_FACILITY = { ...(window.INVENTORY_BY_FACILITY || {}), [hospital?.id]: nextInventory };
    }

    setHistory(nextHistory);
    window.SCAN_HISTORY = nextHistory;

    const nextAuditRows = [
      {
        ts: now.toISOString().slice(0, 19).replace("T", " "),
        actor: session?.user?.username || session?.user?.name || "scanner",
        role: session?.user?.role || "Operator",
        action:
          direction === "Inbound"
            ? "Blood unit received"
            : "Blood unit released",
        scanId,
        requestId: null,
        transferId: transactionId,
        blockchainId,
        target: `ISBT ${preview.isbt}`,
        status: isOnline ? "Recorded" : "Buffered",
        hospitalIds: [hospital?.id].filter(Boolean),
      },
      ...(auditRows || window.AUDIT || []),
    ];
    if (onUpdateAudit) onUpdateAudit(nextAuditRows);
    else window.AUDIT = nextAuditRows;
    setConfirming(false);
    setPreview(null);

    toast.push({
      kind: isOnline ? "ok" : "warn",
      text: isOnline
        ? `${direction} transaction recorded`
        : `${direction} transaction buffered`,
      sub: isOnline
        ? `Scan ${scanId} · Blockchain ${blockchainId.slice(0, 10)}…`
        : `Scan ${scanId} will synchronize when connectivity returns.`,
    });
  };

  return (
    <div className="page transaction-hub-page">
      <PageHead
        eyebrow="BloodLedger"
        title={inboundOnly ? "Blood Unit Receipt" : "Blood Unit Transactions"}
        sub={
          inboundOnly
            ? "Launch the mobile receipt scanner to record blood units received by this requestor facility."
            : "Launch the mobile scanner to record inbound and outbound blood unit transactions."
        }
        actions={
          permissions.canViewInventory ? (
            <Btn size="sm" kind="ghost" onClick={() => onNav("inventory")}>
              View Inventory
            </Btn>
          ) : null
        }
      />

      {!showMobileScanner && (
        <>
          <div className="card scanner-launch-card">
            <div className="scanner-launch-icon"><I name="camera" size={24} /></div>
            <div className="scanner-launch-copy">
              <div className="page-eyebrow">Mobile workflow</div>
              <h2>{inboundOnly ? "Receive blood through the mobile scanner" : "Scan blood units from a phone"}</h2>
              <p className="muted">
                The camera and OCR workflow is simulated inside a phone view. Desktop remains a transaction review hub.
              </p>
              <div className="scanner-capability-row">
                <Chip kind="ok" dot>Inbound</Chip>
                {!inboundOnly && <Chip kind="warn" dot>Outbound</Chip>}
                <span className="muted tiny">{inboundOnly ? "Requestor access" : "Blood-bank access"}</span>
              </div>
            </div>
            <Btn
              buttonRef={launcherRef}
              kind="primary"
              icon="camera"
              onClick={openMobileScanner}
            >
              {inboundOnly ? "Open Mobile Receipt Scanner" : "Open Mobile Scanner"}
            </Btn>
          </div>

          <div className="scanner-desktop-note">
            <I name="info" size={16} />
            <span>Open the mobile simulation to scan, upload, or manually enter a unit. Confirmed entries will appear below.</span>
          </div>
        </>
      )}

      {showMobileScanner && (
        <div className="mobile-scanner-overlay" role="dialog" aria-modal="true" aria-label="Mobile blood unit scanner">
          <div className="mobile-phone-shell">
            <div className="scanner-mobile-header">
              <button ref={closeScannerRef} onClick={closeMobileScanner} aria-label="Close mobile scanner">
                <I name="chevronLeft" size={18} />
              </button>
              <div>
                <span className="brand-mark">B</span>
                <span><strong>Blood<em>ledger</em></strong><small>Mobile OCR Scanner</small></span>
              </div>
              <Chip kind={isOnline ? "ok" : "warn"} dot>
                {isOnline ? "Online" : "Offline"}
              </Chip>
            </div>

            <div className="mobile-phone-body">
              {!isOnline && (
                <div className="scanner-offline-banner">
                  <I name="warn" size={16} />
                  <div>
                    <strong>Offline capture is available</strong>
                    <span>Confirmed scans will be buffered and marked for ledger synchronization.</span>
                  </div>
                </div>
              )}

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
                        className={`filter-chip ${direction === item ? "active" : ""}`}
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
                Scan the printed ISBT-128 serial code or enter the unit details manually.
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
                <div className={`scanner-view camera-${cameraStatus}`}>
                  <video
                    ref={videoRef}
                    className={cameraStatus === "live" ? "scanner-video live" : "scanner-video"}
                    muted
                    playsInline
                    aria-label="Rear camera preview"
                  />

                  {capturedImage && cameraStatus !== "live" && (
                    <img
                      className="scanner-capture-preview"
                      src={capturedImage}
                      alt="Cropped blood-unit serial label"
                    />
                  )}

                  {!capturedImage && cameraStatus !== "live" && (
                    <div className="scanner-empty-state">
                      <I name="camera" size={30} />
                      <strong>Scan printed serial code</strong>
                      <span>Use the rear camera or upload a clear label photo.</span>
                    </div>
                  )}

                  <div className="scanner-focus-frame">
                    <span className="corner tl" />
                    <span className="corner tr" />
                    <span className="corner bl" />
                    <span className="corner br" />
                    {cameraStatus === "live" && <span className="scanline" />}
                    <small>ALIGN SERIAL NUMBER INSIDE FRAME</small>
                  </div>

                  <div className="scanner-meta">
                    <span className={cameraStatus === "live" ? "rec-dot" : "status-dot"} />
                    {cameraStatus === "live"
                      ? "LIVE · REAR CAMERA"
                      : capturedImage
                      ? "CAPTURED SERIAL REGION"
                      : "OCR READY"}
                  </div>
                </div>

                <canvas ref={canvasRef} className="scanner-processing-canvas" />
                <input
                  ref={fileInputRef}
                  className="scanner-file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                />

                <div style={{ height: 14 }} />

                <div className="scanner-capture-actions">
                  {permissions.canScan ? (
                    <>
                      {cameraStatus === "live" ? (
                        <Btn kind="primary" icon="camera" onClick={captureCamera}>
                          Capture Serial
                        </Btn>
                      ) : (
                        <Btn kind="primary" icon="camera" onClick={startCamera}>
                          Open Camera
                        </Btn>
                      )}

                      <Btn
                        kind="ghost"
                        icon="upload"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Photo
                      </Btn>

                      <Btn kind="ghost" icon="scanner" onClick={runDemoOcr}>
                        Try Demo Label
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

                {(ocrStatus === "loading" || ocrStatus === "recognizing") && (
                  <div className="ocr-progress-panel" aria-live="polite">
                    <div>
                      <span>{ocrStatus === "loading" ? "Loading OCR engine" : "Recognizing serial number"}</span>
                      <strong className="mono">{ocrProgress}%</strong>
                    </div>
                    <div className="ocr-progress-track">
                      <span style={{ width: `${Math.max(4, ocrProgress)}%` }} />
                    </div>
                    <small>Processing locally on this device. The label image is not uploaded.</small>
                  </div>
                )}

                {cameraError && (
                  <div className="ocr-message error" role="alert">
                    <I name="warn" size={16} />
                    <span>{cameraError}</span>
                  </div>
                )}

                {ocrStatus === "complete" && (
                  <div className="ocr-result-panel">
                    <div className="ocr-result-heading">
                      <div>
                        <span>Recognized serial number</span>
                        <strong>{ocrConfidence}% OCR confidence</strong>
                      </div>
                      <Chip
                        kind={ocrConfidence >= 80 ? "ok" : "warn"}
                        dot
                      >
                        {ocrConfidence >= 80 ? "Review" : "Low confidence"}
                      </Chip>
                    </div>
                    <label>
                      <span>ISBT-128 Unit ID</span>
                      <input
                        className="input mono"
                        value={recognizedId}
                        onChange={(event) => setRecognizedId(event.target.value.toUpperCase())}
                        aria-label="Recognized ISBT-128 Unit ID"
                      />
                    </label>
                    {ocrRaw && ocrRaw !== recognizedId && (
                      <div className="ocr-raw-text">
                        Raw OCR: <code>{ocrRaw}</code>
                      </div>
                    )}
                    <div className="ocr-result-actions">
                      <Btn kind="ghost" onClick={startCamera}>Retake</Btn>
                      <Btn kind="primary" icon="check" onClick={previewScan}>
                        Match & Preview Unit
                      </Btn>
                    </div>
                  </div>
                )}
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

                  {preview.scanConfidence !== null &&
                    preview.scanConfidence !== undefined && (
                      <>
                        <dt>OCR Confidence</dt>
                        <dd>{preview.scanConfidence}%</dd>
                      </>
                    )}

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

      {confirming && preview && (
        <div className="phone-confirmation-scrim" role="presentation">
          <section className="phone-confirmation-sheet" role="dialog" aria-modal="true" aria-label={`Confirm ${direction} transaction`}>
            <div className="phone-confirmation-header">
              <div>
                <h3>Confirm {direction} Transaction</h3>
                <p>Verify these details before recording.</p>
              </div>
              <button className="icon-btn" onClick={() => setConfirming(false)} aria-label="Close confirmation">×</button>
            </div>
            <div className="phone-confirmation-body">
              <dl className="kv">
                <dt>Transaction Type</dt>
                <dd><Chip kind={direction === "Inbound" ? "ok" : "warn"} dot>{direction}</Chip></dd>
                <dt>Input Method</dt>
                <dd>{preview.method}</dd>
                {preview.scanConfidence !== null && preview.scanConfidence !== undefined && (
                  <>
                    <dt>OCR Confidence</dt>
                    <dd>{preview.scanConfidence}%</dd>
                  </>
                )}
                <dt>Unit ID</dt>
                <dd className="mono small">{preview.isbt}</dd>
                <dt>Blood Product</dt>
                <dd>{preview.type} · {preview.comp}</dd>
                <dt>{direction === "Inbound" ? "Source Facility" : "Destination Facility"}</dt>
                <dd>{preview.facilityName}</dd>
                <dt>Expiration Date</dt>
                <dd className="mono small">{preview.expires || "—"}</dd>
                <dt>Purpose</dt>
                <dd>{preview.purpose}</dd>
              </dl>
              <div className="divider" />
              <div className="muted small">
                {isOnline
                  ? "Confirming creates scan, transaction, and mock blockchain identifiers."
                  : "Offline confirmation buffers this scan for future synchronization."}
              </div>
            </div>
            <div className="phone-confirmation-footer">
              <Btn kind="ghost" onClick={() => setConfirming(false)}>Go Back</Btn>
              <Btn kind="primary" icon="check" onClick={confirmTransaction}>Confirm & Record</Btn>
            </div>
          </section>
        </div>
      )}

            </div>
          </div>
        </div>
      )}

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

        <div className="card-b flush scanner-table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Scan ID</th>
                <th>Transaction ID</th>
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
                    <td className="mono tiny">{item.scanId || "—"}</td>
                    <td className="mono tiny">{item.txId || "—"}</td>
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
                    <td
                      className="mono tiny"
                      title={item.blockchainId || "Pending ledger synchronization"}
                    >
                      {item.blockchainId
                        ? `${item.blockchainId.slice(0, 8)}…`
                        : item.status === "Buffered"
                        ? "Pending sync"
                        : "Legacy record"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
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
                Camera OCR runs locally on this device. Inventory and activity
                updates are functional mock records; blockchain writes and final
                hospital validation rules remain simulated.
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
