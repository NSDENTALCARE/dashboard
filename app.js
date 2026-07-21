// Initialize Lucide Icons
lucide.createIcons();

// Local Storage Persistent Collections
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

let currentSession = null;

// App Startup
function initApp() {
    renderDoctorsRoster();
    renderDoctorOptions();
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

function openPortalLogin() {
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
        document.getElementById('tabLoginBtn').className = "text-sky-400 font-bold";
        document.getElementById('tabRegBtn').className = "text-slate-400";
    } else {
        document.getElementById('portalLoginForm').classList.add('hidden-section');
        document.getElementById('portalRegForm').classList.remove('hidden-section');
        document.getElementById('tabLoginBtn').className = "text-slate-400";
        document.getElementById('tabRegBtn').className = "text-sky-400 font-bold";
    }
}

function handleAssistantRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    users.push({ id: Date.now(), name, role: "assistant", phone, email, password, status: "Pending" });
    localStorage.setItem('ns_users', JSON.stringify(users));

    alert("Assistant registration request submitted! The Doctor can approve this from their portal.");
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
        alert("Invalid credentials or account is pending Doctor approval!");
    }
}

function openDashboard() {
    navigateTo('dashboard');
    document.getElementById('dashBadge').innerText = currentSession.role;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;
    renderAppointments();
    renderApprovals();
    renderLedgers();
}

function logout() {
    currentSession = null;
    navigateTo('public-home');
}

function approveAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        appt.status = 'CONFIRMED';
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        renderAppointments();
        alert(`Appointment ${id} confirmed successfully!`);
    }
}

function approveUserAccount(userId) {
    const u = users.find(x => x.id === userId);
    if(u) {
        u.status = 'Approved';
        localStorage.setItem('ns_users', JSON.stringify(users));
        renderApprovals();
        alert(`Account for ${u.name} approved! They can now log in.`);
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
            <td class="p-3">
                ${a.status !== 'CONFIRMED' ? `<button onclick="approveAppointment('${a.id}')" class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-xs font-bold">Approve</button>` : '<span class="text-xs text-slate-500">Approved</span>'}
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
                <button onclick="approveUserAccount(${u.id})" class="bg-emerald-500 text-slate-950 font-bold px-2.5 py-1 rounded text-xs">Approve Registration</button>
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

    alert(`Appointment request submitted! Appointment ID: ${apptId}`);
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
        box.innerHTML = `<p class="text-xs text-rose-400">No appointment found for "${q}".</p>`;
    }
}

function switchDashTab(tab) {
    document.getElementById('viewAppts').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');
    document.getElementById('viewLedger').classList.add('hidden-section');

    if(tab === 'appts') document.getElementById('viewAppts').classList.remove('hidden-section');
    if(tab === 'approvals') document.getElementById('viewApprovals').classList.remove('hidden-section');
    if(tab === 'ledger') document.getElementById('viewLedger').classList.remove('hidden-section');
}

// Start Application
initApp();
