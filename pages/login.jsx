// pages/login.jsx — Account access and institution-based registration

function LoginPage({ onLogin }) {
  const [mode, setMode] = React.useState("signin");
  const [email, setEmail] = React.useState("r.reyes@mmc.bloodledger");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [institution, setInstitution] = React.useState("MMC-LIP");
  const [role, setRole] = React.useState(INSTITUTION_ROLES["MMC-LIP"]?.[0]?.id || "");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [registered, setRegistered] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");
  const [signingIn, setSigningIn] = React.useState(false);

  const availableRoles = INSTITUTION_ROLES[institution] || [];

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setRegistered(false);
  };

  const handleInstitutionChange = (event) => {
    const nextInstitution = event.target.value;
    const nextRoles = INSTITUTION_ROLES[nextInstitution] || [];
    setInstitution(nextInstitution);
    setRole(nextRoles[0]?.id || "");
  };

  const submitSignIn = async (event) => {
    event.preventDefault();
    setLoginError("");
    setSigningIn(true);
    try {
      await onLogin({ email, password });
    } catch (error) {
      setLoginError(error?.message || "Unable to sign in. Please try again.");
      setSigningIn(false);
    }
  };

  const submitRegistration = (event) => {
    event.preventDefault();
    if (password !== confirmPassword || !agreed) return;
    setRegistered(true);
  };

  if (registered) {
    const selectedInstitution = HOSPITALS.find((item) => item.id === institution);
    return (
      <AuthShell>
        <div className="auth-success-mark"><I name="check" size={22} /></div>
        <div className="page-eyebrow">Registration received</div>
        <h1 className="auth-title">Your account is awaiting approval.</h1>
        <p className="auth-copy">
          {selectedInstitution?.short || "Your institution"} must verify your employee record and requested role before access is activated.
        </p>
        <div className="auth-summary">
          <div><span>Institution / Chapter</span><strong>{selectedInstitution?.name}</strong></div>
          <div><span>Requested role</span><strong>{role}</strong></div>
          <div><span>Account email</span><strong>{email}</strong></div>
        </div>
        <Btn kind="primary" size="lg" onClick={() => switchMode("signin")}>Return to sign in</Btn>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Create account</button>
      </div>

      {mode === "signin" ? (
        <form className="auth-form" onSubmit={submitSignIn}>
          <div>
            <div className="page-eyebrow">Welcome back</div>
            <h1 className="auth-title">Sign in to BloodLedger</h1>
            <p className="auth-copy">Use the email address associated with your approved account.</p>
          </div>
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hospital.org" autoComplete="email" required />
          </div>
          <div className="field">
            <div className="auth-label-row">
              <label htmlFor="login-password">Password</label>
              <button type="button" className="auth-text-button">Forgot password?</button>
            </div>
            <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          </div>
          <label className="auth-check"><input type="checkbox" /><span>Keep me signed in on this trusted device</span></label>
          {loginError && <div className="auth-login-error" role="alert">{loginError}</div>}
          <Btn kind="primary" size="lg" type="submit" disabled={signingIn}>{signingIn ? "Signing in…" : "Sign in"}</Btn>
        </form>
      ) : (
        <form className="auth-form auth-form-signup" onSubmit={submitRegistration}>
          <div>
            <div className="page-eyebrow">Staff registration</div>
            <h1 className="auth-title">Create your BloodLedger account</h1>
            <p className="auth-copy">Your institution and role are verified once during registration.</p>
          </div>
          <div className="auth-fields-2">
            <div className="field"><label htmlFor="signup-name">Full name</label><input id="signup-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" required /></div>
            <div className="field"><label htmlFor="employee-id">Employee ID</label><input id="employee-id" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. MMC-10482" required /></div>
          </div>
          <div className="field"><label htmlFor="signup-email">Institutional email</label><input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@hospital.org" autoComplete="email" required /></div>
          <div className="field">
            <label htmlFor="signup-institution">Institution / Chapter</label>
            <select id="signup-institution" value={institution} onChange={handleInstitutionChange} required>
              {HOSPITALS.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.type}</option>)}
            </select>
            <div className="hint">Select the organization that will verify and manage your access.</div>
          </div>
          <fieldset className="auth-role-fieldset">
            <legend>Requested role</legend>
            <div className="auth-role-grid">
              {availableRoles.map((item) => (
                <label key={item.id} className={`auth-role-option ${role === item.id ? "selected" : ""}`}>
                  <input type="radio" name="requested-role" value={item.id} checked={role === item.id} onChange={() => setRole(item.id)} />
                  <span><strong>{item.label}</strong><small>{item.sub}</small></span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="auth-fields-2">
            <div className="field"><label htmlFor="signup-password">Password</label><input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" minLength="8" required /></div>
            <div className="field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" autoComplete="new-password" minLength="8" required />{confirmPassword && password !== confirmPassword && <div className="hint auth-error">Passwords do not match.</div>}</div>
          </div>
          <div className="auth-approval-note"><I name="info" size={15} /><span>Sensitive permissions are not granted automatically. An authorized administrator must approve the requested role.</span></div>
          <label className="auth-check"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required /><span>I agree to the consortium Data Sharing Agreement and account-use policies.</span></label>
          <Btn kind="primary" size="lg" type="submit" disabled={password !== confirmPassword || !agreed}>Submit registration</Btn>
        </form>
      )}
    </AuthShell>
  );
}

function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <aside className="login-hero auth-hero">
        <div className="topline">
          <div className="brand-mark" style={{ width: 32, height: 32, fontSize: 19 }}>B</div>
          <div>
            <div className="auth-hero-brand">Blood<em>ledger</em></div>
            <div className="brand-sub" style={{ marginTop: 2 }}>Lipa City Consortium</div>
          </div>
        </div>

        <div>
          <div className="page-eyebrow auth-hero-eyebrow">An accountable supply</div>
          <h1>
            One ledger.<br />
            Six institutions.<br />
            <em>Every unit accounted for.</em>
          </h1>
          <p className="lead">
            A permissioned blockchain network supporting safe blood inventory
            traceability and redistribution across the Lipa City consortium.
          </p>
        </div>

        <div className="signature">
          <span className="sig-mark">◆</span>
          <span>Hyperledger Fabric</span>
          <span>·</span>
          <span>Permissioned network</span>
        </div>
      </aside>

      <div className="auth-pane">
        <section className="auth-card">{children}</section>
        <footer className="auth-footer">Permissioned access for authorized consortium personnel only.</footer>
      </div>
    </main>
  );
}

Object.assign(window, { LoginPage });
