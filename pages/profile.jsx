// pages/profile.jsx - Signed-in identity and approved institution record.

function ProfilePage({ hospital, session, permissions, accountApplications }) {
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
  const [contact, setContact] = React.useState({
    phone: storedProfile.phone || applicationFacility.phone || "Not recorded",
    email,
  });
  const [editingContact, setEditingContact] = React.useState(false);
  const [passwordModal, setPasswordModal] = React.useState(false);
  const [passwords, setPasswords] = React.useState({ current: "", next: "", confirm: "" });
  const toast = React.useContext(ToastCtx);

  const person = {
    name: application.name || account.name || session?.user?.name || "Authorized user",
    position: applicationFacility.position || storedProfile.position || account.role || session?.user?.role,
    employeeId: application.employee_id || applicationFacility.employeeId || storedProfile.employeeId || "Not recorded",
    phone: contact.phone,
    email: contact.email,
    license: applicationFacility.medtechLicense || storedProfile.professionalLicense || "Not applicable",
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

  const saveContact = () => {
    window.USER_PROFILE_DETAILS = {
      ...(window.USER_PROFILE_DETAILS || {}),
      [email]: { ...storedProfile, phone: contact.phone },
    };
    setEditingContact(false);
    toast.push({ kind: "ok", text: "Contact information updated", sub: "Your profile phone number was updated for this prototype session." });
  };

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
        sub="Review your approved identity, facility affiliation, and BloodLedger access."
      />

      <div className="profile-identity-card">
        <div className="profile-avatar">{session?.user?.initials || "U"}</div>
        <div className="profile-identity-copy">
          <div className="page-eyebrow">Authorized consortium user</div>
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
            title="Personal Information"
            sub="Primary account details submitted during institutional application."
            action={<Btn size="sm" kind="ghost" icon="user" onClick={() => setEditingContact(true)}>Edit Contact</Btn>}
          >
            <div className="profile-field-grid">
              <ProfileField label="Full Name" value={person.name} />
              <ProfileField label="Official Position" value={person.position} />
              <ProfileField label="Employee ID" value={person.employeeId} mono />
              <ProfileField label="Institutional Email" value={person.email} />
              <ProfileField label="Contact Number" value={person.phone} />
              <ProfileField label="Professional License" value={person.license} mono />
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
              <dt>Access Scope</dt><dd>{permissions?.secondary ? "Requestor facility" : permissions?.canManageAccounts ? "System administration" : "Blood bank operations"}</dd>
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
            <span>Identity, role, facility, and licensing fields are based on the approved application. Contact PRC System Administration to request corrections.</span>
          </div>
        </div>
      </div>

      {editingContact && (
        <Modal title="Edit Contact Information" sub="Only your contact number can be changed directly in this prototype." onClose={() => setEditingContact(false)} footer={<><Btn kind="ghost" onClick={() => setEditingContact(false)}>Cancel</Btn><Btn kind="primary" icon="check" onClick={saveContact}>Save Changes</Btn></>}>
          <label className="request-field"><span>Institutional Email</span><input value={contact.email} disabled /></label>
          <label className="request-field"><span>Contact Number</span><input value={contact.phone === "Not recorded" ? "" : contact.phone} onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))} placeholder="Enter contact number" /></label>
          <div className="profile-modal-note">Changes to your email, name, role, employee ID, or facility require administrator review.</div>
        </Modal>
      )}

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
