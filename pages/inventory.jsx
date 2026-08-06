// pages/inventory.jsx
// Simplified BloodLedger base inventory page.
//
// This version keeps only the essential information needed for the mock-up.
// Detailed hospital workflows, FEFO enforcement, cold-chain monitoring,
// surplus logic, and transfer assumptions can be reintroduced after
// stakeholder requirements are confirmed.

function InventoryPage({ hospital, permissions, filter, onNav }) {
  const [activeType, setActiveType] = React.useState(filter?.type || "ALL");
  const [comp, setComp] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [inventoryVersion, setInventoryVersion] = React.useState(0);
  const toast = React.useContext(ToastCtx);

  React.useEffect(() => {
    if (filter?.type) {
      setActiveType(filter.type);
    }
  }, [filter?.type]);

  const inventory = React.useMemo(
    () => window.INVENTORY || [],
    [inventoryVersion]
  );

  const importUnits = (units) => {
    window.INVENTORY = [...(window.INVENTORY || []), ...units];
    setInventoryVersion((version) => version + 1);
    setImportOpen(false);
    toast.push({
      kind: "ok",
      text: `${units.length} blood unit${units.length === 1 ? "" : "s"} imported`,
      sub: "The registered unit IDs can now be validated by the scanner.",
    });
  };

  // Faceted counts respond to the opposite filter group. For example, when
  // Platelets is selected, each blood-type badge shows its platelet count.
  const typeCountInventory = comp === "ALL"
    ? inventory
    : inventory.filter((unit) => unit.comp === comp);

  const componentCountInventory = activeType === "ALL"
    ? inventory
    : inventory.filter((unit) => unit.type === activeType);

  // Count units by blood type within the selected component.
  const counts = {};
  typeCountInventory.forEach((unit) => {
    counts[unit.type] = (counts[unit.type] || 0) + 1;
  });

  // Count units by component within the selected blood type.
  const compCounts = {};
  componentCountInventory.forEach((unit) => {
    compCounts[unit.comp] = (compCounts[unit.comp] || 0) + 1;
  });

  // Simple filtering.
  const filtered = inventory.filter((unit) => {
    const matchesType =
      activeType === "ALL" || unit.type === activeType;

    const matchesComponent =
      comp === "ALL" || unit.comp === comp;

    const query = search.toLowerCase();

    const matchesSearch =
      !search ||
      String(unit.isbt || "")
        .toLowerCase()
        .includes(query) ||
      String(unit.status || "")
        .toLowerCase()
        .includes(query);

    return (
      matchesType &&
      matchesComponent &&
      matchesSearch
    );
  });

  // For now, sort by expiration date when available.
  // This is only for display convenience and does not imply
  // a finalized hospital workflow.
  filtered.sort((a, b) => {
    return (a.days_left || 9999) - (b.days_left || 9999);
  });

  return (
    <div className="page">
      <PageHead
        eyebrow={
          hospital
            ? hospital.short
            : "BloodLedger"
        }
        title="Blood Inventory"
        sub="View and manage the blood units currently recorded in the system."
        actions={
          <>
            {permissions.canScan && (
              <>
                <Btn icon="upload" onClick={() => setImportOpen(true)}>
                  Import CSV
                </Btn>
                <Btn icon="scanner" onClick={() => onNav("scanner")}>
                  Blood Unit Transactions
                </Btn>
              </>
            )}
          </>
        }
      />

      <div className="card">
        {/* Filters */}
        <div className="filters">
          <span
            className="muted tiny"
            style={{
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            Blood Type
          </span>

          <button
            className={`filter-chip ${
              activeType === "ALL"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveType("ALL")
            }
          >
            All{" "}
            <span className="count">
              {typeCountInventory.length}
            </span>
          </button>

          {BLOOD_TYPES.map((type) => (
            <button
              key={type}
              className={`filter-chip ${
                activeType === type
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveType(type)
              }
            >
              {type}{" "}
              <span className="count">
                {counts[type] || 0}
              </span>
            </button>
          ))}

          <span
            style={{ width: 16 }}
          />

          <span
            className="muted tiny"
            style={{
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            Component
          </span>

          {[
            "ALL",
            ...window.COMPONENTS,
          ].map((component) => (
            <button
              key={component}
              className={`filter-chip ${
                comp === component
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setComp(component)
              }
            >
              {component === "ALL"
                ? "All"
                : component}

              <span className="count">
                {component === "ALL"
                  ? componentCountInventory.length
                  : compCounts[component] || 0}
              </span>
            </button>
          ))}

          {/* Search */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div
              className="top-search"
              style={{
                minWidth: 220,
                padding: "5px 10px",
              }}
            >
              <I
                name="search"
                size={13}
              />

              <input
                placeholder="Search unit ID..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="mono"
              />
            </div>
          </div>
        </div>

        {/* Inventory table */}
        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Blood Type</th>
                <th>Component</th>
                <th>Expiration Date</th>
                <th>Time Remaining</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map(
                  (unit) => {
                    const daysLeft =
                      unit.days_left;

                    let expiryKind =
                      "ok";

                    if (
                      daysLeft <= 3
                    ) {
                      expiryKind =
                        "critical";
                    } else if (
                      daysLeft <= 7
                    ) {
                      expiryKind =
                        "warn";
                    }

                    return (
                      <tr
                        key={
                          unit.isbt
                        }
                        className="row-clickable"
                      >
                        <td className="mono small">
                          {
                            unit.isbt
                          }
                        </td>

                        <td>
                          <BloodType
                            type={
                              unit.type
                            }
                          />
                        </td>

                        <td>
                          {unit.comp}
                        </td>

                        <td className="mono small">
                          {
                            unit.expires
                          }
                        </td>

                        <td>
                          {typeof daysLeft ===
                          "number" ? (
                            <Chip
                              kind={
                                expiryKind
                              }
                              dot
                            >
                              {
                                daysLeft
                              }{" "}
                              days
                            </Chip>
                          ) : (
                            <span className="muted">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          <Chip
                            kind={
                              unit.status ===
                              "Reserved"
                                ? "warn"
                                : unit.status ===
                                  "Expired"
                                ? "critical"
                                : "ok"
                            }
                            dot
                          >
                            {
                              unit.status
                            }
                          </Chip>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign:
                        "center",
                      padding: 32,
                    }}
                    className="muted"
                  >
                    No blood units
                    match the selected
                    filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple information note */}
      <div
        style={{ height: 18 }}
      />

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
                Mock inventory data
              </div>

              <div className="muted tiny">
                The information
                displayed on this page
                is sample data for the
                current BloodLedger
                prototype. Inventory
                fields and workflows may
                change after stakeholder
                validation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {importOpen && (
        <InventoryImportModal
          existingInventory={inventory}
          onClose={() => setImportOpen(false)}
          onImport={importUnits}
        />
      )}
    </div>
  );
}

function InventoryImportModal({ existingInventory, onClose, onImport }) {
  const [fileName, setFileName] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [error, setError] = React.useState("");

  const validRows = rows.filter((row) => row.result === "Valid");
  const duplicateRows = rows.filter((row) => row.result === "Duplicate");
  const invalidRows = rows.filter((row) => row.result === "Invalid");

  const parseLine = (line) => {
    const values = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += character;
      }
    }
    values.push(value.trim());
    return values;
  };

  const parseCsv = (text, name) => {
    setError("");
    const lines = String(text).replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setRows([]);
      setError("The CSV must contain a header row and at least one blood unit.");
      return;
    }

    const aliases = {
      unit_id: "isbt", isbt: "isbt",
      blood_type: "type", type: "type",
      component: "comp", comp: "comp",
      collection_date: "collected", collected: "collected",
      expiration_date: "expires", expires: "expires",
      status: "status", source: "source",
    };
    const headers = parseLine(lines[0]).map((header) => aliases[header.trim().toLowerCase()] || header.trim().toLowerCase());
    const required = ["isbt", "type", "comp", "expires"];
    const missing = required.filter((field) => !headers.includes(field));
    if (missing.length) {
      setRows([]);
      setError(`Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`);
      return;
    }

    const existingIds = new Set(existingInventory.map((unit) => String(unit.isbt).toLowerCase()));
    const fileIds = new Set();
    const parsedRows = lines.slice(1).map((line, rowIndex) => {
      const values = parseLine(line);
      const record = {};
      headers.forEach((header, index) => { record[header] = values[index] || ""; });
      const reasons = [];
      if (!record.isbt) reasons.push("Missing unit ID");
      if (!BLOOD_TYPES.includes(record.type)) reasons.push("Invalid blood type");
      if (!COMPONENTS.includes(record.comp)) reasons.push("Invalid component");
      const expiryTime = new Date(`${record.expires}T00:00:00`).getTime();
      if (!record.expires || Number.isNaN(expiryTime)) reasons.push("Invalid expiration date");

      const normalizedId = String(record.isbt).toLowerCase();
      const duplicate = normalizedId && (existingIds.has(normalizedId) || fileIds.has(normalizedId));
      if (normalizedId) fileIds.add(normalizedId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return {
        row: rowIndex + 2,
        isbt: record.isbt,
        type: record.type,
        comp: record.comp,
        collected: record.collected || "",
        expires: record.expires,
        days_left: Number.isNaN(expiryTime) ? null : Math.ceil((expiryTime - today.getTime()) / 86400000),
        status: record.status || "Pending Inbound",
        source: record.source || "CSV Import",
        reserved_for: null,
        shelf: "Pending assignment",
        temp: null,
        result: reasons.length ? "Invalid" : duplicate ? "Duplicate" : "Valid",
        reason: reasons.join("; ") || (duplicate ? "Unit ID already registered" : "Ready to import"),
      };
    });

    setFileName(name);
    setRows(parsedRows);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setRows([]);
      setError("Choose a CSV file to continue.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => parseCsv(reader.result, file.name);
    reader.onerror = () => setError("The selected file could not be read.");
    reader.readAsText(file);
  };

  const loadSample = () => {
    parseCsv(
      [
        "unit_id,blood_type,component,collection_date,expiration_date,status,source",
        '"=)W0381 2512 100118",B-,PRBC,2026-07-18,2026-08-29,Pending Inbound,PRC-LIP',
        '"=)W0381 2513 100206",AB+,Platelets,2026-08-01,2026-08-08,Pending Inbound,PRC-LIP',
        '"=)W0381 2510 100062",A+,PRBC,2026-07-20,2026-08-30,Pending Inbound,PRC-LIP',
        '"INVALID-001",X+,PRBC,2026-07-20,not-a-date,Pending Inbound,PRC-LIP',
      ].join("\n"),
      "bloodledger-sample-import.csv"
    );
  };

  return (
    <Modal
      title="Import Blood Inventory"
      sub="Validate blood-unit records before registering them in BloodLedger."
      wide
      onClose={onClose}
      footer={
        <>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="check" disabled={!validRows.length} onClick={() => onImport(validRows.map(({ result, reason, row, ...unit }) => unit))}>
            Import {validRows.length || ""} Valid Unit{validRows.length === 1 ? "" : "s"}
          </Btn>
        </>
      }
    >
      <div className="inventory-import-drop">
        <I name="upload" size={21} />
        <div><strong>Select an inventory CSV</strong><div className="muted tiny">Required: unit_id, blood_type, component, expiration_date</div></div>
        <label className="btn btn-sm inventory-import-file">Choose CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} /></label>
        <Btn size="sm" kind="ghost" onClick={loadSample}>Load sample</Btn>
      </div>

      {error && <div className="auth-login-error" role="alert" style={{ marginTop: 14 }}>{error}</div>}

      {rows.length > 0 && (
        <>
          <div className="inventory-import-summary">
            <div><span>File</span><strong>{fileName}</strong></div>
            <div className="ok"><span>Valid</span><strong>{validRows.length}</strong></div>
            <div className="warn"><span>Duplicates</span><strong>{duplicateRows.length}</strong></div>
            <div className="critical"><span>Invalid</span><strong>{invalidRows.length}</strong></div>
          </div>
          <div className="inventory-import-table">
            <table className="tbl">
              <thead><tr><th>Row</th><th>Unit ID</th><th>Blood</th><th>Component</th><th>Expiration</th><th>Validation</th></tr></thead>
              <tbody>{rows.map((item) => (
                <tr key={`${item.row}-${item.isbt}`}>
                  <td className="mono tiny">{item.row}</td><td className="mono tiny">{item.isbt || "—"}</td><td>{item.type || "—"}</td><td>{item.comp || "—"}</td><td className="mono tiny">{item.expires || "—"}</td>
                  <td><Chip kind={item.result === "Valid" ? "ok" : item.result === "Duplicate" ? "warn" : "critical"} dot>{item.result}</Chip><div className="muted tiny" style={{ marginTop: 4 }}>{item.reason}</div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

Object.assign(window, {
  InventoryPage,
});
