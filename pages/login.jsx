// pages/login.jsx — Sign in to a hospital chapter

function LoginPage({ onLogin }) {
  const ROLE_OPTIONS = {
    "MMC-LIP": [
      {
        id: "Med Technologist",
        sub: "Initiate, dispatch & receive transfers",
      },
      {
        id: "Blood Bank Head",
        sub: "Approve, override & reconcile",
      },
      {
        id: "System Administrator",
        sub: "Manage system access & configuration",
      },
    ],

    "PRC-LIP": [
      {
        id: "PRC Officer",
        sub: "Hub-level distribution",
      },
      {
        id: "PRC Administrator",
        sub: "Oversee PRC-side operations",
      },
    ],

    "LMC-LIP": [
      {
        id: "Med Technologist",
        sub: "Review availability & handle blood requests",
      },
      {
        id: "Authorized Requester",
        sub: "Create & monitor blood requests",
      },
    ],

    "MDH-LIP": [
      {
        id: "Med Technologist",
        sub: "Review availability & handle blood requests",
      },
      {
        id: "Authorized Requester",
        sub: "Create & monitor blood requests",
      },
    ],

    "CLH-LIP": [
      {
        id: "Med Technologist",
        sub: "Review availability & handle blood requests",
      },
      {
        id: "Authorized Requester",
        sub: "Create & monitor blood requests",
      },
    ],

    "DOH-CHD": [
      {
        id: "Regulator (DOH)",
        sub: "Read-only network & compliance view",
      },
    ],
  };

  const [hospital, setHospital] =
    React.useState("MMC-LIP");

  const [role, setRole] =
    React.useState("Blood Bank Head");

  const [email, setEmail] =
    React.useState("r.reyes");

  const [pin, setPin] =
    React.useState("");

  const availableRoles =
    ROLE_OPTIONS[hospital] || [];

  const handleHospitalChange = (e) => {
    const nextHospital =
      e.target.value;

    const nextRoles =
      ROLE_OPTIONS[nextHospital] || [];

    setHospital(nextHospital);

    // Reset to the first valid role for the selected institution.
    setRole(
      nextRoles[0]?.id || ""
    );
  };

  const submit = (e) => {
    e.preventDefault();

    onLogin({
      hospital,
      role,
      username: email,
      pin,
    });
  };

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <div className="topline">
          <div
            className="brand-mark"
            style={{
              width: 32,
              height: 32,
              fontSize: 19,
            }}
          >
            B
          </div>

          <div>
            <div
              style={{
                fontFamily:
                  "var(--font-display)",
                fontSize: 22,
                letterSpacing: "-0.01em",
              }}
            >
              Blood
              <em
                style={{
                  fontStyle: "italic",
                  color: "#D7CFBC",
                }}
              >
                ledger
              </em>
            </div>

            <div
              className="brand-sub"
              style={{
                marginTop: 2,
              }}
            >
              Lipa City Consortium
            </div>
          </div>
        </div>

        <div>
          <div
            className="page-eyebrow"
            style={{
              color: "#8C8676",
            }}
          >
            An accountable supply
          </div>

          <h1>
            One ledger.
            <br />
            Six hospitals.
            <br />
            <em>
              Every unit accounted for.
            </em>
          </h1>

          <p className="lead">
            A permissioned blockchain network for
            the safe redistribution of blood
            products across the Lipa City consortium
            — built on Hyperledger Fabric, governed
            by DOH-CHD Calabarzon and the Philippine
            Red Cross.
          </p>
        </div>

        <div className="signature">
          <span className="sig-mark">
            ⌘
          </span>

          <span>
            Hyperledger Fabric · 2.5
          </span>

          <span>
            ·
          </span>

          <span>
            6 peers
          </span>

          <span>
            ·
          </span>

          <span>
            Block 124,892
          </span>
        </div>
      </div>

      <form
        className="login-form"
        onSubmit={submit}
      >
        <div>
          <div className="page-eyebrow">
            Sign in
          </div>

          <h2
            className="serif"
            style={{
              fontSize: 32,
              margin: "6px 0 4px",
              letterSpacing: "-0.015em",
              fontWeight: 500,
            }}
          >
            Welcome back.
          </h2>

          <div className="muted">
            Authenticate with your chapter
            credentials.
          </div>
        </div>

        <div className="field">
          <label>
            Hospital chapter
          </label>

          <select
            value={hospital}
            onChange={
              handleHospitalChange
            }
          >
            {HOSPITALS.map((h) => (
              <option
                key={h.id}
                value={h.id}
              >
                {h.name} — {h.type}
              </option>
            ))}
          </select>

          <div className="hint">
            Each chapter operates its own peer
            node on the network.
          </div>
        </div>

        <div className="field">
          <label>
            Role
          </label>

          <div className="option-grid">
            {availableRoles.map((r) => (
              <button
                type="button"
                key={r.id}
                className={`option ${
                  role === r.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setRole(r.id)
                }
              >
                <div className="nm">
                  {r.id}
                </div>

                <div className="sub">
                  {r.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>
              Username
            </label>

            <input
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="r.reyes"
            />
          </div>

          <div className="field">
            <label>
              6-digit PIN
            </label>

            <input
              value={pin}
              onChange={(e) =>
                setPin(
                  e.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(
                      0,
                      6
                    )
                )
              }
              className="mono"
              placeholder="• • • • • •"
            />
          </div>
        </div>

        <div
          className="row"
          style={{
            justifyContent:
              "space-between",
            marginTop: 6,
          }}
        >
          <div
            className="chain-status"
            style={{
              background:
                "transparent",
              border: 0,
              padding: 0,
            }}
          >
            <span className="dot" />

            <span className="label">
              Peer reachable
            </span>

            <span className="mono muted">
              peer0.mmc.bloodledger
            </span>
          </div>

          <Btn
            kind="primary"
            size="lg"
            icon="check"
            type="submit"
          >
            Sign in to network
          </Btn>
        </div>

        <div className="divider" />

        <div className="muted small">
          By signing in you agree to the
          consortium's Data Sharing Agreement and
          DOH Administrative Order 2008-0008 on the
          use of blockchain-backed traceability.
        </div>
      </form>
    </div>
  );
}

Object.assign(
  window,
  {
    LoginPage,
  }
);