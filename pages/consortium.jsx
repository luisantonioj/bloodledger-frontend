// pages/consortium.jsx - Network-wide participating blood-bank availability.

function ConsortiumPage({ hospital, permissions, onNav }) {
  const banks = window.CONSORTIUM_BANKS || [];
  const [component, setComponent] = React.useState("PRBC");
  const [view, setView] = React.useState("Network Total");
  const [selectedType, setSelectedType] = React.useState("ALL");
  const factor = (window.CONSORTIUM_COMPONENT_FACTORS || {})[component] || 1;
  const canRequest = Boolean(permissions?.canCreateRequest);
  const showOnHand = Boolean(permissions?.bloodBank || permissions?.readOnly || permissions?.canManageAccounts);

  const adjusted = (value) => Math.max(0, Math.round(Number(value || 0) * factor));
  const bankRows = banks.map((bank) => {
    const facility = hospitalById(bank.facilityId);
    const inventory = {};
    BLOOD_TYPES.forEach((type) => {
      const source = bank.inventory[type] || { total: 0, available: 0 };
      inventory[type] = {
        total: adjusted(source.total),
        available: adjusted(source.available),
      };
    });
    return { ...bank, facility, inventory };
  });

  const totals = {};
  BLOOD_TYPES.forEach((type) => {
    totals[type] = bankRows.reduce(
      (result, bank) => ({
        total: result.total + bank.inventory[type].total,
        available: result.available + bank.inventory[type].available,
      }),
      { total: 0, available: 0 }
    );
  });

  const totalOnHand = Object.values(totals).reduce((sum, item) => sum + item.total, 0);
  const totalAvailable = Object.values(totals).reduce((sum, item) => sum + item.available, 0);
  const criticalTypes = Object.values(totals).filter((item) => item.available === 0).length;
  const chartMax = Math.max(5, ...Object.values(totals).map((item) => item.available));

  const availabilityKind = (available) =>
    available === 0 ? "critical" : available <= 2 ? "warn" : "ok";

  const requestFrom = (bank, type) => {
    onNav("transfers", {
      type: type === "ALL" ? "O+" : type,
      supplierId: bank.facilityId,
      component,
    });
  };

  return (
    <div className="page consortium-page">
      <PageHead
        eyebrow="BloodLedger · Lipa City consortium"
        title="Consortium Inventory"
        sub={
          permissions?.secondary
            ? "Find blood units released for redistribution by participating blood banks."
            : "Monitor on-hand and redistributable blood supply across participating hospital blood banks."
        }
        actions={<Chip kind="ok" dot>Network synchronized</Chip>}
      />

      <div className="consortium-summary-grid">
        <Stat label="Participating Blood Banks" value={bankRows.length} unit="online" accent="ok" />
        <Stat label={showOnHand ? "Network Inventory" : "Network Availability"} value={showOnHand ? totalOnHand : totalAvailable} unit={`${component} units`} />
        <Stat label="Available to Redistribute" value={totalAvailable} unit="units" accent="info" />
        <Stat label="Unavailable Blood Types" value={criticalTypes} unit={criticalTypes === 1 ? "type" : "types"} accent={criticalTypes ? "critical" : "ok"} />
      </div>

      <div className="consortium-controls card">
        <div>
          <span className="consortium-control-label">Blood Component</span>
          <div className="consortium-filter-row">
            {(window.COMPONENTS || []).map((item) => (
              <button key={item} className={`filter-chip ${component === item ? "active" : ""}`} onClick={() => setComponent(item)}>{item}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="consortium-control-label">Chart View</span>
          <div className="consortium-filter-row">
            {["Network Total", "Compare Blood Banks"].map((item) => (
              <button key={item} className={`filter-chip ${view === item ? "active" : ""}`} onClick={() => setView(item)}>{item}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card consortium-chart-card">
        <div className="card-h">
          <div><h3>Redistributable Blood Availability</h3><div className="sub muted">Units each blood bank has released above its local safety-stock threshold.</div></div>
          <div className="consortium-bank-legend">
            {view === "Compare Blood Banks" && bankRows.map((bank, index) => <span key={bank.facilityId}><i className={`bank-${index + 1}`} />{bank.facility.short}</span>)}
          </div>
        </div>
        <div className="card-b consortium-chart-scroll">
          <div className="consortium-chart" aria-label={`${component} redistributable inventory chart`}>
            {BLOOD_TYPES.map((type) => (
              <button key={type} className={`consortium-chart-group ${selectedType === type ? "selected" : ""}`} onClick={() => setSelectedType(selectedType === type ? "ALL" : type)}>
                <div className="consortium-chart-values">
                  {view === "Network Total" ? (
                    <span className={`consortium-chart-bar network ${availabilityKind(totals[type].available)}`} style={{ height: `${Math.max(3, (totals[type].available / chartMax) * 100)}%` }}><b>{totals[type].available}</b></span>
                  ) : bankRows.map((bank, index) => {
                    const value = bank.inventory[type].available;
                    return <span key={bank.facilityId} className={`consortium-chart-bar bank-${index + 1}`} style={{ height: `${Math.max(3, (value / chartMax) * 100)}%` }} title={`${bank.facility.short}: ${value} ${type} ${component} unit(s) available`}><b>{value}</b></span>;
                  })}
                </div>
                <strong>{type}</strong>
                <small>{totals[type].available ? `${totals[type].available} available` : "Unavailable"}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="card consortium-matrix-card">
        <div className="card-h">
          <div><h3>Blood Bank Availability Matrix</h3><div className="sub muted">{showOnHand ? "Each cell shows redistributable units and total on-hand stock." : "Only units approved for redistribution are shown to requestor facilities."}</div></div>
          {selectedType !== "ALL" && <Btn size="sm" kind="ghost" onClick={() => setSelectedType("ALL")}>Clear {selectedType} filter</Btn>}
        </div>
        <div className="card-b flush consortium-table-scroll">
          <table className="tbl consortium-matrix">
            <thead><tr><th>Participating Blood Bank</th>{BLOOD_TYPES.map((type) => <th key={type} className={selectedType !== "ALL" && selectedType !== type ? "muted-column" : ""}>{type}</th>)}<th>Redistributable</th><th>Network Status</th><th></th></tr></thead>
            <tbody>
              {bankRows.map((bank) => {
                const available = Object.values(bank.inventory).reduce((sum, item) => sum + item.available, 0);
                const onHand = Object.values(bank.inventory).reduce((sum, item) => sum + item.total, 0);
                return <tr key={bank.facilityId}>
                  <td><div className="consortium-bank-name"><span className="peer-dot" /><div><strong>{bank.facility.name}</strong><small>{bank.facility.type} · {bank.facility.distance_km.toFixed(1)} km away</small></div></div></td>
                  {BLOOD_TYPES.map((type) => {
                    const item = bank.inventory[type];
                    return <td key={type} className={selectedType !== "ALL" && selectedType !== type ? "muted-column" : ""}><span className={`availability-cell ${availabilityKind(item.available)}`}><strong>{item.available}</strong>{showOnHand && <small>of {item.total}</small>}</span></td>;
                  })}
                  <td><strong>{available}</strong>{showOnHand && <small className="muted"> of {onHand} total</small>}</td>
                  <td><Chip kind="ok" dot>{bank.status}</Chip><div className="muted tiny">Updated {bank.lastUpdated.slice(11)}</div></td>
                  <td className="right">{canRequest && bank.facilityId !== hospital?.id ? <Btn size="sm" kind="ghost" onClick={() => requestFrom(bank, selectedType)}>Request</Btn> : bank.facilityId === hospital?.id ? <Chip kind="info">Current facility</Chip> : null}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="consortium-disclosure"><I name="info" size={16} /><span>Redistributable quantities exclude reserved units and each blood bank's configured safety stock. Availability remains subject to Blood Bank Head approval and release validation.</span></div>
    </div>
  );
}

Object.assign(window, { ConsortiumPage });
