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

  if (permissions?.requester) {
    return (
      <RequestorDashboard
        hospital={hospital}
        transfers={transferData}
        onNav={onNav}
      />
    );
  }

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
  const highestInventory = Math.max(
    5,
    ...matrix.map((item) => Number(item.units) || 0)
  );
  const chartMaximum = Math.ceil(highestInventory / 5) * 5;
  const chartTicks = Array.from(
    { length: 6 },
    (_, index) => Math.round(chartMaximum - (chartMaximum / 5) * index)
  );

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

        <div className="card-b inventory-chart-scroll">
          <div className="inventory-chart-legend" aria-label="Inventory status legend">
            <span><i className="critical" />Critical</span>
            <span><i className="warn" />Low</span>
            <span><i className="ok" />Adequate</span>
            <span><i className="surplus" />Available to redistribute</span>
          </div>

          <div className="inventory-chart" aria-label="Blood inventory bar chart">
            <div className="inventory-chart-y-title">Quantity</div>

            <div className="inventory-chart-y-axis" aria-hidden="true">
              {chartTicks.map((tick) => (
                <span key={tick} className="mono tiny">
                  {tick}
                </span>
              ))}
            </div>

            <div className="inventory-chart-plot">
              <div className="inventory-chart-grid" aria-hidden="true">
                {chartTicks.map((tick) => (
                  <span key={tick} />
                ))}
              </div>

              <div className="inventory-chart-bars">
                {matrix.map((item) => {
                  const units = Number(item.units) || 0;
                  const height = `${Math.max(
                    3,
                    (units / chartMaximum) * 100
                  )}%`;
                  const statusLabel = item.status === "critical"
                    ? "Critical"
                    : item.status === "warn"
                      ? "Low"
                      : item.status === "surplus"
                        ? "Surplus"
                        : "Adequate";
                  const redistributableUnits = Math.min(
                    units,
                    Math.max(0, Number(item.redistributable_units) || 0)
                  );
                  const redistributableShare = units
                    ? `${(redistributableUnits / units) * 100}%`
                    : "0%";

                  return (
                    <button
                      key={item.type}
                      className={`inventory-bar s-${item.status || "normal"}`}
                      title={`${item.type} · ${units} total units · ${redistributableUnits} available to redistribute · ${statusLabel} · ${item.days_cover} days of supply`}
                      onClick={() =>
                        onNav("inventory", {
                          type: item.type,
                        })
                      }
                    >
                      <span className="inventory-bar-track">
                        <span
                          className="inventory-bar-value mono"
                          style={{ bottom: `calc(${height} + 7px)` }}
                        >
                          {units}
                        </span>

                        <span
                          className="inventory-bar-fill"
                          style={{ height }}
                        >
                          {redistributableUnits > 0 && (
                            <span
                              className="inventory-bar-redistributable"
                              style={{ height: redistributableShare }}
                            />
                          )}
                        </span>
                      </span>

                      <span className="inventory-bar-label">
                        <span>{item.type}</span>
                        {redistributableUnits > 0 && (
                          <small>{redistributableUnits} redistributable</small>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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

function RequestorDashboard({ hospital, transfers, onNav }) {
  const requests = transfers.filter(
    (item) => item.to === hospital?.id || item.from === hospital?.id
  );
  const requested = requests.filter((item) => ["Pending", "Requested"].includes(item.status)).length;
  const inTransit = requests.filter((item) => ["Approved", "Dispatched", "In Transit"].includes(item.status)).length;
  const received = requests.filter((item) => ["Received", "Completed"].includes(item.status)).length;
  const recent = requests.slice(0, 6);

  return (
    <div className="page">
      <PageHead
        eyebrow={hospital?.short || "Requestor"}
        title="Requestor Dashboard"
        sub="Create blood requests and follow their approval, dispatch, and receipt status."
        actions={<Btn kind="primary" icon="plus" onClick={() => onNav("transfers", { type: "O+" })}>New Blood Request</Btn>}
      />

      <div className="stat-grid requestor-stat-grid">
        <Stat label="Submitted Requests" value={requests.length} unit="total" />
        <Stat label="Awaiting Review" value={requested} unit="requests" accent={requested ? "warn" : undefined} />
        <Stat label="On the Way" value={inTransit} unit="transfers" accent="info" />
        <Stat label="Received" value={received} unit="completed" accent="ok" />
      </div>

      <div style={{ height: 18 }} />

      <div className="grid-dash requestor-dashboard-grid">
        <div className="card">
          <div className="card-h">
            <div><h3>My Requests</h3><div className="sub muted">Requests associated with {hospital?.short}.</div></div>
            <Btn size="sm" kind="ghost" onClick={() => onNav("transfers")}>View all <I name="arrowRight" size={12} /></Btn>
          </div>
          <div className="card-b flush">
            {recent.length ? (
              <table className="tbl">
                <thead><tr><th>Reference</th><th>Blood</th><th className="right">Units</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>{recent.map((item) => (
                  <tr key={item.id} className="row-clickable" onClick={() => onNav("transfers")}>
                    <td className="mono tiny">{item.id}</td><td><BloodType type={item.type} /></td><td className="right tnum">{item.units}</td><td>{item.urgency || "Routine"}</td><td><Chip kind={transferStatusKind(item.status)} dot>{item.status}</Chip></td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <div className="muted small" style={{ padding: 28, textAlign: "center" }}>No requests have been submitted by this institution.</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><div><h3>Requestor Access</h3><div className="sub muted">Available functions for this account.</div></div></div>
          <div className="card-b requestor-access-list">
            <div><I name="check" size={14} /><span><strong>Submit requests</strong><small>Create blood requests for review by the primary blood bank.</small></span></div>
            <div><I name="check" size={14} /><span><strong>Track transfers</strong><small>Monitor approval, dispatch, transit, and receipt.</small></span></div>
            <div><I name="check" size={14} /><span><strong>Review activity</strong><small>See request-related notifications and history.</small></span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });
