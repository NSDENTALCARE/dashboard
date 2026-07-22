lucide.createIcons();

// Signboard Data & System State
let heroContent = JSON.parse(localStorage.getItem('ns_hero')) || {
    title: "Welcome to N.S. Dental Care",
    subtitle: "Providing gentle, hygienic, and affordable dental treatments in Santosh Nagar & Edi Bazar, Hyderabad."
};

let doctors = JSON.parse(localStorage.getItem('ns_doctors')) || [
    { id: "doc1", name: "Dr. Md Salahuddin Ayub", spec: "Cosmetic Dental Surgeon (Regd: A-6705)", phone: "+918978883007", fee: 200 },
    { id: "doc2", name: "Dr. Tabassum Samreen", spec: "Cosmetic Dental Surgeon (Regd: A-7133)", phone: "+917729025118", fee: 150 }
];

let galleryPhotos = JSON.parse(localStorage.getItem('ns_gallery')) || [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80"
];

let patientReviews = JSON.parse(localStorage.getItem('ns_reviews')) || [
    { author: "Afroze Ali", rating: 5, text: "We had a great experience at NS Dental Care. The staff is very professional and the prices are very reasonable, Highly recommend!" },
    { author: "Mohammed Aslam", rating: 5, text: "Dr. Ayub and Dr. Samreen explain the treatment clearly. Painless root canal done at very reasonable cost." },
    { author: "Syeda Afroz", rating: 5, text: "Hygienic clinic and friendly nature of doctors. Best dental clinic in Edi Bazar & Santosh Nagar." }
];

let users = JSON.parse(localStorage.getItem('ns_users')) || [
    { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "+918978883007", email: "ayub@nsdental.com", password: "123", status: "Approved" },
    { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "+917729025118", email: "assistant@nsdental.com", password: "123", status: "Approved" }
];

let patients = JSON.parse(localStorage.getItem('ns_patients')) || [
    { patientId: "PAT-1001", name: "Mohammed Ali", phone: "+919876543210" }
];

let appointments = JSON.parse(localStorage.getItem('ns_appointments')) || [
    { id: "NSD-1001", patientId: "PAT-1001", name: "Mohammed Ali", phone: "+919876543210", doctor: "Dr. Md Salahuddin Ayub", date: "2026-07-23", slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: "2026-07-23" }
];

let medicalRecords = JSON.parse(localStorage.getItem('ns_records')) || {
    "PAT-1001": [
        { date: "2026-07-22", diagnosis: "Pulpitis lower molar", rx: "Amoxicillin 500mg, Paracetamol 650mg", doctor: "Dr. Md Salahuddin Ayub" }
    ]
};

let ledgers = JSON.parse(localStorage.getItem('ns_ledgers')) || [
    { id: "NSD-1001", patientId: "PAT-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 5000, paidAmount: 5000, dueAmount: 0 }
];

let activePrescriptionApptId = null;
let currentSession = null;

function initApp() {
    renderHeroAndFees();
    renderDoctorsRoster();
    renderDoctorOptions();
    renderGallery();
    renderReviews();
}

function renderHeroAndFees() {
    document.getElementById('disp_hero_title').innerText = heroContent.title;
    document.getElementById('disp_hero_subtitle').innerText = heroContent.subtitle;

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
}

function renderDoctorsRoster() {
    document.getElementById('doctorsRoster').innerHTML = doctors.map(d => `
        <div class="bg-slate-900 border border-red-900/40 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
            <div class="w-12 h-12 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center text-red-500 font-bold shrink-0">Dr</div>
            <div class="min-w-0">
                <h4 class="text-sm font-bold text-white truncate">${d.name}</h4>
                <p class="text-xs text-red-400 font-medium truncate">${d.spec}</p>
                <p class="text-[11px] text-slate-400">📞 ${d.phone} | Consultation: ₹${d.fee}</p>
            </div>
        </div>
    `).join('');
}

function renderDoctorOptions() {
    const opts = doctors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    document.getElementById('bk_doctor').innerHTML = opts;
}

function renderGallery() {
    document.getElementById('publicGalleryGrid').innerHTML = galleryPhotos.map(url => `
        <div class="overflow-hidden rounded-xl border border-slate-800 h-32 bg-slate-950">
            <img src="${url}" class="w-full h-full object-cover hover:scale-105 transition">
        </div>
    `).join('');
}

function renderReviews() {
    document.getElementById('publicReviewsGrid').innerHTML = patientReviews.map(r => `
        <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
            <div class="flex justify-between text-amber-400 font-bold">
                <span>${r.author}</span>
                <span>${'★'.repeat(r.rating)}</span>
            </div>
            <p class="text-slate-300 text-[11px] italic">"${r.text}"</p>
        </div>
    `).join('');
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
        alert("Invalid login details or account pending approval!");
    }
}

function openDashboard() {
    navigateTo('dashboard');
    document.getElementById('dashBadge').innerText = currentSession.role;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;

    document.getElementById('edit_hero_title').value = heroContent.title;
    document.getElementById('edit_hero_subtitle').value = heroContent.subtitle;
    document.getElementById('edit_fee_doc1').value = doctors[0].fee;
    document.getElementById('edit_fee_doc2').value = doctors[1].fee;

    renderAppointments();
    renderApprovals();
    renderLedgers();
}

function logout() {
    currentSession = null;
    navigateTo('public-home');
}

function handleAddGalleryPhoto(e) {
    e.preventDefault();
    const url = document.getElementById('gal_img_url').value;
    galleryPhotos.push(url);
    localStorage.setItem('ns_gallery', JSON.stringify(galleryPhotos));
    renderGallery();
    alert("Image added to gallery!");
    e.target.reset();
}

function handleAddReview(e) {
    e.preventDefault();
    const author = document.getElementById('rev_author').value;
    const rating = parseInt(document.getElementById('rev_rating').value);
    const text = document.getElementById('rev_text').value;

    patientReviews.push({ author, rating, text });
    localStorage.setItem('ns_reviews', JSON.stringify(patientReviews));
    renderReviews();
    alert("Review added!");
    e.target.reset();
}

function saveHeroAndFees() {
    heroContent.title = document.getElementById('edit_hero_title').value;
    heroContent.subtitle = document.getElementById('edit_hero_subtitle').value;
    doctors[0].fee = parseFloat(document.getElementById('edit_fee_doc1').value) || 200;
    doctors[1].fee = parseFloat(document.getElementById('edit_fee_doc2').value) || 150;

    localStorage.setItem('ns_hero', JSON.stringify(heroContent));
    localStorage.setItem('ns_doctors', JSON.stringify(doctors));

    renderHeroAndFees();
    renderDoctorsRoster();
    alert("Hero text & fees saved successfully!");
}

function triggerWhatsAppConfirmation(phone, pId, apptId, name, doctor, date, slot) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `*N.S. DENTAL CARE - APPOINTMENT CONFIRMATION*%0A%0AHello *${name}*, your appointment is confirmed!%0A%0A*Patient ID:* ${pId}%0A*Appointment ID:* ${apptId}%0A*Doctor:* ${doctor}%0A*Date:* ${date}%0A*Slot:* ${slot}%0A%0A*Address:* #17-1-305/P/1, Behind Water Tank Road, Santosh Nagar, Edi Bazar, Hyderabad.`;
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

function searchPatientRecords() {
    const q = document.getElementById('trackQuery').value.trim();
    const matchedPatient = patients.find(p => p.patientId === q || p.name.toLowerCase().includes(q.toLowerCase()) || p.phone === q);

    const box = document.getElementById('trackResult');
    box.classList.remove('hidden-section');

    if(matchedPatient) {
        const appts = appointments.filter(a => a.patientId === matchedPatient.patientId);
        const recs = medicalRecords[matchedPatient.patientId] || [];

        box.innerHTML = `
            <div class="border-b border-slate-800 pb-2">
                <span class="text-xs text-red-500 font-mono font-bold">${matchedPatient.patientId}</span>
                <h3 class="text-lg font-bold text-white">${matchedPatient.name} (${matchedPatient.phone})</h3>
            </div>
            <div>
                <h4 class="text-xs font-bold text-red-400 uppercase mb-1">Appointment History:</h4>
                <ul class="text-xs space-y-1 text-slate-300">
                    ${appts.map(a => `<li>• ${a.date} (${a.slot}) - Doctor: ${a.doctor} - <strong>${a.reason}</strong></li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="text-xs font-bold text-emerald-400 uppercase mb-1">Prescriptions:</h4>
                <ul class="text-xs space-y-1 text-slate-300">
                    ${recs.length > 0 ? recs.map(r => `<li>• ${r.date}: ${r.diagnosis} | Rx: <em>${r.rx}</em></li>`).join('') : '<li>No prescription records found.</li>'}
                </ul>
            </div>
        `;
    } else {
        box.innerHTML = `<p class="text-xs text-rose-400">No patient record found for "${q}".</p>`;
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

        alert("Prescription saved & Next visit synced!");
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
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-mono text-red-500">${a.patientId}<br><span class="text-white font-sans font-bold">${a.name}</span></td>
            <td class="p-3">${a.phone}</td>
            <td class="p-3">${a.doctor}</td>
            <td class="p-3">${a.date}<br><span class="text-[10px] text-slate-400">${a.slot}</span></td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">${a.status}</span></td>
            <td class="p-3 flex gap-1">
                <button onclick="openLetterhead('${a.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-xs">Prescription</button>
            </td>
        </tr>
    `).join('');
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
                <button onclick="openReceipt('${l.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-xs">Receipt</button>
            </td>
        </tr>
    `).join('');
}

function renderApprovals() {
    const pendingUsers = users.filter(u => u.status === 'Pending');
    document.getElementById('tblApprovals').innerHTML = pendingUsers.map(u => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-bold text-white">${u.name}</td>
            <td class="p-3 uppercase text-red-400 font-bold">${u.role}</td>
            <td class="p-3">${u.phone}</td>
            <td class="p-3"><span class="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">${u.status}</span></td>
            <td class="p-3">
                <button onclick="approveUserAccount(${u.id})" class="bg-emerald-600 text-white font-bold px-2 py-1 rounded text-xs">Approve</button>
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

function switchDashTab(tab) {
    document.getElementById('viewAppts').classList.add('hidden-section');
    document.getElementById('viewEHR').classList.add('hidden-section');
    document.getElementById('viewReviews').classList.add('hidden-section');
    document.getElementById('viewFees').classList.add('hidden-section');
    document.getElementById('viewLedger').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');

    if(tab === 'appts') document.getElementById('viewAppts').classList.remove('hidden-section');
    if(tab === 'ehr') document.getElementById('viewEHR').classList.remove('hidden-section');
    if(tab === 'reviews') document.getElementById('viewReviews').classList.remove('hidden-section');
    if(tab === 'fees') document.getElementById('viewFees').classList.remove('hidden-section');
    if(tab === 'ledger') document.getElementById('viewLedger').classList.remove('hidden-section');
    if(tab === 'approvals') document.getElementById('viewApprovals').classList.remove('hidden-section');
}

initApp();
