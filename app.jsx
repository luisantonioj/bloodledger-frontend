// app.jsx — Root + simple in-page router

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#9A1B1B",
  "density": "regular",
  "showLogin": false
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  "#9A1B1B",
  "#7A3E2E",
  "#4A6E5B",
  "#234F9E"
];

const SHOW_TWEAKS =
  !window.BLOODLEDGER_PRODUCTION;


function App() {
  const [t, setTweak] =
    useTweaks(
      TWEAK_DEFAULTS
    );

  React.useEffect(() => {
    document.body.classList.toggle(
      "theme-dark",
      !!t.dark
    );

    document.documentElement
      .style
      .setProperty(
        "--blood",
        t.accent
      );

    document.documentElement
      .style
      .setProperty(
        "--blood-deep",
        shade(
          t.accent,
          -0.18
        )
      );
  }, [
    t.dark,
    t.accent
  ]);


  const [
    authed,
    setAuthed
  ] =
    React.useState(
      true
    );


  const [
    session,
    setSession
  ] =
    React.useState({
      hospital:
        HOSPITALS[0],

      user: {
        name:
          "Dr. R. Reyes",

        initials:
          "RR",

        role:
          "BLOOD BANK HEAD",

        username:
          "r.reyes@mmc.bloodledger",
      },
    });


  const [
    page,
    setPage
  ] =
    React.useState(
      "dashboard"
    );


  const [
    pageState,
    setPageState
  ] =
    React.useState(
      null
    );


  const [
    search,
    setSearch
  ] =
    React.useState(
      ""
    );


  const [
    transfers,
    setTransfers
  ] =
    React.useState(
      window.TRANSFERS ||
      []
    );


  const [
    accountApplications,
    setAccountApplications
  ] =
    React.useState(
      window.PENDING_ACCOUNTS ||
      []
    );


  const [
    prcSupplyRequests,
    setPrcSupplyRequests
  ] =
    React.useState(
      window.PRC_SUPPLY_REQUESTS ||
      []
    );


  const [
    alerts,
    setAlerts
  ] =
    React.useState(
      window.ALERTS ||
      []
    );


  const [
    auditRows,
    setAuditRows
  ] =
    React.useState(
      window.AUDIT ||
      []
    );


  const permissions =
    buildPermissions(
      session
    );


  const toast =
    React.useContext(
      ToastCtx
    );


  const navigate = (
    id,
    state
  ) => {
    setPage(
      id
    );

    setPageState(
      state ||
      null
    );

    if (
      typeof window !==
      "undefined"
    ) {
      window.scrollTo({
        top:
          0,

        behavior:
          "instant",
      });
    }
  };


  const handleAlertAction =
    (action) => {
      if (
        action.goto
      ) {
        navigate(
          action.goto,
          action.payload ||
          null
        );
      }
    };


  const handleCommit =
    async (
      payload
    ) => {
      if (
        !permissions.canCreateTransfer
      ) {
        toast.push({
          kind:
            "warn",

          text:
            "Read-only session",

          sub:
            "This account does not have permission to create blood requests or transfers.",
        });

        return;
      }


      const result =
        await BloodLedgerApi
          .createTransfer(
            payload
          );


      const tx = {
        id:
          result.id ||
          payload.id ||
          `REQ-${Date.now()}`,

        type:
          payload.type,

        component:
          payload.component ||
          "PRBC",

        units:
          payload.units,

        from:
          payload.from ||
          null,

        to:
          payload.to ||
          session.hospital
            ?.id ||
          null,

        status:
          result.status ||
          (
            payload.requestOnly
              ? "Requested"
              : "Requested"
          ),

        initiated:
          new Date()
            .toISOString()
            .slice(
              0,
              16
            )
            .replace(
              "T",
              " "
            ),

        completed:
          result.completed ||
          null,

        urgency:
          payload.urgency ||
          "Routine",

        note:
          payload.note ||
          "",

        requesterName:
          payload.requesterName ||
          "",

        requesterEmployeeId:
          payload.requesterEmployeeId ||
          "",

        physicianName:
          payload.physicianName ||
          "",

        caseReference:
          payload.caseReference ||
          "",

        requiredDate:
          payload.requiredDate ||
          null,

        pickupName:
          payload.pickupName ||
          "",

        pickupIdReference:
          payload.pickupIdReference ||
          "",

        attachments:
          payload.attachments ||
          [],

        requestOnly:
          !!payload.requestOnly,
      };


      setTransfers(
        (
          current
        ) => [
          tx,
          ...current,
        ]
      );


      window.TRANSFERS = [
        tx,
        ...(
          window.TRANSFERS ||
          []
        ),
      ];


      toast.push({
        kind:
          "ok",

        text:
          payload.requestOnly
            ? "Blood request submitted"
            : "Transfer record created",

        sub:
          `${tx.units} unit${
            tx.units ===
            1
              ? ""
              : "s"
          } · ${tx.type} · ${tx.status}`,
      });


      return tx;
    };


  const handleTransfersChange =
    (
      nextTransfers
    ) => {
      setTransfers(
        nextTransfers
      );

      window.TRANSFERS =
        nextTransfers;
    };


  const handleAccountApplicationsChange =
    (nextApplications) => {
      setAccountApplications(nextApplications);
      window.PENDING_ACCOUNTS = nextApplications;
    };


  const handleInstitutionApplication =
    (application) => {
      handleAccountApplicationsChange([
        application,
        ...accountApplications,
      ]);
    };


  const handlePrcSupplyRequestsChange =
    (nextRequests) => {
      setPrcSupplyRequests(nextRequests);
      window.PRC_SUPPLY_REQUESTS = nextRequests;
    };


  const handleAlertsChange =
    (nextAlerts) => {
      setAlerts(nextAlerts);
      window.ALERTS = nextAlerts;
    };


  const handleAuditChange =
    (nextRows) => {
      setAuditRows(nextRows);
      window.AUDIT = nextRows;
    };


  const handleLogin =
    async (
      s
    ) => {
      const next =
        await BloodLedgerApi
          .login(
            s
          );

      setSession(
        next
      );

      setAuthed(
        true
      );

      setTweak(
        "showLogin",
        false
      );

      const nextPermissions =
        buildPermissions(next);

      const nextPage =
        nextPermissions.canManageAccounts
          ? "accounts"
          : "dashboard";

      setPage(
        nextPage
      );

      setPageState(null);
    };


  const handleLogout =
    async () => {
      await BloodLedgerApi
        .logout();

      setAuthed(
        false
      );
    };


  if (
    t.showLogin ||
    !authed
  ) {
    return (
      <div className="app login-mode">
        <LoginPage
          onLogin={
            handleLogin
          }
          onSubmitApplication={
            handleInstitutionApplication
          }
        />

        {SHOW_TWEAKS && (
          <Tweaks
            t={t}
            setTweak={
              setTweak
            }
          />
        )}
      </div>
    );
  }


  const pageProps = {
    hospital:
      session.hospital,

    session,

    permissions,

    transfers,

    onNav:
      navigate,

    onAct:
      handleAlertAction,

    onCommit:
      handleCommit,

    onUpdateTransfers:
      handleTransfersChange,

    accountApplications,

    onUpdateAccountApplications:
      handleAccountApplicationsChange,

    prcSupplyRequests,

    onUpdatePrcSupplyRequests:
      handlePrcSupplyRequestsChange,

    alerts,

    onUpdateAlerts:
      handleAlertsChange,

    auditRows,

    onUpdateAudit:
      handleAuditChange,
  };


  const crumbsByPage = {
    dashboard: [
      "BloodLedger",
      "Dashboard",
    ],

    inventory: [
      "BloodLedger",
      "Blood Inventory",
    ],

    scanner: [
      "BloodLedger",
      permissions?.secondary
        ? "Blood Unit Receipt"
        : "Blood Unit Transactions",
    ],

    consortium: [
      "BloodLedger",
      "Consortium Inventory",
    ],

    transfers: [
      "BloodLedger",
      "Requests & Transfers",
    ],

    alerts: [
      "BloodLedger",
      "Alerts",
    ],

    audit: [
      "BloodLedger",
      "Activity History",
    ],

    reporting: [
      "BloodLedger",
      "Compliance Reports",
    ],

    accounts: [
      "BloodLedger",
      "Account Administration",
    ],

    profile: [
      "BloodLedger",
      "My Profile",
    ],
  };


  let PageBody =
    null;


  if (
    page ===
    "dashboard"
  ) {
    PageBody = (
      <DashboardPage
        {...pageProps}
      />
    );
  }


  else if (
    page ===
    "inventory"
  ) {
    PageBody = (
      <InventoryPage
        {...pageProps}
        filter={
          pageState
        }
      />
    );
  }


  else if (
    page ===
    "scanner"
  ) {
    PageBody = (
      <ScannerPage
        {...pageProps}
      />
    );
  }


  else if (
    page ===
    "transfers"
  ) {
    PageBody = (
      <TransfersPage
        {...pageProps}
        prefill={
          pageState
        }
      />
    );
  }


  else if (
    page ===
    "alerts"
  ) {
    PageBody = (
      <AlertsPage
        {...pageProps}
      />
    );
  }


  else if (
    page ===
    "audit"
  ) {
    PageBody = (
      <AuditPage
        {...pageProps}
        filter={
          pageState
        }
      />
    );
  }


  else if (
    page ===
    "reporting"
  ) {
    PageBody = (
      <ReportingPage
        {...pageProps}
      />
    );
  }


  else if (
    page ===
    "accounts"
  ) {
    PageBody = (
      <AccountsPage
        {...pageProps}
      />
    );
  }


  else if (
    page ===
    "consortium"
  ) {
    PageBody = (
      <ConsortiumPage
        {...pageProps}
      />
    );
  }


  else if (
    page ===
    "profile"
  ) {
    PageBody = (
      <ProfilePage
        {...pageProps}
      />
    );
  }


  else {
    PageBody = (
      <DashboardPage
        {...pageProps}
      />
    );
  }


  const badges = {
    transfers:
      transfers.filter(
        (
          item
        ) =>
          item.status ===
            "Pending" ||
          item.status ===
            "Requested"
      ).length,

    alerts:
      (
        alerts
      ).filter(
        (
          alert
        ) =>
          (
            !alert.hospitalId ||
            alert.hospitalId === session.hospital?.id
          ) &&
          alert.severity ===
          "critical"
      ).length,

    accounts:
      (
        accountApplications
      ).filter(
        (application) =>
          application.status ===
          "Pending Review"
      ).length,
  };


  return (
    <div
      className={
        `app density-${t.density}`
      }
    >
      <Sidebar
        active={
          page
        }

        onNav={
          navigate
        }

        hospital={
          session.hospital
        }

        user={{
          ...session.user,

          onLogout:
            handleLogout,
        }}

        badges={
          badges
        }

        permissions={
          permissions
        }
      />


      <div className="main">
        <Topbar
          crumbs={
            crumbsByPage[
              page
            ] || [
              "BloodLedger"
            ]
          }

          search={
            search
          }

          onSearch={
            setSearch
          }

          right={
            permissions.canManageAccounts ? (
              <Btn icon="user" size="sm" onClick={() => navigate("accounts")}>
                {badges.accounts}
                <span className="muted" style={{ marginLeft: 4 }}>pending accounts</span>
              </Btn>
            ) : permissions.canViewAlerts ? (
              <Btn icon="bell" size="sm" onClick={() => navigate("alerts")}>
                {badges.alerts}
                <span className="muted" style={{ marginLeft: 4 }}>alerts</span>
              </Btn>
            ) : null
          }
        />

        {PageBody}
      </div>


      {SHOW_TWEAKS && (
        <Tweaks
          t={t}
          setTweak={
            setTweak
          }
        />
      )}
    </div>
  );
}


// ───── Tweaks panel ───────────────────────────────────────

function Tweaks({
  t,
  setTweak
}) {
  return (
    <TweaksPanel>
      <TweakSection
        label="Theme"
      />

      <TweakToggle
        label="Dark mode"
        value={
          t.dark
        }
        onChange={(v) =>
          setTweak(
            "dark",
            v
          )
        }
      />

      <TweakColor
        label="Accent"
        value={
          t.accent
        }
        options={
          ACCENT_OPTIONS
        }
        onChange={(v) =>
          setTweak(
            "accent",
            v
          )
        }
      />

      <TweakSection
        label="Layout"
      />

      <TweakRadio
        label="Density"
        value={
          t.density
        }
        options={[
          "compact",
          "regular"
        ]}
        onChange={(v) =>
          setTweak(
            "density",
            v
          )
        }
      />

      <TweakSection
        label="Demo"
      />

      <TweakToggle
        label="Show login screen"
        value={
          !!t.showLogin
        }
        onChange={(v) =>
          setTweak(
            "showLogin",
            v
          )
        }
      />
    </TweaksPanel>
  );
}


// Lighten / darken a hex color

function shade(
  hex,
  amt
) {
  const c =
    hex.replace(
      "#",
      ""
    );

  const n =
    parseInt(
      c.length === 3
        ? c
            .split("")
            .map(
              (
                x
              ) =>
                x +
                x
            )
            .join("")
        : c,
      16
    );

  const r =
    Math.max(
      0,
      Math.min(
        255,
        (
          n >>
          16
        ) +
          Math.round(
            255 *
            amt
          )
      )
    );

  const g =
    Math.max(
      0,
      Math.min(
        255,
        (
          (
            n >>
            8
          ) &
          0xff
        ) +
          Math.round(
            255 *
            amt
          )
      )
    );

  const b =
    Math.max(
      0,
      Math.min(
        255,
        (
          n &
          0xff
        ) +
          Math.round(
            255 *
            amt
          )
      )
    );

  return (
    "#" +
    [
      r,
      g,
      b
    ]
      .map(
        (
          x
        ) =>
          x
            .toString(
              16
            )
            .padStart(
              2,
              "0"
            )
      )
      .join("")
  );
}


ReactDOM
  .createRoot(
    document.getElementById(
      "root"
    )
  )
  .render(
    <ToastProvider>
      <App />
    </ToastProvider>
  );
