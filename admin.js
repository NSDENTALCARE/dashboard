// ==========================================================================
// ADMIN CONTROL SUITE, GOVERNANCE & IDENTITY PROOF MANAGEMENT
// ==========================================================================

function setStaffViewMode(mode) {
    staffViewMode = mode;
    const btnList = document.getElementById('btn_staff_view_list');
    const btnGrid = document.getElementById('btn_staff_view_grid');
    const containerList = document.getElementById('staffListViewContainer');
    const containerGrid = document.getElementById('staffGridViewContainer');

    if (mode === 'list') {
        if(btnList) btnList.className = "px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-red-700 text-white shadow";
        if(btnGrid) btnGrid.className = "px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-400 hover:text-white";
        if(containerList) containerList.classList.remove('hidden-section');
        if(containerGrid) containerGrid.classList.add('hidden-section');
    } else {
        if(btnGrid) btnGrid.className = "px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-red-700 text-white shadow";
        if(btnList) btnList.className = "px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-slate-400 hover:text-white";
        if(containerGrid) containerGrid.classList.remove('hidden-section');
        if(containerList) containerList.classList.add('hidden-section');
    }
    renderAdminUsers();
}

function renderAdminUsers() {
    renderAdminUserTable();
    renderAdminUserGrid();
}

function renderAdminUserTable() {
    const tbl = document.getElementById('adminUserManagementTable');
    if(tbl) {
        tbl.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${u.name}</td>
                <td class="p-2.5 uppercase font-bold text-red-400">${u.role}</td>
                <td class="p-2.5 font-mono text-slate-300">${u.phone}</td>
                <td class="p-2.5 font-mono text-amber-400 font-bold">${u.accessTier ? u.accessTier.toUpperCase() : 'LIMITED'}</td>
                <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">${u.status}</span></td>
                <td class="p-2.5">
                    <button onclick="openEditStaffModal(${u.id})" class="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow">
                        Manage Profile / Proofs
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function renderAdminUserGrid() {
    const grid = document.getElementById('staffGridViewContainer');
    if(grid) {
        grid.innerHTML = users.map(u => `
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 shadow-md">
                <div class="flex justify-between items-start border-b border-slate-800 pb-2">
                    <div>
                        <h4 class="text-sm font-bold text-white">${u.name}</h4>
                        <span class="text-[10px] font-black uppercase text-amber-400 block">${u.role} ACCOUNT</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">${u.status}</span>
                </div>
                <div class="text-xs space-y-1 text-slate-300 font-mono">
                    <p>📞 Phone: ${u.phone}</p>
                    <p>🔑 Access Tier: <strong class="text-amber-400">${u.accessTier ? u.accessTier.toUpperCase() : 'LIMITED'}</strong></p>
                    ${u.idProofBase64 ? `<p class="text-emerald-400">✓ ID Proof Attached</p>` : `<p class="text-slate-500">No ID Proof Uploaded</p>`}
                </div>
                <button onclick="openEditStaffModal(${u.id})" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs mt-2 shadow">
                    Manage Credentials & Proof
                </button>
            </div>
        `).join('');
    }
}

function openCreateStaffModal() {
    document.getElementById('edit_staff_target_id').value = "";
    document.getElementById('edit_staff_name').value = "";
    document.getElementById('edit_staff_phone').value = "";
    document.getElementById('edit_staff_email').value = "";
    document.getElementById('edit_staff_role').value = "assistant";
    document.getElementById('edit_staff_status').value = "Approved";
    document.getElementById('edit_staff_password').value = "";
    document.getElementById('tier_limited').checked = true;
    document.getElementById('edit_staff_proof_preview').innerText = "";

    document.getElementById('editStaffModal').classList.remove('hidden');
    document.getElementById('editStaffModal').classList.add('flex');
}

function openEditStaffModal(userId) {
    const u = users.find(x => x.id === userId);
    if (!u) return;

    document.getElementById('edit_staff_target_id').value = u.id;
    document.getElementById('edit_staff_name').value = u.name;
    document.getElementById('edit_staff_phone').value = u.phone;
    document.getElementById('edit_staff_email').value = u.email || "";
    document.getElementById('edit_staff_role').value = u.role;
    document.getElementById('edit_staff_status').value = u.status || "Approved";
    document.getElementById('edit_staff_password').value = u.password;

    if (u.accessTier === 'full') {
        document.getElementById('tier_full').checked = true;
    } else {
        document.getElementById('tier_limited').checked = true;
    }

    const prev = document.getElementById('edit_staff_proof_preview');
    if(prev) {
        if(u.idProofBase64) {
            prev.innerHTML = `<span class="text-emerald-400 font-bold">✓ Identity Proof Document Attached</span>`;
        } else {
            prev.innerHTML = `<span class="text-slate-500">No identity proof file on record.</span>`;
        }
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
    const targetIdVal = document.getElementById('edit_staff_target_id').value;
    const proofInput = document.getElementById('edit_staff_proof_file');

    async function processSave(proofBase64) {
        if (targetIdVal) {
            const uid = parseInt(targetIdVal);
            const u = users.find(x => x.id === uid);
            if (u) {
                u.name = document.getElementById('edit_staff_name').value;
                u.phone = document.getElementById('edit_staff_phone').value;
                u.email = document.getElementById('edit_staff_email').value;
                u.role = document.getElementById('edit_staff_role').value;
                u.status = document.getElementById('edit_staff_status').value;
                u.password = document.getElementById('edit_staff_password').value;
                u.accessTier = document.getElementById('tier_full').checked ? 'full' : 'limited';
                if(proofBase64) u.idProofBase64 = proofBase64;

                logAction(`Admin updated profile for ${u.name}`);
            }
        } else {
            const newStaff = {
                id: Date.now(),
                name: document.getElementById('edit_staff_name').value,
                phone: document.getElementById('edit_staff_phone').value,
                email: document.getElementById('edit_staff_email').value,
                role: document.getElementById('edit_staff_role').value,
                status: document.getElementById('edit_staff_status').value,
                password: document.getElementById('edit_staff_password').value,
                accessTier: document.getElementById('tier_full').checked ? 'full' : 'limited',
                idProofBase64: proofBase64 || null
            };
            users.push(newStaff);
            logAction(`Admin created new staff account for ${newStaff.name}`);
        }

        await storageEngine.setItem('ns_users', users);
        renderAdminUsers();
        alert("Staff Account & Credentials Saved!");
        closeEditStaffModal();
    }

    if(proofInput && proofInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            await processSave(evt.target.result);
        };
        reader.readAsDataURL(proofInput.files[0]);
    } else {
        await processSave(null);
    }
}

async function deleteStaffAccount() {
    const targetIdVal = document.getElementById('edit_staff_target_id').value;
    if(!targetIdVal) return;

    const uid = parseInt(targetIdVal);
    const u = users.find(x => x.id === uid);

    if (u && confirm(`PERMANENTLY DELETE staff profile for ${u.name}?`)) {
        users = users.filter(x => x.id !== uid);
        await storageEngine.setItem('ns_users', users);
        renderAdminUsers();
        logAction(`Deleted staff account #${uid}`);
        alert("Staff Profile deleted.");
        closeEditStaffModal();
    }
}
