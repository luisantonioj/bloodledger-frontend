// components.jsx — shared chrome (Sidebar, Topbar, Icons, helpers)

const HOSPITALS =
  window.HOSPITALS;

const BLOOD_TYPES =
  window.BLOOD_TYPES;


// ───── Tiny SVG icons ─────────────────────────────────────

const Icon = ({
  d,
  size = 16,
  fill = "none",
  stroke = "currentColor",
  sw = 1.6,
  vb = "0 0 24 24"
}) => (
  <svg
    width={size}
    height={size}
    viewBox={vb}
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {typeof d === "string"
      ? <path d={d} />
      : d}
  </svg>
);


const ICONS = {
  dashboard:
    "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",

  inventory:
    "M3 7l9-4 9 4-9 4-9-4Zm0 5l9 4 9-4M3 17l9 4 9-4",

  transfers:
    "M7 7h13l-3-3M17 17H4l3 3",

  alerts:
    "M12 3l9 16H3l9-16Zm0 6v4m0 3v.5",

  scanner:
    "M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2M7 8v8M11 8v8M15 8v8M18 8v8",

  audit:
    "M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 8h8M8 16h6M8 8h5",

  reporting:
    "M4 20V10m6 10V4m6 16v-7m6 7V8",

  settings:
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8.5 4l1.5-1.2-2-3.4-1.8.6a8 8 0 0 0-2.1-1.2L15.5 5h-7l-.6 1.8a8 8 0 0 0-2.1 1.2l-1.8-.6-2 3.4L3.5 12 2 13.2l2 3.4 1.8-.6a8 8 0 0 0 2.1 1.2L8.5 19h7l.6-1.8a8 8 0 0 0 2.1-1.2l1.8.6 2-3.4L20.5 12Z",

  search:
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </>,

  chevron:
    "m9 6 6 6-6 6",

  chevronDown:
    "m6 9 6 6 6-6",

  chevronLeft:
    "m15 6-6 6 6 6",

  plus:
    "M12 5v14M5 12h14",

  check:
    "m5 12 5 5 9-13",

  x:
    "m6 6 12 12M18 6 6 18",

  arrowRight:
    "M5 12h14m-6-6 6 6-6 6",

  arrowUp:
    "M12 19V5m-6 6 6-6 6 6",

  arrowDown:
    "M12 5v14m6-6-6 6-6-6",

  flask:
    "M9 3h6v4l5 11a3 3 0 0 1-2.8 4H6.8A3 3 0 0 1 4 18L9 7V3Zm0 4h6",

  truck:
    "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6Zm-7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",

  shield:
    "M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Zm-2 9 2 2 4-4",

  clock:
    "M12 7v5l3 2",

  pin:
    "M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",

  refresh:
    "M4 4v6h6M20 20v-6h-6M5 14a8 8 0 0 0 14 4M19 10a8 8 0 0 0-14-4",

  filter:
    "M3 5h18l-7 9v6l-4-2v-4L3 5Z",

  download:
    "M12 4v12m-5-5 5 5 5-5M4 20h16",

  upload:
    "M12 20V8m-5 5 5-5 5 5M4 4h16",

  link:
    "M9 15l6-6m-3-3 1-1a4 4 0 1 1 5.6 5.6L17 12M7 12l-1.6 1.6a4 4 0 0 0 5.6 5.6L12 18",

  thermo:
    "M10 4a2 2 0 1 1 4 0v10a4 4 0 1 1-4 0V4Zm2 0v10",

  user:
    "M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",

  bell:
    "M6 19h12l-1-1V13a5 5 0 1 0-10 0v5l-1 1Zm4 2a2 2 0 0 0 4 0",

  log:
    "M4 6h16M4 12h16M4 18h10",

  exit:
    "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 12h11l-3-3m0 6 3-3",

  warn:
    "M12 9v4m0 3v.5M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",

  info:
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>,
};


const I = ({
  name,
  size,
  sw
}) => (
  <Icon
    d={ICONS[name]}
    size={size}
    sw={sw}
  />
);


// ───── Small UI bits ──────────────────────────────────────

function BloodType({
  type,
  lg
}) {
  const neg =
    type &&
    type.endsWith("-");

  return (
    <span
      className={`bt ${
        lg ? "lg" : ""
      } ${
        neg ? "neg" : "pos"
      }`}
    >
      {type}
    </span>
  );
}


function Chip({
  kind = "neutral",
  children,
  dot,
  outline
}) {
  return (
    <span
      className={`chip ${kind} ${
        outline ? "outline" : ""
      }`}
    >
      {dot && (
        <span className="chip-dot" />
      )}

      {children}
    </span>
  );
}


function StatusChip({
  status
}) {
  const map = {
    critical: [
      "critical",
      "Critical"
    ],

    warn: [
      "warn",
      "Low"
    ],

    ok: [
      "ok",
      "Sufficient"
    ],

    surplus: [
      "info",
      "Surplus"
    ],
  };

  const [
    k,
    label
  ] =
    map[status] ||
    [
      "neutral",
      status
    ];

  return (
    <Chip
      kind={k}
      dot
    >
      {label}
    </Chip>
  );
}


function Btn({
  kind = "default",
  size,
  icon,
  children,
  onClick,
  disabled,
  type,
  title,
  ariaLabel
}) {
  const cls =
    kind === "primary"
      ? "btn btn-primary"
      : kind === "ghost"
      ? "btn btn-ghost"
      : "btn";

  const sz =
    size === "sm"
      ? "btn-sm"
      : size === "lg"
      ? "btn-lg"
      : "";

  return (
    <button
      className={`${cls} ${sz}`}
      onClick={onClick}
      disabled={disabled}
      type={type || "button"}
      title={title}
      aria-label={
        ariaLabel ||
        title
      }
    >
      {icon && (
        <I
          name={icon}
          size={14}
        />
      )}

      {children}
    </button>
  );
}


// ───── Permissions ─────────────────────────────────────────

function roleKey(
  role
) {
  const r =
    String(
      role ||
      ""
    ).toUpperCase();

  if (
    r.includes(
      "DOH"
    ) ||
    r.includes(
      "REGULATOR"
    )
  ) {
    return "regulator";
  }

  if (
    r.includes(
      "PRC"
    )
  ) {
    return "prc";
  }

  if (
    r.includes(
      "BLOOD BANK HEAD"
    ) ||
    r.includes(
      "HOSPITAL ADMIN"
    )
  ) {
    return "admin";
  }

  if (
    r.includes(
      "TECHNOLOGIST"
    )
  ) {
    return "technologist";
  }

  if (
    r.includes(
      "SYSTEM"
    )
  ) {
    return "system";
  }

  return "readonly";
}


function isSecondaryHospital(
  hospital
) {
  return (
    !!hospital &&
    ![
      "MMC-LIP",
      "PRC-LIP",
      "DOH-CHD"
    ].includes(
      hospital.id
    )
  );
}


function buildPermissions(
  session
) {
  const key =
    roleKey(
      session?.user?.role
    );

  const secondary =
    isSecondaryHospital(
      session?.hospital
    );

  const readOnly =
    key ===
      "regulator" ||
    key ===
      "prc";

  return {
    roleKey:
      key,

    readOnly,

    secondary,

    canCreateTransfer:
      !readOnly,

    canCreateRequest:
      secondary &&
      !readOnly,

    canFullTransfer:
      !readOnly &&
      !secondary,

    canScan:
      !readOnly &&
      !secondary &&
      session?.hospital?.id ===
        "MMC-LIP",

    canApprove:
      key ===
        "admin" &&
      !secondary,

    canAcknowledge:
      !readOnly,
  };
}


function transferStatusKind(
  status
) {
  const s =
    String(
      status ||
      ""
    ).toLowerCase();

  if (
    s === "received" ||
    s === "completed"
  ) {
    return "ok";
  }

  if (
    s === "delayed" ||
    s === "in transit"
  ) {
    return "warn";
  }

  if (
    s === "rejected" ||
    s === "compromised"
  ) {
    return "critical";
  }

  if (
    s === "pending" ||
    s === "requested" ||
    s === "approved" ||
    s === "dispatched"
  ) {
    return "info";
  }

  return "neutral";
}


// ───── Sidebar ─────────────────────────────────────────────

function Sidebar({
  active,
  onNav,
  user,
  hospital,
  badges = {},
  permissions
}) {
  const sections = [
    {
      label:
        "Overview",

      items: [
        {
          id:
            "dashboard",

          name:
            "Dashboard",

          icon:
            "dashboard",
        },
      ],
    },

    {
      label:
        "Inventory",

      items: [
        {
          id:
            "inventory",

          name:
            "Blood Inventory",

          icon:
            "inventory",
        },

        {
          id:
            "scanner",

          name:
            "Scan / Add Blood Unit",

          icon:
            "scanner",
        },
      ],
    },

    {
      label:
        "Requests & Activity",

      items: [
        {
          id:
            "transfers",

          name:
            "Requests & Transfers",

          icon:
            "transfers",

          badge:
            badges.transfers,
        },

        {
          id:
            "alerts",

          name:
            "Alerts",

          icon:
            "alerts",

          badge:
            badges.alerts,

          badgeKind:
            "blood",
        },

        {
          id:
            "audit",

          name:
            "Activity History",

          icon:
            "audit",
        },
      ],
    },

    {
      label:
        "Compliance",

      items: [
        {
          id:
            "reporting",

          name:
            "Compliance Reports",

          icon:
            "reporting",
        },
      ],
    },
  ];


  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          B
        </div>

        <div>
          <div className="brand-name">
            Blood
            <em>
              ledger
            </em>
          </div>

          <div className="brand-sub">
            Blood Inventory Management
          </div>
        </div>
      </div>


      <div className="hospital-pill">
        <div className="label">
          Current Facility
        </div>

        <div className="name">
          {hospital?.short ||
            "Hospital"}
        </div>

        <div className="meta">
          <span className="peer-dot" />

          <span>
            Active session
          </span>
        </div>
      </div>


      <nav className="nav">
        {sections.map(
          (
            section
          ) => (
            <React.Fragment
              key={
                section.label
              }
            >
              <div className="nav-section-label">
                {
                  section.label
                }
              </div>

              {section.items.map(
                (
                  item
                ) => (
                  <button
                    key={
                      item.id
                    }

                    className={`nav-item ${
                      active ===
                      item.id
                        ? "active"
                        : ""
                    }`}

                    onClick={() =>
                      onNav(
                        item.id
                      )
                    }
                  >
                    <span className="nav-ico">
                      <I
                        name={
                          item.icon
                        }
                        size={16}
                      />
                    </span>

                    {
                      item.name
                    }

                    {item.badge
                      ? (
                        <span
                          className={`badge ${
                            item.badgeKind ===
                            "blood"
                              ? ""
                              : "dim"
                          }`}
                        >
                          {
                            item.badge
                          }
                        </span>
                      )
                      : null}
                  </button>
                )
              )}
            </React.Fragment>
          )
        )}
      </nav>


      <div className="sidebar-foot">
        <div className="user-avatar">
          {
            user.initials
          }
        </div>

        <div
          style={{
            flex:
              1,

            minWidth:
              0,
          }}
        >
          <div className="user-name">
            {
              user.name
            }
          </div>

          <div className="user-role">
            {
              user.role
            }
          </div>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={
            user.onLogout
          }
          title="Sign out"
          aria-label="Sign out"
        >
          <I
            name="exit"
            size={14}
          />
        </button>
      </div>
    </aside>
  );
}


// ───── Topbar ──────────────────────────────────────────────

function Topbar({
  crumbs,
  search,
  onSearch,
  right
}) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map(
          (
            c,
            i
          ) => (
            <React.Fragment
              key={i}
            >
              {i >
                0 && (
                <span className="sep">
                  /
                </span>
              )}

              <span
                className={
                  i ===
                  crumbs.length -
                    1
                    ? "current"
                    : ""
                }
              >
                {c}
              </span>
            </React.Fragment>
          )
        )}
      </div>

      <div className="top-actions">
        <div className="top-search">
          <I
            name="search"
            size={14}
          />

          <input
            placeholder="Search records..."
            value={
              search ||
              ""
            }
            onChange={(e) =>
              onSearch &&
              onSearch(
                e.target.value
              )
            }
          />
        </div>

        {right}
      </div>
    </div>
  );
}


// ───── Page header ─────────────────────────────────────────

function PageHead({
  eyebrow,
  title,
  sub,
  actions
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && (
          <div className="page-eyebrow">
            {
              eyebrow
            }
          </div>
        )}

        <h1 className="page-title serif">
          {
            title
          }
        </h1>

        {sub && (
          <div className="page-sub">
            {
              sub
            }
          </div>
        )}
      </div>

      {actions && (
        <div className="actions">
          {
            actions
          }
        </div>
      )}
    </div>
  );
}


// ───── Stat tile ───────────────────────────────────────────

function Stat({
  label,
  value,
  unit,
  delta,
  deltaDir = "up",
  accent,
  spark
}) {
  return (
    <div
      className={`stat ${
        accent
          ? "accent-" +
            accent
          : ""
      }`}
    >
      <div className="label">
        {
          label
        }
      </div>

      <div className="value serif tnum">
        {
          value
        }

        {unit && (
          <span className="unit">
            {
              unit
            }
          </span>
        )}
      </div>

      {delta && (
        <div className="delta">
          <span
            className={
              deltaDir
            }
          >
            <I
              name={
                deltaDir ===
                "up"
                  ? "arrowUp"
                  : deltaDir ===
                    "down"
                  ? "arrowDown"
                  : "arrowRight"
              }
              size={12}
            />
          </span>

          <span>
            {
              delta
            }
          </span>
        </div>
      )}

      {spark && (
        <div className="spark">
          {
            spark
          }
        </div>
      )}
    </div>
  );
}


// Simple sparkline

function Spark({
  data,
  color = "var(--ink-3)",
  w = 70,
  h = 22
}) {
  const max =
    Math.max(
      ...data
    );

  const min =
    Math.min(
      ...data
    );

  const range =
    max -
      min ||
    1;

  const pts =
    data
      .map(
        (
          v,
          i
        ) => {
          const x =
            (
              i /
              (
                data.length -
                1
              )
            ) *
            w;

          const y =
            h -
            (
              (
                v -
                min
              ) /
              range
            ) *
            h;

          return `${x},${y}`;
        }
      )
      .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
    >
      <polyline
        points={pts}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}


// ───── Modal ───────────────────────────────────────────────

function Modal({
  title,
  sub,
  children,
  footer,
  onClose,
  wide
}) {
  React.useEffect(() => {
    const k =
      (
        e
      ) =>
        e.key ===
          "Escape" &&
        onClose &&
        onClose();

    window.addEventListener(
      "keydown",
      k
    );

    return () =>
      window.removeEventListener(
        "keydown",
        k
      );
  }, [
    onClose
  ]);

  return (
    <div
      className="modal-scrim"
      onClick={
        onClose
      }
    >
      <div
        className="modal"
        style={
          wide
            ? {
                width:
                  "min(820px, 94vw)"
              }
            : null
        }
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-h">
          <div
            style={{
              flex:
                1
            }}
          >
            <h3>
              {
                title
              }
            </h3>

            {sub && (
              <div
                className="muted small"
                style={{
                  marginTop:
                    2
                }}
              >
                {
                  sub
                }
              </div>
            )}
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={
              onClose
            }
            title="Close"
            aria-label="Close"
          >
            <I
              name="x"
              size={14}
            />
          </button>
        </div>

        <div className="modal-b">
          {
            children
          }
        </div>

        {footer && (
          <div className="modal-f">
            {
              footer
            }
          </div>
        )}
      </div>
    </div>
  );
}


// ───── Toast ───────────────────────────────────────────────

function Toast({
  kind = "ok",
  text,
  sub
}) {
  return (
    <div
      className={`toast ${kind}`}
    >
      <div className="dot" />

      <div>
        <div>
          {
            text
          }
        </div>

        {sub && (
          <div
            className="muted small"
            style={{
              marginTop:
                2
            }}
          >
            {
              sub
            }
          </div>
        )}
      </div>
    </div>
  );
}


// ───── Toast manager ───────────────────────────────────────

const ToastCtx =
  React.createContext({
    push:
      () => {}
  });


function ToastProvider({
  children
}) {
  const [
    list,
    setList
  ] =
    React.useState(
      []
    );

  const push =
    React.useCallback(
      (
        t
      ) => {
        const id =
          Math.random()
            .toString(
              36
            )
            .slice(
              2
            );

        setList(
          (
            l
          ) => [
            ...l,
            {
              id,
              ...t
            }
          ]
        );

        setTimeout(
          () =>
            setList(
              (
                l
              ) =>
                l.filter(
                  (
                    x
                  ) =>
                    x.id !==
                    id
                )
            ),
          t.duration ||
            3600
        );
      },
      []
    );

  return (
    <ToastCtx.Provider
      value={{
        push
      }}
    >
      {
        children
      }

      <div
        style={{
          position:
            "fixed",

          right:
            0,

          bottom:
            0,

          zIndex:
            80
        }}
      >
        {list.map(
          (
            t
          ) => (
            <div
              key={
                t.id
              }
              style={{
                marginBottom:
                  8
              }}
            >
              <Toast
                kind={
                  t.kind
                }
                text={
                  t.text
                }
                sub={
                  t.sub
                }
              />
            </div>
          )
        )}
      </div>
    </ToastCtx.Provider>
  );
}


// Helpers

function hospitalById(
  id
) {
  return HOSPITALS.find(
    (
      h
    ) =>
      h.id ===
      id
  );
}


function fmtDate(
  d
) {
  if (
    !d
  ) {
    return "—";
  }

  const dt =
    new Date(
      d.replace(
        " ",
        "T"
      )
    );

  return dt.toLocaleString(
    "en-PH",
    {
      month:
        "short",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false
    }
  );
}


Object.assign(
  window,
  {
    Icon,
    ICONS,
    I,

    BloodType,
    Chip,
    StatusChip,
    Btn,

    Sidebar,
    Topbar,
    PageHead,
    Stat,
    Spark,

    Modal,
    Toast,
    ToastCtx,
    ToastProvider,

    hospitalById,
    fmtDate,

    roleKey,
    isSecondaryHospital,
    buildPermissions,
    transferStatusKind,
  }
);
