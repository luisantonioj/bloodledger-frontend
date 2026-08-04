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

  React.useEffect(() => {
    if (filter?.type) {
      setActiveType(filter.type);
    }
  }, [filter?.type]);

  const inventory = window.INVENTORY || [];

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
              <Btn
                icon="scanner"
                onClick={() =>
                  onNav("scanner")
                }
              >
                Scan / Add Blood Unit
              </Btn>
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
    </div>
  );
}

Object.assign(window, {
  InventoryPage,
});
