// pages/profile.jsx - Signed-in identity and approved institution record.

function ProfilePage({ hospital, session, permissions, accountApplications, staffDirectory, onUpdateStaffDirectory, auditRows, onUpdateAudit }) {
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
  const [manageStaff, setManageStaff] = React.useState(false);
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
        sub="Review the approved Facility Account, institutional application, and authorized Staff Directory."
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

          {facilityStaff.length > 0 && <ProfileSection
            title="Staff Directory"
            sub="Active personnel may authorize transactions with their own personal PIN. Historical attribution is never rewritten."
            action={permissions?.canManageStaff ? <Btn icon={manageStaff ? "x" : "user"} onClick={() => setManageStaff((value) => !value)}>{manageStaff ? "Close Management" : "Manage Staff"}</Btn> : null}
          >
            <StaffDirectoryManager
              hospital={hospital}
              permissions={permissions}
              directory={staffDirectory}
              onUpdateDirectory={onUpdateStaffDirectory}
              auditRows={auditRows}
              onUpdateAudit={onUpdateAudit}
              managing={manageStaff}
            />
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
            <span>The Facility Account and licensing fields are based on the approved application. Every ledger-changing action requires an Active staff member's fresh personal PIN.</span>
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

function StaffDirectoryManager({ hospital, permissions, directory, onUpdateDirectory, auditRows, onUpdateAudit, managing }) {
  const toast = React.useContext(ToastCtx);
  const rows = directory?.[hospital?.id] || [];
  const bloodBank = !!hospital?.is_blood_bank;
  const adminClass = bloodBank ? "Blood Bank Head" : "Facility Administrator";
  const staffClass = bloodBank ? "Blood Bank Staff" : "Requestor Staff";
  const classifications = [adminClass, staffClass];
  const administrators = rows.filter((staff) => staff.status === "Active" && staff.classification === adminClass);
  const [addOpen, setAddOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState(null);
  const [adminId, setAdminId] = React.useState("");
  const [adminPin, setAdminPin] = React.useState("");
  const [enrollment, setEnrollment] = React.useState(null);
  const [privatePin, setPrivatePin] = React.useState("");
  const [confirmPrivatePin, setConfirmPrivatePin] = React.useState("");
  const [newAdminPin, setNewAdminPin] = React.useState("");
  const [confirmAdminPin, setConfirmAdminPin] = React.useState("");
  const [newStaff, setNewStaff] = React.useState({ name: "", staffId: "", professionalLicense: "", phone: "" });

  const save = (nextRows) => onUpdateDirectory?.({ ...directory, [hospital.id]: nextRows });
  const stamp = () => new Date().toISOString().slice(0, 19).replace("T", " ");
  const audit = (actor, action, target, details) => {
    const event = { timestamp: stamp(), activity: action, type: action, user: actor.name, source: actor.name, facilityId: hospital.id, operatorStaffId: actor.staffId, operatorName: actor.name, operatorClassification: actor.classification, reference: target, details, status: "Recorded", tx_hash: transactionAttribution(hospital.id, actor, action).ledgerId };
    onUpdateAudit?.([event, ...(auditRows || [])]);
  };

  const requestAdminAction = (action) => {
    setAdminId(administrators[0]?.staffId || "");
    setAdminPin("");
    setPendingAction(action);
  };

  const authorizeAdminAction = async () => {
    const administrator = administrators.find((staff) => staff.staffId === adminId);
    const result = await BloodLedgerApi.verifyAdministrativePin(hospital.id, adminId, adminPin);
    setAdminPin("");
    if (!administrator || !result?.authorized) {
      toast.push({ kind: "warn", text: "Administrative authorization failed", sub: `Select the Active ${adminClass} and enter the correct administrative PIN.` });
      return;
    }
    const action = pendingAction;
    setPendingAction(null);
    await action?.run(administrator);
  };

  const beginAdd = () => {
    if (!newStaff.name.trim() || !newStaff.staffId.trim() || rows.some((staff) => staff.staffId.toLowerCase() === newStaff.staffId.trim().toLowerCase())) {
      toast.push({ kind: "warn", text: "Staff record is incomplete", sub: "Enter a name and a unique Staff ID." });
      return;
    }
    requestAdminAction({
      title: "Authorize staff enrollment",
      summary: `${newStaff.name.trim()} will privately create a personal transaction PIN before becoming Active.`,
      run: (administrator) => {
        setEnrollment({ mode: "add", administrator, record: { ...newStaff, name: newStaff.name.trim(), staffId: newStaff.staffId.trim(), classification: staffClass, status: "Active", initials: newStaff.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() } });
        setAddOpen(false);
      },
    });
  };

  const toggleStatus = (staff) => {
    if (staff.status === "Active" && staff.classification === adminClass && administrators.length === 1) {
      toast.push({ kind: "warn", text: `${adminClass} cannot be made Inactive`, sub: `Transfer ${adminClass} responsibility to another Active staff member first.` });
      return;
    }
    requestAdminAction({
      title: `${staff.status === "Active" ? "Make staff member Inactive" : "Reactivate staff member"}`,
      summary: staff.status === "Active" ? `${staff.name} will no longer appear in transaction authorization controls.` : `${staff.name} will become available for transaction authorization again.`,
      run: (administrator) => {
        const status = staff.status === "Active" ? "Inactive" : "Active";
        save(rows.map((item) => item.staffId === staff.staffId ? { ...item, status } : item));
        audit(administrator, "Staff status changed", staff.staffId, `${staff.name} changed from ${staff.status} to ${status}.`);
        toast.push({ kind: "ok", text: `Staff marked ${status}`, sub: "Historical operator attribution was retained." });
      },
    });
  };

  const changeClassification = (staff, classification) => {
    if (classification === staff.classification) return;
    if (classification === adminClass && staff.status !== "Active") {
      toast.push({ kind: "warn", text: `Inactive staff cannot become ${adminClass}`, sub: "Reactivate the staff member before transferring administrator responsibility." });
      return;
    }
    if (staff.classification === adminClass && classification !== adminClass) {
      toast.push({ kind: "warn", text: `${adminClass} must be transferred`, sub: `Assign another Active staff member as ${adminClass} instead of leaving the facility without an administrator.` });
      return;
    }
    requestAdminAction({
      title: classification === adminClass ? `Transfer ${adminClass} responsibility` : "Authorize classification change",
      summary: `${staff.name}: ${staff.classification} → ${classification}`,
      run: (administrator) => {
        if (classification === adminClass) {
          setEnrollment({ mode: "admin-transfer", administrator, staff });
          return;
        }
        save(rows.map((item) => item.staffId === staff.staffId ? { ...item, classification } : item));
        audit(administrator, "Staff classification changed", staff.staffId, `${staff.name} changed from ${staff.classification} to ${classification}.`);
      },
    });
  };

  const resetOperatorPin = (staff) => requestAdminAction({
    title: "Authorize personal PIN reset",
    summary: `${staff.name} will privately enter a replacement six-digit operator PIN.`,
    run: (administrator) => setEnrollment({ mode: "reset", administrator, staff }),
  });

  const completeEnrollment = async () => {
    if (!/^\d{6}$/.test(privatePin) || privatePin !== confirmPrivatePin) {
      toast.push({ kind: "warn", text: "Personal PIN was not enrolled", sub: "Enter the same six-digit PIN in both fields." });
      return;
    }
    if (enrollment.mode === "admin-transfer" && (!/^\d{6}$/.test(newAdminPin) || newAdminPin !== confirmAdminPin || newAdminPin === privatePin)) {
      toast.push({ kind: "warn", text: "Administrative PIN was not enrolled", sub: "Enter matching six-digit administrative PINs that differ from the personal operator PIN." });
      return;
    }
    const operatorPinHash = await BloodLedgerApi.hashMockPin(privatePin);
    const enrollmentStaffId = enrollment.record?.staffId || enrollment.staff?.staffId;
    if (rows.some((staff) => staff.staffId !== enrollmentStaffId && staff.operatorPinHash === operatorPinHash)) {
      toast.push({ kind: "warn", text: "Personal PIN is already in use", sub: "Choose a different six-digit PIN so each staff member has a unique authorization credential." });
      return;
    }
    const enrolledAt = stamp();
    if (enrollment.mode === "add") {
      const record = { ...enrollment.record, operatorPinHash, pinEnrolledAt: enrolledAt };
      save([...rows, record]);
      audit(enrollment.administrator, "Staff added", record.staffId, `${record.name} enrolled as ${record.classification}; status Active.`);
    } else if (enrollment.mode === "reset") {
      save(rows.map((item) => item.staffId === enrollment.staff.staffId ? { ...item, operatorPinHash, pinEnrolledAt: enrolledAt } : item));
      audit(enrollment.administrator, "Operator PIN reset", enrollment.staff.staffId, `${enrollment.staff.name} privately enrolled a replacement operator PIN.`);
    } else {
      const adminPinHash = await BloodLedgerApi.hashMockPin(newAdminPin);
      save(rows.map((item) => item.staffId === enrollment.staff.staffId ? { ...item, classification: adminClass, operatorPinHash, adminPinHash, pinEnrolledAt: enrolledAt } : item.classification === adminClass ? { ...item, classification: staffClass, adminPinHash: undefined } : item));
      audit(enrollment.administrator, "Administrator responsibility transferred", enrollment.staff.staffId, `${enrollment.staff.name} became ${adminClass}; the previous administrator was reassigned as ${staffClass}.`);
    }
    setEnrollment(null);
    setPrivatePin(""); setConfirmPrivatePin(""); setNewAdminPin(""); setConfirmAdminPin("");
    setNewStaff({ name: "", staffId: "", professionalLicense: "", phone: "" });
    toast.push({ kind: "ok", text: "Private PIN enrollment complete", sub: "The PIN is stored only as a mock hash and is not visible to facility administrators." });
  };

  return <>
    {managing && <div className="staff-management-toolbar"><div><strong>Protected staff management</strong><span>Administrative actions require the current {adminClass}'s separate PIN.</span></div><Btn kind="primary" icon="user" onClick={() => setAddOpen(true)}>Add Staff</Btn></div>}
    <div className="staff-table-wrap"><table><thead><tr><th>Staff member</th><th>Staff ID</th><th>Classification</th><th>Status</th><th>PIN status</th>{managing && <th>Actions</th>}</tr></thead><tbody>{rows.map((staff) => <tr key={staff.staffId}><td><div className="staff-person"><span>{staff.initials}</span><strong>{staff.name}</strong></div></td><td className="mono">{staff.staffId}</td><td>{managing ? <select value={staff.classification} onChange={(event) => changeClassification(staff, event.target.value)}>{classifications.map((item) => <option key={item}>{item}</option>)}</select> : staff.classification}</td><td><Chip kind={staff.status === "Active" ? "ok" : "neutral"} dot>{staff.status}</Chip></td><td><Chip kind={staff.operatorPinHash ? "info" : "warn"}>{staff.operatorPinHash ? "Enrolled" : "Required"}</Chip></td>{managing && <td><div className="staff-row-actions"><Btn size="sm" onClick={() => resetOperatorPin(staff)}>Reset PIN</Btn><Btn size="sm" kind={staff.status === "Active" ? "ghost" : "default"} onClick={() => toggleStatus(staff)}>{staff.status === "Active" ? "Make Inactive" : "Activate"}</Btn></div></td>}</tr>)}</tbody></table></div>
    {managing && <div className="staff-policy-note"><I name="shield" size={16} /><span>Personal operator PINs are private and required again for every ledger-changing action. Administrative PINs are separate and limited to the {adminClass}.</span></div>}

    {addOpen && <Modal title="Add Facility Staff" sub={`New personnel are enrolled as ${staffClass} and become Active after private PIN setup.`} onClose={() => setAddOpen(false)} footer={<><Btn kind="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn kind="primary" icon="check" onClick={beginAdd}>Continue to Authorization</Btn></>}><div className="application-fields-grid"><label className="field"><span>Full name</span><input value={newStaff.name} onChange={(event) => setNewStaff((current) => ({ ...current, name: event.target.value }))} /></label><label className="field"><span>Staff ID</span><input className="mono" value={newStaff.staffId} onChange={(event) => setNewStaff((current) => ({ ...current, staffId: event.target.value }))} /></label><label className="field"><span>Classification</span><input value={staffClass} disabled /></label><label className="field"><span>Professional license (optional)</span><input value={newStaff.professionalLicense} onChange={(event) => setNewStaff((current) => ({ ...current, professionalLicense: event.target.value }))} /></label><label className="field"><span>Contact number (optional)</span><input value={newStaff.phone} onChange={(event) => setNewStaff((current) => ({ ...current, phone: event.target.value }))} /></label></div></Modal>}

    {pendingAction && <Modal title={pendingAction.title} sub={pendingAction.summary} onClose={() => { setPendingAction(null); setAdminPin(""); }} footer={<><Btn kind="ghost" onClick={() => setPendingAction(null)}>Cancel</Btn><Btn kind="primary" icon="shield" onClick={authorizeAdminAction}>Authorize Action</Btn></>}><label className="field"><span>{adminClass}</span><select value={adminId} onChange={(event) => setAdminId(event.target.value)}>{administrators.map((staff) => <option key={staff.staffId} value={staff.staffId}>{staff.name} · {staff.staffId}</option>)}</select></label><label className="field"><span>Administrative PIN</span><input type="password" inputMode="numeric" autoComplete="off" value={adminPin} onChange={(event) => setAdminPin(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter administrative PIN" /></label><div className="staff-policy-note"><I name="audit" size={15} /><span>The administrator identity, action, target, timestamp, and ledger ID will be written to Activity History.</span></div></Modal>}

    {enrollment && <Modal title={enrollment.mode === "add" ? "Private Operator PIN Enrollment" : enrollment.mode === "reset" ? "Private Operator PIN Reset" : `Transfer ${adminClass}`} sub="Hand control to the staff member. The authorizing administrator should not view the PIN being entered." onClose={() => { setEnrollment(null); setPrivatePin(""); setConfirmPrivatePin(""); setNewAdminPin(""); setConfirmAdminPin(""); }} footer={<><Btn kind="ghost" onClick={() => setEnrollment(null)}>Cancel</Btn><Btn kind="primary" icon="shield" onClick={completeEnrollment}>Complete Private Enrollment</Btn></>}><div className="private-pin-handoff"><I name="shield" size={20} /><div><strong>{enrollment.record?.name || enrollment.staff?.name}</strong><span>{enrollment.record?.staffId || enrollment.staff?.staffId} · PIN values are never displayed after enrollment.</span></div></div><div className="profile-password-fields"><label className="request-field"><span>New six-digit operator PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength="6" value={privatePin} onChange={(event) => setPrivatePin(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label><label className="request-field"><span>Confirm operator PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength="6" value={confirmPrivatePin} onChange={(event) => setConfirmPrivatePin(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>{enrollment.mode === "admin-transfer" && <><label className="request-field"><span>New six-digit administrative PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength="6" value={newAdminPin} onChange={(event) => setNewAdminPin(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label><label className="request-field"><span>Confirm administrative PIN</span><input type="password" inputMode="numeric" autoComplete="new-password" maxLength="6" value={confirmAdminPin} onChange={(event) => setConfirmAdminPin(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label></>}</div></Modal>}
  </>;
}

function ProfileSection({ title, sub, action, children }) {
  return <section className="card profile-section"><div className="card-h"><div><h3>{title}</h3><div className="sub muted">{sub}</div></div>{action}</div><div className="card-b">{children}</div></section>;
}

function ProfileField({ label, value, mono, wide }) {
  return <div className={`profile-field ${wide ? "wide" : ""}`}><span>{label}</span><strong className={mono ? "mono" : ""}>{value || "Not recorded"}</strong></div>;
}

Object.assign(window, { ProfilePage });
