// pages/dashboard.jsx
// Simplified BloodLedger base dashboard
//
// This version intentionally avoids detailed hospital-specific workflows,
// BROA scoring, ML forecasts, blockchain metrics, and consortium assumptions.
// The purpose is to provide a neutral base mock-up that can later be refined
// after stakeholder interviews.

function DashboardPage({ hospital, permissions, transfers, onNav, onAct }) {
  const consortiumBank = (window.CONSORTIUM_BANKS || []).find(
    (item) => item.facilityId === hospital?.id
  );
  const matrix = consortiumBank
    ? (window.BLOOD_TYPES || []).map((type) => {
        const item = consortiumBank.inventory[type] || { total: 0, available: 0 };
        const status = item.total <= 2
          ? "critical"
          : item.total <= 5
          ? "warn"
          : item.available >= 4
          ? "surplus"
          : "ok";
        return {
          type,
          units: item.total,
          status,
          redistributable_units: item.available,
          trend: 0,
          days_cover: Math.max(1, Math.round((item.total / 4) * 10) / 10),
        };
      })
    : window.MATRIX || [];
  const alerts = visibleAlertsForRole(
    window.ALERTS || [],
    hospital,
    permissions
  );
  const allTransferData = transfers || window.TRANSFERS || [];
  const transferData = permissions?.bloodBank || permissions?.secondary
    ? allTransferData.filter((item) => item.from === hospital?.id || item.to === hospital?.id)
    : allTransferData;

  if (permissions?.requester) {
    return (
      <RequestorDashboard
        hospital={hospital}
        transfers={transferData}
        onNav={onNav}
      />
    );
  }

  if (["prc", "prc_admin"].includes(permissions?.roleKey)) {
    return <PrcDashboard hospital={hospital} onNav={onNav} />;
  }

  if (permissions?.roleKey === "regulator") {
    return <RegulatoryDashboard hospital={hospital} onNav={onNav} />;
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
  const [networkType, setNetworkType] = React.useState("O+");
  const [networkComponent, setNetworkComponent] = React.useState("PRBC");
  const scopedRecords = transfers.filter(
    (item) => item.to === hospital?.id || item.from === hospital?.id
  );
  const requests = scopedRecords.filter((item) => item.requestOnly);
  const operationalTransfers = scopedRecords.filter((item) => !item.requestOnly);
  const requested = requests.filter((item) => ["Pending", "Requested"].includes(item.status)).length;
  const inTransit = operationalTransfers.filter((item) => ["Approved", "Dispatched", "In Transit"].includes(item.status)).length;
  const received = operationalTransfers.filter((item) => ["Received", "Completed"].includes(item.status)).length;
  const recent = requests.slice(0, 6);
  const componentFactor = (window.CONSORTIUM_COMPONENT_FACTORS || {})[networkComponent] || 1;
  const networkBanks = (window.CONSORTIUM_BANKS || []).map((bank) => {
    const source = bank.inventory[networkType] || { available: 0 };
    return {
      ...bank,
      facility: hospitalById(bank.facilityId),
      available: Math.max(0, Math.round(source.available * componentFactor)),
    };
  }).sort((a, b) => b.available - a.available || a.facility.distance_km - b.facility.distance_km);
  const networkAvailable = networkBanks.reduce(
    (sum, bank) => sum + bank.available,
    0
  );

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

        <div className="card requestor-network-card">
          <div className="card-h">
            <div><h3>Network Blood Availability</h3><div className="sub muted">Redistributable supply from all participating blood banks.</div></div>
            <Btn size="sm" kind="primary" icon="plus" onClick={() => onNav("transfers", { type: networkType, component: networkComponent })}>Request Blood</Btn>
          </div>
          <div className="card-b">
            <div className="requestor-network-filters">
              <label><span>Blood Type</span><select value={networkType} onChange={(event) => setNetworkType(event.target.value)}>{(window.BLOOD_TYPES || []).map((type) => <option key={type}>{type}</option>)}</select></label>
              <label><span>Component</span><select value={networkComponent} onChange={(event) => setNetworkComponent(event.target.value)}>{(window.COMPONENTS || []).map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className={`requestor-availability-result ${networkAvailable ? "available" : "unavailable"}`}>
              <div className="requestor-availability-blood"><BloodType type={networkType} lg /><span>{networkComponent}</span></div>
              <div className="requestor-availability-quantity"><strong className="mono">{networkAvailable}</strong><span>network units available</span></div>
              <div className="requestor-availability-status">
                <Chip kind={networkAvailable ? "ok" : "critical"} dot>{networkAvailable ? "Request available" : "No current supply"}</Chip>
                <small>{networkAvailable ? "A source will be selected after submission." : "You may still submit an urgent request for review."}</small>
              </div>
            </div>
            <div className="requestor-network-note"><I name="info" size={14} /> Individual hospital eligibility is intentionally hidden. Submit one request and BloodLedger will route it using availability, distance, and redistribution rules.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function consortiumDashboardData() {
  const banks = (window.CONSORTIUM_BANKS || []).map((bank) => {
    const facility = hospitalById(bank.facilityId);
    const totals = Object.values(bank.inventory || {}).reduce(
      (summary, item) => ({
        total: summary.total + (Number(item.total) || 0),
        available: summary.available + (Number(item.available) || 0),
      }),
      { total: 0, available: 0 }
    );
    return { ...bank, facility, ...totals };
  });
  const byType = (window.BLOOD_TYPES || []).map((type) => {
    const available = banks.reduce(
      (sum, bank) => sum + (Number(bank.inventory?.[type]?.available) || 0),
      0
    );
    return { type, available };
  });
  return {
    banks,
    byType,
    total: banks.reduce((sum, bank) => sum + bank.total, 0),
    available: banks.reduce((sum, bank) => sum + bank.available, 0),
    shortages: byType.filter((item) => item.available <= 1).length,
  };
}

function NetworkAvailabilitySummary({ data }) {
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Consortium Availability Summary</h3>
          <div className="sub muted">Redistributable PRBC units reported across participating blood banks.</div>
        </div>
      </div>
      <div className="card-b">
        <div className="dashboard-network-types">
          {data.byType.map((item) => (
            <div key={item.type} className={item.available <= 1 ? "critical" : item.available <= 3 ? "warn" : "ok"}>
              <BloodType type={item.type} />
              <strong className="mono">{item.available}</strong>
              <span>available</span>
            </div>
          ))}
        </div>
        <div className="requestor-network-note"><I name="info" size={14} /> This summary excludes reserved units and institutional safety stock.</div>
      </div>
    </div>
  );
}

function PrcDashboard({ hospital, onNav }) {
  const network = consortiumDashboardData();
  const supplyRequests = window.PRC_SUPPLY_REQUESTS || [];
  const openSupply = supplyRequests.filter((item) => !["Completed", "Cancelled"].includes(item.status)).length;
  const chartTypes = (window.BLOOD_TYPES || []).map((type) => ({
    type,
    banks: network.banks.map((bank) => ({
      facilityId: bank.facilityId,
      name: bank.facility?.short || bank.facilityId,
      units: Number(bank.inventory?.[type]?.total) || 0,
      available: Number(bank.inventory?.[type]?.available) || 0,
    })),
  }));
  const highest = Math.max(
    1,
    ...chartTypes.flatMap((item) => item.banks.map((bank) => bank.units))
  );
  const maximum = Math.ceil(highest / 5) * 5;
  const ticks = Array.from({ length: 6 }, (_, index) =>
    Math.round(maximum - (maximum / 5) * index)
  );

  return (
    <div className="page">
      <PageHead
        eyebrow={hospital?.short || "Philippine Red Cross"}
        title="PRC Administrator Dashboard"
        sub="Monitor blood-bank supply levels, coordinate replenishment, and administer consortium participation."
        actions={<Btn size="sm" kind="ghost" onClick={() => onNav("accounts")}>Manage accounts <I name="arrowRight" size={12} /></Btn>}
      />
      <div className="stat-grid">
        <Stat label="Participating Blood Banks" value={network.banks.length} unit="facilities" />
        <Stat label="Redistributable Supply" value={network.available} unit="units" accent="ok" />
        <Stat label="Critical Blood Types" value={network.shortages} unit="types" accent={network.shortages ? "critical" : undefined} />
        <Stat label="Open Supply Requests" value={openSupply} unit="requests" accent={openSupply ? "info" : undefined} />
      </div>
      <div style={{ height: 18 }} />
      <div className="card">
        <div className="card-h">
          <div><h3>Blood-Bank Inventory Overview</h3><div className="sub muted">Total PRBC stock by blood type for every participating blood bank.</div></div>
          <Btn size="sm" kind="ghost" onClick={() => onNav("alerts")}>View shortage alerts <I name="arrowRight" size={12} /></Btn>
        </div>
        <div className="card-b inventory-chart-scroll">
          <div className="prc-bank-legend" aria-label="Blood bank chart legend">
            {network.banks.map((bank, index) => <span key={bank.facilityId}><i className={`bank-${index + 1}`} />{bank.facility?.name}</span>)}
          </div>
          <div className="inventory-chart prc-inventory-chart" aria-label="PRC blood-bank supply bar chart">
            <div className="inventory-chart-y-title">Total units</div>
            <div className="inventory-chart-y-axis" aria-hidden="true">
              {ticks.map((tick) => <span key={tick} className="mono tiny">{tick}</span>)}
            </div>
            <div className="inventory-chart-plot">
              <div className="inventory-chart-grid" aria-hidden="true">{ticks.map((tick) => <span key={tick} />)}</div>
              <div className="inventory-chart-bars">
                {chartTypes.map((item) => {
                  const total = item.banks.reduce((sum, bank) => sum + bank.units, 0);
                  return <div key={item.type} className="inventory-bar prc-inventory-group">
                    <span className="inventory-bar-track">
                      <span className="prc-bank-bars">
                        {item.banks.map((bank, index) => {
                          const height = `${Math.max(3, (bank.units / maximum) * 100)}%`;
                          return <span key={bank.facilityId} className={`prc-bank-bar bank-${index + 1}`} style={{ height }} title={`${bank.name} · ${item.type} · ${bank.units} total · ${bank.available} redistributable`}><b className="mono">{bank.units}</b></span>;
                        })}
                      </span>
                    </span>
                    <span className="inventory-bar-label"><span>{item.type}</span><small>{total} across network</small></span>
                  </div>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 18 }} />
      <div className="grid-dash role-dashboard-grid">
      <div className="card">
        <div className="card-h"><div><h3>Blood-Bank Reporting Status</h3><div className="sub muted">Latest stock update received from each member blood bank.</div></div></div>
        <div className="card-b flush"><table className="tbl"><thead><tr><th>Blood Bank</th><th>Updated</th><th className="right">Available</th><th>Status</th></tr></thead><tbody>{network.banks.map((bank) => <tr key={bank.facilityId}><td><strong>{bank.facility.short}</strong></td><td className="mono tiny">{bank.lastUpdated}</td><td className="right mono">{bank.available}</td><td><Chip kind="ok" dot>{bank.status}</Chip></td></tr>)}</tbody></table></div>
      </div>
      <div className="card">
        <div className="card-h">
          <div><h3>Hospital Replenishment Requests</h3><div className="sub muted">Requests sent to PRC for blood-bank stock replenishment.</div></div>
          <Btn size="sm" kind="ghost" onClick={() => onNav("transfers")}>Open coordination records <I name="arrowRight" size={12} /></Btn>
        </div>
        <div className="card-b flush">
          <table className="tbl">
            <thead><tr><th>Reference</th><th>Blood</th><th className="right">Units</th><th>Needed By</th><th>Status</th></tr></thead>
            <tbody>{supplyRequests.slice(0, 5).map((item) => (
              <tr key={item.id}>
                <td className="mono tiny">{item.id}</td>
                <td><BloodType type={item.type} /> <span className="tiny muted">{item.component}</span></td>
                <td className="right mono">{item.units}</td>
                <td className="mono tiny">{String(item.neededBy || "").replace("T", " ")}</td>
                <td><Chip kind={transferStatusKind(item.status)} dot>{item.status}</Chip></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

function RegulatoryDashboard({ hospital, onNav }) {
  const rows = window.COMPLIANCE_STATUS || [];
  const compliant = rows.filter((item) => item.status === "Compliant").length;
  const due = rows.filter((item) => item.status === "Due Today").length;
  const late = rows.filter((item) => item.status === "Late Submission").length;
  const regulatoryAlerts = rows.filter((item) => item.status !== "Compliant").map((item) => ({
    id: `DOH-${item.facilityId}`,
    facility: hospitalById(item.facilityId),
    severity: item.status === "Late Submission" ? "critical" : "warn",
    title: item.status === "Late Submission" ? "Late compliance submission" : "Reporting checkpoint due",
    desc: item.status === "Late Submission"
      ? `${hospitalById(item.facilityId)?.name} submitted a required checkpoint after the reporting window.`
      : `${hospitalById(item.facilityId)?.name} has not yet submitted the afternoon checkpoint.`,
  }));

  return (
    <div className="page">
      <PageHead
        eyebrow={hospital?.short || "DOH CALABARZON"}
        title="Compliance Oversight Dashboard"
        sub="A single read-only view of blood-bank reporting compliance and regulatory alerts."
      />
      <div className="stat-grid">
        <Stat label="Monitored Blood Banks" value={rows.length} unit="facilities" />
        <Stat label="Fully Compliant" value={compliant} unit={`of ${rows.length}`} accent="ok" />
        <Stat label="Reports Due" value={due} unit="facilities" accent={due ? "warn" : undefined} />
        <Stat label="Late Submissions" value={late} unit="facilities" accent={late ? "critical" : undefined} />
      </div>
      <div style={{ height: 18 }} />
      <div className="grid-dash role-dashboard-grid">
        <div className="card">
          <div className="card-h">
            <div><h3>Compliance Reports</h3><div className="sub muted">Morning and afternoon reporting checkpoints by licensed blood bank.</div></div>
            <Btn size="sm" kind="ghost" onClick={() => onNav("reporting")}>View all reports <I name="arrowRight" size={12} /></Btn>
          </div>
          <div className="card-b flush">
            <table className="tbl">
              <thead><tr><th>Licensed Facility</th><th>9:00 AM</th><th>4:00 PM</th><th>Last Submission</th><th>Status</th></tr></thead>
              <tbody>{rows.map((item) => (
                <tr key={item.facilityId}>
                  <td><strong>{hospitalById(item.facilityId)?.name}</strong><div className="tiny muted">{item.facilityId}</div></td>
                  <td><Chip kind={item.morning === "Submitted" ? "ok" : "warn"}>{item.morning}</Chip></td>
                  <td><Chip kind={item.afternoon === "Submitted" ? "ok" : "warn"}>{item.afternoon}</Chip></td>
                  <td className="mono tiny">{item.lastSubmission}</td>
                  <td><Chip kind={item.status === "Compliant" ? "ok" : item.status === "Late Submission" ? "critical" : "warn"} dot>{item.status}</Chip></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><h3>Alerts</h3><div className="sub muted">Compliance exceptions requiring follow-up by DOH reviewers.</div></div><Btn size="sm" kind="ghost" onClick={() => onNav("alerts")}>View all alerts <I name="arrowRight" size={12} /></Btn></div>
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {regulatoryAlerts.length ? regulatoryAlerts.map((alert) => <div key={alert.id} className={`alert-card ${alert.severity}`}><div><div className="row" style={{ gap: 8 }}><Chip kind={alert.severity === "critical" ? "critical" : "warn"}>{alert.severity.toUpperCase()}</Chip><div className="title">{alert.title}</div></div><div className="desc">{alert.desc}</div><div className="muted tiny" style={{ marginTop: 8 }}>Source: Compliance Monitor</div></div></div>) : <div className="muted small">No compliance exceptions require follow-up.</div>}
          </div>
        </div>
      </div>
      <div className="consortium-disclosure"><I name="info" size={16} /><span>DOH access is read-only. Operational inventory, requests, transfers, scanning, and account administration are intentionally hidden from this role.</span></div>
    </div>
  );
}

Object.assign(window, { DashboardPage });
