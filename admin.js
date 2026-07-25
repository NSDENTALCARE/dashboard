// ==========================================================================
// ADMIN MASTER GOVERNANCE & EMERGENCY REPAIR SUITE (v2.4.0)
// ==========================================================================

function setStaffViewMode(mode) {
    staffViewMode = mode;
    const btnList = document.getElementById('btn_staff_view_list');
    const btnGrid = document.getElementById('btn_staff_view_grid');
    const containerList = document.getElementById('staffListViewContainer');
    const containerGrid = document.getElementById('staffGridViewContainer');

    if (mode === 'list') {
        if (btnList) btnList.className = 'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-red-700 text-white shadow';
        if (btnGrid) btnGrid.className = 'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-400 hover:text-white';
        if (containerList) containerList.classList.remove('hidden-section');
        if (containerGrid) containerGrid.classList.add('hidden-section');
    } else {
        if (btnList) btnList.className = 'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-400 hover:text-white';
        if (btnGrid) btnGrid.className = 'px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-red-700 text-white shadow';
        if (containerList) containerList.classList.add('hidden-section');
        if (containerGrid) containerGrid.classList.remove('hidden-section');
    }

    renderAdminUsers();
}

function renderAdminUsers() {
    const tbl = document.getElementById('adminUserManagementTable');
    const grid = document.getElementById('staffGridViewContainer');

    if (tbl) {
        tbl.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${u.name}</td>
                <td class="p-2.5 uppercase font-mono text-amber-400 font-bold">${u.role}</td>
                <td class="p-2.5 font-mono">${u.phone}</td>
                <td class="p-2.5"><span class="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">${u.accessTier || 'limited'}</span></td>
                <td class="p-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                        ${u.status}
                    </span>
                </td>
                <td class="p-2.5">
                    <button onclick="openEditStaffModal(${u.id})" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-[10px] shadow">
                        Edit Credentials
                    </button>
                </td>
            </tr>
        `).join('');
    }

    if (grid) {
        grid.innerHTML = users.map(u => `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 shadow-md">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                        <strong class="text-white text-sm block">${u.name}</strong>
                        <span class="text-amber-400 font-mono text-[10px] font-bold uppercase">${u.role} (${u.accessTier || 'limited'})</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                        ${u.status}
                    </span>
                </div>
                <p class="text-xs text-slate-400 font-mono">📞 ${u.phone} | ✉️ ${u.email}</p>
                <div class="flex justify-between items-center pt-2">
                    ${u.idProofBase64 ? `<span class="text-[9px] text-emerald-400 font-mono font-bold">✓ ID Proof Uploaded</span>` : `<span class="text-[9px] text-slate-500 font-mono">No ID File</span>`}
                    <button onclick="openEditStaffModal(${u.id})" class="bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded text-xs shadow">
                        Modify Profile
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function openEditStaffModal(userId) {
    const u = users.find(x => x.id === userId);
    if (!u) return;

    document.getElementById('edit_staff_target_id').value = u.id;
    document.getElementById('edit_staff_name').value = u.name;
    document.getElementById('edit_staff_phone').value = u.phone;
    document.getElementById('edit_staff_email').value = u.email;
    document.getElementById('edit_staff_role').value = u.role;
    document.getElementById('edit_staff_status').value = u.status;
    document.getElementById('edit_staff_password').value = u.password;

    if (u.accessTier === 'full') {
        document.getElementById('tier_full').checked = true;
    } else {
        document.getElementById('tier_limited').checked = true;
    }

    const preview = document.getElementById('edit_staff_proof_preview');
    if (u.idProofBase64) {
        preview.innerText = "✓ Identity proof file currently attached.";
    } else {
        preview.innerText = "No identity proof document attached yet.";
    }

    document.getElementById('editStaffModal').classList.remove('hidden');
    document.getElementById('editStaffModal').classList.add('flex');
}

function closeEditStaffModal() {
    document.getElementById('editStaffModal').classList.add('hidden');
    document.getElementById('editStaffModal').classList.remove('flex');
}

async function handleStaffEditSubmit(e) {
    e.preventDefault();
    const targetId = parseInt(document.getElementById('edit_staff_target_id').value);
    const u = users.find(x => x.id === targetId);

    if (!u) return;

    u.name = document.getElementById('edit_staff_name').value;
    u.phone = document.getElementById('edit_staff_phone').value;
    u.email = document.getElementById('edit_staff_email').value;
    u.role = document.getElementById('edit_staff_role').value;
    u.status = document.getElementById('edit_staff_status').value;
    u.password = document.getElementById('edit_staff_password').value;
    u.accessTier = document.getElementById('tier_full').checked ? 'full' : 'limited';

    const fileInput = document.getElementById('edit_staff_proof_file');

    async function finishSave() {
        await storageEngine.setItem('ns_users', users);
        renderAdminUsers();
        logAction(`Updated credentials and status for staff user ${u.name}`);
        alert(`Profile for ${u.name} Updated Successfully!`);
        closeEditStaffModal();
    }

    if (fileInput && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            u.idProofBase64 = evt.target.result;
            await finishSave();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        await finishSave();
    }
}

async function deleteStaffAccount() {
    const targetId = parseInt(document.getElementById('edit_staff_target_id').value);
    const u = users.find(x => x.id === targetId);

    if (u && confirm(`PERMANENTLY DELETE staff profile for ${u.name}?`)) {
        users = users.filter(x => x.id !== targetId);
        await storageEngine.setItem('ns_users', users);
        renderAdminUsers();
        logAction(`Deleted staff profile for ${u.name}`);
        alert("Staff Account Removed!");
        closeEditStaffModal();
    }
}

function openCreateStaffModal() {
    const newId = Date.now();
    users.push({
        id: newId,
        name: "New Staff Member",
        role: "assistant",
        phone: "9000000000",
        email: "staff@nsdentalcare.com",
        password: "123",
        status: "Approved",
        accessTier: "limited",
        idProofBase64: null
    });
    openEditStaffModal(newId);
}

function renderApprovals() {
    const tbl = document.getElementById('tblApprovals');
    if (!tbl) return;

    const pending = users.filter(u => u.status === 'Pending');

    if (pending.length === 0) {
        tbl.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-500">No pending staff registrations awaiting approval.</td></tr>`;
        return;
    }

    tbl.innerHTML = pending.map(u => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-bold text-white">${u.name}</td>
            <td class="p-3 uppercase font-mono text-amber-400">${u.role}</td>
            <td class="p-3">${u.phone}<br><span class="text-[10px] text-slate-400">${u.email}</span></td>
            <td class="p-3 flex gap-1">
                <button onclick="approveStaffUser(${u.id})" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-xs shadow">Approve</button>
                <button onclick="rejectStaffUser(${u.id})" class="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-1 rounded text-xs shadow">Reject</button>
            </td>
        </tr>
    `).join('');
}

async function approveStaffUser(userId) {
    const u = users.find(x => x.id === userId);
    if (u) {
        u.status = 'Approved';
        await storageEngine.setItem('ns_users', users);
        renderApprovals();
        renderAdminUsers();
        logAction(`Approved registration request for ${u.name}`);
        alert(`Account approved for ${u.name}!`);
    }
}

async function rejectStaffUser(userId) {
    if (confirm("Reject and delete this registration request?")) {
        users = users.filter(x => x.id !== userId);
        await storageEngine.setItem('ns_users', users);
        renderApprovals();
        renderAdminUsers();
        logAction(`Rejected registration request ID ${userId}`);
    }
}

// EMERGENCY FIX & REPAIR UTILITIES
async function adminFixMissingReceipts() {
    let count = 0;
    appointments.forEach(a => {
        let l = ledgers.find(x => x.patientId === a.patientId);
        if (!l) {
            count++;
            ledgers.push({
                id: "REC-" + Math.floor(1000 + Math.random() * 9000),
                apptId: a.id,
                patientId: a.patientId,
                patientName: a.name,
                purpose: a.reason || "Consultation",
                totalCost: 200,
                paidAmount: 200,
                dueAmount: 0,
                lastPaymentMode: "Cash",
                date: a.date,
                paymentHistory: [{ amount: 200, mode: "Cash", timestamp: `${a.date} 10:00:00 AM` }]
            });
        }
    });

    await storageEngine.setItem('ns_ledgers', ledgers);
    refreshAllUIViews();
    alert(`Auto-Repair Complete: Created ${count} missing billing ledger receipts!`);
}

async function adminMergeDuplicatePatients() {
    let mergedCount = 0;
    const phoneMap = {};

    patients.forEach(p => {
        if (!phoneMap[p.phone]) {
            phoneMap[p.phone] = p;
        } else {
            mergedCount++;
            const primaryId = phoneMap[p.phone].patientId;
            const duplicateId = p.patientId;

            appointments.forEach(a => { if (a.patientId === duplicateId) a.patientId = primaryId; });
            ledgers.forEach(l => { if (l.patientId === duplicateId) l.patientId = primaryId; });
            if (medicalRecords[duplicateId]) {
                if (!medicalRecords[primaryId]) medicalRecords[primaryId] = [];
                medicalRecords[primaryId] = medicalRecords[primaryId].concat(medicalRecords[duplicateId]);
                delete medicalRecords[duplicateId];
            }
        }
    });

    patients = Object.values(phoneMap);
    await storageEngine.setItem('ns_patients', patients);
    await storageEngine.setItem('ns_appointments', appointments);
    await storageEngine.setItem('ns_ledgers', ledgers);
    await storageEngine.setItem('ns_records', medicalRecords);

    refreshAllUIViews();
    alert(`Consolidated & Merged ${mergedCount} duplicate patient records!`);
}

async function adminPurgeBase64Xrays() {
    if (confirm("Purge high-resolution X-Ray base64 image data to optimize IndexedDB storage space?")) {
        Object.keys(medicalRecords).forEach(pid => {
            medicalRecords[pid].forEach(r => {
                r.xrayBase64 = null;
            });
        });
        await storageEngine.setItem('ns_records', medicalRecords);
        updateStorageMeter();
        alert("IndexedDB Base64 Storage Cleaned!");
    }
}

function adminForceLogoutAllSessions() {
    logout();
    alert("All active staff portal sessions locked and forced to re-authenticate!");
}

function calculateRevenueSplit() {
    const cPct = parseFloat(document.getElementById('adm_split_clinic').value) || 60;
    const dPct = parseFloat(document.getElementById('adm_split_doc').value) || 40;

    let totRev = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    let docAmt = (totRev * dPct) / 100;

    document.getElementById('adm_calc_doc_share').innerText = `₹${docAmt.toLocaleString('en-IN')}`;
}

async function clearAuditLogs() {
    if (confirm("Clear system audit logs history?")) {
        auditLogs = [];
        await storageEngine.setItem('ns_logs', auditLogs);
        renderAuditLogs();
    }
}
