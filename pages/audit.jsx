// pages/audit.jsx
// Simplified BloodLedger activity history page.
//
// This version keeps the concept of traceability while removing
// detailed blockchain implementation language such as block numbers,
// chaincode functions, endorsement details, and transaction hashes.
//
// The technical ledger implementation can remain part of the thesis
// architecture without being exposed heavily in the base user interface.

function AuditPage({ hospital, permissions, onNav }) {
  const auditRows = window.AUDIT || window.AUDIT_LOGS || [];

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  const actionTypes = [
    "ALL",
    ...Array.from(
      new Set(
        auditRows
          .map((row) => row.action || row.type)
          .filter(Boolean)
      )
    ),
  ];

  const filtered = auditRows.filter((row) => {
    const action = row.action || row.type || "";
    const user = row.user || row.actor || "";
    const details =
      row.details ||
      row.description ||
      row.desc ||
      "";
    const unitId =
      row.unitId ||
      row.isbt ||
      row.unit ||
      "";
    const transferId =
      row.transferId ||
      row.transfer ||
      "";

    const query = search.toLowerCase();

    const matchesSearch =
      !search ||
      String(action)
        .toLowerCase()
        .includes(query) ||
      String(user)
        .toLowerCase()
        .includes(query) ||
      String(details)
        .toLowerCase()
        .includes(query) ||
      String(unitId)
        .toLowerCase()
        .includes(query) ||
      String(transferId)
        .toLowerCase()
        .includes(query);

    const matchesType =
      typeFilter === "ALL" ||
      action === typeFilter;

    return (
      matchesSearch &&
      matchesType
    );
  });

  return (
    <div className="page">
      <PageHead
        eyebrow={
          hospital
            ? hospital.short
            : "BloodLedger"
        }
        title="Activity History"
        sub="Review recent inventory, request, and transfer activities recorded in the system."
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
            Activity Type
          </span>

          {actionTypes.map(
            (type) => (
              <button
                key={type}
                className={`filter-chip ${
                  typeFilter === type
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setTypeFilter(type)
                }
              >
                {type === "ALL"
                  ? "All"
                  : type}
              </button>
            )
          )}

          <div
            style={{
              marginLeft: "auto",
            }}
          >
            <div
              className="top-search"
              style={{
                minWidth: 240,
                padding: "5px 10px",
              }}
            >
              <I
                name="search"
                size={13}
              />

              <input
                placeholder="Search activity..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Activity table */}
        <div className="card-b flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Activity</th>
                <th>User / Source</th>
                <th>Reference</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map(
                  (row, index) => {
                    const action =
                      row.action ||
                      row.type ||
                      "System Activity";

                    const user =
                      row.user ||
                      row.actor ||
                      row.source ||
                      "System";

                    const dateTime =
                      row.timestamp ||
                      row.time ||
                      row.ts ||
                      "—";

                    const reference =
                      row.unitId ||
                      row.isbt ||
                      row.transferId ||
                      row.transfer ||
                      row.reference ||
                      "—";

                    const details =
                      row.details ||
                      row.description ||
                      row.desc ||
                      "No additional details.";

                    const status =
                      row.status ||
                      "Recorded";

                    let statusKind =
                      "info";

                    if (
                      status ===
                        "Completed" ||
                      status ===
                        "Success" ||
                      status ===
                        "Recorded"
                    ) {
                      statusKind =
                        "ok";
                    }

                    if (
                      status ===
                        "Failed" ||
                      status ===
                        "Rejected" ||
                      status ===
                        "Error"
                    ) {
                      statusKind =
                        "critical";
                    }

                    if (
                      status ===
                        "Pending" ||
                      status ===
                        "Warning"
                    ) {
                      statusKind =
                        "warn";
                    }

                    return (
                      <tr
                        key={
                          row.id ||
                          `${dateTime}-${index}`
                        }
                      >
                        <td className="mono small">
                          {
                            dateTime
                          }
                        </td>

                        <td>
                          <div className="small">
                            {
                              action
                            }
                          </div>
                        </td>

                        <td>
                          {
                            user
                          }
                        </td>

                        <td className="mono small">
                          {
                            reference
                          }
                        </td>

                        <td>
                          <div
                            className="small"
                            style={{
                              maxWidth: 320,
                            }}
                          >
                            {
                              details
                            }
                          </div>
                        </td>

                        <td>
                          <Chip
                            kind={
                              statusKind
                            }
                            dot
                          >
                            {
                              status
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
                    className="muted"
                    style={{
                      textAlign:
                        "center",
                      padding: 32,
                    }}
                  >
                    No activity
                    records match
                    the selected
                    filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 18 }} />

      {/* Simple traceability explanation */}
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
                Activity traceability
              </div>

              <div className="muted tiny">
                This page demonstrates
                how important inventory,
                request, and transfer
                activities can be reviewed
                over time. The exact
                technical audit fields
                shown to users will be
                refined after stakeholder
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
  AuditPage,
});