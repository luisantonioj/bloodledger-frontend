// pages/accounts.jsx — Consortium user-account administration

function AccountsPage({ hospital, permissions, accountApplications, onUpdateAccountApplications }) {
  const [tab, setTab] = React.useState("accounts");
  const [accounts, setAccounts] = React.useState(window.MOCK_ACCOUNTS || []);
  const applications = accountApplications || window.PENDING_ACCOUNTS || [];
  const [search, setSearch] = React.useState("");
  const [decision, setDecision] = React.useState(null);
  const [note, setNote] = React.useState("");
  const toast = React.useContext(ToastCtx);

  if (!permissions?.canManageAccounts) {
    return (
      <div className="page">
        <PageHead eyebrow="BloodLedger" title="Accounts" sub="This page is available to authorized system administrators only." />
        <div className="card"><div className="card-b muted small">Your account does not have permission to manage consortium users.</div></div>
      </div>
    );
  }

  const pending = applications.filter((item) => item.status === "Pending Review");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredAccounts = accounts.filter((account) => {
    const institution = hospitalById(account.hospital);
    return !normalizedSearch || `${account.name} ${account.email} ${account.role} ${institution?.name || ""}`.toLowerCase().includes(normalizedSearch);
  });

  const decide = (status) => {
    if (!decision) return;
    const nextApplications = applications.map((item) => item.id === decision.id ? { ...item, status, review_note: note, reviewed: new Date().toISOString() } : item);
    onUpdateAccountApplications(nextApplications);

    if (status === "Approved") {
      const initials = decision.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      const approvedAccount = {
        email: decision.email,
        password: "BloodLedger2026!",
        name: decision.name,
        initials,
        hospital: decision.hospital,
        role: decision.role,
      };
      const nextAccounts = [...accounts, approvedAccount];
      setAccounts(nextAccounts);
      window.MOCK_ACCOUNTS = nextAccounts;
    }

    toast.push({
      kind: status === "Approved" ? "ok" : "warn",
      text: `Account application ${status.toLowerCase()}`,
      sub: `${decision.id} · ${decision.name}`,
    });
    setDecision(null);
    setNote("");
  };

  return (
    <div className="page">
      <PageHead
        eyebrow={hospital?.short || "PRC Administration"}
        title="Account Administration"
        sub="Review access requests and monitor authorized users across participating institutions."
      />

      <div className="stat-grid accounts-stat-grid">
        <Stat label="Authorized Accounts" value={accounts.length} unit="users" />
        <Stat label="Pending Approval" value={pending.length} unit="applications" accent={pending.length ? "warn" : undefined} />
        <Stat label="Participating Institutions" value={new Set(accounts.map((item) => item.hospital)).size} unit="chapters" accent="info" />
        <Stat label="Administrator" value="PRC" unit="Lipa Chapter" accent="ok" />
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <div className="card-h accounts-toolbar">
          <div className="tabs">
            <button className={`filter-chip ${tab === "accounts" ? "active" : ""}`} onClick={() => setTab("accounts")}>Accounts <span className="count">{accounts.length}</span></button>
            <button className={`filter-chip ${tab === "applications" ? "active" : ""}`} onClick={() => setTab("applications")}>New Accounts <span className="count">{pending.length}</span></button>
          </div>
          {tab === "accounts" && (
            <div className="top-search accounts-search"><I name="search" size={13} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts..." /></div>
          )}
        </div>

        <div className="card-b flush">
          {tab === "accounts" ? (
            <table className="tbl">
              <thead><tr><th>User</th><th>Institution / Chapter</th><th>Role</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.email}>
                    <td><div className="account-user"><span>{account.initials}</span><strong>{account.name}</strong></div></td>
                    <td>{hospitalById(account.hospital)?.short || account.hospital}</td>
                    <td>{account.role}</td>
                    <td className="mono tiny">{account.email}</td>
                    <td><Chip kind="ok" dot>Authorized</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="tbl">
              <thead><tr><th>Application</th><th>Applicant</th><th>Institution / Chapter</th><th>Requested Role</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="mono tiny">{application.id}</td>
                    <td><strong>{application.name}</strong><div className="muted tiny">{application.employee_id} · {application.applicant_type}</div></td>
                    <td>{hospitalById(application.hospital)?.short || application.hospital}</td>
                    <td>{application.role}</td>
                    <td className="mono tiny">{application.submitted}</td>
                    <td><Chip kind={application.status === "Approved" ? "ok" : application.status === "Rejected" ? "critical" : "warn"} dot>{application.status}</Chip></td>
                    <td className="right">{application.status === "Pending Review" && <Btn size="sm" onClick={() => setDecision(application)}>Review</Btn>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {decision && (
        <Modal
          title="Review Account Application"
          sub={`${decision.id} · ${decision.applicant_type}`}
          onClose={() => { setDecision(null); setNote(""); }}
          footer={<><Btn kind="ghost" onClick={() => setDecision(null)}>Cancel</Btn><Btn onClick={() => decide("Rejected")}>Reject</Btn><Btn kind="primary" icon="check" onClick={() => decide("Approved")}>Approve Account</Btn></>}
        >
          <dl className="kv">
            <dt>Applicant</dt><dd>{decision.name}</dd>
            <dt>Employee ID</dt><dd className="mono">{decision.employee_id}</dd>
            <dt>Email</dt><dd className="mono">{decision.email}</dd>
            <dt>Institution</dt><dd>{hospitalById(decision.hospital)?.name}</dd>
            <dt>Requested Role</dt><dd>{decision.role}</dd>
          </dl>
          <div className="field" style={{ marginTop: 18 }}><label htmlFor="review-note">Review note</label><textarea id="review-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional approval or rejection note..." /></div>
          <div className="auth-approval-note" style={{ marginTop: 14 }}><I name="info" size={15} /><span>Approving creates an authorized prototype account under the selected institution and role.</span></div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, { AccountsPage });
