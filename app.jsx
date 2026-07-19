// app.jsx — Root + simple in-page router
//
// Simplified base mock-up version.
// Advanced consortium, reporting, blockchain status, and algorithm-specific
// interface elements are intentionally hidden until stakeholder validation.

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

const SHOW_TWEAKS = !window.BLOODLEDGER_PRODUCTION;


function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply visual tweak side effects.
  React.useEffect(() => {
    document.body.classList.toggle(
      "theme-dark",
      !!t.dark
    );

    document.documentElement.style.setProperty(
      "--blood",
      t.accent
    );

    document.documentElement.style.setProperty(
      "--blood-deep",
      shade(t.accent, -0.18)
    );
  }, [t.dark, t.accent]);


  // ---------------------------------------------------------
  // Session
  // ---------------------------------------------------------

  const [authed, setAuthed] = React.useState(true);

  const [session, setSession] = React.useState({
    hospital: HOSPITALS[1],

    user: {
      name: "Dr. R. Reyes",
      initials: "RR",
      role: "BLOOD BANK HEAD",
    },
  });


  // ---------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------

  const [page, setPage] = React.useState("dashboard");

  const [pageState, setPageState] = React.useState(null);

  const [search, setSearch] = React.useState("");

  const [transfers, setTransfers] = React.useState(
    window.TRANSFERS || []
  );

  const permissions = buildPermissions(session);

  const toast = React.useContext(ToastCtx);


  const navigate = (id, state) => {
    setPage(id);

    setPageState(
      state || null
    );

    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  };


  // ---------------------------------------------------------
  // Alert actions
  // ---------------------------------------------------------

  const handleAlertAction = (action) => {
    if (action.goto) {
      navigate(
        action.goto,
        action.payload || null
      );
    }
  };


  // ---------------------------------------------------------
  // Request / transfer creation
  // ---------------------------------------------------------

  const handleCommit = async (payload) => {
    if (!permissions.canCreateTransfer) {
      toast.push({
        kind: "warn",
        text: "Read-only session",
        sub: "This account does not have permission to create blood requests or transfers.",
      });

      return;
    }


    const result =
      await BloodLedgerApi.createTransfer(
        payload
      );


    const tx = {
      id:
        result.id ||
        payload.id ||
        `REQ-${Date.now()}`,

      type: payload.type,

      units: payload.units,

      from:
        payload.from ||
        null,

      to:
        payload.to ||
        session.hospital?.id ||
        null,

      status:
        result.status ||
        (payload.requestOnly
          ? "Pending"
          : "Requested"),

      initiated:
        new Date()
          .toISOString()
          .slice(0, 16)
          .replace("T", " "),

      completed:
        result.completed ||
        null,

      urgency:
        payload.urgency ||
        "Routine",

      note:
        payload.note ||
        "",

      requestOnly:
        !!payload.requestOnly,
    };


    // Update local state.
    setTransfers(
      (current) => [
        tx,
        ...current,
      ]
    );


    // Keep the mock global data synchronized.
    window.TRANSFERS = [
      tx,
      ...(window.TRANSFERS || []),
    ];


    toast.push({
      kind: "ok",

      text:
        payload.requestOnly
          ? "Blood request submitted"
          : "Transfer record created",

      sub:
        `${tx.units} unit${
          tx.units === 1 ? "" : "s"
        } · ${tx.type} · ${tx.status}`,
    });


    return tx;
  };


  // ---------------------------------------------------------
  // Login / logout
  // ---------------------------------------------------------

  const handleLogin = async (s) => {
    const next =
      await BloodLedgerApi.login(s);

    setSession(next);

    setAuthed(true);

    setTweak(
      "showLogin",
      false
    );
  };


  const handleLogout = async () => {
    await BloodLedgerApi.logout();

    setAuthed(false);
  };


  // ---------------------------------------------------------
  // Login screen
  // ---------------------------------------------------------

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


  // ---------------------------------------------------------
  // Shared page props
  // ---------------------------------------------------------

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
  };


  // ---------------------------------------------------------
  // Breadcrumbs
  // ---------------------------------------------------------

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
      "Scan / Add Blood Unit",
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
  };


  // ---------------------------------------------------------
  // Router
  // ---------------------------------------------------------

  let PageBody = null;


  if (
    page === "dashboard"
  ) {
    PageBody = (
      <DashboardPage
        {...pageProps}
      />
    );
  }


  else if (
    page === "inventory"
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
    page === "scanner"
  ) {
    PageBody = (
      <ScannerPage
        {...pageProps}
      />
    );
  }


  else if (
    page === "transfers"
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
    page === "alerts"
  ) {
    PageBody = (
      <AlertsPage
        {...pageProps}
      />
    );
  }


  else if (
    page === "audit"
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


  // Fallback
  else {
    PageBody = (
      <DashboardPage
        {...pageProps}
      />
    );
  }


  // ---------------------------------------------------------
  // Navigation badges
  // ---------------------------------------------------------

  const badges = {

    transfers:
      transfers.filter(
        (item) =>
          item.status === "Pending" ||
          item.status === "Requested"
      ).length,

    alerts:
      (window.ALERTS || []).filter(
        (alert) =>
          alert.severity ===
          "critical"
      ).length,

  };


  // ---------------------------------------------------------
  // Main application
  // ---------------------------------------------------------

  return (
    <div
      className={`app density-${t.density}`}
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

      />


      <div className="main">

        <Topbar

          crumbs={
            crumbsByPage[
              page
            ] || [
              "BloodLedger",
            ]
          }

          search={
            search
          }

          onSearch={
            setSearch
          }

          right={

            <Btn

              icon="bell"

              size="sm"

              onClick={() =>
                navigate(
                  "alerts"
                )
              }

            >

              {
                badges.alerts
              }

              <span
                className="muted"
                style={{
                  marginLeft: 4,
                }}
              >
                alerts
              </span>

            </Btn>

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


// =========================================================
// TWEAKS PANEL
// =========================================================

function Tweaks({
  t,
  setTweak,
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


// =========================================================
// COLOR HELPER
// =========================================================

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
              (x) =>
                x + x
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

        (n >> 16) +
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

        ((n >> 8) &
          0xff) +

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

        (n &
          0xff) +

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
        (x) =>
          x
            .toString(16)
            .padStart(
              2,
              "0"
            )
      )

      .join("")
  );
}


// =========================================================
// APP MOUNT
// =========================================================

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