// pages/dashboard.jsx
// Simplified BloodLedger base dashboard
//
// This version intentionally avoids detailed hospital-specific workflows,
// BROA scoring, ML forecasts, blockchain metrics, and consortium assumptions.
// The purpose is to provide a neutral base mock-up that can later be refined
// after stakeholder interviews.

function DashboardPage({ hospital, permissions, transfers, onNav, onAct }) {
  const matrix = window.MATRIX || [];
  const alerts = window.ALERTS || [];
  const transferData = transfers || window.TRANSFERS || [];

  // Basic inventory summary
  const totalUnits = matrix.reduce((sum, item) => {
    return sum + (Number(item.units) || 0);
  }, 0);

  // For the base mock-up, these statuses are only visual placeholders.
  // Their actual business rules can be defined after stakeholder validation.
  const lowStockCount = matrix.filter(
    (item) => item.status === "critical" || item.status === "warn"
  ).length;

  const pendingRequests = transferData.filter(
    (item) =>
      item.status === "Pending" ||
      item.status === "Requested" ||
      item.requestOnly
  ).length;

  // Temporary estimate using existing mock alerts.
  // This avoids introducing a new data model before requirements are confirmed.
  const expiringSoonCount = alerts.filter((alert) => {
    const text = `${alert.title || ""} ${alert.desc || ""}`.toLowerCase();

    return (
      text.includes("expir") ||
      text.includes("near-expiry") ||
      text.includes("near expiry")
    );
  }).length;

  const visibleAlerts = alerts.slice(0, 3);
  const recentTransfers = transferData.slice(0, 5);

  return (
    <div className="page">
      {/* Page heading */}
      <PageHead
        eyebrow={hospital ? hospital.short : "BloodLedger"}
        title="Dashboard"
        sub="A simple overview of blood inventory, requests, alerts, and recent system activity."
        actions={
          <>
            <Btn
              icon="refresh"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Btn>
          </>
        }
      />

      {/* Basic summary cards */}
      <div className="stat-grid">
        <Stat
          label="Total Blood Units"
          value={totalUnits}
          unit="units"
        />

        <Stat
          label="Expiring Soon"
          value={expiringSoonCount}
          unit={expiringSoonCount === 1 ? "unit" : "units"}
          accent="warn"
        />

        <Stat
          label="Low Stock"
          value={lowStockCount}
          unit={lowStockCount === 1 ? "type" : "types"}
          accent={lowStockCount > 0 ? "critical" : undefined}
        />

        <Stat
          label="Pending Requests"
          value={pendingRequests}
          unit=""
          accent="info"
        />
      </div>

      <div style={{ height: 18 }} />

      {/* Blood inventory overview */}
      <div className="card">
        <div className="card-h">
          <div>
            <h3>Blood Inventory Overview</h3>
            <div className="sub muted">
              Current mock inventory by blood type.
            </div>
          </div>

          <div className="actions">
            <Btn
              size="sm"
              kind="ghost"
              onClick={() => onNav("inventory")}
            >
              View inventory <I name="arrowRight" size={12} />
            </Btn>
          </div>
        </div>

        <div className="card-b">
          <div className="matrix">
            {matrix.map((item) => (
              <button
                key={item.type}
                className={`matrix-cell s-${item.status || "normal"}`}
                onClick={() =>
                  onNav("inventory", {
                    type: item.type,
                  })
                }
              >
                <div className="indicator" />

                <div className="head">
                  <BloodType type={item.type} />

                  {item.status === "critical" && (
                    <span className="muted tiny">
                      Low stock
                    </span>
                  )}

                  {item.status === "warn" && (
                    <span className="muted tiny">
                      Low
                    </span>
                  )}
                </div>

                <div className="units serif tnum">
                  {item.units}
                </div>

                <div className="unit-suffix">
                  units available
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      {/* Alerts and recent activity */}
      <div className="grid-dash">

        {/* Basic alerts */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Alerts</h3>
              <div className="sub muted">
                Inventory and system notifications.
              </div>
            </div>

            <div className="actions">
              <Btn
                size="sm"
                kind="ghost"
                onClick={() => onNav("alerts")}
              >
                View all <I name="arrowRight" size={12} />
              </Btn>
            </div>
          </div>

          <div
            className="card-b"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {visibleAlerts.length > 0 ? (
              visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-card ${alert.severity || "info"}`}
                >
                  <div>
                    <div
                      className="row"
                      style={{ gap: 8 }}
                    >
                      <span
                        className={`chip ${
                          alert.severity === "critical"
                            ? "solid-critical"
                            : alert.severity === "warn"
                            ? "warn"
                            : "info"
                        }`}
                        style={
                          alert.severity === "critical"
                            ? { color: "#fff" }
                            : null
                        }
                      >
                        {alert.severity
                          ? alert.severity.toUpperCase()
                          : "INFO"}
                      </span>

                      <div className="title">
                        {alert.title}
                      </div>
                    </div>

                    <div className="desc">
                      {alert.desc}
                    </div>

                    {alert.when && (
                      <div className="meta">
                        <span>
                          <I name="clock" size={11} />{" "}
                          {alert.when}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted">
                No alerts to display.
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Recent Activity</h3>
              <div className="sub muted">
                Latest mock activity recorded in the system.
              </div>
            </div>
          </div>

          <div className="card-b flush">
            {recentTransfers.length > 0 ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Blood Type</th>
                    <th className="right">Units</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentTransfers.map((item) => (
                    <tr
                      key={item.id}
                      className="row-clickable"
                      onClick={() =>
                        onNav("transfers", {
                          selectId: item.id,
                        })
                      }
                    >
                      <td>
                        <div className="small">
                          Blood transfer
                        </div>

                        <div className="tiny muted mono">
                          {item.id}
                        </div>
                      </td>

                      <td>
                        <BloodType type={item.type} />
                      </td>

                      <td className="right tnum">
                        {item.units}
                      </td>

                      <td>
                        <Chip
                          kind={transferStatusKind(item.status)}
                          dot
                        >
                          {item.status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                className="muted"
                style={{ padding: 20 }}
              >
                No recent activity to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });