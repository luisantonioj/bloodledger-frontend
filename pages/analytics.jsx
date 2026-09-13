// pages/analytics.jsx - Authorized historical demand and simulated assessment views.

function AnalyticsPage({ hospital, permissions }) {
  const prcView = permissions?.roleKey === "prc_admin";
  const authorized = !!permissions?.canViewAnalytics && (prcView || !!hospital?.is_blood_bank);
  const today = new Date();
  const end = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-01`;
  const [filters, setFilters] = React.useState({ dateFrom: start, dateTo: end, bloodType: "All", component: "All", group: "All" });
  const [metric, setMetric] = React.useState("unitsRequested");
  const [data, setData] = React.useState(null);
  const [status, setStatus] = React.useState(authorized ? "loading" : "unauthorized");
  const [showTable, setShowTable] = React.useState(false);
  const [yearOverYear, setYearOverYear] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!authorized) {
      setStatus("unauthorized");
      setData(null);
      return;
    }
    setStatus("loading");
    try {
      const result = await BloodLedgerApi.getAnalytics(
        prcView ? { type: "prc", facilityId: hospital?.id } : { type: "blood_bank", facilityId: hospital?.id },
        filters
      );
      setData(result);
      setStatus(result.demand.length ? "ready" : "empty");
    } catch (error) {
      setStatus("error");
      setData(null);
    }
  }, [authorized, prcView, hospital?.id, filters.dateFrom, filters.dateTo, filters.bloodType, filters.component, filters.group]);

  React.useEffect(() => { load(); }, [load]);

  if (!authorized) return <AnalyticsState kind="unauthorized" title="Analytics access is not authorized" text="This module requires both an eligible Blood Bank or PRC institution and an authorized analytics permission. No analytics data has been loaded." />;

  const demand = data?.demand || [];
  const scopeLabel = prcView ? "PRC-authorized consortium aggregate" : `${hospital?.name} · institution-only`;
  const groupLabel = prcView ? "Requesting hospital" : "Requesting department";
  const groupOptions = prcView
    ? (window.HOSPITALS || []).filter((item) => !["PRC-LIP", "DOH-CHD"].includes(item.id)).map((item) => ({ value: item.id, label: item.short }))
    : Array.from(new Set((window.ANALYTICS_DEMAND || []).filter((row) => row.facilityId === hospital?.id).map((row) => row.department))).sort().map((value) => ({ value, label: value }));

  const grouped = {};
  demand.forEach((row) => {
    const raw = prcView ? row.requestingFacilityId : (row.department || "Unknown department");
    const label = prcView ? (hospitalById(raw)?.name || raw) : raw;
    if (!grouped[label]) grouped[label] = { label, requestCount: 0, unitsRequested: 0 };
    grouped[label].requestCount += row.requestCount;
    grouped[label].unitsRequested += row.unitsRequested;
  });
  const ranked = Object.values(grouped).sort((a, b) => b[metric] - a[metric]);
  const totalRequests = demand.reduce((sum, row) => sum + row.requestCount, 0);
  const totalUnits = demand.reduce((sum, row) => sum + row.unitsRequested, 0);
  const rankedTotal = ranked.reduce((sum, row) => sum + row[metric], 0);
  const maxRank = Math.max(...ranked.map((row) => row[metric]), 1);

  const monthlyMap = {};
  demand.forEach((row) => {
    if (!monthlyMap[row.month]) monthlyMap[row.month] = { month: row.month, units: 0, complete: true };
    monthlyMap[row.month].units += row.unitsRequested;
    monthlyMap[row.month].complete = monthlyMap[row.month].complete && row.complete;
  });
  const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  const completeMonths = monthly.filter((item) => item.complete);
  const average = completeMonths.length ? completeMonths.reduce((sum, item) => sum + item.units, 0) / completeMonths.length : 0;
  const peak = [...completeMonths].sort((a, b) => b.units - a.units)[0] || null;
  const maxMonth = Math.max(...monthly.map((item) => item.units), 1);
  const years = Array.from(new Set(completeMonths.map((item) => item.month.slice(0, 4))));
  const yearMonthCounts = Object.fromEntries(years.map((year) => [year, new Set(completeMonths.filter((item) => item.month.startsWith(year)).map((item) => item.month.slice(5))).size]));
  const completeYears = years.filter((year) => yearMonthCounts[year] === 12);
  const comparableYears = completeYears.length >= 2;
  const comparisonYears = completeYears.slice(-2);

  const exportDemand = () => exportCsvReport({
    title: prcView ? "Hospital Demand" : "Department Demand",
    scope: scopeLabel,
    filters,
    simulation: true,
    headers: [groupLabel, "Request count", "Units requested", "Percent of selected units"],
    rows: ranked.map((row) => [row.label, row.requestCount, row.unitsRequested, totalUnits ? `${((row.unitsRequested / totalUnits) * 100).toFixed(1)}%` : "0%"]),
    filename: prcView ? "analytics-hospital-demand" : "analytics-department-demand",
  });
  const exportMonthly = () => exportCsvReport({
    title: "Monthly Demand",
    scope: scopeLabel,
    filters,
    simulation: true,
    headers: ["Month", "Requested units", "Data completeness", "Confirmed use"],
    rows: monthly.map((row) => [row.month, row.units, row.complete ? "Complete" : "Incomplete", "Not available"]),
    filename: "analytics-monthly-demand",
  });
  const exportAssessment = () => exportCsvReport({
    title: "Redistribution Assessment",
    scope: scopeLabel,
    filters,
    simulation: true,
    headers: [prcView ? "Facility" : null, "Blood type", "Component", "Eligible unreserved stock", "Expected demand", "Forecast horizon", "Uncertainty", "Safety allowance", "Minimum reserve", "Estimated surplus", "Status", "Explanation", "Generated", "Freshness"].filter(Boolean),
    rows: (data?.assessments || []).map((row) => [prcView ? hospitalById(row.facilityId)?.name : null, row.bloodType, row.component, row.eligibleUnreservedStock, row.expectedDemand, row.forecastHorizon, row.uncertainty, row.safetyAllowance, row.minimumReserve, row.estimatedSurplus, row.freshness === "Stale" ? "Assessment unavailable" : row.status, row.freshness === "Stale" ? "Forecast is stale and cannot support an assessment." : row.explanation, row.generatedAt, row.freshness].filter((value, index) => prcView || index !== 0)),
    filename: "analytics-redistribution-assessment",
  });

  return (
    <div className="page analytics-page">
      <PageHead eyebrow={prcView ? "Philippine Red Cross" : hospital?.short} title="Analytics" sub="Review observed historical blood demand and backend-supplied redistribution assessments." />

      <div className="analytics-simulation-banner"><I name="info" size={17} /><div><strong>Simulation only—not authorization to redistribute</strong><span>Demand history is synthetic. Forecast and surplus results require authorized human review and an approved backend policy.</span></div></div>

      <section className="card analytics-filters">
        <div className="card-h"><div><h3>Reporting filters</h3><div className="sub muted">Exports use this exact filtered view.</div></div><Chip kind="info" dot>{scopeLabel}</Chip></div>
        <div className="card-b analytics-filter-grid">
          <label><span>Date from</span><input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
          <label><span>Date to</span><input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} /></label>
          <label><span>Blood type</span><select value={filters.bloodType} onChange={(event) => setFilters((current) => ({ ...current, bloodType: event.target.value }))}><option>All</option>{BLOOD_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Component</span><select value={filters.component} onChange={(event) => setFilters((current) => ({ ...current, component: event.target.value }))}><option>All</option>{(window.COMPONENTS || []).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>{groupLabel}</span><select value={filters.group} onChange={(event) => setFilters((current) => ({ ...current, group: event.target.value }))}><option>All</option>{groupOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </div>
      </section>

      {status === "loading" && <AnalyticsState kind="loading" title="Loading authorized analytics" text="Applying the reporting scope and selected filters…" />}
      {status === "error" && <AnalyticsState kind="error" title="Analytics could not be loaded" text="The mock analytics service did not return a usable response." action={<Btn onClick={load}>Retry</Btn>} />}
      {status === "empty" && <AnalyticsState kind="empty" title="No records match these filters" text="Adjust the date range, blood type, component, or requesting group." />}

      {status === "ready" && <>
        <div className="analytics-meta-row">
          <span><b>Coverage</b> {data.meta.coverageStart}–{data.meta.coverageEnd}</span>
          <span><b>Completeness</b> {data.meta.completeness}</span>
          <span><b>Last successful update</b> <span className="mono">{data.meta.lastSuccessfulUpdate}</span></span>
          <Chip kind="warn">Synthetic data</Chip>
        </div>

        <div className="analytics-stat-grid">
          <AnalyticsStat label="Blood requests" value={totalRequests} sub="Request events, not units" />
          <AnalyticsStat label="Units requested" value={totalUnits} sub="Requested quantity" />
          <AnalyticsStat label="Confirmed units used" value="—" sub="Approved aggregate source unavailable" unavailable />
          <AnalyticsStat label={`Highest requesting ${prcView ? "hospital" : "department"}`} value={ranked[0]?.label || "—"} sub={ranked[0] ? `${ranked[0].unitsRequested} requested units` : "No classified records"} text />
          <AnalyticsStat label="Highest-volume month" value={peak?.month || "—"} sub={peak ? `${peak.units} units · ${peak.units >= average ? "+" : ""}${(peak.units - average).toFixed(1)} vs monthly average` : "No complete month"} text />
        </div>

        <div className="analytics-two-column">
          <section className="card">
            <div className="card-h analytics-card-head"><div><h3>Which {prcView ? "hospitals" : "departments"} request blood most often?</h3><div className="sub muted">Ranked using the selected historical period.</div></div><div className="row"><button className={`filter-chip ${metric === "requestCount" ? "active" : ""}`} onClick={() => setMetric("requestCount")}>Requests</button><button className={`filter-chip ${metric === "unitsRequested" ? "active" : ""}`} onClick={() => setMetric("unitsRequested")}>Units</button><Btn size="sm" icon="download" onClick={exportDemand}>Export CSV</Btn></div></div>
            <div className="card-b analytics-ranked-chart">
              {ranked.map((row) => <div className="analytics-ranked-row" key={row.label}><span>{row.label}</span><div><i style={{ width: `${(row[metric] / maxRank) * 100}%` }} /></div><b className="mono">{row[metric]}</b></div>)}
            </div>
            <div className="analytics-table-wrap"><table><thead><tr><th>{groupLabel}</th><th>Requests</th><th>Units</th><th>% of selected units</th></tr></thead><tbody>{ranked.map((row) => <tr key={row.label}><td>{row.label}</td><td className="mono">{row.requestCount}</td><td className="mono">{row.unitsRequested}</td><td className="mono">{totalUnits ? ((row.unitsRequested / totalUnits) * 100).toFixed(1) : 0}%</td></tr>)}</tbody></table></div>
          </section>

          <section className="card">
            <div className="card-h analytics-card-head"><div><h3>Which months have the greatest blood demand?</h3><div className="sub muted">Observed requested units; incomplete months are hatched.</div></div><div className="row">{comparableYears && <button className={`filter-chip ${yearOverYear ? "active" : ""}`} onClick={() => setYearOverYear((value) => !value)}>Year over year</button>}<Btn size="sm" kind="ghost" onClick={() => setShowTable((value) => !value)}>{showTable ? "Show chart" : "Table alternative"}</Btn><Btn size="sm" icon="download" onClick={exportMonthly}>Export CSV</Btn></div></div>
            <div className="card-b">
              {showTable ? <div className="analytics-table-wrap"><table><thead><tr><th>Month</th><th>Requested units</th><th>Coverage</th><th>Confirmed use</th></tr></thead><tbody>{monthly.map((row) => <tr key={row.month}><td className="mono">{row.month}</td><td className="mono">{row.units}</td><td><Chip kind={row.complete ? "ok" : "warn"}>{row.complete ? "Complete" : "Incomplete"}</Chip></td><td>Not available</td></tr>)}</tbody></table></div> : yearOverYear && comparableYears ? <div className="analytics-yoy-chart">{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((monthNumber) => <div key={monthNumber}><div>{comparisonYears.map((year, yearIndex) => { const item = monthly.find((row) => row.month === `${year}-${monthNumber}`); return <i key={year} className={`year-${yearIndex + 1}`} style={{ height: `${Math.max(6, ((item?.units || 0) / maxMonth) * 100)}%` }} title={`${year}-${monthNumber}: ${item?.units || "Missing"}`} />; })}</div><span>{monthNumber}</span></div>)}<aside>{comparisonYears.map((year, index) => <span key={year}><i className={`year-${index + 1}`} />{year}</span>)}</aside></div> : <div className="analytics-month-chart">{monthly.map((row) => <div key={row.month} title={`${row.month}: ${row.units} requested units${row.complete ? "" : " (incomplete)"}`}><b className="mono">{row.units}</b><i className={row.complete ? "" : "incomplete"} style={{ height: `${Math.max(8, (row.units / maxMonth) * 100)}%` }} /><span>{row.month.slice(2)}</span></div>)}</div>}
              <div className="analytics-chart-notes"><span>Complete-month average: <b>{average.toFixed(1)} units</b></span><span>Confirmed use: <b>Unavailable</b></span><span>Year-over-year: <b>{comparableYears ? "Available for selected complete years" : "Needs two comparable complete years"}</b></span></div>
            </div>
          </section>
        </div>

        <section className="card analytics-purpose-panel"><div className="card-h"><div><h3>Requested purpose and actual use</h3><div className="sub muted">Requested purpose and confirmed use remain separate datasets.</div></div></div><div className="card-b analytics-awaiting"><I name="clock" size={20} /><div><strong>Awaiting approved aggregate categories and data source</strong><span>No patient details, diagnoses, treatments, clinical free text, or inferred classifications are shown.</span></div></div></section>

        <section className="card">
          <div className="card-h analytics-card-head"><div><h3>Redistribution assessment</h3><div className="sub muted">Backend-shaped values by blood type and component. The frontend performs no surplus calculation.</div></div><Btn size="sm" icon="download" onClick={exportAssessment}>Export CSV</Btn></div>
          <div className="analytics-table-wrap"><table className="analytics-assessment-table"><thead><tr>{prcView && <th>Facility</th>}<th>Blood</th><th>Component</th><th>Eligible stock</th><th>Expected demand</th><th>Horizon</th><th>Uncertainty</th><th>Safety</th><th>Reserve</th><th>Est. surplus</th><th>Assessment</th><th>Generated / freshness</th></tr></thead><tbody>{(data.assessments || []).map((row, index) => { const unavailable = row.estimatedSurplus == null || row.freshness === "Stale"; return <tr key={`${row.facilityId}-${row.bloodType}-${row.component}-${index}`}>{prcView && <td>{hospitalById(row.facilityId)?.short}</td>}<td><BloodType type={row.bloodType} /></td><td>{row.component}</td><td className="mono">{row.eligibleUnreservedStock}</td><td className="mono">{row.expectedDemand}</td><td>{row.forecastHorizon}</td><td className="mono">{row.uncertainty}</td><td className="mono">{row.safetyAllowance}</td><td className="mono">{row.minimumReserve}</td><td className="mono">{row.estimatedSurplus == null ? "—" : row.estimatedSurplus}</td><td><Chip kind={unavailable ? "warn" : row.status === "Review candidate" ? "info" : "neutral"}>{unavailable ? "Assessment unavailable" : row.status}</Chip><small>{unavailable && row.freshness === "Stale" ? "Forecast is stale." : row.explanation}</small></td><td><span className="mono small">{row.generatedAt}</span><Chip kind={row.freshness === "Current" ? "ok" : "warn"}>{row.freshness}</Chip></td></tr>; })}</tbody></table></div>
          <div className="analytics-table-disclosure">Simulation only—not authorization to redistribute. Operational release always requires authorized human review.</div>
        </section>
      </>}
    </div>
  );
}

function AnalyticsStat({ label, value, sub, unavailable, text }) {
  return <div className={`analytics-stat ${unavailable ? "unavailable" : ""}`}><span>{label}</span><strong className={text ? "text-value" : "serif"}>{value}</strong><small>{sub}</small></div>;
}

function AnalyticsState({ kind, title, text, action }) {
  return <div className={`analytics-state ${kind}`} role={kind === "error" || kind === "unauthorized" ? "alert" : "status"}><I name={kind === "unauthorized" ? "shield" : kind === "error" ? "alerts" : kind === "loading" ? "refresh" : "search"} size={24} /><div><strong>{title}</strong><span>{text}</span></div>{action}</div>;
}

Object.assign(window, { AnalyticsPage });
