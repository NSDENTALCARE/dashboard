lucide.createIcons();

// Permanent Collections
let doctors = JSON.parse(localStorage.getItem('ns_doctors')) || [
    { id: "doc1", name: "Dr. Mohammed Salahuddin Ayub", spec: "Chief Dental Surgeon (Implants)", phone: "+919876543210" },
    { id: "doc2", name: "Dr. Tabassum Samreen Alam", spec: "Consultant Dental Surgeon (Orthodontics)", phone: "+919876543211" }
];

let users = JSON.parse(localStorage.getItem('ns_users')) || [
    { id: 1, name: "Dr. Mohammed Salahuddin Ayub", role: "doctor", phone: "+919876543210", email: "ayub@nsdental.com", password: "123", status: "Approved" },
    { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "+919876543212", email: "assistant@nsdental.com", password: "123", status: "Approved" }
];

let patients = JSON.parse(localStorage.getItem('ns_patients')) || [
    { patientId: "PAT-1001", name: "Mohammed Ali", phone: "+919876543210" }
];

let appointments = JSON.parse(localStorage.getItem('ns_appointments')) || [
    { id: "NSD-1001", patientId: "PAT-1001", name: "Mohammed Ali", phone: "+919876543210", doctor: "Dr. Mohammed Salahuddin Ayub", date: "2026-07-23", slot: "11:00 AM - 01:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: "2026-07-23" }
];

let medicalRecords = JSON.parse(localStorage.getItem('ns_records')) || {
    "PAT-1001": [
        { date: "2026-07-22", diagnosis: "Severe pulpitis lower molar", rx: "Amoxicillin 500mg, Paracetamol 650mg", doctor: "Dr. Mohammed Salahuddin Ayub" }
    ]
};

let ledgers = JSON.parse(localStorage.getItem('ns_ledgers')) || [
    { id: "NSD-1001", patientId: "PAT-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 5000, paidAmount: 5000, dueAmount: 0 }
];

let publicInquiries = JSON.parse(localStorage.getItem('ns_inquiries')) || [];
let activePrescriptionApptId = null;
let currentSession = null;

function initApp() {
    renderDoctorsRoster();
    renderDoctorOptions();
}

function playLoginChime() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
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
    const opts = doctors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    document.getElementById('bk_doctor').innerHTML = opts;
    document.getElementById('asst_pdoctor').innerHTML = opts;
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

function handlePortalLogin(e) {
    e.preventDefault();
    const role = document.getElementById('portalRole').value;
    const identifier = document.getElementById('portalIdentifier').value;
    const pwd = document.getElementById('portalPassword').value;

    if (role === 'admin' && identifier === 'admin' && pwd === '9290') {
        currentSession = { role: 'admin', name: 'Developer Admin' };
        playLoginChime();
        openDashboard();
        closePortalModal();
        return;
    }

    const u = users.find(x => x.role === role && (x.email === identifier || x.phone === identifier) && x.password === pwd);
    if (u && u.status === 'Approved') {
        currentSession = u;
        playLoginChime();
        openDashboard();
        closePortalModal();
    } else {
        alert("Invalid login details or account pending approval!");
    }
}

function openDashboard() {
    navigateTo('dashboard');
    document.getElementById('dashBadge').innerText = currentSession.role;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;

    if(currentSession.role === 'admin') {
        document.getElementById('tabBtnAdminMaster').classList.remove('hidden-section');
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    renderAppointments();
    renderCalendar();
    renderApprovals();
    renderLedgers();
}

function logout() {
    currentSession = null;
    navigateTo('public-home');
}

function triggerWhatsAppConfirmation(phone, pId, apptId, name, doctor, date, slot) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `*NS DENTAL CARE - APPOINTMENT CONFIRMATION*%0A%0AHello *${name}*, your dental appointment is confirmed!%0A%0A*Patient ID:* ${pId}%0A*Appointment ID:* ${apptId}%0A*Doctor:* ${doctor}%0A*Date:* ${date}%0A*Slot:* ${slot}%0A%0A*Address:* #17-1-305/P/1, Behind Water Tank, Santosh Nagar, Hyderabad.`;
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
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
    appointments.push({ id: apptId, patientId: patient.patientId, name, phone, doctor, date, slot, status: "CONFIRMED", reason, nextVisit: date });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    ledgers.push({ id: apptId, patientId: patient.patientId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0 });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    alert(`Booking Completed! Patient ID: ${patient.patientId}`);
    triggerWhatsAppConfirmation(phone, patient.patientId, apptId, name, doctor, date, slot);
    navigateTo('public-home');
}

function handleAssistantPatientRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('asst_pname').value;
    const phone = document.getElementById('asst_pphone').value;
    const doctor = document.getElementById('asst_pdoctor').value;
    const reason = document.getElementById('asst_preason').value;
    const date = document.getElementById('asst_pdate').value;
    const slot = document.getElementById('asst_pslot').value;

    let patient = patients.find(p => p.phone === phone);
    if(!patient) {
        patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone };
        patients.push(patient);
        localStorage.setItem('ns_patients', JSON.stringify(patients));
    }

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    appointments.push({ id: apptId, patientId: patient.patientId, name, phone, doctor, date, slot, status: "CONFIRMED", reason, nextVisit: date });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    ledgers.push({ id: apptId, patientId: patient.patientId, patientName: name, purpose: reason, totalCost: 0, paidAmount: 0, dueAmount: 0 });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    alert(`Patient Registered! Patient ID: ${patient.patientId}`);
    triggerWhatsAppConfirmation(phone, patient.patientId, apptId, name, doctor, date, slot);
    openDashboard();
}

function sendDailyBriefingToDoctor() {
    const today = new Date().toISOString().split('T')[0];
    const todaysAppts = appointments.filter(a => a.date === today || a.nextVisit === today);

    let text = `*NS DENTAL CARE - TODAY'S PATIENT SCHEDULE (${today})*%0A%0A`;
    if(todaysAppts.length === 0) {
        text += `No patient visits scheduled for today.`;
    } else {
        todaysAppts.forEach((a, i) => {
            text += `${i+1}. *${a.name}* (ID: ${a.patientId})%0A    Slot: ${a.slot}%0A    Problem: ${a.reason}%0A%0A`;
        });
    }

    const docPhone = doctors[0].phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${docPhone}?text=${text}`, '_blank');
}

function searchPatientRecords() {
    const q = document.getElementById('trackQuery').value.trim();
    const matchedPatient = patients.find(p => p.patientId === q || p.name.toLowerCase().includes(q.toLowerCase()) || p.phone === q);

    const box = document.getElementById('trackResult');
    box.classList.remove('hidden-section');

    if(matchedPatient) {
        const appts = appointments.filter(a => a.patientId === matchedPatient.patientId);
        const recs = medicalRecords[matchedPatient.patientId] || [];

        box.innerHTML = `
            <div class="border-b border-slate-700 pb-2">
                <span class="text-xs text-sky-400 font-mono font-bold">${matchedPatient.patientId}</span>
                <h3 class="text-lg font-bold text-white">${matchedPatient.name} (${matchedPatient.phone})</h3>
            </div>
            <div>
                <h4 class="text-xs font-bold text-sky-300 uppercase mb-1">Appointment History:</h4>
                <ul class="text-xs space-y-1 text-slate-300">
                    ${appts.map(a => `<li>• ${a.date} (${a.slot}) - Doctor: ${a.doctor} - <strong>${a.reason}</strong></li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="text-xs font-bold text-emerald-300 uppercase mb-1">Past Treatments & Prescriptions:</h4>
                <ul class="text-xs space-y-1 text-slate-300">
                    ${recs.length > 0 ? recs.map(r => `<li>• ${r.date}: ${r.diagnosis} | Rx: <em>${r.rx}</em></li>`).join('') : '<li>No prescription records found.</li>'}
                </ul>
            </div>
        `;
    } else {
        box.innerHTML = `<p class="text-xs text-rose-400">No patient record found for "${q}".</p>`;
    }
}

function renderCalendar() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const list = document.getElementById('calendarList');
    list.innerHTML = appointments.map(a => {
        const isTomorrow = (a.nextVisit === tomorrowStr || a.date === tomorrowStr);
        return `
            <div class="bg-slate-900 border ${isTomorrow ? 'due-tomorrow border-amber-500' : 'border-slate-700'} p-3 rounded-xl space-y-2">
                <div class="flex justify-between items-start">
                    <span class="text-[10px] font-mono text-sky-400">${a.patientId}</span>
                    ${isTomorrow ? '<span class="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Due Tomorrow</span>' : ''}
                </div>
                <h4 class="text-xs font-bold text-white">${a.name}</h4>
                <p class="text-[11px] text-slate-300">Visit Date: <strong>${a.nextVisit || a.date}</strong></p>
                <p class="text-[10px] text-slate-400">Reason: ${a.reason}</p>
                <button onclick="rescheduleVisit('${a.id}')" class="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-600 px-2 py-1 rounded text-[10px]">Reschedule Date</button>
            </div>
        `;
    }).join('');
}

function rescheduleVisit(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        const newDate = prompt("Enter new visit date (YYYY-MM-DD):", appt.nextVisit || appt.date);
        if(newDate) {
            appt.nextVisit = newDate;
            localStorage.setItem('ns_appointments', JSON.stringify(appointments));
            renderCalendar();
            alert("Visit date updated!");
        }
    }
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
        medicalRecords[appt.patientId].push({
            date: new Date().toLocaleDateString(),
            diagnosis: notes,
            rx: rx,
            doctor: appt.doctor
        });

        localStorage.setItem('ns_records', JSON.stringify(medicalRecords));

        appt.nextVisit = nextVisit;
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));

        renderCalendar();
        alert("Prescription saved & Next visit date synced!");
    }
}

function closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.add('hidden');
    document.getElementById('letterheadModal').classList.remove('flex');
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
    }
}

function openReceipt(id) {
    const item = ledgers.find(l => l.id === id);
    if(item) {
        document.getElementById('rc_num').innerText = `REC-${Math.floor(1000 + Math.random()*9000)}`;
        document.getElementById('rc_pid').innerText = item.patientId;
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

function renderAppointments() {
    document.getElementById('tblAppointments').innerHTML = appointments.map(a => `
        <tr class="hover:bg-slate-700/30">
            <td class="p-3 font-mono text-sky-400">${a.patientId}<br><span class="text-white font-sans font-bold">${a.name}</span></td>
            <td class="p-3">${a.phone}</td>
            <td class="p-3">${a.doctor}</td>
            <td class="p-3">${a.date}<br><span class="text-[10px] text-slate-400">${a.slot}</span></td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">${a.status}</span></td>
            <td class="p-3 flex gap-1">
                <button onclick="openLetterhead('${a.id}')" class="bg-sky-500/20 text-sky-300 px-2 py-1 rounded text-xs">Prescription</button>
            </td>
        </tr>
    `).join('');
}

function renderLedgers() {
    document.getElementById('tblLedger').innerHTML = ledgers.map(l => `
        <tr class="hover:bg-slate-700/30">
            <td class="p-3 font-mono text-sky-400">${l.patientId}<br><span class="text-white font-sans">${l.patientName}</span></td>
            <td class="p-3">${l.purpose}</td>
            <td class="p-3 font-bold text-white">₹${l.totalCost}</td>
            <td class="p-3 text-emerald-400 font-bold">₹${l.paidAmount}</td>
            <td class="p-3 text-amber-400 font-bold">₹${l.dueAmount}</td>
            <td class="p-3 flex gap-1">
                <button onclick="editFeeManual('${l.id}')" class="bg-sky-500/20 text-sky-300 px-2 py-1 rounded text-xs">Edit Fee</button>
                <button onclick="openReceipt('${l.id}')" class="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-xs">Receipt</button>
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
            <td class="p-3">${u.phone}</td>
            <td class="p-3"><span class="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">${u.status}</span></td>
            <td class="p-3">
                <button onclick="approveUserAccount(${u.id})" class="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-xs">Approve</button>
            </td>
        </tr>
    `).join('');
}

function approveUserAccount(id) {
    const u = users.find(x => x.id === id);
    if(u) {
        u.status = 'Approved';
        localStorage.setItem('ns_users', JSON.stringify(users));
        renderApprovals();
        alert("Account Approved!");
    }
}

function resetSystemData() {
    localStorage.clear();
    location.reload();
}

function switchDashTab(tab) {
    document.getElementById('viewAppts').classList.add('hidden-section');
    document.getElementById('viewEHR').classList.add('hidden-section');
    document.getElementById('viewCalendar').classList.add('hidden-section');
    document.getElementById('viewLedger').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');
    document.getElementById('viewAdminMaster').classList.add('hidden-section');

    if(tab === 'appts') document.getElementById('viewAppts').classList.remove('hidden-section');
    if(tab === 'ehr') document.getElementById('viewEHR').classList.remove('hidden-section');
    if(tab === 'calendar') document.getElementById('viewCalendar').classList.remove('hidden-section');
    if(tab === 'ledger') document.getElementById('viewLedger').classList.remove('hidden-section');
    if(tab === 'approvals') document.getElementById('viewApprovals').classList.remove('hidden-section');
    if(tab === 'adminMaster') document.getElementById('viewAdminMaster').classList.remove('hidden-section');
}

initApp();
