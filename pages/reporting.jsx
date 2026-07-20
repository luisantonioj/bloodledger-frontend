// pages/reporting.jsx
// BloodLedger — DOH Compliance Reports
//
// Prototype implementation of twice-daily blood stock reporting.
//
// Reporting checkpoints:
//   Morning:   9:00 AM
//   Afternoon: 4:00 PM
//
// Current behavior:
// - Reads current blood inventory.
// - Summarizes stock by blood type and blood component.
// - Allows an authorized hospital user to capture a checkpoint snapshot.
// - Allows captured snapshots to be marked as verified.
// - Allows verified records to be exported as CSV.
// - DOH/regulator users receive a read-only monitoring view.
//
// Direct electronic submission to DOH is intentionally not implemented
// until the exact submission process is validated with stakeholders.

function ReportingPage({
  hospital,
  session,
  permissions,
}) {
  const inventory = window.INVENTORY || [];
  const bloodTypes = window.BLOOD_TYPES || [];
  const components = window.COMPONENTS || [];

  const isRegulator =
    permissions?.roleKey === "regulator";

  const isReadOnly =
    permissions?.readOnly || isRegulator;

  const reportingHospital =
    hospital || {
      id: "MMC-LIP",
      name: "Mary Mediatrix Medical Center",
      short: "Mary Mediatrix",
    };

  const [selectedPeriod, setSelectedPeriod] =
    React.useState("09:00");

  const [selectedSnapshotId, setSelectedSnapshotId] =
    React.useState(null);

  const [snapshots, setSnapshots] =
    React.useState(() => {
      if (
        window.COMPLIANCE_SNAPSHOTS &&
        window.COMPLIANCE_SNAPSHOTS.length
      ) {
        return window.COMPLIANCE_SNAPSHOTS;
      }

      return [
        {
          id: "CSR-2026-0720-AM",
          date: "2026-07-20",
          period: "09:00",
          periodLabel: "9:00 AM",

          hospitalId: "MMC-LIP",

          hospitalName:
            "Mary Mediatrix Medical Center",

          capturedAt:
            "2026-07-20 09:00",

          capturedBy:
            "Blood Bank Staff",

          status:
            "Verified",

          verifiedAt:
            "2026-07-20 09:08",

          verifiedBy:
            "Blood Bank Head",

          totals:
            buildComplianceMatrix(
              inventory,
              bloodTypes,
              components
            ),
        },

        {
          id: "CSR-2026-0719-PM",
          date: "2026-07-19",
          period: "16:00",
          periodLabel: "4:00 PM",

          hospitalId: "MMC-LIP",

          hospitalName:
            "Mary Mediatrix Medical Center",

          capturedAt:
            "2026-07-19 16:00",

          capturedBy:
            "Blood Bank Staff",

          status:
            "Verified",

          verifiedAt:
            "2026-07-19 16:11",

          verifiedBy:
            "Blood Bank Head",

          totals:
            buildComplianceMatrix(
              inventory,
              bloodTypes,
              components
            ),
        },
      ];
    });


  // Keep prototype snapshot data available globally.
  React.useEffect(() => {
    window.COMPLIANCE_SNAPSHOTS =
      snapshots;
  }, [snapshots]);


  // Build the current live inventory matrix.
  const liveMatrix =
    React.useMemo(
      () =>
        buildComplianceMatrix(
          inventory,
          bloodTypes,
          components
        ),
      [
        inventory,
        bloodTypes,
        components,
      ]
    );


  // Calculate current total inventory.
  const liveTotal =
    liveMatrix.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Object.values(
          row.components
        ).reduce(
          (
            componentSum,
            value
          ) =>
            componentSum +
            value,
          0
        ),
      0
    );


  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  const selectedPeriodLabel =
    selectedPeriod ===
    "09:00"
      ? "9:00 AM"
      : "4:00 PM";


  const selectedSnapshot =
    snapshots.find(
      (
        snapshot
      ) =>
        snapshot.id ===
        selectedSnapshotId
    ) ||
    snapshots[0] ||
    null;


  const checkpointExists =
    snapshots.some(
      (
        snapshot
      ) =>
        snapshot.date ===
          today &&
        snapshot.period ===
          selectedPeriod &&
        snapshot.hospitalId ===
          reportingHospital.id
    );


  // =========================================================
  // CAPTURE SNAPSHOT
  // =========================================================

  const captureSnapshot =
    () => {
      if (
        isReadOnly
      ) {
        return;
      }

      if (
        checkpointExists
      ) {
        return;
      }


      const now =
        new Date();


      const capturedAt =
        now
          .toISOString()
          .slice(
            0,
            16
          )
          .replace(
            "T",
            " "
          );


      const suffix =
        selectedPeriod ===
        "09:00"
          ? "AM"
          : "PM";


      const id =
        `CSR-${today.replaceAll(
          "-",
          ""
        )}-${suffix}`;


      const snapshot = {
        id,

        date:
          today,

        period:
          selectedPeriod,

        periodLabel:
          selectedPeriodLabel,

        hospitalId:
          reportingHospital.id,

        hospitalName:
          reportingHospital.name,

        capturedAt,

        capturedBy:
          session?.user?.name ||
          "Authorized User",

        status:
          "Pending Verification",

        verifiedAt:
          null,

        verifiedBy:
          null,

        totals:
          liveMatrix.map(
            (
              row
            ) => ({
              ...row,

              components: {
                ...row.components,
              },
            })
          ),
      };


      setSnapshots(
        (
          current
        ) => [
          snapshot,
          ...current,
        ]
      );


      setSelectedSnapshotId(
        id
      );
    };


  // =========================================================
  // VERIFY SNAPSHOT
  // =========================================================

  const verifySnapshot =
    (
      snapshotId
    ) => {
      if (
        isReadOnly
      ) {
        return;
      }


      const now =
        new Date()
          .toISOString()
          .slice(
            0,
            16
          )
          .replace(
            "T",
            " "
          );


      setSnapshots(
        (
          current
        ) =>
          current.map(
            (
              snapshot
            ) =>
              snapshot.id ===
              snapshotId
                ? {
                    ...snapshot,

                    status:
                      "Verified",

                    verifiedAt:
                      now,

                    verifiedBy:
                      session?.user?.name ||
                      "Authorized User",
                  }
                : snapshot
          )
      );
    };


  // =========================================================
  // EXPORT SNAPSHOT AS CSV
  // =========================================================

  const exportSnapshotCSV =
    (
      snapshot
    ) => {
      if (
        !snapshot
      ) {
        return;
      }


      const rows =
        [];


      // -------------------------------------------------------
      // Report metadata
      // -------------------------------------------------------

      rows.push([
        "BloodLedger Compliance Report",
      ]);

      rows.push(
        []
      );


      rows.push([
        "Record ID",
        snapshot.id,
      ]);


      rows.push([
        "Facility",
        snapshot.hospitalName,
      ]);


      rows.push([
        "Date",
        snapshot.date,
      ]);


      rows.push([
        "Reporting Checkpoint",
        snapshot.periodLabel,
      ]);


      rows.push([
        "Captured At",
        snapshot.capturedAt,
      ]);


      rows.push([
        "Captured By",
        snapshot.capturedBy,
      ]);


      rows.push([
        "Status",
        snapshot.status,
      ]);


      rows.push([
        "Verified At",
        snapshot.verifiedAt ||
          "",
      ]);


      rows.push([
        "Verified By",
        snapshot.verifiedBy ||
          "",
      ]);


      rows.push(
        []
      );


      // -------------------------------------------------------
      // Table header
      // -------------------------------------------------------

      rows.push([
        "Blood Type",
        ...components,
        "Total",
      ]);


      // -------------------------------------------------------
      // Blood inventory rows
      // -------------------------------------------------------

      snapshot.totals.forEach(
        (
          row
        ) => {
          const componentValues =
            components.map(
              (
                component
              ) =>
                row.components[
                  component
                ] ||
                0
            );


          const total =
            componentValues.reduce(
              (
                sum,
                value
              ) =>
                sum +
                value,
              0
            );


          rows.push([
            row.type,
            ...componentValues,
            total,
          ]);
        }
      );


      // -------------------------------------------------------
      // Convert to CSV
      // -------------------------------------------------------

      const csv =
        rows
          .map(
            (
              row
            ) =>
              row
                .map(
                  (
                    value
                  ) => {
                    const text =
                      String(
                        value ??
                        ""
                      );


                    return `"${text.replace(
                      /"/g,
                      '""'
                    )}"`;
                  }
                )
                .join(
                  ","
                )
          )
          .join(
            "\n"
          );


      // Add UTF-8 BOM so spreadsheet software
      // opens the file with proper encoding.
      const csvContent =
        "\uFEFF" +
        csv;


      const blob =
        new Blob(
          [
            csvContent,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      const safeFacility =
        String(
          snapshot.hospitalName ||
          "Hospital"
        )
          .replace(
            /[^a-z0-9]/gi,
            "_"
          )
          .replace(
            /_+/g,
            "_"
          );


      const safePeriod =
        snapshot.period.replace(
          ":",
          ""
        );


      link.href =
        url;


      link.download =
        `BloodLedger_Compliance_${safeFacility}_${snapshot.date}_${safePeriod}.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );
    };


  return (
    <div className="page">

      <PageHead

        eyebrow={
          isRegulator
            ? "DOH Compliance Monitoring"
            : reportingHospital.short
        }

        title="Compliance Reports"

        sub={
          isRegulator
            ? "Review twice-daily hospital blood stock records."
            : "Capture, verify, and export the hospital's 9:00 AM and 4:00 PM blood stock records."
        }

      />


      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="stat-grid">

        <Stat

          label="Current Inventory"

          value={
            liveTotal
          }

          unit=" units"

        />


        <Stat

          label="Today's Checkpoints"

          value={
            snapshots.filter(
              (
                snapshot
              ) =>
                snapshot.date ===
                today
            ).length
          }

          unit=" / 2"

        />


        <Stat

          label="Pending Verification"

          value={
            snapshots.filter(
              (
                snapshot
              ) =>
                snapshot.status ===
                "Pending Verification"
            ).length
          }

        />


        <Stat

          label="Verified Records"

          value={
            snapshots.filter(
              (
                snapshot
              ) =>
                snapshot.status ===
                "Verified"
            ).length
          }

        />

      </div>


      <div
        style={{
          height:
            18,
        }}
      />


      {/* =====================================================
          DAILY CHECKPOINTS
          ===================================================== */}

      {!isRegulator && (

        <>

          <div className="card">

            <div className="card-h">

              <div>

                <h3>
                  Today's Reporting Checkpoints
                </h3>


                <div className="sub muted">
                  Blood stock is recorded twice daily at 9:00 AM and 4:00 PM.
                </div>

              </div>

            </div>


            <div className="card-b">

              <div

                style={{

                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",

                  gap:
                    14,

                }}

              >

                <CheckpointCard

                  time="09:00"

                  label="9:00 AM"

                  title="Morning Stock Record"

                  selected={
                    selectedPeriod ===
                    "09:00"
                  }

                  snapshot={
                    snapshots.find(
                      (
                        snapshot
                      ) =>
                        snapshot.date ===
                          today &&
                        snapshot.period ===
                          "09:00"
                    )
                  }

                  onSelect={() =>
                    setSelectedPeriod(
                      "09:00"
                    )
                  }

                />


                <CheckpointCard

                  time="16:00"

                  label="4:00 PM"

                  title="Afternoon Stock Record"

                  selected={
                    selectedPeriod ===
                    "16:00"
                  }

                  snapshot={
                    snapshots.find(
                      (
                        snapshot
                      ) =>
                        snapshot.date ===
                          today &&
                        snapshot.period ===
                          "16:00"
                    )
                  }

                  onSelect={() =>
                    setSelectedPeriod(
                      "16:00"
                    )
                  }

                />

              </div>


              <div

                style={{

                  marginTop:
                    18,

                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    16,

                  flexWrap:
                    "wrap",

                }}

              >

                <div>

                  <div className="small">
                    Selected checkpoint
                  </div>


                  <div

                    className="muted tiny"

                    style={{
                      marginTop:
                        3,
                    }}

                  >

                    {selectedPeriodLabel}
                    {" · "}
                    {today}

                  </div>

                </div>


                {!isReadOnly && (

                  <Btn

                    kind="primary"

                    icon="check"

                    disabled={
                      checkpointExists
                    }

                    onClick={
                      captureSnapshot
                    }

                  >

                    {
                      checkpointExists

                        ? "Snapshot Already Captured"

                        : `Capture ${selectedPeriodLabel} Snapshot`
                    }

                  </Btn>

                )}

              </div>

            </div>

          </div>


          <div
            style={{
              height:
                18,
            }}
          />

        </>

      )}


      {/* =====================================================
          LIVE INVENTORY PREVIEW
          ===================================================== */}

      <div className="card">

        <div className="card-h">

          <div>

            <h3>
              Current Blood Stock
            </h3>


            <div className="sub muted">
              Current inventory summary by blood type and component.
            </div>

          </div>


          <Chip
            kind="info"
            dot
          >
            Live Inventory
          </Chip>

        </div>


        <div className="card-b flush">

          <ComplianceMatrixTable

            matrix={
              liveMatrix
            }

            components={
              components
            }

          />

        </div>

      </div>


      <div
        style={{
          height:
            18,
        }}
      />


      {/* =====================================================
          SNAPSHOT HISTORY + DETAILS
          ===================================================== */}

      <div

        style={{

          display:
            "grid",

          gridTemplateColumns:
            "minmax(0, 1.45fr) minmax(300px, 0.55fr)",

          gap:
            18,

          alignItems:
            "start",

        }}

      >

        {/* History */}
        <div className="card">

          <div className="card-h">

            <div>

              <h3>
                Compliance Record History
              </h3>


              <div className="sub muted">
                Previously captured morning and afternoon stock records.
              </div>

            </div>

          </div>


          <div className="card-b flush">

            <table className="tbl">

              <thead>

                <tr>

                  <th>
                    Record ID
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Checkpoint
                  </th>

                  <th>
                    Facility
                  </th>

                  <th>
                    Captured
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  snapshots.length

                    ? snapshots.map(
                        (
                          snapshot
                        ) => (

                          <tr

                            key={
                              snapshot.id
                            }

                            className="row-clickable"

                            onClick={() =>
                              setSelectedSnapshotId(
                                snapshot.id
                              )
                            }

                            style={

                              selectedSnapshot?.id ===
                              snapshot.id

                                ? {
                                    background:
                                      "rgba(154, 27, 27, 0.04)",
                                  }

                                : null

                            }

                          >

                            <td className="mono small">
                              {
                                snapshot.id
                              }
                            </td>


                            <td>
                              {
                                snapshot.date
                              }
                            </td>


                            <td>
                              {
                                snapshot.periodLabel
                              }
                            </td>


                            <td>
                              {
                                snapshot.hospitalName
                              }
                            </td>


                            <td className="mono small">
                              {
                                snapshot.capturedAt
                              }
                            </td>


                            <td>

                              <Chip

                                kind={

                                  snapshot.status ===
                                  "Verified"

                                    ? "ok"

                                    : "warn"

                                }

                                dot

                              >

                                {
                                  snapshot.status
                                }

                              </Chip>

                            </td>

                          </tr>

                        )
                      )

                    : (

                      <tr>

                        <td

                          colSpan="6"

                          className="muted"

                          style={{

                            textAlign:
                              "center",

                            padding:
                              32,

                          }}

                        >

                          No compliance records available.

                        </td>

                      </tr>

                    )
                }

              </tbody>

            </table>

          </div>

        </div>


        {/* ===================================================
            RECORD DETAILS
            =================================================== */}

        <div className="card">

          <div className="card-h">

            <div>

              <h3>
                Record Details
              </h3>


              <div className="sub muted">
                Selected compliance snapshot.
              </div>

            </div>

          </div>


          <div className="card-b">

            {
              !selectedSnapshot

                ? (

                  <div

                    className="muted"

                    style={{

                      textAlign:
                        "center",

                      padding:
                        24,

                    }}

                  >

                    Select a record to view details.

                  </div>

                )

                : (

                  <>

                    <div

                      style={{

                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "flex-start",

                        gap:
                          12,

                      }}

                    >

                      <div>

                        <div className="mono small">
                          {
                            selectedSnapshot.id
                          }
                        </div>


                        <div

                          style={{

                            fontWeight:
                              600,

                            marginTop:
                              4,

                          }}

                        >

                          {
                            selectedSnapshot.periodLabel
                          }
                          {" "}
                          Stock Record

                        </div>

                      </div>


                      <Chip

                        kind={

                          selectedSnapshot.status ===
                          "Verified"

                            ? "ok"

                            : "warn"

                        }

                        dot

                      >

                        {
                          selectedSnapshot.status
                        }

                      </Chip>

                    </div>


                    <div className="divider" />


                    <dl className="kv">

                      <dt>
                        Facility
                      </dt>

                      <dd>
                        {
                          selectedSnapshot.hospitalName
                        }
                      </dd>


                      <dt>
                        Date
                      </dt>

                      <dd>
                        {
                          selectedSnapshot.date
                        }
                      </dd>


                      <dt>
                        Checkpoint
                      </dt>

                      <dd>
                        {
                          selectedSnapshot.periodLabel
                        }
                      </dd>


                      <dt>
                        Captured at
                      </dt>

                      <dd className="mono small">
                        {
                          selectedSnapshot.capturedAt
                        }
                      </dd>


                      <dt>
                        Captured by
                      </dt>

                      <dd>
                        {
                          selectedSnapshot.capturedBy
                        }
                      </dd>


                      <dt>
                        Verified at
                      </dt>

                      <dd className="mono small">
                        {
                          selectedSnapshot.verifiedAt ||
                          "Not yet verified"
                        }
                      </dd>


                      <dt>
                        Verified by
                      </dt>

                      <dd>
                        {
                          selectedSnapshot.verifiedBy ||
                          "Not yet verified"
                        }
                      </dd>

                    </dl>


                    <div className="divider" />


                    <div

                      style={{

                        display:
                          "flex",

                        gap:
                          8,

                        flexWrap:
                          "wrap",

                      }}

                    >

                      {
                        selectedSnapshot.status ===
                          "Pending Verification" &&
                        !isReadOnly &&
                        (

                          <Btn

                            kind="primary"

                            icon="check"

                            onClick={() =>
                              verifySnapshot(
                                selectedSnapshot.id
                              )
                            }

                          >

                            Verify Record

                          </Btn>

                        )
                      }


                      {
                        selectedSnapshot.status ===
                          "Verified" &&
                        (

                          <Btn

                            icon="download"

                            onClick={() =>
                              exportSnapshotCSV(
                                selectedSnapshot
                              )
                            }

                          >

                            Export CSV

                          </Btn>

                        )
                      }

                    </div>

                  </>

                )
            }

          </div>

        </div>

      </div>


      {/* =====================================================
          SELECTED SNAPSHOT MATRIX
          ===================================================== */}

      {
        selectedSnapshot &&
        (

          <>

            <div
              style={{
                height:
                  18,
              }}
            />


            <div className="card">

              <div className="card-h">

                <div>

                  <h3>
                    Recorded Blood Stock
                  </h3>


                  <div className="sub muted">

                    Inventory values captured for{" "}

                    {
                      selectedSnapshot.periodLabel
                    }

                    {" "}on{" "}

                    {
                      selectedSnapshot.date
                    }

                    .

                  </div>

                </div>


                {
                  selectedSnapshot.status ===
                  "Verified" &&
                  (

                    <Btn

                      icon="download"

                      size="sm"

                      onClick={() =>
                        exportSnapshotCSV(
                          selectedSnapshot
                        )
                      }

                    >

                      Export CSV

                    </Btn>

                  )
                }

              </div>


              <div className="card-b flush">

                <ComplianceMatrixTable

                  matrix={
                    selectedSnapshot.totals
                  }

                  components={
                    components
                  }

                />

              </div>

            </div>

          </>

        )
      }


      <div
        style={{
          height:
            18,
        }}
      />


      {/* =====================================================
          PROTOTYPE NOTE
          ===================================================== */}

      <div className="card">

        <div className="card-b">

          <div

            className="row"

            style={{

              gap:
                12,

              alignItems:
                "flex-start",

            }}

          >

            <I
              name="info"
              size={16}
            />


            <div>

              <div className="small">
                Prototype compliance workflow
              </div>


              <div

                className="muted tiny"

                style={{

                  marginTop:
                    4,

                  lineHeight:
                    1.6,

                }}

              >

                BloodLedger generates twice-daily inventory snapshots from the
                hospital's recorded blood stock. Verified records can be
                exported as CSV files for spreadsheet use, record keeping, or
                preparation for submission. The exact verification, approval,
                official export format, and submission process will be
                finalized after validation with hospital and DOH stakeholders.
                This prototype does not assume a direct electronic connection
                to DOH.

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   CHECKPOINT CARD
   ========================================================= */

function CheckpointCard({
  label,
  title,
  selected,
  snapshot,
  onSelect,
}) {
  const complete =
    !!snapshot;


  return (

    <button

      type="button"

      onClick={
        onSelect
      }

      style={{

        width:
          "100%",

        textAlign:
          "left",

        padding:
          "18px",

        borderRadius:
          "10px",

        border:
          selected

            ? "1px solid var(--blood)"

            : "1px solid var(--line)",

        background:
          selected

            ? "rgba(154, 27, 27, 0.035)"

            : "var(--surface)",

        color:
          "inherit",

        cursor:
          "pointer",

        fontFamily:
          "inherit",

      }}

    >

      <div

        style={{

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap:
            12,

        }}

      >

        <div>

          <div

            className="serif"

            style={{

              fontSize:
                "22px",

              fontWeight:
                600,

            }}

          >

            {
              label
            }

          </div>


          <div

            className="small"

            style={{
              marginTop:
                4,
            }}

          >

            {
              title
            }

          </div>

        </div>


        <Chip

          kind={

            complete

              ? snapshot.status ===
                "Verified"

                ? "ok"

                : "warn"

              : "neutral"

          }

          dot={
            complete
          }

        >

          {
            complete

              ? snapshot.status

              : "Not Captured"
          }

        </Chip>

      </div>


      <div

        className="muted tiny"

        style={{

          marginTop:
            12,

          lineHeight:
            1.5,

        }}

      >

        {
          complete

            ? `Captured ${snapshot.capturedAt}`

            : "Inventory snapshot has not yet been recorded for this checkpoint."
        }

      </div>

    </button>

  );
}


/* =========================================================
   COMPLIANCE MATRIX TABLE
   ========================================================= */

function ComplianceMatrixTable({
  matrix,
  components,
}) {
  return (

    <div

      style={{
        overflowX:
          "auto",
      }}

    >

      <table className="tbl">

        <thead>

          <tr>

            <th>
              Blood Type
            </th>


            {
              components.map(
                (
                  component
                ) => (

                  <th
                    key={
                      component
                    }
                  >

                    {
                      component
                    }

                  </th>

                )
              )
            }


            <th>
              Total
            </th>

          </tr>

        </thead>


        <tbody>

          {
            matrix.map(
              (
                row
              ) => {

                const total =
                  Object.values(
                    row.components
                  ).reduce(
                    (
                      sum,
                      value
                    ) =>
                      sum +
                      value,
                    0
                  );


                return (

                  <tr
                    key={
                      row.type
                    }
                  >

                    <td>

                      <BloodType
                        type={
                          row.type
                        }
                      />

                    </td>


                    {
                      components.map(
                        (
                          component
                        ) => (

                          <td

                            key={
                              component
                            }

                            className="tnum"

                          >

                            {
                              row.components[
                                component
                              ] ||
                              0
                            }

                          </td>

                        )
                      )
                    }


                    <td

                      className="tnum"

                      style={{
                        fontWeight:
                          600,
                      }}

                    >

                      {
                        total
                      }

                    </td>

                  </tr>

                );

              }
            )
          }

        </tbody>

      </table>

    </div>

  );
}


/* =========================================================
   BUILD STOCK MATRIX FROM INVENTORY
   ========================================================= */

function buildComplianceMatrix(
  inventory,
  bloodTypes,
  components
) {
  return bloodTypes.map(
    (
      bloodType
    ) => {

      const componentTotals =
        {};


      components.forEach(
        (
          component
        ) => {

          componentTotals[
            component
          ] =

            inventory.filter(
              (
                unit
              ) =>

                unit.type ===
                  bloodType &&

                unit.comp ===
                  component &&

                unit.status !==
                  "Expired" &&

                unit.status !==
                  "Discarded"

            ).length;

        }
      );


      return {

        type:
          bloodType,

        components:
          componentTotals,

      };

    }
  );
}


Object.assign(
  window,
  {
    ReportingPage,
    CheckpointCard,
    ComplianceMatrixTable,
    buildComplianceMatrix,
  }
);