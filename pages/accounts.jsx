// pages/accounts.jsx - PRC consortium system administration

function AccountsPage({ hospital, session, permissions, accountApplications, onUpdateAccountApplications }) {
  const [tab, setTab] = React.useState("overview");
  const [accounts, setAccounts] = React.useState(window.MOCK_ACCOUNTS || []);
  const [institutions, setInstitutions] = React.useState(window.HOSPITALS || []);
  const [adminActivity, setAdminActivity] = React.useState(window.ADMIN_ACTIVITY || []);
  const [search, setSearch] = React.useState("");
  const [decision, setDecision] = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [note, setNote] = React.useState("");
  const toast = React.useContext(ToastCtx);
  const applications = accountApplications || window.PENDING_ACCOUNTS || [];

  if (!permissions?.canManageAccounts) {
    return <div className="page"><PageHead eyebrow="BloodLedger" title="System Administration" sub="This workspace is available to authorized PRC system administrators only." /><div className="card"><div className="card-b muted small">Your account does not have system-administration permission.</div></div></div>;
  }

  const pending = applications.filter((item) => item.status === "Pending Review");
  const activeInstitutions = institutions.filter((item) => !["DOH-CHD"].includes(item.id));
  const normalizedSearch = search.trim().toLowerCase();
  const filteredAccounts = accounts.filter((account) => {
    const institution = institutions.find((item) => item.id === account.hospital);
    return !normalizedSearch || `${account.name} ${account.email} ${account.role} ${institution?.name || ""}`.toLowerCase().includes(normalizedSearch);
  });

  const recordAdminAction = (action, target, details) => {
    const row = {
      id: `ADM-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
      administrator: session?.user?.name || "PRC Administrator",
      action,
      target,
      details,
    };
    const next = [row, ...adminActivity];
    setAdminActivity(next);
    window.ADMIN_ACTIVITY = next;
  };

  const institutionCode = (name) => {
    const prefix = String(name || "Institution").split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]).join("").toUpperCase();
    return `${prefix || "INST"}-${String(Date.now()).slice(-4)}`;
  };

  const decide = (status) => {
    if (!decision || !note.trim()) return;
    let assignedHospital = decision.hospital;

    if (status === "Approved" && !assignedHospital) {
      assignedHospital = institutionCode(decision.institution_name);
      const newInstitution = {
        id: assignedHospital,
        name: decision.institution_name,
        short: decision.institution_name,
        type: decision.applicant_type === "Blood Bank" ? "Consortium Blood Bank" : "Requestor Hospital",
        distance_km: null,
        peer_id: `pending.${assignedHospital.toLowerCase()}.bloodledger`,
        membership_status: "Active",
        joined: new Date().toISOString().slice(0, 10),
      };
      const nextInstitutions = [...institutions, newInstitution];
      setInstitutions(nextInstitutions);
      window.HOSPITALS = nextInstitutions;
      window.INSTITUTION_ROLES[assignedHospital] = decision.applicant_type === "Blood Bank"
        ? [{ id: "Blood Bank Administrator", label: "Blood Bank Administrator", sub: "Manage the approved blood-bank institution." }]
        : [{ id: "Authorized Requester", label: "Authorized Requester", sub: "Create and monitor blood requests." }];
    }

    const nextApplications = applications.map((item) => item.id === decision.id ? {
      ...item,
      hospital: assignedHospital,
      status,
      review_note: note.trim(),
      reviewed: new Date().toISOString(),
      reviewed_by: session?.user?.name,
    } : item);
    onUpdateAccountApplications(nextApplications);

    if (status === "Approved") {
      const initials = decision.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      const approvedAccount = {
        email: decision.email,
        password: "BloodLedger2026!",
        name: decision.name,
        initials,
        hospital: assignedHospital,
        role: decision.role,
        status: "Active",
        created_from: decision.id,
      };
      const nextAccounts = accounts.some((item) => item.email === approvedAccount.email) ? accounts : [...accounts, approvedAccount];
      setAccounts(nextAccounts);
      window.MOCK_ACCOUNTS = nextAccounts;
    }

    recordAdminAction(`${status} application`, decision.id, `${decision.applicant_type} application for ${decision.institution_name || hospitalById(decision.hospital)?.name}. ${note.trim()}`);
    toast.push({ kind: status === "Approved" ? "ok" : "warn", text: `Application ${status.toLowerCase()}`, sub: status === "Approved" ? "Institution and primary account provisioned." : "The rejection reason has been recorded." });
    setDecision(null);
    setNote("");
  };

  const deleteAccount = () => {
    if (!deleteTarget || !note.trim()) return;
    const nextAccounts = accounts.filter((item) => item.email !== deleteTarget.email);
    setAccounts(nextAccounts);
    window.MOCK_ACCOUNTS = nextAccounts;
    recordAdminAction("Deleted account", deleteTarget.email, note.trim());
    toast.push({ kind: "warn", text: "Account deleted", sub: `${deleteTarget.name} no longer has prototype access.` });
    setDeleteTarget(null);
    setNote("");
  };

  const tabs = [
    ["overview", "Overview", null],
    ["applications", "Applications", pending.length],
    ["institutions", "Institutions", activeInstitutions.length],
    ["accounts", "User Accounts", accounts.length],
    ["activity", "Admin Activity", adminActivity.length],
  ];

  return <div className="page">
    <PageHead eyebrow={hospital?.short || "PRC Administration"} title="System Administration" sub="Review institutional applications, provision consortium access, and manage authorized accounts." />

    <div className="admin-tabbar">
      {tabs.map(([key, label, count]) => <button key={key} className={`filter-chip ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}{count !== null && <span className="count">{count}</span>}</button>)}
    </div>

    {tab === "overview" && <AdminOverview accounts={accounts} pending={pending} institutions={activeInstitutions} activity={adminActivity} onOpen={setTab} />}
    {tab === "applications" && <ApplicationsTable applications={applications} institutions={institutions} onReview={(item) => { setDecision(item); setNote(""); }} />}
    {tab === "institutions" && <InstitutionsTable institutions={activeInstitutions} accounts={accounts} />}
    {tab === "accounts" && <AccountsTable accounts={filteredAccounts} institutions={institutions} search={search} setSearch={setSearch} currentEmail={session?.user?.email} onDelete={(account) => { setDeleteTarget(account); setNote(""); }} />}
    {tab === "activity" && <AdminActivityTable activity={adminActivity} />}

    {decision && <ApplicationReviewModal decision={decision} note={note} setNote={setNote} onClose={() => setDecision(null)} onDecide={decide} />}

    {deleteTarget && <Modal title="Delete User Account" sub="This removes the account from the prototype consortium directory." onClose={() => { setDeleteTarget(null); setNote(""); }} footer={<><Btn kind="ghost" onClick={() => setDeleteTarget(null)}>Keep Account</Btn><Btn kind="primary" onClick={deleteAccount} disabled={!note.trim()}>Confirm Deletion</Btn></>}>
      <div className="admin-delete-warning"><I name="warn" size={18} /><div><strong>{deleteTarget.name}</strong><span>{deleteTarget.email} · {deleteTarget.role}</span></div></div>
      <div className="field"><label htmlFor="delete-reason">Deletion reason</label><textarea id="delete-reason" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required for the administrator audit record..." /></div>
      <div className="auth-approval-note" style={{ marginTop: 14 }}><I name="info" size={15} /><span>This is a reversible browser-session simulation. A production system should deactivate or archive accounts instead of permanently deleting audit-linked identities.</span></div>
    </Modal>}
  </div>;
}

function AdminOverview({ accounts, pending, institutions, activity, onOpen }) {
  return <>
    <div className="stat-grid accounts-stat-grid">
      <Stat label="Authorized Accounts" value={accounts.length} unit="users" />
      <Stat label="Pending Review" value={pending.length} unit="applications" accent={pending.length ? "warn" : undefined} />
      <Stat label="Member Institutions" value={institutions.length} unit="facilities" accent="info" />
      <Stat label="Admin Actions" value={activity.length} unit="this session" accent="ok" />
    </div>
    <div className="admin-overview-grid">
      <div className="card"><div className="card-h"><div><h3>System Administrator Responsibilities</h3><div className="sub muted">PRC governance functions represented in this prototype.</div></div></div><div className="card-b admin-responsibilities">
        <div><I name="check" size={15} /><span><strong>Verify applications</strong><small>Review institutional licenses, responsible personnel, and documents.</small></span></div>
        <div><I name="user" size={15} /><span><strong>Manage access</strong><small>Provision primary accounts and remove unauthorized or obsolete access.</small></span></div>
        <div><I name="inventory" size={15} /><span><strong>Maintain membership</strong><small>Monitor participating blood banks, requestors, and PRC chapters.</small></span></div>
        <div><I name="audit" size={15} /><span><strong>Preserve accountability</strong><small>Record application decisions and account-administration activity.</small></span></div>
      </div></div>
      <div className="card"><div className="card-h"><div><h3>Attention Required</h3><div className="sub muted">Administrative work awaiting action.</div></div></div><div className="card-b admin-attention">
        <strong>{pending.length}</strong><span>institutional application{pending.length === 1 ? "" : "s"} pending verification</span><Btn kind="primary" size="sm" onClick={() => onOpen("applications")}>Review Applications</Btn>
      </div></div>
    </div>
  </>;
}

function ApplicationsTable({ applications, institutions, onReview }) {
  return <div className="card"><div className="card-h"><div><h3>Institution Applications</h3><div className="sub muted">Approve or reject Blood Bank and Requestor qualification submissions.</div></div></div><div className="card-b flush"><table className="tbl"><thead><tr><th>Application</th><th>Institution</th><th>Type</th><th>Primary Contact</th><th>Submitted</th><th>Status</th><th></th></tr></thead><tbody>{applications.map((item) => <tr key={item.id}><td className="mono tiny">{item.id}</td><td><strong>{item.institution_name || institutions.find((institution) => institution.id === item.hospital)?.short || item.hospital}</strong><div className="muted tiny">{item.facility?.facilityLevel || "Existing member institution"}</div></td><td>{item.applicant_type}</td><td><strong>{item.name}</strong><div className="muted tiny">{item.email}</div></td><td className="mono tiny">{item.submitted}</td><td><Chip kind={item.status === "Approved" ? "ok" : item.status === "Rejected" ? "critical" : "warn"} dot>{item.status}</Chip></td><td className="right"><Btn size="sm" onClick={() => onReview(item)}>{item.status === "Pending Review" ? "Review" : "View"}</Btn></td></tr>)}</tbody></table></div></div>;
}

function InstitutionsTable({ institutions, accounts }) {
  return <div className="card"><div className="card-h"><div><h3>Consortium Institutions</h3><div className="sub muted">Approved facilities and their current BloodLedger membership.</div></div></div><div className="card-b flush"><table className="tbl"><thead><tr><th>Institution</th><th>Participation Type</th><th>Peer / Provisioning ID</th><th>Authorized Users</th><th>Status</th></tr></thead><tbody>{institutions.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><div className="mono tiny muted">{item.id}</div></td><td>{item.type}</td><td className="mono tiny">{item.peer_id}</td><td className="tnum">{accounts.filter((account) => account.hospital === item.id).length}</td><td><Chip kind="ok" dot>{item.membership_status || "Active"}</Chip></td></tr>)}</tbody></table></div></div>;
}

function AccountsTable({ accounts, institutions, search, setSearch, currentEmail, onDelete }) {
  return <div className="card"><div className="card-h accounts-toolbar"><div><h3>Authorized User Accounts</h3><div className="sub muted">Search and manage access across consortium institutions.</div></div><div className="top-search accounts-search"><I name="search" size={13} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts..." /></div></div><div className="card-b flush"><table className="tbl"><thead><tr><th>User</th><th>Institution</th><th>Role</th><th>Email</th><th>Status</th><th></th></tr></thead><tbody>{accounts.map((account) => { const protectedAccount = account.email === currentEmail || account.role === "PRC Administrator"; return <tr key={account.email}><td><div className="account-user"><span>{account.initials}</span><strong>{account.name}</strong></div></td><td>{institutions.find((item) => item.id === account.hospital)?.short || account.hospital}</td><td>{account.role}</td><td className="mono tiny">{account.email}</td><td><Chip kind="ok" dot>{account.status || "Authorized"}</Chip></td><td className="right">{protectedAccount ? <span className="muted tiny">Protected</span> : <Btn size="sm" onClick={() => onDelete(account)}>Delete</Btn>}</td></tr>; })}</tbody></table></div></div>;
}

function AdminActivityTable({ activity }) {
  return <div className="card"><div className="card-h"><div><h3>Administration Activity</h3><div className="sub muted">Application decisions and account-management actions from this browser session.</div></div></div><div className="card-b flush"><table className="tbl"><thead><tr><th>Date & Time</th><th>Administrator</th><th>Action</th><th>Target</th><th>Details</th></tr></thead><tbody>{activity.length ? activity.map((item) => <tr key={item.id}><td className="mono tiny">{item.timestamp}</td><td>{item.administrator}</td><td>{item.action}</td><td className="mono tiny">{item.target}</td><td>{item.details}</td></tr>) : <tr><td colSpan="5" className="muted" style={{ textAlign: "center", padding: 30 }}>No administration actions have been recorded in this session.</td></tr>}</tbody></table></div></div>;
}

function ApplicationReviewModal({ decision, note, setNote, onClose, onDecide }) {
  const isPending = decision.status === "Pending Review";
  return <Modal title="Review Institution Application" sub={`${decision.id} · ${decision.applicant_type}`} onClose={onClose} footer={isPending ? <><Btn kind="ghost" onClick={onClose}>Close</Btn><Btn onClick={() => onDecide("Rejected")} disabled={!note.trim()}>Reject</Btn><Btn kind="primary" icon="check" onClick={() => onDecide("Approved")} disabled={!note.trim()}>Approve & Provision</Btn></> : <Btn kind="primary" onClick={onClose}>Close</Btn>}>
    <dl className="kv"><dt>Institution</dt><dd>{decision.institution_name || hospitalById(decision.hospital)?.name}</dd><dt>Applicant Type</dt><dd>{decision.applicant_type}</dd><dt>Primary Contact</dt><dd>{decision.name} · {decision.email}</dd><dt>Requested Role</dt><dd>{decision.role}</dd>{decision.facility && <><dt>Facility Classification</dt><dd>{decision.facility.facilityLevel} · {decision.facility.ownership}</dd><dt>Address</dt><dd>{decision.facility.address}, {decision.facility.city}, {decision.facility.province}</dd><dt>Hospital / Facility LTO</dt><dd className="mono">{decision.facility.hospitalLto} · expires {decision.facility.hospitalLtoExpiry}</dd><dt>{decision.applicant_type === "Blood Bank" ? "BSF License" : "Blood Station Authority"}</dt><dd className="mono">{decision.facility.bloodServiceLicense} · expires {decision.facility.bloodServiceExpiry}</dd>{decision.facility.headName && <><dt>Head of BSF</dt><dd>{decision.facility.headName} · PRC {decision.facility.headLicense}</dd></>}<dt>Medical Technologist</dt><dd>{decision.facility.medtechName} · PRC {decision.facility.medtechLicense}</dd></>}</dl>
    {decision.documents?.length > 0 && <div className="account-review-documents"><div className="request-review-label">Submitted Documents</div>{decision.documents.map((document) => <div className="request-review-document" key={`${document.category}-${document.name}`}><I name="audit" size={15} /><span><strong>{document.category}</strong><small>{document.name}</small></span><Chip kind="info">For verification</Chip></div>)}</div>}
    {isPending ? <div className="field" style={{ marginTop: 18 }}><label htmlFor="review-note">Decision note</label><textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required: record the verification basis or rejection reason..." /></div> : <div className="auth-approval-note" style={{ marginTop: 16 }}><I name="audit" size={15} /><span>{decision.review_note || "No review note recorded."}</span></div>}
  </Modal>;
}

Object.assign(window, { AccountsPage });
