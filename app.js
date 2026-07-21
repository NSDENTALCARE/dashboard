lucide.createIcons();

// Persistent Local Data
let clinicInfo = JSON.parse(localStorage.getItem('ns_clinic_info')) || {
    name: "NS Dental Care",
    phone: "+91 9876543210",
    address: "#17-1-305/P/1, Behind Water Tank, Santosh Nagar, Hyderabad - 500023"
};

let modules = JSON.parse(localStorage.getItem('ns_modules')) || {
    chat: true,
    ledger: true
};

let doctors = JSON.parse(localStorage.getItem('ns_doctors')) || [
    { id: "doc1", name: "Dr. Mohammed Salahuddin Ayub", spec: "Chief Dental Surgeon (Implants)", phone: "+919876543210" },
    { id: "doc2", name: "Dr. Tabassum Samreen Alam", spec: "Consultant Dental Surgeon (Orthodontics)", phone: "+919876543211" }
];

let users = JSON.parse(localStorage.getItem('ns_users')) || [
    { id: 1, name: "Dr. Mohammed Salahuddin Ayub", role: "doctor", phone: "+919876543210", email: "ayub@nsdental.com", password: "123", status: "Approved" },
    { id: 2, name: "Assistant Staff", role: "assistant", phone: "+919876543212", email: "assistant@nsdental.com", password: "123", status: "Approved" }
];

let appointments = JSON.parse(localStorage.getItem('ns_appointments')) || [
    { id: "NSD-1001", name: "Mohammed Ali", phone: "+919876543210", doctor: "Dr. Mohammed Salahuddin Ayub", date: "2026-07-22", slot: "11:00 AM - 01:00 PM", status: "PENDING", reason: "Root Canal Treatment" }
];

let ledgers = JSON.parse(localStorage.getItem('ns_ledgers')) || [
    { id: "NSD-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 5000, paidAmount: 5000, dueAmount: 0 }
];

let chatInquiries = JSON.parse(localStorage.getItem('ns_inquiries')) || [
    { id: 1, name: "Rahul Sharma", phone: "+91 9876500000", msg: "What is the cost of tooth cleaning?" }
];

let currentSession = null;

function initApp() {
    updateClinicHeader();
    renderDoctorsRoster();
    renderDoctorOptions();
    applyModuleSettings();
}

function updateClinicHeader() {
    document.getElementById('hdr_clinic_name').innerText = clinicInfo.name;
    document.getElementById('hdr_clinic_contact').innerText = `${clinicInfo.address} | 📞 ${clinicInfo.phone}`;
}

function navigateTo(id) {
    document.querySelectorAll('main > section').forEach(el => el.classList.add('hidden-section'));
    document.getElementById(id).classList.remove('hidden-section');
}

function renderDoctorsRoster() {
    document.getElementById('doctorsRoster').innerHTML = doctors.map(d => `
        <div class="bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
            <div class="w-12 h-12 bg-sky-500/20 border border-sky-500/40 rounded-xl flex items-center justify-center text-sky-400 font-bold shrink-0">Dr</div>
            <div class="min-w-0">
                <h4 class="text-sm font-bold text-white truncate">${d.name}</h4>
                <p class="text-xs text-sky-400 font-medium truncate">${d.spec}</p>
                <p class="text-[11px] text-slate-400">📞 ${d.phone}</p>
            </div>
        </div>
    `).join('');
}

function renderDoctorOptions() {
    document.getElementById('bk_doctor').innerHTML = doctors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
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
    if(tab === 'login') {
        document.getElementById('portalLoginForm').classList.remove('hidden-section');
        document.getElementById('portalRegForm').classList.add('hidden-section');
    } else {
        document.getElementById('portalLoginForm').classList.add('hidden-section');
        document.getElementById('portalRegForm').classList.remove('hidden-section');
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

    alert("Registration request submitted! Approval needed.");
    closePortalModal();
}

function handlePortalLogin(e) {
    e.preventDefault();
    const role = document.getElementById('portalRole').value;
    const identifier = document.getElementById('portalIdentifier').value;
    const pwd = document.getElementById('portalPassword').value;

    if (role === 'admin' && identifier === 'admin' && pwd === '9290') {
        currentSession = { role: 'admin', name: 'Developer Admin' };
        openDashboard();
        closePortalModal();
        return;
    }

    const u = users.find(x => x.role === role && (x.email === identifier || x.phone === identifier) && x.password === pwd);
    if (u && u.status === 'Approved') {
        currentSession = u;
        openDashboard();
        closePortalModal();
    } else {
        alert("Invalid credentials or account pending approval!");
    }
}

function openDashboard() {
    navigateTo('dashboard');
    document.getElementById('dashBadge').innerText = currentSession.role;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;

    if(currentSession.role === 'admin') {
        document.getElementById('tabBtnAdminMaster').classList.remove('hidden-section');
        document.getElementById('adm_toggle_chat').checked = modules.chat;
        document.getElementById('adm_toggle_ledger').checked = modules.ledger;
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    document.getElementById('set_clinic_name').value = clinicInfo.name;
    document.getElementById('set_clinic_phone').value = clinicInfo.phone;
    document.getElementById('set_clinic_address').value = clinicInfo.address;

    renderAppointments();
    renderApprovals();
    renderLedgers();
    renderInquiries();
}

function logout() {
    currentSession = null;
    navigateTo('public-home');
}

function handlePublicChatSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('pub_chat_name').value;
    const phone = document.getElementById('pub_chat_phone').value;
    const msg = document.getElementById('pub_chat_msg').value;

    chatInquiries.push({ id: Date.now(), name, phone, msg });
    localStorage.setItem('ns_inquiries', JSON.stringify(chatInquiries));

    alert("Inquiry submitted successfully! A clinic representative will contact you.");
    e.target.reset();
}

function renderInquiries() {
    document.getElementById('dashChatInbox').innerHTML = chatInquiries.map(i => `
        <div class="bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs space-y-1">
            <div class="flex justify-between font-bold text-sky-400">
                <span>${i.name} (${i.phone})</span>
            </div>
            <p class="text-slate-200">${i.msg}</p>
        </div>
    `).join('');
}

function editFeeManual(id) {
    const item = ledgers.find(l => l.id === id);
    if(!item) return;

    const total = prompt("Enter Total Treatment Cost (₹):", item.totalCost);
    const paid = prompt("Enter Amount Paid (₹):", item.paidAmount);

    if(total !== null && paid !== null) {
        item.totalCost = parseFloat(total) || 0;
        item.paidAmount = parseFloat(paid) || 0;
        item.dueAmount = item.totalCost - item.paidAmount;
        localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));
        renderLedgers();
    }
}

function openReceipt(id) {
    const item = ledgers.find(l => l.id === id);
    if(item) {
        document.getElementById('rc_hdr_name').innerText = clinicInfo.name;
        document.getElementById('rc_hdr_address').innerText = clinicInfo.address;
        document.getElementById('rc_num').innerText = `REC-${Math.floor(1000 + Math.random()*9000)}`;
        document.getElementById('rc_pid').innerText = item.id;
        document.getElementById('rc_pname').innerText = item.patientName;
        document.getElementById('rc_date').innerText = new Date().toLocaleDateString();
        document.getElementById('rc_purpose').innerText = item.purpose;
        document.getElementById('rc_total').innerText = `₹${item.totalCost}`;
        document.getElementById('rc_sum_total').innerText = `₹${item.totalCost}`;
        document.getElementById('rc_sum_paid').innerText = `₹${item.paidAmount}`;
        document.getElementById('rc_sum_due').innerText = `₹${item.dueAmount}`;

        document.getElementById('receiptModal').classList.remove('hidden');
        document.getElementById('receiptModal').classList.add('flex');
    }
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.add('hidden');
    document.getElementById('receiptModal').classList.remove('flex');
}

function openLetterhead(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        document.getElementById('lh_hdr_name').innerText = clinicInfo.name;
        document.getElementById('lh_hdr_address').innerText = clinicInfo.address;
        document.getElementById('lh_pid').innerText = appt.id;
        document.getElementById('lh_pname').innerText = appt.name;
        document.getElementById('lh_date').innerText = new Date().toLocaleDateString();
        document.getElementById('lh_doctor').innerText = appt.doctor;

        document.getElementById('letterheadModal').classList.remove('hidden');
        document.getElementById('letterheadModal').classList.add('flex');
    }
}

function closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.add('hidden');
    document.getElementById('letterheadModal').classList.remove('flex');
}

function saveClinicSettings() {
    clinicInfo.name = document.getElementById('set_clinic_name').value || clinicInfo.name;
    clinicInfo.phone = document.getElementById('set_clinic_phone').value || clinicInfo.phone;
    clinicInfo.address = document.getElementById('set_clinic_address').value || clinicInfo.address;

    localStorage.setItem('ns_clinic_info', JSON.stringify(clinicInfo));
    updateClinicHeader();
    alert("Clinic settings updated!");
}

function toggleModule(mod) {
    if(mod === 'chat') modules.chat = document.getElementById('adm_toggle_chat').checked;
    if(mod === 'ledger') modules.ledger = document.getElementById('adm_toggle_ledger').checked;

    localStorage.setItem('ns_modules', JSON.stringify(modules));
    applyModuleSettings();
}

function applyModuleSettings() {
    if(!modules.chat) document.getElementById('tabBtnChats').classList.add('hidden-section');
    else document.getElementById('tabBtnChats').classList.remove('hidden-section');

    if(!modules.ledger) document.getElementById('tabBtnLedger').classList.add('hidden-section');
    else document.getElementById('tabBtnLedger').classList.remove('hidden-section');
}

function approveAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        appt.status = 'CONFIRMED';
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        renderAppointments();
    }
}

function approveUserAccount(userId) {
    const u = users.find(x => x.id === userId);
    if(u) {
        u.status = 'Approved';
        localStorage.setItem('ns_users', JSON.stringify(users));
        renderApprovals();
    }
}

function renderAppointments() {
    document.getElementById('tblAppointments').innerHTML = appointments.map(a => `
        <tr class="hover:bg-slate-700/30">
            <td class="p-3 font-mono text-sky-400">${a.id}<br><span class="text-white font-sans font-bold">${a.name}</span></td>
            <td class="p-3">${a.phone}</td>
            <td class="p-3">${a.doctor}</td>
            <td class="p-3">${a.date}<br><span class="text-[10px] text-slate-400">${a.slot}</span></td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${a.status}</span></td>
            <td class="p-3 flex gap-1">
                ${a.status !== 'CONFIRMED' ? `<button onclick="approveAppointment('${a.id}')" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-xs font-bold">Approve</button>` : ''}
                <button onclick="openLetterhead('${a.id}')" class="bg-sky-500/20 text-sky-300 px-2 py-1 rounded text-xs">Write Rx</button>
            </td>
        </tr>
    `).join('');
}

function renderApprovals() {
    const pendingUsers = users.filter(u => u.status === 'Pending');
    document.getElementById('tblApprovals').innerHTML = pendingUsers.map(u => `
        <tr class="hover:bg-slate-700/30">
            <td class="p-3 font-bold text-white">${u.name}</td>
            <td class="p-3 uppercase text-sky-400 font-bold">${u.role}</td>
            <td class="p-3">${u.phone}<br><span class="text-[10px] text-slate-400">${u.email}</span></td>
            <td class="p-3"><span class="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">${u.status}</span></td>
            <td class="p-3">
                <button onclick="approveUserAccount(${u.id})" class="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-xs">Approve Account</button>
            </td>
        </tr>
    `).join('');
}

function renderLedgers() {
    document.getElementById('tblLedger').innerHTML = ledgers.map(l => `
        <tr class="hover:bg-slate-700/30">
            <td class="p-3 font-mono text-sky-400">${l.id}<br><span class="text-white font-sans">${l.patientName}</span></td>
            <td class="p-3">${l.purpose}</td>
            <td class="p-3 font-bold text-white">₹${l.totalCost}</td>
            <td class="p-3 text-emerald-400 font-bold">₹${l.paidAmount}</td>
            <td class="p-3 text-amber-400 font-bold">₹${l.dueAmount}</td>
            <td class="p-3 flex gap-1">
                <button onclick="editFeeManual('${l.id}')" class="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-1 rounded text-xs">Edit Fee</button>
                <button onclick="openReceipt('${l.id}')" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-xs">Receipt</button>
            </td>
        </tr>
    `).join('');
}

function handlePublicBooking(e) {
    e.preventDefault();
    const apptId = "NSD-" + Math.floor(1000 + Math.random() * 9000);
    const name = document.getElementById('bk_name').value;
    const phone = document.getElementById('bk_phone').value;
    const doctorName = document.getElementById('bk_doctor').value;
    const date = document.getElementById('bk_date').value;
    const slot = document.getElementById('bk_slot').value;
    const reason = document.getElementById('bk_reason').value;

    appointments.push({ id: apptId, name, phone, doctor: doctorName, date, slot, status: "PENDING", reason });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    ledgers.push({ id: apptId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0 });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    alert(`Appointment submitted! ID: ${apptId}`);
    navigateTo('public-home');
}

function searchAppointment() {
    const q = document.getElementById('trackQuery').value.trim();
    const res = appointments.find(a => a.id === q || a.phone === q);
    const box = document.getElementById('trackResult');
    box.classList.remove('hidden-section');

    if(res) {
        box.innerHTML = `
            <p class="text-xs text-sky-400 font-mono font-bold">Appointment Found: ${res.id}</p>
            <h3 class="text-lg font-bold text-white">${res.name}</h3>
            <p class="text-xs text-slate-300">Doctor: ${res.doctor}</p>
            <p class="text-xs text-slate-300">Scheduled: ${res.date} (${res.slot})</p>
            <span class="inline-block mt-2 font-bold px-2 py-0.5 rounded text-xs ${res.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">Status: ${res.status}</span>
        `;
    } else {
        box.innerHTML = `<p class="text-xs text-rose-400">No appointment records found for "${q}".</p>`;
    }
}

function switchDashTab(tab) {
    document.getElementById('viewAppts').classList.add('hidden-section');
    document.getElementById('viewChats').classList.add('hidden-section');
    document.getElementById('viewLedger').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');
    document.getElementById('viewSettings').classList.add('hidden-section');
    document.getElementById('viewAdminMaster').classList.add('hidden-section');

    if(tab === 'appts') document.getElementById('viewAppts').classList.remove('hidden-section');
    if(tab === 'chats') document.getElementById('viewChats').classList.remove('hidden-section');
    if(tab === 'ledger') document.getElementById('viewLedger').classList.remove('hidden-section');
    if(tab === 'approvals') document.getElementById('viewApprovals').classList.remove('hidden-section');
    if(tab === 'settings') document.getElementById('viewSettings').classList.remove('hidden-section');
    if(tab === 'adminMaster') document.getElementById('viewAdminMaster').classList.remove('hidden-section');
}

// Initialize Application
initApp();
