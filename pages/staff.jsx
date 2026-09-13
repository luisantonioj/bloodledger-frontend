// pages/staff.jsx - Facility staff directory and duty schedule administration.

function StaffSchedulePage({ hospital, permissions, staffDirectory, dutySchedules, onUpdateStaffDirectory, onUpdateDutySchedules, auditRows, onUpdateAudit }) {
  const bloodBank = !!hospital?.is_blood_bank;
  const [tab, setTab] = React.useState("directory");
  const [addOpen, setAddOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState(null);
  const [adminId, setAdminId] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [uploadError, setUploadError] = React.useState("");
  const [schedulePreview, setSchedulePreview] = React.useState(null);
  const [newStaff, setNewStaff] = React.useState({ name: "", staffId: "", classification: bloodBank ? "Blood Bank Staff" : "Requestor Staff", professionalLicense: "", phone: "" });
  const toast = React.useContext(ToastCtx);
  const rows = (staffDirectory?.[hospital?.id] || []);
  const schedules = (dutySchedules?.[hospital?.id] || []);
  const adminClass = bloodBank ? "Blood Bank Head" : "Facility Administrator";
  const administrators = rows.filter((staff) => staff.status === "Active" && staff.classification === adminClass);
  const classifications = bloodBank ? ["Blood Bank Head", "Blood Bank Staff"] : ["Facility Administrator", "Requestor Staff"];

  if (!permissions?.canManageStaff) {
    return <div className="page"><AnalyticsState kind="unauthorized" title="Staff administration is not authorized" text="Only approved hospital Facility Accounts may open this module." /></div>;
  }

  const audit = (action, target, details) => {
    const actor = rows.find((staff) => staff.staffId === adminId);
    const event = {
      timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
      activity: action,
      type: action,
      user: actor?.name || "Facility administrator",
      source: actor?.name || "Facility administrator",
      facilityId: hospital.id,
      operatorStaffId: actor?.staffId || null,
      operatorName: actor?.name || null,
      operatorClassification: actor?.classification || adminClass,
      reference: target,
      details,
      status: "Recorded",
      tx_hash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`,
    };
    onUpdateAudit?.([event, ...(auditRows || [])]);
  };

  const requestAdminAction = (action) => {
    setAdminId(administrators[0]?.staffId || "");
    setPin("");
    setPendingAction(action);
  };

  const authorize = () => {
    const administrator = administrators.find((staff) => staff.staffId === adminId);
    if (!administrator || administrator.adminPin !== pin) {
      toast.push({ kind: "warn", text: "Administrative PIN not accepted", sub: `Select the active ${adminClass} and enter the assigned mock PIN.` });
      return;
    }
    pendingAction?.run(administrator);
    setPendingAction(null);
    setPin("");
  };

  const saveDirectory = (next) => {
    onUpdateStaffDirectory?.({ ...staffDirectory, [hospital.id]: next });
  };

  const addStaff = () => {
    if (!newStaff.name.trim() || !newStaff.staffId.trim() || rows.some((staff) => staff.staffId.toLowerCase() === newStaff.staffId.trim().toLowerCase())) {
      toast.push({ kind: "warn", text: "Staff record is incomplete", sub: "Use a unique Staff ID and enter the staff member's name." });
      return;
    }
    requestAdminAction({
      title: "Authorize new staff record",
      summary: `${newStaff.name} will become Active immediately as ${newStaff.classification}.`,
      run: () => {
        const record = { ...newStaff, name: newStaff.name.trim(), staffId: newStaff.staffId.trim(), status: "Active", initials: newStaff.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() };
        saveDirectory([...rows, record]);
        audit("Staff added", record.staffId, `${record.name} created as ${record.classification}; status Active.`);
        setAddOpen(false);
        setNewStaff({ name: "", staffId: "", classification: bloodBank ? "Blood Bank Staff" : "Requestor Staff", professionalLicense: "", phone: "" });
        toast.push({ kind: "ok", text: "Staff member added", sub: `${record.name} is Active and available for transaction attribution.` });
      },
    });
  };

  const toggleStatus = (staff) => requestAdminAction({
    title: `${staff.status === "Active" ? "Deactivate" : "Activate"} staff member`,
    summary: staff.status === "Active" ? `${staff.name} will no longer appear in transaction operator selectors. Historical attribution is retained.` : `${staff.name} will become available for operator selection immediately.`,
    run: () => {
      const status = staff.status === "Active" ? "Inactive" : "Active";
      saveDirectory(rows.map((item) => item.staffId === staff.staffId ? { ...item, status } : item));
      audit("Staff status changed", staff.staffId, `${staff.name} changed from ${staff.status} to ${status}.`);
      toast.push({ kind: "ok", text: `Staff marked ${status}`, sub: "Historical ledger attribution was not changed." });
    },
  });

  const changeClassification = (staff, classification) => {
    if (classification === staff.classification) return;
    requestAdminAction({
      title: "Authorize classification change",
      summary: `${staff.name}: ${staff.classification} → ${classification}`,
      run: (administrator) => {
        let next = rows.map((item) => item.staffId === staff.staffId ? { ...item, classification } : item);
        if (classification === adminClass) {
          next = next.map((item) => item.staffId !== staff.staffId && item.classification === adminClass ? { ...item, classification: bloodBank ? "Blood Bank Staff" : "Requestor Staff", adminPin: undefined } : item);
          next = next.map((item) => item.staffId === staff.staffId ? { ...item, adminPin: administrator.adminPin } : item);
        }
        saveDirectory(next);
        audit(classification === adminClass ? "Administrator responsibility transferred" : "Staff classification changed", staff.staffId, `${staff.name} changed from ${staff.classification} to ${classification}.`);
        toast.push({ kind: "ok", text: classification === adminClass ? "Administrator responsibility transferred" : "Classification updated", sub: `${staff.name} is now ${classification}.` });
      },
    });
  };

  const downloadTemplate = () => {
    const primaryExample = rows.find((staff) => staff.status === "Active" && staff.classification !== adminClass) || rows.find((staff) => staff.status === "Active");
    const supportingExample = rows.find((staff) => staff.status === "Active" && staff.staffId !== primaryExample?.staffId) || primaryExample;
    const quoted = (value) => `"${String(value || "").replace(/"/g, '""')}"`;
    const content = `\ufeffstaff_id,staff_name,shift_start,shift_end,assignment\r\n${quoted(primaryExample?.staffId || "STAFF-001")},${quoted(primaryExample?.name || "Primary Staff")},"2026-09-13 08:00","2026-09-13 16:00","Primary"\r\n${quoted(supportingExample?.staffId || "STAFF-002")},${quoted(supportingExample?.name || "Supporting Staff")},"2026-09-13 08:00","2026-09-13 16:00","Supporting"`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bloodledger-duty-schedule-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const inspectSchedule = async (file) => {
    setUploadError("");
    setSchedulePreview(null);
    if (!file) return;
    const csv = parseCsvText(await file.text());
    const expected = ["staff_id", "staff_name", "shift_start", "shift_end", "assignment"];
    if (!csv.length || expected.some((header, index) => String(csv[0][index] || "").toLowerCase() !== header)) {
      setUploadError(`Use the required columns in this order: ${expected.join(", ")}.`);
      return;
    }
    const parsed = csv.slice(1).map((values) => Object.fromEntries(expected.map((header, index) => [header, values[index] || ""])));
    const errors = [];
    parsed.forEach((entry, index) => {
      const staff = rows.find((item) => item.staffId === entry.staff_id);
      const start = parseFacilityDateTime(entry.shift_start);
      const end = parseFacilityDateTime(entry.shift_end);
      if (!staff || staff.status !== "Active") errors.push(`Row ${index + 2}: Staff ID is not Active in this facility.`);
      if (staff && entry.staff_name !== staff.name) errors.push(`Row ${index + 2}: Staff name does not match ${entry.staff_id}.`);
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(entry.shift_start) || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(entry.shift_end) || !start || !end || end <= start) errors.push(`Row ${index + 2}: Enter complete Asia/Manila date-times with an end after the start.`);
      if (!["Primary", "Supporting"].includes(entry.assignment)) errors.push(`Row ${index + 2}: Assignment must be Primary or Supporting.`);
    });
    const primaries = parsed.filter((entry) => entry.assignment === "Primary");
    primaries.forEach((entry, index) => primaries.slice(index + 1).forEach((other) => {
      const aStart = parseFacilityDateTime(entry.shift_start); const aEnd = parseFacilityDateTime(entry.shift_end);
      const bStart = parseFacilityDateTime(other.shift_start); const bEnd = parseFacilityDateTime(other.shift_end);
      if (aStart && aEnd && bStart && bEnd && aStart < bEnd && bStart < aEnd) errors.push(`Primary conflict: ${entry.staff_id} and ${other.staff_id} overlap.`);
    }));
    parsed.filter((entry) => entry.assignment === "Supporting").forEach((entry) => {
      const start = parseFacilityDateTime(entry.shift_start); const end = parseFacilityDateTime(entry.shift_end);
      const matches = primaries.filter((primary) => { const pStart = parseFacilityDateTime(primary.shift_start); const pEnd = parseFacilityDateTime(primary.shift_end); return pStart && pEnd && start && end && pStart < end && start < pEnd; });
      if (matches.length !== 1) errors.push(`${entry.staff_id}: the Supporting duty period must overlap exactly one Primary operator.`);
    });
    if (!primaries.length) errors.push("At least one Primary operator is required.");
    if (errors.length) {
      setUploadError(Array.from(new Set(errors)).join(" "));
      return;
    }
    setSchedulePreview({ fileName: file.name, rows: parsed, coveredDates: Array.from(new Set(parsed.map((entry) => entry.shift_start.slice(0, 10)))) });
  };

  const importSchedule = () => requestAdminAction({
    title: "Authorize duty schedule import",
    summary: `${schedulePreview?.rows.length || 0} entries will replace the schedule only for ${schedulePreview?.coveredDates.join(", ")}.`,
    run: () => {
      const covered = new Set(schedulePreview.coveredDates);
      const retained = schedules.filter((entry) => !covered.has(entry.shift_start.slice(0, 10)));
      onUpdateDutySchedules?.({ ...dutySchedules, [hospital.id]: [...retained, ...schedulePreview.rows].sort((a, b) => a.shift_start.localeCompare(b.shift_start)) });
      audit("Duty schedule imported", schedulePreview.fileName, `${schedulePreview.rows.length} entries replaced dates ${schedulePreview.coveredDates.join(", ")}.`);
      setSchedulePreview(null);
      toast.push({ kind: "ok", text: "Duty schedule imported", sub: "Current Primary and Supporting assignments are now available to transaction operator selectors." });
    },
  });

  return <div className="page staff-page">
    <PageHead eyebrow={hospital?.short} title="Staff & Schedule" sub="Maintain Active facility staff and assign the transaction operator through an approved duty schedule." />
    <div className="tabs"><button className={tab === "directory" ? "active" : ""} onClick={() => setTab("directory")}>Staff Directory <span>{rows.length}</span></button>{bloodBank && <button className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}>Duty Schedule <span>{schedules.length}</span></button>}</div>

    {tab === "directory" && <section className="card">
      <div className="card-h"><div><h3>Facility Staff Directory</h3><div className="sub muted">Only Active staff appear in transaction operator selectors. Historical attribution is never rewritten.</div></div><Btn icon="user" kind="primary" onClick={() => setAddOpen(true)}>Add Staff</Btn></div>
      <div className="staff-table-wrap"><table><thead><tr><th>Staff member</th><th>Staff ID</th><th>Classification</th><th>License / contact</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((staff) => <tr key={staff.staffId}><td><div className="staff-person"><span>{staff.initials}</span><strong>{staff.name}</strong></div></td><td className="mono">{staff.staffId}</td><td><select value={staff.classification} onChange={(event) => changeClassification(staff, event.target.value)}>{classifications.map((item) => <option key={item}>{item}</option>)}</select></td><td><span className="mono small">{staff.professionalLicense || "Not applicable"}</span><small>{staff.phone || "No contact recorded"}</small></td><td><Chip kind={staff.status === "Active" ? "ok" : "neutral"} dot>{staff.status}</Chip></td><td><Btn size="sm" kind={staff.status === "Active" ? "ghost" : "default"} onClick={() => toggleStatus(staff)}>{staff.status === "Active" ? "Make Inactive" : "Activate"}</Btn></td></tr>)}</tbody></table></div>
      <div className="staff-policy-note"><I name="shield" size={16} /><span>Adding staff, changing status/classification, and transferring {adminClass} responsibility require the current {adminClass}'s administrative PIN. PRC can perform documented recovery when that person is unavailable.</span></div>
    </section>}

    {tab === "schedule" && <div className="staff-schedule-layout">
      <section className="card"><div className="card-h"><div><h3>Import Duty Schedule</h3><div className="sub muted">CSV date-times use Asia/Manila. Overnight shifts are supported.</div></div><Btn icon="download" size="sm" onClick={downloadTemplate}>Download Template</Btn></div><div className="card-b"><label className="schedule-upload"><I name="upload" size={20} /><span><strong>Choose completed schedule CSV</strong><small>Required: staff_id, staff_name, shift_start, shift_end, assignment</small></span><input type="file" accept=".csv,text/csv" onChange={(event) => inspectSchedule(event.target.files?.[0])} /></label>{uploadError && <div className="auth-login-error" role="alert">{uploadError}</div>}{schedulePreview && <div className="schedule-preview"><div><strong>Validated preview</strong><span>{schedulePreview.fileName} · {schedulePreview.rows.length} entries · replaces {schedulePreview.coveredDates.join(", ")}</span></div><div className="staff-table-wrap"><table><thead><tr><th>Staff</th><th>Shift start</th><th>Shift end</th><th>Assignment</th></tr></thead><tbody>{schedulePreview.rows.map((entry, index) => <tr key={`${entry.staff_id}-${index}`}><td>{entry.staff_name}<small className="mono">{entry.staff_id}</small></td><td className="mono">{entry.shift_start}</td><td className="mono">{entry.shift_end}</td><td><Chip kind={entry.assignment === "Primary" ? "info" : "neutral"}>{entry.assignment}</Chip></td></tr>)}</tbody></table></div><Btn kind="primary" icon="check" onClick={importSchedule}>Authorize & Save Import</Btn></div>}</div></section>
      <section className="card"><div className="card-h"><div><h3>Current Schedule</h3><div className="sub muted">One Primary operator per overlapping duty period.</div></div></div><div className="staff-table-wrap"><table><thead><tr><th>Staff</th><th>Start</th><th>End</th><th>Assignment</th></tr></thead><tbody>{schedules.length ? schedules.map((entry, index) => <tr key={`${entry.staff_id}-${index}`}><td>{entry.staff_name}<small className="mono">{entry.staff_id}</small></td><td className="mono">{entry.shift_start}</td><td className="mono">{entry.shift_end}</td><td><Chip kind={entry.assignment === "Primary" ? "info" : "neutral"}>{entry.assignment}</Chip></td></tr>) : <tr><td colSpan="4" className="empty">No duty schedule imported. Transactions will require manual operator selection.</td></tr>}</tbody></table></div></section>
    </div>}

    {addOpen && <Modal title="Add Facility Staff" sub="New staff become Active immediately after administrative authorization." onClose={() => setAddOpen(false)} footer={<><Btn kind="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn kind="primary" icon="check" onClick={addStaff}>Continue to Authorization</Btn></>}><div className="application-fields-grid"><label className="field"><span>Full name</span><input value={newStaff.name} onChange={(event) => setNewStaff((current) => ({ ...current, name: event.target.value }))} /></label><label className="field"><span>Staff ID</span><input className="mono" value={newStaff.staffId} onChange={(event) => setNewStaff((current) => ({ ...current, staffId: event.target.value }))} /></label><label className="field"><span>Classification</span><select value={newStaff.classification} onChange={(event) => setNewStaff((current) => ({ ...current, classification: event.target.value }))}>{classifications.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Professional license (optional)</span><input value={newStaff.professionalLicense} onChange={(event) => setNewStaff((current) => ({ ...current, professionalLicense: event.target.value }))} /></label><label className="field"><span>Contact number (optional)</span><input value={newStaff.phone} onChange={(event) => setNewStaff((current) => ({ ...current, phone: event.target.value }))} /></label></div></Modal>}

    {pendingAction && <Modal title={pendingAction.title} sub={pendingAction.summary} onClose={() => setPendingAction(null)} footer={<><Btn kind="ghost" onClick={() => setPendingAction(null)}>Cancel</Btn><Btn kind="primary" icon="shield" onClick={authorize}>Authorize Action</Btn></>}><label className="field"><span>{adminClass}</span><select value={adminId} onChange={(event) => setAdminId(event.target.value)}>{administrators.map((staff) => <option key={staff.staffId} value={staff.staffId}>{staff.name} · {staff.staffId}</option>)}</select></label><label className="field"><span>Administrative PIN</span><input type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Enter PIN" /></label><div className="staff-policy-note"><I name="audit" size={15} /><span>The administrator identity, action, target, timestamp, and ledger ID will be written to Activity History.</span></div></Modal>}
  </div>;
}

Object.assign(window, { StaffSchedulePage });
