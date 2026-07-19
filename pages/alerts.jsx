// pages/alerts.jsx
// Simplified BloodLedger alert center.
//
// This version removes blockchain peer terminology, ledger links,
// subscription controls, detailed threshold rules, and algorithm-specific
// recommendations.
//
// Alert behavior and hospital-specific escalation rules can be refined
// after stakeholder validation.

function AlertsPage({ permissions, onAct, onNav }) {
  const alerts = window.ALERTS || [];

  const [filter, setFilter] = React.useState("all");

  const counts = alerts.reduce((result, alert) => {
    const severity = alert.severity || "info";

    result[severity] =
      (result[severity] || 0) + 1;

    return result;
  }, {});

  const filtered =
    filter === "all"
      ? alerts
      : alerts.filter(
          (alert) =>
            alert.severity === filter
        );

  return (
    <div className="page">
      <PageHead
        eyebrow="BloodLedger"
        title="Alerts"
        sub="View important inventory and system notifications."
      />

      {/* Summary */}
      <div className="stat-grid">
        <Stat
          label="All Alerts"
          value={alerts.length}
          unit=""
        />

        <Stat
          label="Critical"
          value={counts.critical || 0}
          unit=""
          accent="critical"
        />

        <Stat
          label="Warnings"
          value={counts.warn || 0}
          unit=""
          accent="warn"
        />

        <Stat
          label="Information"
          value={counts.info || 0}
          unit=""
          accent="info"
        />
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        {/* Filters */}
        <div className="filters">
          {[
            [
              "all",
              "All",
              alerts.length,
            ],
            [
              "critical",
              "Critical",
              counts.critical || 0,
            ],
            [
              "warn",
              "Warnings",
              counts.warn || 0,
            ],
            [
              "info",
              "Information",
              counts.info || 0,
            ],
          ].map(
            ([key, label, count]) => (
              <button
                key={key}
                className={`filter-chip ${
                  filter === key
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setFilter(key)
                }
              >
                {label}

                <span className="count">
                  {count}
                </span>
              </button>
            )
          )}
        </div>

        {/* Alert list */}
        <div
          className="card-b"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((alert) => {
              const severity =
                alert.severity ||
                "info";

              const chipKind =
                severity === "critical"
                  ? "solid-critical"
                  : severity === "warn"
                  ? "warn"
                  : "info";

              return (
                <div
                  key={alert.id}
                  className={`alert-card ${severity}`}
                >
                  <div
                    className="row"
                    style={{
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        className="row"
                        style={{
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          className={`chip ${chipKind}`}
                          style={
                            severity ===
                            "critical"
                              ? {
                                  color:
                                    "#fff",
                                }
                              : null
                          }
                        >
                          {severity.toUpperCase()}
                        </span>

                        {alert.when && (
                          <span className="muted tiny">
                            <I
                              name="clock"
                              size={11}
                            />{" "}
                            {alert.when}
                          </span>
                        )}
                      </div>

                      <div className="title">
                        {alert.title ||
                          "System Alert"}
                      </div>

                      <div className="desc">
                        {alert.desc ||
                          "No additional information available."}
                      </div>

                      {alert.source && (
                        <div
                          className="muted tiny"
                          style={{
                            marginTop: 8,
                          }}
                        >
                          Source:{" "}
                          {alert.source}
                        </div>
                      )}
                    </div>

                    {/* Keep actions intentionally simple */}
                    <div
                      className="actions"
                      style={{
                        flexShrink: 0,
                      }}
                    >
                      {alert.actions &&
                        alert.actions
                          .slice(0, 1)
                          .map(
                            (
                              action,
                              index
                            ) => (
                              <Btn
                                key={
                                  index
                                }
                                size="sm"
                                kind={
                                  action.kind ===
                                  "primary"
                                    ? "primary"
                                    : "ghost"
                                }
                                onClick={() => {
                                  if (
                                    action.goto &&
                                    onAct
                                  ) {
                                    onAct(
                                      action
                                    );
                                  }
                                }}
                              >
                                {
                                  action.label
                                }
                              </Btn>
                            )
                          )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="muted"
              style={{
                textAlign: "center",
                padding: 32,
              }}
            >
              No alerts match the
              selected filter.
            </div>
          )}
        </div>
      </div>

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
                Prototype alert system
              </div>

              <div className="muted tiny">
                Alert types,
                notification thresholds,
                escalation procedures, and
                required user actions are
                placeholders and may change
                after consultation with
                hospital stakeholders.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AlertsPage,
});