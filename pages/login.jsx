// pages/login.jsx - Account access and institution qualification applications

function LoginPage({ onLogin, onSubmitApplication }) {
  const emptyFiles = { hospitalLto: null, bloodServiceLicense: null, assessment: null, authorization: null };
  const [mode, setMode] = React.useState("signin");
  const [applicationType, setApplicationType] = React.useState(null);
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState("r.reyes@mmc.bloodledger");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");
  const [signingIn, setSigningIn] = React.useState(false);
  const [registered, setRegistered] = React.useState(null);
  const [files, setFiles] = React.useState(emptyFiles);
  const [agreed, setAgreed] = React.useState(false);
  const [applicationError, setApplicationError] = React.useState("");
  const [form, setForm] = React.useState({
    facilityName: "",
    legalName: "",
    ownership: "Private",
    facilityLevel: "Level 2 Hospital",
    address: "",
    city: "Lipa City",
    province: "Batangas",
    phone: "",
    facilityEmail: "",
    hospitalLto: "",
    hospitalLtoExpiry: "",
    bloodServiceCategory: "Blood Bank",
    bloodServiceLicense: "",
    bloodServiceExpiry: "",
    headName: "",
    headLicense: "",
    medtechName: "",
    medtechLicense: "",
    referralFacility: "PRC Lipa City Chapter",
    fullName: "",
    position: "",
    employeeId: "",
    accountEmail: "",
    capabilityConfirmed: false,
    readinessConfirmed: false,
    verificationConfirmed: false,
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const fileMeta = (file) => file ? { name: file.name, size: file.size, type: file.type || "application/octet-stream" } : null;
  const setDocument = (key, file) => setFiles((current) => ({ ...current, [key]: fileMeta(file) }));

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setRegistered(null);
    if (nextMode === "signup") {
      setApplicationType(null);
      setStep(1);
    }
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

  const requiredForStep = () => {
    if (step === 1) return [form.facilityName, form.legalName, form.address, form.city, form.province, form.phone, form.facilityEmail, form.hospitalLto, form.hospitalLtoExpiry];
    if (step === 2) return applicationType === "blood-bank"
      ? [form.bloodServiceCategory, form.bloodServiceLicense, form.bloodServiceExpiry, form.headName, form.headLicense, form.medtechName, form.medtechLicense, form.capabilityConfirmed, form.readinessConfirmed, form.verificationConfirmed]
      : [form.bloodServiceLicense, form.bloodServiceExpiry, form.medtechName, form.medtechLicense, form.referralFacility, form.capabilityConfirmed, form.readinessConfirmed, form.verificationConfirmed];
    if (step === 3) return [form.fullName, form.position, form.employeeId, form.accountEmail, password, confirmPassword];
    return [];
  };

  const nextStep = () => {
    setApplicationError("");
    if (requiredForStep().some((value) => !String(value || "").trim())) {
      setApplicationError("Complete all required fields and declarations before continuing.");
      return;
    }
    if (step === 3 && (password !== confirmPassword || password.length < 8)) {
      setApplicationError("Use a password of at least 8 characters and make sure both passwords match.");
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  };

  const submitApplication = (event) => {
    event.preventDefault();
    const requiredDocuments = applicationType === "blood-bank"
      ? [files.hospitalLto, files.bloodServiceLicense, files.assessment]
      : [files.hospitalLto, files.authorization];
    if (!agreed || requiredDocuments.some((file) => !file)) {
      setApplicationError("Attach every required document and confirm the applicant declaration.");
      return;
    }

    const application = {
      id: `APP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      name: form.fullName,
      email: form.accountEmail,
      employee_id: form.employeeId,
      hospital: null,
      institution_name: form.facilityName,
      role: applicationType === "blood-bank" ? "Blood Bank Administrator" : "Authorized Requester",
      applicant_type: applicationType === "blood-bank" ? "Blood Bank" : "Requestor",
      submitted: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "Pending Review",
      facility: { ...form },
      documents: Object.entries(files).filter(([, value]) => value).map(([category, value]) => ({ category, ...value })),
      regulatory_basis: applicationType === "blood-bank"
        ? "DOH Blood Service Facility license verification required"
        : "Hospital LTO and Blood Station/transfusion authorization verification required",
    };
    onSubmitApplication?.(application);
    setRegistered(application);
  };

  if (registered) {
    return (
      <AuthShell wide>
        <div className="auth-success-mark"><I name="check" size={22} /></div>
        <div className="page-eyebrow">Application received</div>
        <h1 className="auth-title">Your institution is awaiting verification.</h1>
        <p className="auth-copy">PRC administration will review the facility licenses, submitted documents, and proposed primary account before consortium access is activated.</p>
        <div className="auth-summary application-success-summary">
          <div><span>Application</span><strong>{registered.id}</strong></div>
          <div><span>Applicant type</span><strong>{registered.applicant_type}</strong></div>
          <div><span>Institution</span><strong>{registered.institution_name}</strong></div>
          <div><span>Primary contact</span><strong>{registered.name}</strong></div>
        </div>
        <Btn kind="primary" size="lg" onClick={() => switchMode("signin")}>Return to sign in</Btn>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide={mode === "signup"}>
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>Sign in</button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Apply for access</button>
      </div>

      {mode === "signin" ? (
        <form className="auth-form" onSubmit={submitSignIn}>
          <div><div className="page-eyebrow">Welcome back</div><h1 className="auth-title">Sign in to BloodLedger</h1><p className="auth-copy">Use the email address associated with your approved account.</p></div>
          <div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@hospital.org" required /></div>
          <div className="field"><div className="auth-label-row"><label htmlFor="login-password">Password</label><button type="button" className="auth-text-button">Forgot password?</button></div><input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></div>
          <label className="auth-check"><input type="checkbox" /><span>Keep me signed in on this trusted device</span></label>
          {loginError && <div className="auth-login-error" role="alert">{loginError}</div>}
          <Btn kind="primary" size="lg" type="submit" disabled={signingIn}>{signingIn ? "Signing in..." : "Sign in"}</Btn>
        </form>
      ) : !applicationType ? (
        <div className="auth-application-choice">
          <div><div className="page-eyebrow">Institution application</div><h1 className="auth-title">How will your facility participate?</h1><p className="auth-copy">Choose one application. Approval establishes the institution first; individual staff accounts can be authorized afterward.</p></div>
          <div className="application-type-grid">
            <button type="button" onClick={() => { setApplicationType("blood-bank"); setStep(1); }}>
              <span className="application-type-icon"><I name="inventory" size={22} /></span>
              <strong>Apply as a Blood Bank</strong>
              <p>For a hospital seeking to supply, store, process, issue, and redistribute blood through the consortium.</p>
              <ul><li>DOH Blood Service Facility license</li><li>Qualified physician and medical technologist</li><li>Facility assessment and service capability</li></ul>
              <span className="application-type-action">Start Blood Bank Application <I name="arrowRight" size={14} /></span>
            </button>
            <button type="button" onClick={() => { setApplicationType("requestor"); setStep(1); }}>
              <span className="application-type-icon requestor"><I name="dashboard" size={22} /></span>
              <strong>Apply as a Requestor</strong>
              <p>For a licensed hospital or health facility that will request, receive, store, and transfuse blood.</p>
              <ul><li>Valid hospital or health-facility LTO</li><li>Blood Station or transfusion authorization</li><li>Responsible licensed medical technologist</li></ul>
              <span className="application-type-action">Start Requestor Application <I name="arrowRight" size={14} /></span>
            </button>
          </div>
          <div className="auth-approval-note"><I name="info" size={15} /><span>BloodLedger approval does not replace any DOH license, authority to operate, inspection, or accreditation.</span></div>
        </div>
      ) : (
        <form className="auth-form auth-application-form" onSubmit={submitApplication}>
          <div className="application-form-header">
            <button type="button" className="auth-back-button" onClick={() => setApplicationType(null)}><I name="chevronLeft" size={14} /> Change application</button>
            <div className="page-eyebrow">{applicationType === "blood-bank" ? "Blood Bank application" : "Requestor application"}</div>
            <h1 className="auth-title">Institution qualification</h1>
            <p className="auth-copy">Step {step} of 4 - {step === 1 ? "Facility information" : step === 2 ? "Licensing and capability" : step === 3 ? "Primary account" : "Documents and declaration"}</p>
          </div>

          <div className="application-steps" aria-label="Application progress">
            {["Facility", "Qualification", "Primary Account", "Documents"].map((label, index) => <div key={label} className={step >= index + 1 ? "active" : ""}><span>{index + 1}</span><b>{label}</b></div>)}
          </div>

          {applicationError && <div className="auth-login-error" role="alert">{applicationError}</div>}

          {step === 1 && <FacilityApplicationStep form={form} update={update} />}
          {step === 2 && <QualificationApplicationStep type={applicationType} form={form} update={update} />}
          {step === 3 && <PrimaryAccountStep form={form} update={update} password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} />}
          {step === 4 && <DocumentApplicationStep type={applicationType} files={files} setDocument={setDocument} agreed={agreed} setAgreed={setAgreed} />}

          <div className="application-form-footer">
            {step > 1 ? <Btn kind="ghost" type="button" onClick={() => setStep((current) => current - 1)}>Previous</Btn> : <span />}
            {step < 4 ? <Btn kind="primary" type="button" onClick={nextStep}>Continue</Btn> : <Btn kind="primary" icon="check" type="submit" disabled={!agreed}>Submit for PRC Review</Btn>}
          </div>
        </form>
      )}
    </AuthShell>
  );
}

function FacilityApplicationStep({ form, update }) {
  return <div className="application-section">
    <div className="application-section-title"><h3>Facility information</h3><p>Legal and operational details used to verify the applicant.</p></div>
    <div className="application-fields-grid">
      <AppField label="Facility name"><input value={form.facilityName} onChange={(event) => update("facilityName", event.target.value)} required /></AppField>
      <AppField label="Registered legal name"><input value={form.legalName} onChange={(event) => update("legalName", event.target.value)} required /></AppField>
      <AppField label="Ownership"><select value={form.ownership} onChange={(event) => update("ownership", event.target.value)}><option>Private</option><option>Government</option></select></AppField>
      <AppField label="Facility classification"><select value={form.facilityLevel} onChange={(event) => update("facilityLevel", event.target.value)}><option>Level 1 Hospital</option><option>Level 2 Hospital</option><option>Level 3 Hospital</option><option>Other Licensed Health Facility</option></select></AppField>
      <AppField label="Complete address" wide><input value={form.address} onChange={(event) => update("address", event.target.value)} required /></AppField>
      <AppField label="City / Municipality"><input value={form.city} onChange={(event) => update("city", event.target.value)} required /></AppField>
      <AppField label="Province"><input value={form.province} onChange={(event) => update("province", event.target.value)} required /></AppField>
      <AppField label="Official phone"><input value={form.phone} onChange={(event) => update("phone", event.target.value)} required /></AppField>
      <AppField label="Official facility email"><input type="email" value={form.facilityEmail} onChange={(event) => update("facilityEmail", event.target.value)} required /></AppField>
      <AppField label="Hospital / Health Facility LTO number"><input value={form.hospitalLto} onChange={(event) => update("hospitalLto", event.target.value)} required /></AppField>
      <AppField label="LTO expiration"><input type="date" value={form.hospitalLtoExpiry} onChange={(event) => update("hospitalLtoExpiry", event.target.value)} required /></AppField>
    </div>
  </div>;
}

function QualificationApplicationStep({ type, form, update }) {
  const bloodBank = type === "blood-bank";
  return <div className="application-section">
    <div className="application-section-title"><h3>{bloodBank ? "Blood Service Facility qualification" : "Requestor receiving capability"}</h3><p>{bloodBank ? "Information aligned with DOH Blood Service Facility licensing and assessment." : "Information showing that the facility can lawfully receive, store, test, and transfuse blood."}</p></div>
    <div className="application-fields-grid">
      {bloodBank && <AppField label="BSF category"><select value={form.bloodServiceCategory} onChange={(event) => update("bloodServiceCategory", event.target.value)}><option>Blood Bank</option><option>Blood Bank with Additional Functions</option><option>Blood Center</option></select></AppField>}
      <AppField label={bloodBank ? "DOH BSF LTO number" : "Blood Station ATO / authorization number"}><input value={form.bloodServiceLicense} onChange={(event) => update("bloodServiceLicense", event.target.value)} required /></AppField>
      <AppField label="License / authority expiration"><input type="date" value={form.bloodServiceExpiry} onChange={(event) => update("bloodServiceExpiry", event.target.value)} required /></AppField>
      {bloodBank && <><AppField label="Head of Blood Service Facility"><input value={form.headName} onChange={(event) => update("headName", event.target.value)} required /></AppField><AppField label="Physician PRC license number"><input value={form.headLicense} onChange={(event) => update("headLicense", event.target.value)} required /></AppField></>}
      <AppField label="Medical technologist-in-charge"><input value={form.medtechName} onChange={(event) => update("medtechName", event.target.value)} required /></AppField>
      <AppField label="Medical technologist PRC license"><input value={form.medtechLicense} onChange={(event) => update("medtechLicense", event.target.value)} required /></AppField>
      {!bloodBank && <AppField label="Referral blood bank / supplying BSF" wide><input value={form.referralFacility} onChange={(event) => update("referralFacility", event.target.value)} required /></AppField>}
    </div>
    <div className="qualification-checklist">
      <strong>Applicant declaration of capability</strong>
      <label><input type="checkbox" checked={form.capabilityConfirmed} onChange={(event) => update("capabilityConfirmed", event.target.checked)} /> <span>{bloodBank ? "Blood storage, processing, compatibility testing, issuance, and transport procedures are documented." : "Safe blood storage, compatibility testing, transfusion, and hemovigilance procedures are documented."}</span></label>
      <label><input type="checkbox" checked={form.readinessConfirmed} onChange={(event) => update("readinessConfirmed", event.target.checked)} /> <span>Required personnel, equipment, power continuity, maintenance, and contingency procedures are available.</span></label>
      <label><input type="checkbox" checked={form.verificationConfirmed} onChange={(event) => update("verificationConfirmed", event.target.checked)} /> <span>The facility agrees to verification against current DOH/CHD licensing records.</span></label>
    </div>
  </div>;
}

function PrimaryAccountStep({ form, update, password, setPassword, confirmPassword, setConfirmPassword }) {
  return <div className="application-section">
    <div className="application-section-title"><h3>Authorized primary account</h3><p>This person will act as the institution’s initial BloodLedger contact after approval.</p></div>
    <div className="application-fields-grid">
      <AppField label="Full name"><input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></AppField>
      <AppField label="Official position"><input value={form.position} onChange={(event) => update("position", event.target.value)} placeholder="e.g. Blood Bank Head" required /></AppField>
      <AppField label="Employee ID"><input value={form.employeeId} onChange={(event) => update("employeeId", event.target.value)} required /></AppField>
      <AppField label="Institutional email"><input type="email" value={form.accountEmail} onChange={(event) => update("accountEmail", event.target.value)} required /></AppField>
      <AppField label="Password"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required /></AppField>
      <AppField label="Confirm password"><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" required />{confirmPassword && password !== confirmPassword && <small className="auth-error">Passwords do not match.</small>}</AppField>
    </div>
  </div>;
}

function DocumentApplicationStep({ type, files, setDocument, agreed, setAgreed }) {
  const bloodBank = type === "blood-bank";
  const uploads = bloodBank
    ? [["hospitalLto", "Hospital / Health Facility LTO", "Required"], ["bloodServiceLicense", "DOH Blood Service Facility LTO", "Required"], ["assessment", "BSF assessment, personnel and equipment documents", "Required"]]
    : [["hospitalLto", "Hospital / Health Facility LTO", "Required"], ["authorization", "Blood Station ATO or transfusion-service authorization", "Required"], ["assessment", "Referral agreement or facility capability documents", "Optional"]];
  return <div className="application-section">
    <div className="application-section-title"><h3>Supporting documents</h3><p>Upload clear PDF, JPG, or PNG copies. The prototype records file metadata only.</p></div>
    <div className="application-upload-list">
      {uploads.map(([key, label, requirement]) => <label key={key} className={`application-upload ${files[key] ? "has-file" : ""}`}>
        <I name="audit" size={18} /><span><strong>{label}</strong><small>{files[key]?.name || `${requirement} - choose a document`}</small></span><b>{files[key] ? "Replace" : "Attach"}</b>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" required={requirement === "Required" && !files[key]} onChange={(event) => setDocument(key, event.target.files?.[0])} />
      </label>)}
    </div>
    <div className="auth-approval-note"><I name="shield" size={15} /><span>Licenses remain subject to verification with DOH/CHD and PRC professional registries. Approval in this prototype is not regulatory approval.</span></div>
    <label className="auth-check application-attestation"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required /><span>I certify that the submitted information is accurate, the institution holds the stated authorizations, and authorized reviewers may verify these records.</span></label>
  </div>;
}

function AppField({ label, wide, children }) {
  return <label className={`field application-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

function AuthShell({ children, wide }) {
  return <main className={`auth-page ${wide ? "auth-page-application" : ""}`}>
    <aside className="login-hero auth-hero">
      <div className="topline"><div className="brand-mark" style={{ width: 32, height: 32, fontSize: 19 }}>B</div><div><div className="auth-hero-brand">Blood<em>ledger</em></div><div className="brand-sub" style={{ marginTop: 2 }}>Lipa City Consortium</div></div></div>
      <div><div className="page-eyebrow auth-hero-eyebrow">An accountable supply</div><h1>One ledger.<br />Six institutions.<br /><em>Every unit accounted for.</em></h1><p className="lead">A permissioned blockchain network supporting safe blood inventory traceability and redistribution across the Lipa City consortium.</p></div>
      <div className="signature"><span className="sig-mark">◆</span><span>Hyperledger Fabric</span><span>·</span><span>Permissioned network</span></div>
    </aside>
    <div className="auth-pane"><section className="auth-card">{children}</section><footer className="auth-footer">Permissioned access for authorized consortium personnel only.</footer></div>
  </main>;
}

Object.assign(window, { LoginPage });
