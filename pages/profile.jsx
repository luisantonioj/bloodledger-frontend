// pages/profile.jsx - Signed-in identity and approved institution record.

function ProfilePage({ hospital, session, permissions, accountApplications, staffDirectory }) {
  const email = session?.user?.username || session?.user?.email || "";
  const account = (window.MOCK_ACCOUNTS || []).find(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  ) || {};
  const storedProfile = (window.USER_PROFILE_DETAILS || {})[email] || {};
  const facilityProfile = (window.FACILITY_PROFILES || {})[hospital?.id] || {};
  const submittedApplication = (accountApplications || window.PENDING_ACCOUNTS || []).find(
    (item) => String(item.email || "").toLowerCase() === email.toLowerCase()
  );
  const application = submittedApplication || storedProfile.application || {};
  const applicationFacility = application.facility || {};
  const [passwordModal, setPasswordModal] = React.useState(false);
  const [passwords, setPasswords] = React.useState({ current: "", next: "", confirm: "" });
  const toast = React.useContext(ToastCtx);
  const facilityStaff = (staffDirectory || window.STAFF_DIRECTORY || {})[hospital?.id] || [];

  const person = {
    name: account.name || session?.user?.name || application.institution_name || "Authorized facility",
    position: account.role || session?.user?.role || "Approved organizational account",
    employeeId: hospital?.id || "Not recorded",
    phone: facilityProfile.phone || hospital?.phone || "Not recorded",
    email,
    license: "Not applicable to facility account",
  };

  const facility = {
    name: application.institution_name || applicationFacility.facilityName || hospital?.name || "Not recorded",
    legalName: applicationFacility.legalName || facilityProfile.legalName || hospital?.name || "Not recorded",
    type: application.applicant_type || facilityProfile.participationType || (permissions?.secondary ? "Requestor" : hospital?.type) || "Not recorded",
    classification: applicationFacility.facilityLevel || facilityProfile.facilityLevel || hospital?.type || "Not recorded",
    address: applicationFacility.address || facilityProfile.address || "Not recorded",
    ownership: applicationFacility.ownership || facilityProfile.ownership || "Not recorded",
    officialEmail: applicationFacility.facilityEmail || facilityProfile.facilityEmail || "Not recorded",
    officialPhone: applicationFacility.phone || facilityProfile.phone || "Not recorded",
    hospitalLto: applicationFacility.hospitalLto || facilityProfile.hospitalLto || "Not recorded",
    bloodServiceLicense: applicationFacility.bloodServiceLicense || facilityProfile.bloodServiceLicense || "Not recorded",
    bloodServiceCategory: applicationFacility.bloodServiceCategory || facilityProfile.bloodServiceCategory || "Not applicable",
    referralFacility: applicationFacility.referralFacility || facilityProfile.referralFacility || "Not applicable",
  };

  const documents = application.documents || facilityProfile.documents || [];
  const accountStatus = application.status === "Pending Review" ? "Pending Review" : storedProfile.status || "Active";
  const applicationId = application.id || storedProfile.applicationId || "Legacy consortium account";

  const updatePassword = () => {
    if (passwords.current !== account.password) {
      toast.push({ kind: "warn", text: "Current password is incorrect", sub: "Enter the password currently assigned to this account." });
      return;
    }
    if (passwords.next.length < 8 || passwords.next !== passwords.confirm) {
      toast.push({ kind: "warn", text: "Password was not changed", sub: "Enter the current password and use a matching new password of at least 8 characters." });
      return;
    }
    window.MOCK_ACCOUNTS = (window.MOCK_ACCOUNTS || []).map((item) =>
      item.email.toLowerCase() === email.toLowerCase()
        ? { ...item, password: passwords.next }
        : item
    );
    setPasswordModal(false);
    setPasswords({ current: "", next: "", confirm: "" });
    toast.push({ kind: "ok", text: "Password updated", sub: "The password change is simulated for this frontend prototype." });
  };

  return (
    <div className="page profile-page">
      <PageHead
        eyebrow={hospital?.short || "BloodLedger"}
        title="My Profile"
        sub="Review the approved Facility Account, institutional application, and read-only Staff Directory."
      />

      <div className="profile-identity-card">
        <div className="profile-avatar">{session?.user?.initials || "U"}</div>
        <div className="profile-identity-copy">
          <div className="page-eyebrow">Approved Facility Account</div>
          <h2>{person.name}</h2>
          <div>{person.email}</div>
          <div className="profile-chip-row">
            <Chip kind="info" dot>{session?.user?.role || account.role}</Chip>
            <Chip kind={accountStatus === "Active" ? "ok" : "warn"} dot>{accountStatus}</Chip>
          </div>
        </div>
        <div className="profile-identity-meta">
          <span>Facility</span>
          <strong>{hospital?.short || facility.name}</strong>
          <small className="mono">{hospital?.peer_id || "No peer assigned"}</small>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-main-column">
          <ProfileSection
            title="Facility Account"
            sub="Organizational credentials provisioned after PRC approval. Individual attribution is selected inside transaction confirmations."
          >
            <div className="profile-field-grid">
              <ProfileField label="Account Name" value={person.name} />
              <ProfileField label="Account Type" value={person.position} />
              <ProfileField label="Facility ID" value={person.employeeId} mono />
              <ProfileField label="Facility Login Email" value={person.email} />
              <ProfileField label="Official Contact" value={person.phone} />
              <ProfileField label="Account Status" value={accountStatus} />
            </div>
          </ProfileSection>

          <ProfileSection title="Facility Information" sub="Institution details verified for consortium participation.">
            <div className="profile-field-grid">
              <ProfileField label="Facility Name" value={facility.name} />
              <ProfileField label="Registered Legal Name" value={facility.legalName} />
              <ProfileField label="Participation Type" value={facility.type} />
              <ProfileField label="Facility Classification" value={facility.classification} />
              <ProfileField label="Ownership" value={facility.ownership} />
              <ProfileField label="Complete Address" value={facility.address} wide />
              <ProfileField label="Official Facility Email" value={facility.officialEmail} />
              <ProfileField label="Official Phone" value={facility.officialPhone} />
            </div>
          </ProfileSection>

          {facilityStaff.length > 0 && <ProfileSection title="Staff Directory" sub="Read-only personnel approved for transaction attribution. Manage records in Staff & Schedule.">
            <div className="staff-table-wrap"><table><thead><tr><th>Staff member</th><th>Staff ID</th><th>Classification</th><th>Status</th></tr></thead><tbody>{facilityStaff.map((staff) => <tr key={staff.staffId}><td><div className="staff-person"><span>{staff.initials}</span><strong>{staff.name}</strong></div></td><td className="mono">{staff.staffId}</td><td>{staff.classification}</td><td><Chip kind={staff.status === "Active" ? "ok" : "neutral"} dot>{staff.status}</Chip></td></tr>)}</tbody></table></div>
          </ProfileSection>}

          <ProfileSection title="Licensing & Qualification" sub="Approved regulatory and blood-service information.">
            <div className="profile-field-grid">
              <ProfileField label="Hospital / Facility LTO" value={facility.hospitalLto} mono />
              <ProfileField label="Blood Service License / Authority" value={facility.bloodServiceLicense} mono />
              <ProfileField label="Blood Service Category" value={facility.bloodServiceCategory} />
              <ProfileField label="Referral / Supplying Facility" value={facility.referralFacility} />
            </div>
            {documents.length > 0 && (
              <div className="profile-document-list">
                {documents.map((document, index) => (
                  <div key={`${document.category || document.name}-${index}`}>
                    <I name="audit" size={16} />
                    <span><strong>{document.name || document.category}</strong><small>{document.category || "Supporting document"}</small></span>
                    <Chip kind="ok">Verified</Chip>
                  </div>
                ))}
              </div>
            )}
          </ProfileSection>
        </div>

        <div className="profile-side-column">
          <ProfileSection title="Credentials & Access" sub="Role and permission assignment for this account.">
            <dl className="kv profile-kv">
              <dt>Assigned Role</dt><dd>{session?.user?.role || account.role}</dd>
              <dt>Account Status</dt><dd><Chip kind={accountStatus === "Active" ? "ok" : "warn"} dot>{accountStatus}</Chip></dd>
              <dt>Facility ID</dt><dd className="mono small">{hospital?.id || "—"}</dd>
              <dt>Access Scope</dt><dd>{permissions?.secondary ? "Requestor facility" : permissions?.canManageAccounts ? "PRC system administration" : permissions?.bloodBank ? "Blood bank facility" : "Regulatory compliance"}</dd>
              <dt>Last Sign-in</dt><dd className="mono small">{storedProfile.lastSignIn || "2026-08-11 09:42"}</dd>
            </dl>
          </ProfileSection>

          <ProfileSection title="Application Record" sub="Institutional approval and account provenance.">
            <dl className="kv profile-kv">
              <dt>Application ID</dt><dd className="mono small">{applicationId}</dd>
              <dt>Submitted</dt><dd className="mono small">{application.submitted || storedProfile.submitted || "Existing consortium record"}</dd>
              <dt>Approved</dt><dd className="mono small">{application.reviewed_at || storedProfile.approvedAt || "2026-07-15 10:30"}</dd>
              <dt>Approved By</dt><dd>{application.reviewed_by || storedProfile.approvedBy || "PRC System Administration"}</dd>
              <dt>Application Type</dt><dd>{application.applicant_type || facility.type}</dd>
            </dl>
          </ProfileSection>

          <ProfileSection title="Security" sub="Manage authentication for your own account.">
            <div className="profile-security-action">
              <I name="shield" size={20} />
              <div><strong>Password</strong><span>Use at least eight characters and keep credentials private.</span></div>
            </div>
            <Btn kind="default" onClick={() => setPasswordModal(true)}>Change Password</Btn>
          </ProfileSection>

          <div className="profile-readonly-note">
            <I name="info" size={16} />
            <span>The Facility Account and licensing fields are based on the approved application. Staff are selected only within transaction workflows and retain historical attribution if later made Inactive.</span>
          </div>
        </div>
      </div>

      {passwordModal && (
        <Modal title="Change Password" sub="Update the password used for this BloodLedger account." onClose={() => setPasswordModal(false)} footer={<><Btn kind="ghost" onClick={() => setPasswordModal(false)}>Cancel</Btn><Btn kind="primary" icon="check" onClick={updatePassword}>Update Password</Btn></>}>
          <div className="profile-password-fields">
            <label className="request-field"><span>Current Password</span><input type="password" value={passwords.current} onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))} /></label>
            <label className="request-field"><span>New Password</span><input type="password" value={passwords.next} onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))} /></label>
            <label className="request-field"><span>Confirm New Password</span><input type="password" value={passwords.confirm} onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))} /></label>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfileSection({ title, sub, action, children }) {
  return <section className="card profile-section"><div className="card-h"><div><h3>{title}</h3><div className="sub muted">{sub}</div></div>{action}</div><div className="card-b">{children}</div></section>;
}

function ProfileField({ label, value, mono, wide }) {
  return <div className={`profile-field ${wide ? "wide" : ""}`}><span>{label}</span><strong className={mono ? "mono" : ""}>{value || "Not recorded"}</strong></div>;
}

Object.assign(window, { ProfilePage });
