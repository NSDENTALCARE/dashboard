lucide.createIcons();

let doctors = JSON.parse(localStorage.getItem('ns_doctors')) || [
    { id: "doc1", name: "Dr. Md Salahuddin Ayub", spec: "Cosmetic Dental Surgeon (Regd: A-6705)", phone: "+918978883007", fee: 200 },
    { id: "doc2", name: "Dr. Tabassum Samreen", spec: "Cosmetic Dental Surgeon (Regd: A-7133)", phone: "+917729025118", fee: 150 }
];

let users = JSON.parse(localStorage.getItem('ns_users')) || [
    { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "+918978883007", email: "ayub@nsdental.com", password: "123", status: "Approved" },
    { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "+917729025118", email: "assistant@nsdental.com", password: "123", status: "Approved" }
];

let passwordResetRequests = JSON.parse(localStorage.getItem('ns_pwd_resets')) || [];
let auditLogs = JSON.parse(localStorage.getItem('ns_logs')) || [{ time: new Date().toLocaleTimeString(), text: "System Initialized." }];

let galleryPhotos = JSON.parse(localStorage.getItem('ns_gallery')) || [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80"
];

let allReviews = JSON.parse(localStorage.getItem('ns_reviews')) || [
    { author: "Afroze Ali", rating: 5, text: "Great experience at NS Dental Care. Professional staff and reasonable prices." },
    { author: "Mohammed Aslam", rating: 5, text: "Dr. Ayub & Dr. Samreen explain treatment clearly. Painless root canal." },
    { author: "Syeda Afroz", rating: 5, text: "Hygienic clinic and friendly nature of doctors. Best dental clinic in Edi Bazar." }
];

let patients = JSON.parse(localStorage.getItem('ns_patients')) || [
    { patientId: "PAT-1001", name: "Mohammed Ali", phone: "+919876543210" }
];

const todayStr = new Date().toISOString().split('T')[0];

let appointments = JSON.parse(localStorage.getItem('ns_appointments')) || [
    { id: "NSD-1001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "+919876543210", doctor: "Dr. Md Salahuddin Ayub", date: todayStr, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: todayStr, modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "135", risk: "Diabetic" }
];

let labOrders = JSON.parse(localStorage.getItem('ns_lab_orders')) || [
    { id: "LAB-101", patientId: "PAT-1001", patientName: "Mohammed Ali", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: todayStr, status: "In Lab Production" }
];

let medicalRecords = JSON.parse(localStorage.getItem('ns_records')) || {
    "PAT-1001": [
        { date: "2026-07-23", diagnosis: "Pulpitis lower molar", rx: "Amoxicillin 500mg, Paracetamol 650mg", doctor: "Dr. Md Salahuddin Ayub", nextVisit: todayStr }
    ]
};

let ledgers = JSON.parse(localStorage.getItem('ns_ledgers')) || [
    { id: "NSD-1001", patientId: "PAT-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 5000, paidAmount: 5000, dueAmount: 0 }
];

let activePrescriptionApptId = null;
let selectedTeeth = [];
let currentSession = null;

function initApp() {
    startRealtimeClock();
    renderHeroAndFees();
    renderDoctorsRoster();
    renderDoctorOptions();
    renderGallery();
    initShufflingReviews();
    renderPublicTokenQueue();
    renderOdontogram();
}

function startRealtimeClock() {
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
        
        const elTime = document.getElementById('hdr_time');
        const elDate = document.getElementById('hdr_date');
        const elDashClock = document.getElementById('dashClockBar');

        if(elTime) elTime.innerText = timeStr;
        if(elDate) elDate.innerText = dateStr;
        if(elDashClock) elDashClock.innerText = `${dateStr} | ${timeStr}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function logAction(msg) {
    auditLogs.unshift({ time: new Date().toLocaleTimeString(), text: msg });
    localStorage.setItem('ns_logs', JSON.stringify(auditLogs));
    renderAuditLogs();
}

function renderAuditLogs() {
    const box = document.getElementById('adminAuditLogs');
    if(box) box.innerHTML = auditLogs.map(l => `<div>[${l.time}] ${l.text}</div>`).join('');
}

function renderPublicTokenQueue() {
    const tbl = document.getElementById('publicQueueTable');
    const todays = appointments.filter(a => a.date === todayStr);

    if(tbl) {
        if(todays.length === 0) {
            tbl.innerHTML = `<tr><td colspan="5" class="p-3 text-center text-slate-500">No patient visits scheduled for today yet.</td></tr>`;
        } else {
            tbl.innerHTML = todays.map(a => `
                <tr class="hover:bg-slate-800/40">
                    <td class="p-2.5 font-bold font-mono text-amber-400">${a.token || 'TK-01'}</td>
                    <td class="p-2.5 font-bold text-white">${a.patientId}<br><span class="text-[11px] text-slate-300">${a.name}</span></td>
                    <td class="p-2.5 font-mono text-[11px] text-slate-300">${a.slot}</td>
                    <td class="p-2.5 text-[11px] text-slate-300">${a.reason}</td>
                    <td class="p-2.5">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.queueStatus === 'In Consultation' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'}">
                            ${a.queueStatus || 'In Waiting Room'}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function renderHeroAndFees() {
    document.getElementById('pub_consultation_fees').innerHTML = doctors.map(d => `
        <div class="flex justify-between border-b border-slate-800 pb-1">
            <span>${d.name}:</span>
            <strong class="text-emerald-400">₹${d.fee}</strong>
        </div>
    `).join('');
}

function navigateTo(id) {
    document.querySelectorAll('main > section').forEach(el => el.classList.add('hidden-section'));
    document.getElementById(id).classList.remove('hidden-section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderDoctorsRoster() {
    document.getElementById('doctorsRoster').innerHTML = doctors.map(d => `
        <div class="bg-slate-900 border border-red-900/40 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
            <div class="w-12 h-12 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center text-red-500 font-bold shrink-0">Dr</div>
            <div class="min-w-0">
                <h4 class="text-sm font-bold text-white truncate">${d.name}</h4>
                <p class="text-xs text-red-400 font-medium truncate">${d.spec}</p>
                <p class="text-[11px] text-slate-400">📞 ${d.phone} | Fee: ₹${d.fee}</p>
            </div>
        </div>
    `).join('');
}

function renderDoctorOptions() {
    const opts = doctors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    document.getElementById('bk_doctor').innerHTML = opts;
    document.getElementById('man_pdoctor').innerHTML = opts;
}

function renderGallery() {
    const publicGrid = document.getElementById('publicGalleryGrid');
    if(publicGrid) {
        publicGrid.innerHTML = galleryPhotos.map(url => `
            <div class="overflow-hidden rounded-xl border border-slate-800 h-28 sm:h-32 bg-slate-950">
                <img src="${url}" class="w-full h-full object-cover">
            </div>
        `).join('');
    }
}

function initShufflingReviews() {
    const container = document.getElementById('shufflingReviewsContainer');
    function shuffle() {
        const shuffled = [...allReviews].sort(() => 0.5 - Math.random()).slice(0, 3);
        if(container) {
            container.style.opacity = '0';
            setTimeout(() => {
                container.innerHTML = shuffled.map(r => `
                    <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                        <div class="flex justify-between text-amber-400 font-bold">
                            <span>${r.author}</span>
                            <span>${'★'.repeat(r.rating)}</span>
                        </div>
                        <p class="text-slate-300 text-[11px] italic">"${r.text}"</p>
                    </div>
                `).join('');
                container.style.opacity = '1';
            }, 300);
        }
    }
    shuffle();
    setInterval(shuffle, 6000);
}

function openPortalModal() {
    document.getElementById('portalModal').classList.remove('hidden');
    document.getElementById('portalModal').classList.add('flex');
    switchPortalTab('login');
}

function closePortalModal() {
    document.getElementById('portalModal').classList.add('hidden');
    document.getElementById('portalModal').classList.remove('flex');
}

function switchPortalTab(tab) {
    document.getElementById('portalLoginForm').classList.add('hidden-section');
    document.getElementById('portalForgotForm').classList.add('hidden-section');
    document.getElementById('portalRegForm').classList.add('hidden-section');

    if(tab === 'login') document.getElementById('portalLoginForm').classList.remove('hidden-section');
    if(tab === 'forgot') document.getElementById('portalForgotForm').classList.remove('hidden-section');
    if(tab === 'register') document.getElementById('portalRegForm').classList.remove('hidden-section');
}

function handlePortalLogin(e) {
    e.preventDefault();
    const role = document.getElementById('portalRole').value;
    const identifier = document.getElementById('portalIdentifier').value;
    const pwd = document.getElementById('portalPassword').value;

    if (role === 'admin' && identifier === 'admin' && pwd === '9290') {
        currentSession = { role: 'admin', name: 'Developer Admin' };
        logAction("Admin session started.");
        openDashboard();
        closePortalModal();
        return;
    }

    const u = users.find(x => x.role === role && (x.email === identifier || x.phone === identifier) && x.password === pwd);
    if (u && u.status === 'Approved') {
        currentSession = u;
        logAction(`${u.role.toUpperCase()} logged in: ${u.name}`);
        openDashboard();
        closePortalModal();
    } else {
        alert("Invalid login credentials or account pending approval!");
    }
}

function handleStaffRegistration(e) {
    e.preventDefault();
    const role = document.getElementById('regRole').value;
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    users.push({ id: Date.now(), name, role, phone, email, password, status: "Pending" });
    localStorage.setItem('ns_users', JSON.stringify(users));

    logAction(`New ${role} registration request for ${name}.`);
    alert("Registration request submitted!");
    closePortalModal();
}

function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    const role = document.getElementById('fg_role').value;
    const identifier = document.getElementById('fg_identifier').value;
    const newPassword = document.getElementById('fg_newpwd').value;

    passwordResetRequests.push({ id: Date.now(), role, identifier, newPassword });
    localStorage.setItem('ns_pwd_resets', JSON.stringify(passwordResetRequests));

    logAction(`Password reset request for ${identifier}`);
    alert("Password reset request submitted successfully!");
    closePortalModal();
}

function openDashboard() {
    navigateTo('dashboard');
    document.getElementById('dashBadge').innerText = currentSession.role;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;

    if(currentSession.role === 'admin') {
        document.getElementById('tabBtnAdminMaster').classList.remove('hidden-section');
        renderAdminUserTable();
        renderAuditLogs();
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    renderAppointments();
    renderLabOrders();
    renderCalendar();
    renderLedgers();
    renderApprovals();
}

function logout() {
    currentSession = null;
    navigateTo('public-home');
}

function renderAppointments() {
    document.getElementById('tblAppointments').innerHTML = appointments.map(a => `
        <tr class="${a.modifiedToday ? 'modified-today' : 'hover:bg-slate-800/50'}">
            <td class="p-3 font-mono text-red-500">${a.patientId}<br><span class="text-white font-sans font-bold">${a.name}</span></td>
            <td class="p-3 font-mono font-bold text-amber-400">${a.token || 'TK-01'}</td>
            <td class="p-3 text-[11px]">
                <p>BP: <strong class="text-white">${a.bp || '120/80'}</strong> | Sugar: <strong class="text-white">${a.sugar || 'N/A'}</strong></p>
                <span class="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">${a.risk || 'None'}</span>
            </td>
            <td class="p-3">${a.doctor}</td>
            <td class="p-3">${a.date}<br><span class="text-[10px] text-slate-400">${a.slot}</span></td>
            <td class="p-3 font-medium text-slate-200">${a.reason}</td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                    ${a.status}
                </span>
            </td>
            <td class="p-3 flex gap-1 flex-wrap">
                ${a.status === 'PENDING' ? `<button onclick="approveAppointment('${a.id}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">Approve</button>` : ''}
                <button onclick="updateTokenStatus('${a.id}')" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-[10px]">Queue</button>
                <button onclick="openLetterhead('${a.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px]">Rx</button>
            </td>
        </tr>
    `).join('');
}

function approveAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        appt.status = 'CONFIRMED';
        appt.modifiedToday = true;
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        renderAppointments();
        renderPublicTokenQueue();
        logAction(`Approved appointment ${id} for ${appt.name}.`);
        alert("Appointment Approved!");
    }
}

function updateTokenStatus(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        const nextState = prompt("Update Queue Status (1: In Waiting Room, 2: In Consultation, 3: Completed):", "2");
        if(nextState === "1") appt.queueStatus = "In Waiting Room";
        if(nextState === "2") appt.queueStatus = "In Consultation";
        if(nextState === "3") appt.queueStatus = "Treatment Completed";

        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        renderAppointments();
        renderPublicTokenQueue();
        logAction(`Token status updated for ${appt.patientId}`);
    }
}

function renderLabOrders() {
    const tbl = document.getElementById('tblLabOrders');
    if(tbl) {
        tbl.innerHTML = labOrders.map(o => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${o.patientId}<br><span class="text-slate-400 font-normal">${o.patientName}</span></td>
                <td class="p-2.5 font-mono text-amber-400 font-bold">${o.tooth}</td>
                <td class="p-2.5">${o.material}</td>
                <td class="p-2.5">${o.labName}</td>
                <td class="p-2.5 font-mono text-[10px]">${o.date}</td>
                <td class="p-2.5"><span class="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[10px] font-bold border border-sky-500/30">${o.status}</span></td>
                <td class="p-2.5"><button onclick="updateLabOrderStatus('${o.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2 py-1 rounded text-[10px]">Update</button></td>
            </tr>
        `).join('');
    }
}

function openNewLabOrderModal() {
    const pid = prompt("Enter Patient ID (e.g. PAT-1001):", "PAT-1001");
    const tooth = prompt("Enter Tooth # / Quadrant (e.g. #14 Upper Molar):", "#14 Upper Molar");
    const material = prompt("Enter Material (Zirconia, Ceramic, PFM):", "Zirconia Crown");
    const labName = prompt("Lab Partner Name:", "Apex Dental Lab");

    if(pid && tooth) {
        const patient = patients.find(p => p.patientId === pid) || { name: "Patient " + pid };
        labOrders.push({ id: "LAB-" + Date.now(), patientId: pid, patientName: patient.name, tooth, material, labName, date: todayStr, status: "Impression Taken" });
        localStorage.setItem('ns_lab_orders', JSON.stringify(labOrders));
        renderLabOrders();
        logAction(`Lab order created for ${pid}`);
    }
}

function updateLabOrderStatus(id) {
    const order = labOrders.find(o => o.id === id);
    if(order) {
        const st = prompt("Lab Status (1: Impression Taken, 2: In Lab Production, 3: Delivered & Fitted):", "2");
        if(st === "1") order.status = "Impression Taken";
        if(st === "2") order.status = "In Lab Production";
        if(st === "3") order.status = "Delivered & Fitted";

        localStorage.setItem('ns_lab_orders', JSON.stringify(labOrders));
        renderLabOrders();
        logAction(`Lab order ${id} status updated.`);
    }
}

function triggerWhatsAppDoctorBriefing() {
    const todays = appointments.filter(a => a.date === todayStr);
    let msg = `*N.S. DENTAL CARE - DAILY MORNING BRIEFING (${todayStr})*%0A%0ATotal Scheduled Patients: ${todays.length}%0A%0A`;
    todays.forEach((a, i) => {
        msg += `*${i+1}. Token ${a.token || 'TK-01'}* - ${a.name} (${a.patientId})%0A   Purpose: ${a.reason} | Slot: ${a.slot}%0A   BP: ${a.bp || '120/80'} | Risk: ${a.risk || 'None'}%0A%0A`;
    });

    window.open(`https://wa.me/918978883007?text=${msg}`, '_blank');
}

function renderOdontogram() {
    const grid = document.getElementById('odontogramGrid');
    if(!grid) return;
    let html = '';
    for(let i = 1; i <= 32; i++) {
        html += `<button type="button" onclick="toggleToothSelection(${i})" id="toothBtn_${i}" class="border border-slate-300 bg-white text-slate-900 px-2 py-1 rounded font-bold hover:bg-red-100">#${i}</button>`;
    }
    grid.innerHTML = html;
}

function toggleToothSelection(toothNum) {
    const btn = document.getElementById(`toothBtn_${toothNum}`);
    if(selectedTeeth.includes(toothNum)) {
        selectedTeeth = selectedTeeth.filter(t => t !== toothNum);
        btn.classList.remove('tooth-btn-selected');
    } else {
        selectedTeeth.push(toothNum);
        btn.classList.add('tooth-btn-selected');
    }

    const notesArea = document.getElementById('lh_notes');
    notesArea.value = `Teeth Selected: #${selectedTeeth.join(', #')} | Procedure Planned: `;
}

function sendPrescriptionWhatsApp() {
    const appt = appointments.find(a => a.id === activePrescriptionApptId);
    if(appt) {
        const notes = document.getElementById('lh_notes').value;
        const rx = document.getElementById('lh_rx').value;
        const nextVisit = document.getElementById('lh_next_visit').value;

        const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
        const msg = `*N.S. DENTAL CARE - DIGITAL PRESCRIPTION*%0A%0APatient: *${appt.name}* (ID: ${appt.patientId})%0ADoctor: ${appt.doctor}%0A%0A*Findings:* ${notes}%0A*Rx / Medications:*%0A${rx}%0A%0A*Next Follow-Up Date:* ${nextVisit}`;
        window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    }
}

function renderAdminUserTable() {
    const tbl = document.getElementById('adminUserManagementTable');
    if(tbl) {
        tbl.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${u.name}</td>
                <td class="p-2.5 uppercase font-bold text-red-400">${u.role}</td>
                <td class="p-2.5">${u.phone}</td>
                <td class="p-2.5"><span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">${u.status}</span></td>
                <td class="p-2.5">
                    <button onclick="adminOverridePassword(${u.id})" class="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">Reset Pwd</button>
                </td>
                <td class="p-2.5">
                    <button onclick="adminToggleUserStatus(${u.id})" class="bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold">Toggle Access</button>
                </td>
            </tr>
        `).join('');
    }
}

function adminOverridePassword(userId) {
    const u = users.find(x => x.id === userId);
    if(u) {
        const newPwd = prompt(`Enter new password for ${u.name}:`, "123");
        if(newPwd) {
            u.password = newPwd;
            localStorage.setItem('ns_users', JSON.stringify(users));
            logAction(`Admin reset password for ${u.name}`);
            alert("Password updated!");
        }
    }
}

function adminToggleUserStatus(userId) {
    const u = users.find(x => x.id === userId);
    if(u) {
        u.status = u.status === 'Approved' ? 'Disabled' : 'Approved';
        localStorage.setItem('ns_users', JSON.stringify(users));
        renderAdminUserTable();
        logAction(`Admin toggled status for ${u.name} to ${u.status}`);
    }
}

function handleAdminAddStaff(e) {
    e.preventDefault();
    const name = document.getElementById('adm_stf_name').value;
    const role = document.getElementById('adm_stf_role').value;
    const phone = document.getElementById('adm_stf_phone').value;
    const password = document.getElementById('adm_stf_password').value;

    users.push({ id: Date.now(), name, role, phone, email: `${role}@nsdental.com`, password, status: "Approved" });
    localStorage.setItem('ns_users', JSON.stringify(users));

    if(role === 'doctor') {
        doctors.push({ id: `doc${doctors.length+1}`, name, spec: "Dental Surgeon", phone, fee: 200 });
        localStorage.setItem('ns_doctors', JSON.stringify(doctors));
        renderDoctorsRoster();
        renderDoctorOptions();
    }

    renderAdminUserTable();
    logAction(`Admin registered new ${role}: ${name}`);
    alert(`Staff ${name} registered!`);
    e.target.reset();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if(grid) {
        grid.innerHTML = appointments.map(a => `
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <div class="flex justify-between text-[10px] text-red-400 font-mono">
                    <span>${a.patientId}</span>
                    <span>${a.date}</span>
                </div>
                <h4 class="text-xs font-bold text-white">${a.name}</h4>
                <p class="text-[11px] text-slate-300">Purpose: ${a.reason}</p>
                <p class="text-[10px] text-slate-400">Dr: ${a.doctor}</p>
            </div>
        `).join('');
    }
}

function handleManualPatientUpload(e) {
    e.preventDefault();
    const name = document.getElementById('man_pname').value;
    const phone = document.getElementById('man_pphone').value;
    const doctor = document.getElementById('man_pdoctor').value;
    const reason = document.getElementById('man_preason').value;
    const rx = document.getElementById('man_prx').value;
    const date = document.getElementById('man_pdate').value;
    const nextVisit = document.getElementById('man_pnext').value || date;
    const fee = parseFloat(document.getElementById('man_pfee').value) || 0;

    const bp = document.getElementById('man_vitals_bp').value;
    const sugar = document.getElementById('man_vitals_sugar').value;
    const risk = document.getElementById('man_vitals_risk').value;

    let patient = patients.find(p => p.phone === phone);
    if(!patient) {
        patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone };
        patients.push(patient);
        localStorage.setItem('ns_patients', JSON.stringify(patients));
    }

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    const token = "TK-0" + (appointments.length + 1);
    appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone, doctor, date, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason, nextVisit, modifiedToday: true, queueStatus: "In Waiting Room", bp, sugar, risk });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    if(!medicalRecords[patient.patientId]) medicalRecords[patient.patientId] = [];
    medicalRecords[patient.patientId].push({ date, diagnosis: reason, rx, doctor, nextVisit });
    localStorage.setItem('ns_records', JSON.stringify(medicalRecords));

    ledgers.push({ id: apptId, patientId: patient.patientId, patientName: name, purpose: reason, totalCost: fee, paidAmount: fee, dueAmount: 0 });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    logAction(`Record added for ${name} (${patient.patientId}) with vitals BP:${bp}`);
    alert(`Patient Uploaded! ID: ${patient.patientId} | Token: ${token}`);
    e.target.reset();
    renderAppointments();
    renderCalendar();
    renderLedgers();
    renderPublicTokenQueue();
}

function applyAdminThemeSettings() {
    const font = document.getElementById('adm_font_size').value;
    const name = document.getElementById('adm_brand_name').value;
    const contact = document.getElementById('adm_brand_contact').value;

    document.getElementById('appBody').className = `bg-slate-950 text-slate-100 font-sans antialiased min-h-full flex flex-col overflow-x-hidden ${font}`;
    document.getElementById('hdr_clinic_name').innerText = name;
    document.getElementById('hdr_clinic_contact').innerText = contact;
    logAction("Admin customized UI theme & branding.");
}

function downloadJSONBackup() {
    const backupData = { patients, appointments, medicalRecords, ledgers, labOrders, users, galleryPhotos, allReviews, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NS_Dental_Care_Backup_${todayStr}.json`;
    a.click();
    logAction("System JSON Backup downloaded.");
}

function restoreJSONBackup(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.patients && data.appointments) {
                patients = data.patients;
                appointments = data.appointments;
                medicalRecords = data.medicalRecords || {};
                ledgers = data.ledgers || [];
                labOrders = data.labOrders || [];

                localStorage.setItem('ns_patients', JSON.stringify(patients));
                localStorage.setItem('ns_appointments', JSON.stringify(appointments));
                localStorage.setItem('ns_records', JSON.stringify(medicalRecords));
                localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));
                localStorage.setItem('ns_lab_orders', JSON.stringify(labOrders));

                alert("Backup Restored Successfully!");
                location.reload();
            }
        } catch(err) {
            alert("Invalid Backup File!");
        }
    };
    reader.readAsText(file);
}

function resetSystemData() {
    if(confirm("Permanently erase all stored database records?")) {
        localStorage.clear();
        location.reload();
    }
}

function handleVerifiedPatientSearch(e) {
    e.preventDefault();
    const inputName = document.getElementById('ver_name').value.trim().toLowerCase();
    const inputId = document.getElementById('ver_identifier').value.trim();

    const matchedPatient = patients.find(p => p.name.toLowerCase().includes(inputName) && (p.patientId === inputId || p.phone === inputId));
    const container = document.getElementById('verifiedResultContainer');
    container.classList.remove('hidden-section');

    if(matchedPatient) {
        const appts = appointments.filter(a => a.patientId === matchedPatient.patientId);
        const recs = medicalRecords[matchedPatient.patientId] || [];

        container.innerHTML = `
            <div class="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                    <span class="text-xs text-red-500 font-mono font-bold">${matchedPatient.patientId}</span>
                    <h3 class="text-base font-bold text-white">${matchedPatient.name}</h3>
                </div>
                <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">Verified Record</span>
            </div>
            
            <div class="space-y-2">
                <h4 class="text-xs font-bold text-red-400 uppercase">Upcoming & Past Visits:</h4>
                <ul class="text-xs space-y-1.5 text-slate-300">
                    ${appts.map(a => `<li class="bg-slate-950 p-2 rounded-lg border border-slate-800">• <strong>${a.date} (${a.slot})</strong> - Dr. ${a.doctor}<br>Problem: ${a.reason} | Next Visit: <span class="text-amber-400 font-bold">${a.nextVisit || a.date}</span></li>`).join('')}
                </ul>
            </div>

            <div class="space-y-2 pt-2">
                <h4 class="text-xs font-bold text-emerald-400 uppercase">Prescribed Tablets & Diagnosis:</h4>
                <ul class="text-xs space-y-1.5 text-slate-300">
                    ${recs.length > 0 ? recs.map(r => `<li class="bg-slate-950 p-2.5 rounded-lg border border-slate-800"><p class="font-bold text-slate-200">Date: ${r.date}</p><p>Diagnosis: ${r.diagnosis}</p><p class="text-emerald-300 mt-0.5">Rx: ${r.rx}</p></li>`).join('') : '<li>No prescription history found.</li>'}
                </ul>
            </div>
        `;
    } else {
        container.innerHTML = `<p class="text-xs text-rose-400 font-semibold">Verification Failed: Full Name and Patient ID / Mobile # do not match.</p>`;
    }
}

function handlePublicBooking(e) {
    e.preventDefault();
    const name = document.getElementById('bk_name').value;
    const phone = document.getElementById('bk_phone').value;
    const doctor = document.getElementById('bk_doctor').value;
    const date = document.getElementById('bk_date').value;
    const slot = document.getElementById('bk_slot').value;
    const reason = document.getElementById('bk_reason').value;

    let patient = patients.find(p => p.phone === phone);
    if(!patient) {
        patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone };
        patients.push(patient);
        localStorage.setItem('ns_patients', JSON.stringify(patients));
    }

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    const token = "TK-0" + (appointments.length + 1);
    appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone, doctor, date, slot, status: "PENDING", reason, nextVisit: date, modifiedToday: true, queueStatus: "In Waiting Room" });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    ledgers.push({ id: apptId, patientId: patient.patientId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0 });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    alert(`Booking Request Submitted! Patient ID: ${patient.patientId} | Token: ${token}. Awaiting Staff Approval.`);
    renderPublicTokenQueue();
    navigateTo('public-home');
}

function openLetterhead(id) {
    activePrescriptionApptId = id;
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        document.getElementById('lh_pid').innerText = appt.patientId;
        document.getElementById('lh_pname').innerText = appt.name;
        document.getElementById('lh_date').innerText = new Date().toLocaleDateString();
        document.getElementById('lh_doctor').innerText = appt.doctor;
        document.getElementById('lh_next_visit').value = appt.nextVisit || appt.date;

        document.getElementById('letterheadModal').classList.remove('hidden');
        document.getElementById('letterheadModal').classList.add('flex');
    }
}

function savePrescriptionAndSync() {
    const appt = appointments.find(a => a.id === activePrescriptionApptId);
    if(appt) {
        const notes = document.getElementById('lh_notes').value;
        const rx = document.getElementById('lh_rx').value;
        const nextVisit = document.getElementById('lh_next_visit').value;

        if(!medicalRecords[appt.patientId]) medicalRecords[appt.patientId] = [];
        medicalRecords[appt.patientId].push({ date: new Date().toLocaleDateString(), diagnosis: notes, rx: rx, doctor: appt.doctor, nextVisit: nextVisit });

        localStorage.setItem('ns_records', JSON.stringify(medicalRecords));
        appt.nextVisit = nextVisit;
        appt.modifiedToday = true;
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));

        logAction(`Prescription saved for ${appt.patientId}.`);
        alert("Prescription saved & Next visit synced!");
    }
}

function closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.add('hidden');
    document.getElementById('letterheadModal').classList.remove('flex');
}

function renderLedgers() {
    document.getElementById('tblLedger').innerHTML = ledgers.map(l => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-mono text-red-500">${l.patientId}<br><span class="text-white font-sans">${l.patientName}</span></td>
            <td class="p-3">${l.purpose}</td>
            <td class="p-3 font-bold text-white">₹${l.totalCost}</td>
            <td class="p-3 text-emerald-400 font-bold">₹${l.paidAmount}</td>
            <td class="p-3 text-amber-400 font-bold">₹${l.dueAmount}</td>
            <td class="p-3 flex gap-1">
                <button onclick="editFeeManual('${l.id}')" class="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 rounded text-xs">Edit Fee</button>
            </td>
        </tr>
    `).join('');
}

function editFeeManual(id) {
    const item = ledgers.find(l => l.id === id);
    if(!item) return;

    const total = prompt("Enter Total Fee (₹):", item.totalCost);
    const paid = prompt("Enter Paid Amount (₹):", item.paidAmount);

    if(total !== null && paid !== null) {
        item.totalCost = parseFloat(total) || 0;
        item.paidAmount = parseFloat(paid) || 0;
        item.dueAmount = item.totalCost - item.paidAmount;
        localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));
        renderLedgers();
        logAction(`Ledger fee modified for patient ${item.patientId}.`);
    }
}

function renderApprovals() {
    let pendingUsers = users.filter(u => u.status === 'Pending');
    document.getElementById('tblApprovals').innerHTML = pendingUsers.map(u => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-bold text-white">${u.name}</td>
            <td class="p-3 uppercase text-red-400 font-bold">${u.role}</td>
            <td class="p-3">${u.phone}</td>
            <td class="p-3"><button onclick="approveUserAccount(${u.id})" class="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-xs">Approve Account</button></td>
        </tr>
    `).join('');

    document.getElementById('tblPasswordResets').innerHTML = passwordResetRequests.map(r => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 uppercase text-amber-400 font-bold">${r.role}</td>
            <td class="p-3 font-bold text-white">${r.identifier}</td>
            <td class="p-3 font-mono">${r.newPassword}</td>
            <td class="p-3"><button onclick="approvePasswordReset(${r.id})" class="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-xs">Approve Password</button></td>
        </tr>
    `).join('');
}

function approveUserAccount(id) {
    const u = users.find(x => x.id === id);
    if(u) {
        u.status = 'Approved';
        localStorage.setItem('ns_users', JSON.stringify(users));
        renderApprovals();
        logAction(`User ${u.name} account approved.`);
        alert("Account Approved!");
    }
}

function approvePasswordReset(reqId) {
    const req = passwordResetRequests.find(r => r.id === reqId);
    if(req) {
        const u = users.find(x => x.email === req.identifier || x.phone === req.identifier);
        if(u) {
            u.password = req.newPassword;
            localStorage.setItem('ns_users', JSON.stringify(users));
        }
        passwordResetRequests = passwordResetRequests.filter(r => r.id !== reqId);
        localStorage.setItem('ns_pwd_resets', JSON.stringify(passwordResetRequests));
        renderApprovals();
        logAction(`Approved password reset for ${req.identifier}.`);
        alert("Password reset approved!");
    }
}

function switchDashTab(tab) {
    document.getElementById('viewAppts').classList.add('hidden-section');
    document.getElementById('viewManualPatient').classList.add('hidden-section');
    document.getElementById('viewLabTracker').classList.add('hidden-section');
    document.getElementById('viewCalendar').classList.add('hidden-section');
    document.getElementById('viewEHR').classList.add('hidden-section');
    document.getElementById('viewLedger').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');
    document.getElementById('viewAdminMaster').classList.add('hidden-section');

    if(tab === 'appts') document.getElementById('viewAppts').classList.remove('hidden-section');
    if(tab === 'manualPatient') document.getElementById('viewManualPatient').classList.remove('hidden-section');
    if(tab === 'labTracker') document.getElementById('viewLabTracker').classList.remove('hidden-section');
    if(tab === 'calendar') document.getElementById('viewCalendar').classList.remove('hidden-section');
    if(tab === 'ehr') document.getElementById('viewEHR').classList.remove('hidden-section');
    if(tab === 'ledger') document.getElementById('viewLedger').classList.remove('hidden-section');
    if(tab === 'approvals') document.getElementById('viewApprovals').classList.remove('hidden-section');
    if(tab === 'adminMaster') document.getElementById('viewAdminMaster').classList.remove('hidden-section');
}

initApp();
