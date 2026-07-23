lucide.createIcons();

let hospitalEmail = localStorage.getItem('ns_hospital_email') || "info@nsdentalcare.com";
let doctorEmail = localStorage.getItem('ns_doctor_email') || "ayub@nsdentalcare.com";

let doctors = JSON.parse(localStorage.getItem('ns_doctors')) || [
    { id: "doc1", name: "Dr. Md Salahuddin Ayub", spec: "Cosmetic Dental Surgeon (Regd: A-6705)", phone: "8978883007", fee: 200 },
    { id: "doc2", name: "Dr. Tabassum Samreen", spec: "Cosmetic Dental Surgeon (Regd: A-7133)", phone: "7729025118", fee: 150 }
];

let users = JSON.parse(localStorage.getItem('ns_users')) || [
    { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "8978883007", email: "ayub@nsdental.com", password: "123", status: "Approved" },
    { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "7729025118", email: "assistant@nsdental.com", password: "123", status: "Approved" }
];

let passwordResetRequests = JSON.parse(localStorage.getItem('ns_pwd_resets')) || [];
let auditLogs = JSON.parse(localStorage.getItem('ns_logs')) || [{ time: new Date().toLocaleTimeString(), text: "System Initialized." }];

let galleryPhotos = JSON.parse(localStorage.getItem('ns_gallery')) || [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80"
];

let allReviews = JSON.parse(localStorage.getItem('ns_reviews')) || [
    { author: "Afroze Ali", rating: 5, text: "Great experience at NS Dental Care. Professional staff and reasonable prices." },
    { author: "Mohammed Aslam", rating: 5, text: "Dr. Ayub & Dr. Samreen explain treatment clearly. Painless root canal treatment!" },
    { author: "Syeda Afroz", rating: 5, text: "Hygienic clinic and friendly nature of doctors. Best dental clinic in Edi Bazar." },
    { author: "Mirza Faizan Baig", rating: 5, text: "Very gentle treatment. Got my wisdom tooth extracted without any pain. Highly recommended!" },
    { author: "Khaja Moinuddin", rating: 5, text: "Clean environment, expert surgeons, and fair fee structure in Santosh Nagar area." },
    { author: "Adnan Khan", rating: 5, text: "The crown fitting was perfect. Dr. Ayub is extremely skilled and patient with questions." },
    { author: "Fatima Begum", rating: 5, text: "Brought my mother for dentures. Very polite staff and comfortable clinic setup." },
    { author: "Syed Rizwan", rating: 5, text: "Painless dental scaling and teeth cleaning. Very neat and sanitized clinic." },
    { author: "Abdul Qadir", rating: 5, text: "Awesome dental clinic in Hyderabad. Fast token system and quick response on WhatsApp." },
    { author: "Zareena Sultana", rating: 5, text: "Best cosmetic dental care! My tooth whitening results are amazing. Thank you Dr. Samreen." },
    { author: "Mohammed Imran", rating: 5, text: "Root canal was completely smooth. They follow great hygiene and sterilization standards." },
    { author: "Tariq Mahmood", rating: 5, text: "Prompt appointment approval and minimal waiting time. Excellent treatment care." },
    { author: "Saba Anjum", rating: 5, text: "Dr. Tabassum Samreen is very soft spoken and attentive. Best clinic for ladies and children." },
    { author: "Bilal Ahmed", rating: 5, text: "Highly professional diagnostic advice. They don't suggest unnecessary expensive treatments." },
    { author: "Mohammed Rahil", rating: 5, text: "Got Zirconia crowns installed here. Super quality and very natural look. 5 stars!" },
    { author: "Ayesha Siddiqua", rating: 5, text: "Very clean hospital. The staff is polite, and the WhatsApp digital prescription system is great." },
    { author: "Omer Farooq", rating: 5, text: "Exceptional dental care. Painless filling and root canal under expert guidance." },
    { author: "Nusrath Jahan", rating: 5, text: "Very gentle hands. I had high dental anxiety, but Dr. Ayub made me feel totally calm." },
    { author: "Salman Khan", rating: 5, text: "Great service at Santosh Nagar center. Fees are nominal and treatments are top class." },
    { author: "Feroz Khan", rating: 5, text: "Fast service and clean equipment. Recommended for all family dental problems." },
    { author: "Hina Kausar", rating: 5, text: "Braces consultation was detailed and affordable installments were offered." },
    { author: "Wasim Akram", rating: 5, text: "Token system in waiting room is smooth. Very organized queue management." },
    { author: "Sameer Uddin", rating: 5, text: "Got immediate relief from severe toothache. Thank you N.S. Dental Care team!" },
    { author: "Nazia Parveen", rating: 5, text: "Warm atmosphere and clean surroundings. Doctors explain everything on dental charts." },
    { author: "Mohammed Yaseen", rating: 5, text: "Best clinic near Edi Bazar main road. Easy booking and quick patient portal lookups." },
    { author: "Arshad Hussain", rating: 5, text: "Top class implant clinic. Professional surgeons and complete transparency in billing." },
    { author: "Rehana Sultana", rating: 5, text: "Painless wisdom tooth removal! Instructions for post-op care were given clearly." },
    { author: "Shoaib Malik", rating: 5, text: "Digital receipt and prescription feature on WhatsApp is extremely convenient." },
    { author: "Farha Naaz", rating: 5, text: "Dr. Samreen is wonderful with kids. My daughter's teeth cleaning went effortlessly." },
    { author: "Javed Iqbal", rating: 5, text: "5 star dental facility in Hyderabad! Clean, modern, trustworthy and affordable." }
];

let patients = JSON.parse(localStorage.getItem('ns_patients')) || [
    { patientId: "PAT-1001", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male" }
];

const todayStr = new Date().toISOString().split('T')[0];

let appointments = JSON.parse(localStorage.getItem('ns_appointments')) || [
    { id: "NSD-1001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male", doctor: "Dr. Md Salahuddin Ayub", date: todayStr, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: todayStr, modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "135", risk: "Diabetic" }
];

let labOrders = JSON.parse(localStorage.getItem('ns_lab_orders')) || [
    { id: "LAB-101", patientId: "PAT-1001", patientName: "Mohammed Ali", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: todayStr, status: "In Lab Production" }
];

let medicalRecords = JSON.parse(localStorage.getItem('ns_records')) || {
    "PAT-1001": [
        { id: "RX-1001", date: todayStr, diagnosis: "Teeth Selected: #14, #15 | Upper Molar Pulpitis", rx: "Tab Amoxicillin 500mg (1-0-1)\nTab Paracetamol 650mg (1-0-1)", doctor: "Dr. Md Salahuddin Ayub", nextVisit: todayStr }
    ]
};

let ledgers = JSON.parse(localStorage.getItem('ns_ledgers')) || [
    { id: "REC-1001", apptId: "NSD-1001", patientId: "PAT-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 5000, paidAmount: 5000, dueAmount: 0, date: todayStr }
];

let activePrescriptionApptId = null;
let activeReceiptId = null;
let selectedTeeth = [];
let currentSession = null;

function initApp() {
    startRealtimeClock();
    checkPublicTicker();
    renderHeroAndFees();
    renderDoctorsRoster();
    renderDoctorOptions();
    renderGallery();
    initShufflingReviews10Sec();
    renderPublicTokenQueue();
    renderOdontogram();
    syncAdminEmailInputs();
}

function startRealtimeClock() {
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        
        const elTicker = document.getElementById('hdr_datetime_ticker');
        const elDashClock = document.getElementById('dashClockBar');

        if(elTicker) elTicker.innerText = `${dateStr} | ${timeStr}`;
        if(elDashClock) elDashClock.innerText = `${dateStr} | ${timeStr}`;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function updateMetricCards() {
    const todays = appointments.filter(a => a.date === todayStr);
    const activeQueue = todays.filter(a => a.queueStatus === 'In Waiting Room' || a.queueStatus === 'In Consultation');
    const todayRev = ledgers.filter(l => l.date === todayStr).reduce((acc, c) => acc + (parseFloat(c.paidAmount) || 0), 0);
    const labPending = labOrders.filter(o => o.status !== 'Delivered & Fitted');
    const riskCount = todays.filter(a => a.risk && a.risk !== 'None').length;

    if(document.getElementById('card_stat_visits')) document.getElementById('card_stat_visits').innerText = todays.length;
    if(document.getElementById('card_stat_queue')) document.getElementById('card_stat_queue').innerText = activeQueue.length;
    if(document.getElementById('card_stat_revenue')) document.getElementById('card_stat_revenue').innerText = `₹${todayRev.toLocaleString('en-IN')}`;
    if(document.getElementById('card_stat_lab')) document.getElementById('card_stat_lab').innerText = labPending.length;
    if(document.getElementById('card_stat_risk')) document.getElementById('card_stat_risk').innerText = riskCount;
}

function checkPublicTicker() {
    const textEl = document.getElementById('disp_marquee_text');
    const inputEl = document.getElementById('adm_ticker_input');
    const saved = localStorage.getItem('ns_ticker_text');

    const defaultText = "Dental consultation fees and appointment slots updated with effect from 1 July 2026. Prior booking mandatory for evening Sunday procedures.";
    const activeText = saved || defaultText;

    if(textEl) textEl.innerText = activeText;
    if(inputEl) inputEl.value = activeText;
}

function updateLiveTickerAdmin() {
    const inputEl = document.getElementById('adm_ticker_input');
    if(inputEl && inputEl.value) {
        localStorage.setItem('ns_ticker_text', inputEl.value);
        checkPublicTicker();
        logAction(`Admin updated live marquee ticker: "${inputEl.value}"`);
        alert("Top Marquee Ticker Updated!");
    }
}

function syncAdminEmailInputs() {
    const elHosp = document.getElementById('adm_hosp_email');
    const elDoc = document.getElementById('adm_doc_email');
    const elHdr = document.getElementById('disp_hdr_email');

    if(elHosp) elHosp.value = hospitalEmail;
    if(elDoc) elDoc.value = doctorEmail;
    if(elHdr) elHdr.innerText = hospitalEmail;
}

function saveAdminEmailSettings() {
    hospitalEmail = document.getElementById('adm_hosp_email').value;
    doctorEmail = document.getElementById('adm_doc_email').value;

    localStorage.setItem('ns_hospital_email', hospitalEmail);
    localStorage.setItem('ns_doctor_email', doctorEmail);

    syncAdminEmailInputs();
    logAction("Admin updated hospital and doctor email configuration.");
    alert("Email addresses updated successfully!");
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

function autoCheckExistingPatient(val) {
    const clean = val.replace(/[^0-9a-zA-Z-]/g, '').trim();
    const p = patients.find(x => x.phone === clean || x.patientId.toLowerCase() === clean.toLowerCase());
    const badge = document.getElementById('bk_existing_badge');
    
    if(p) {
        document.getElementById('bk_name').value = p.name;
        if(badge) badge.classList.remove('hidden-section');
    } else {
        if(badge) badge.classList.add('hidden-section');
    }
}

function autoCheckExistingPatientUpload(val) {
    const clean = val.replace(/[^0-9a-zA-Z-]/g, '').trim();
    const p = patients.find(x => x.phone === clean || x.patientId.toLowerCase() === clean.toLowerCase());
    const badge = document.getElementById('man_existing_badge');

    if(p) {
        document.getElementById('man_pname').value = p.name;
        document.getElementById('man_page_gender').value = p.ageGender || "34 / Male";
        if(badge) badge.classList.remove('hidden-section');
    } else {
        if(badge) badge.classList.add('hidden-section');
    }
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

function resetDailyTokens() {
    if(confirm("Reset token numbers for today's queue starting from TK-01?")) {
        let todays = appointments.filter(a => a.date === todayStr);
        todays.forEach((a, index) => {
            a.token = "TK-0" + (index + 1);
            a.queueStatus = "In Waiting Room";
            a.modifiedToday = true;
        });
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        renderAppointments();
        renderPublicTokenQueue();
        updateMetricCards();
        logAction("Staff reset today's patient queue tokens starting from TK-01.");
        alert("Daily Token Queue Reset Complete!");
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
    document.getElementById('med_doctor').innerHTML = opts;
}

function renderGallery() {
    const publicGrid = document.getElementById('publicGalleryGrid');
    const adminGrid = document.getElementById('adminGalleryPreview');

    if(publicGrid) {
        publicGrid.innerHTML = galleryPhotos.map((url, idx) => `
            <div class="relative overflow-hidden rounded-xl border border-slate-800 h-28 sm:h-32 bg-slate-950 group">
                <img src="${url}" class="w-full h-full object-cover">
                ${currentSession ? `<button onclick="deleteGalleryPhoto(${idx})" class="absolute top-1 right-1 bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow">Delete</button>` : ''}
            </div>
        `).join('');
    }

    if(adminGrid) {
        adminGrid.innerHTML = galleryPhotos.map((url, idx) => `
            <div class="relative rounded-lg overflow-hidden border border-slate-800 h-16 group">
                <img src="${url}" class="w-full h-full object-cover">
                <button onclick="deleteGalleryPhoto(${idx})" class="absolute top-1 right-1 bg-rose-600 text-white text-[9px] px-1 rounded">✕</button>
            </div>
        `).join('');
    }
}

function promptStaffAddGalleryImage() {
    const url = prompt("Enter High-Resolution Photo URL:");
    if(url) {
        galleryPhotos.push(url);
        localStorage.setItem('ns_gallery', JSON.stringify(galleryPhotos));
        renderGallery();
        logAction(`${currentSession.role.toUpperCase()} added photo to gallery.`);
        alert("Image added to gallery!");
    }
}

function deleteGalleryPhoto(idx) {
    if(confirm("Remove this photo from clinic gallery?")) {
        galleryPhotos.splice(idx, 1);
        localStorage.setItem('ns_gallery', JSON.stringify(galleryPhotos));
        renderGallery();
        logAction(`Deleted gallery photo index ${idx}`);
    }
}

function addReviewAdmin() {
    const author = document.getElementById('adm_rev_author').value;
    const text = document.getElementById('adm_rev_text').value;

    if(author && text) {
        allReviews.unshift({ author, rating: 5, text });
        localStorage.setItem('ns_reviews', JSON.stringify(allReviews));
        alert("Google review added!");
        logAction(`Admin added Google review from ${author}`);
        document.getElementById('adm_rev_author').value = '';
        document.getElementById('adm_rev_text').value = '';
    }
}

function initShufflingReviews10Sec() {
    const container = document.getElementById('shufflingReviewsContainer');
    let currentIndex = 0;

    function shuffle10() {
        if(!container) return;
        const slice = [];
        for(let i = 0; i < 3; i++) {
            slice.push(allReviews[(currentIndex + i) % allReviews.length]);
        }
        currentIndex = (currentIndex + 3) % allReviews.length;

        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = slice.map(r => `
                <div class="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5 shadow-md">
                    <div class="flex justify-between text-amber-400 font-bold">
                        <span>${r.author}</span>
                        <span>${'★'.repeat(r.rating)}</span>
                    </div>
                    <p class="text-slate-300 text-[11px] italic leading-snug">"${r.text}"</p>
                </div>
            `).join('');
            container.style.opacity = '1';
        }, 300);
    }

    shuffle10();
    setInterval(shuffle10, 10000);
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
        currentSession = { role: 'admin', name: 'Developer Admin', phone: '+91 8978883007' };
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
    
    const hdrBadge = document.getElementById('hdr_user_badge');
    const hdrRole = document.getElementById('hdr_user_role');
    const hdrName = document.getElementById('hdr_user_name');
    const loginBtn = document.getElementById('btn_staff_login');

    if(hdrBadge && currentSession) {
        hdrRole.innerText = `ROLE: ${currentSession.role.toUpperCase()}`;
        hdrName.innerText = currentSession.name;
        hdrBadge.classList.remove('hidden-section');
        if(loginBtn) loginBtn.classList.add('hidden-section');
    }

    document.getElementById('dashBadge').innerText = `ROLE: ${currentSession.role.toUpperCase()}`;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name} (${currentSession.phone || ''})`;

    document.getElementById('btn_staff_add_gallery').classList.remove('hidden-section');

    if(currentSession.role === 'admin') {
        document.getElementById('tabBtnAdminMaster').classList.remove('hidden-section');
        renderAdminUserTable();
        renderAuditLogs();
        calculateAdminStats();
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    renderAppointments();
    renderLabOrders();
    renderCalendar();
    renderLedgers();
    renderApprovals();
    updateMetricCards();
}

function logout() {
    currentSession = null;
    document.getElementById('hdr_user_badge').classList.add('hidden-section');
    document.getElementById('btn_staff_login').classList.remove('hidden-section');
    document.getElementById('btn_staff_add_gallery').classList.add('hidden-section');
    navigateTo('public-home');
}

function calculateAdminStats() {
    let totalRev = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    let totalDue = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.dueAmount) || 0), 0);

    const elRev = document.getElementById('adm_stat_rev');
    const elDue = document.getElementById('adm_stat_due');

    if(elRev) elRev.innerText = `₹${totalRev.toLocaleString('en-IN')}`;
    if(elDue) elDue.innerText = `₹${totalDue.toLocaleString('en-IN')}`;
}

function exportFinancialReport() {
    let csv = "Patient ID,Patient Name,Purpose,Total Cost,Paid Amount,Due Amount\n";
    ledgers.forEach(l => {
        csv += `"${l.patientId}","${l.patientName}","${l.purpose}",${l.totalCost},${l.paidAmount},${l.dueAmount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NS_Dental_Financial_Report_${todayStr}.csv`;
    a.click();
    logAction("Exported financial ledger CSV report.");
}

function saveClinicTimings() {
    const m = document.getElementById('adm_slot_morning').value;
    const e = document.getElementById('adm_slot_evening').value;

    document.getElementById('disp_slot_morning').innerText = m;
    document.getElementById('disp_slot_evening').innerText = e;

    localStorage.setItem('ns_timings', JSON.stringify({ morning: m, evening: e }));
    logAction("Updated clinic operating hours.");
    alert("Hospital hours updated!");
}

function togglePerm(key) {
    let permObj = JSON.parse(localStorage.getItem('ns_perms')) || {};
    permObj[key] = !permObj[key];
    localStorage.setItem('ns_perms', JSON.stringify(permObj));
    logAction(`Updated permission flag: ${key} = ${permObj[key]}`);
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
            <td class="p-3 font-bold text-amber-400 font-mono">${a.nextVisit || a.date}</td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                    ${a.status}
                </span>
            </td>
            <td class="p-3 flex gap-1 flex-wrap">
                ${a.status === 'PENDING' ? `<button onclick="approveAppointment('${a.id}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">Approve</button>` : ''}
                <button onclick="openMasterEditModal('${a.patientId}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">Edit Record</button>
                <button onclick="openLetterhead('${a.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px]">Rx</button>
                <button onclick="sendAppointmentWhatsAppLinks('${a.id}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">WhatsApp</button>
                ${(currentSession.role === 'admin' || currentSession.role === 'doctor') ? `<button onclick="deletePatientRecordATOZ('${a.patientId}')" class="bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-[10px]">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openMasterEditModal(pid) {
    const p = patients.find(x => x.patientId === pid);
    const appt = appointments.find(a => a.patientId === pid) || {};
    const ledger = ledgers.find(l => l.patientId === pid) || {};

    if(!p) return;

    document.getElementById('med_target_pid').value = pid;
    document.getElementById('med_pid_badge').innerText = pid;
    document.getElementById('med_name').value = p.name;
    document.getElementById('med_phone').value = p.phone;
    document.getElementById('med_age_gender').value = p.ageGender || "34 / Male";
    document.getElementById('med_token').value = appt.token || "TK-01";
    document.getElementById('med_doctor').value = appt.doctor || doctors[0].name;
    document.getElementById('med_bp').value = appt.bp || "120/80";
    document.getElementById('med_sugar').value = appt.sugar || "140 mg/dL";
    document.getElementById('med_risk').value = appt.risk || "None";
    document.getElementById('med_reason').value = appt.reason || "Consultation";
    document.getElementById('med_next_visit').value = appt.nextVisit || todayStr;
    document.getElementById('med_total_cost').value = ledger.totalCost || 0;
    document.getElementById('med_paid_amount').value = ledger.paidAmount || 0;

    document.getElementById('masterEditModal').classList.remove('hidden');
    document.getElementById('masterEditModal').classList.add('flex');
}

function closeMasterEditModal() {
    document.getElementById('masterEditModal').classList.add('hidden');
    document.getElementById('masterEditModal').classList.remove('flex');
}

function handleMasterEditSubmit(e) {
    e.preventDefault();
    const pid = document.getElementById('med_target_pid').value;
    const p = patients.find(x => x.patientId === pid);
    const appt = appointments.find(a => a.patientId === pid);
    const ledger = ledgers.find(l => l.patientId === pid);

    if(p) {
        p.name = document.getElementById('med_name').value;
        p.phone = document.getElementById('med_phone').value.replace(/[^0-9]/g, '');
        p.ageGender = document.getElementById('med_age_gender').value;
    }

    if(appt) {
        appt.name = p.name;
        appt.phone = p.phone;
        appt.ageGender = p.ageGender;
        appt.token = document.getElementById('med_token').value;
        appt.doctor = document.getElementById('med_doctor').value;
        appt.bp = document.getElementById('med_bp').value;
        appt.sugar = document.getElementById('med_sugar').value;
        appt.risk = document.getElementById('med_risk').value;
        appt.reason = document.getElementById('med_reason').value;
        appt.nextVisit = document.getElementById('med_next_visit').value;
        appt.modifiedToday = true;
    }

    if(ledger) {
        ledger.patientName = p.name;
        ledger.totalCost = parseFloat(document.getElementById('med_total_cost').value) || 0;
        ledger.paidAmount = parseFloat(document.getElementById('med_paid_amount').value) || 0;
        ledger.dueAmount = ledger.totalCost - ledger.paidAmount;
    }

    localStorage.setItem('ns_patients', JSON.stringify(patients));
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    renderAppointments();
    renderLedgers();
    renderPublicTokenQueue();
    calculateAdminStats();
    updateMetricCards();

    logAction(`Advanced modal edit applied to patient ${pid}`);
    alert("Patient Record Updated via Master Editor!");
    closeMasterEditModal();
}

function openMasterEditModalFromReceipt() {
    if(activeReceiptId) {
        const item = ledgers.find(l => l.id === activeReceiptId);
        if(item) {
            closeReceiptModal();
            openMasterEditModal(item.patientId);
        }
    }
}

function sendDoctorDailyBriefingEmail() {
    const todays = appointments.filter(a => a.date === todayStr);
    let subject = `N.S. DENTAL CARE - Daily Schedule Briefing (${todayStr})`;
    let body = `N.S. DENTAL CARE DAILY CLINICAL SUMMARY (${todayStr})\n\nTotal Patients Scheduled: ${todays.length}\n\n`;

    todays.forEach((a, i) => {
        body += `${i+1}. Token ${a.token || 'TK-01'} | ${a.name} (${a.patientId})\n   Slot: ${a.slot} | Doctor: ${a.doctor}\n   Issue: ${a.reason} | Vitals: BP ${a.bp || '120/80'}, Sugar ${a.sugar || 'N/A'}\n\n`;
    });

    window.location.href = `mailto:${doctorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    logAction(`Daily briefing email triggered to ${doctorEmail}`);
}

function openDayWiseAuditModal() {
    const todaysAppts = appointments.filter(a => a.date === todayStr);
    const todaysLedgers = ledgers.filter(l => l.date === todayStr || l.date === undefined);

    let totRev = todaysLedgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    let totDue = todaysLedgers.reduce((acc, curr) => acc + (parseFloat(curr.dueAmount) || 0), 0);

    document.getElementById('audit_date_display').innerText = todayStr;
    document.getElementById('aud_pcount').innerText = todaysAppts.length;
    document.getElementById('aud_rev').innerText = `₹${totRev.toLocaleString('en-IN')}`;
    document.getElementById('aud_due').innerText = `₹${totDue.toLocaleString('en-IN')}`;

    const listContainer = document.getElementById('auditBreakupList');
    if(todaysAppts.length === 0) {
        listContainer.innerHTML = `<p class="text-slate-500 italic">No visits logged for today.</p>`;
    } else {
        listContainer.innerHTML = todaysAppts.map((a, i) => {
            const l = todaysLedgers.find(x => x.patientId === a.patientId) || {};
            return `<div class="border-b border-slate-800 pb-1">${i+1}. <strong>${a.name}</strong> (${a.patientId}) - ${a.reason} | Fee: ₹${l.totalCost || 0} | Paid: ₹${l.paidAmount || 0} | Status: ${a.status}</div>`;
        }).join('');
    }

    document.getElementById('dayAuditModal').classList.remove('hidden');
    document.getElementById('dayAuditModal').classList.add('flex');
}

function closeDayWiseAuditModal() {
    document.getElementById('dayAuditModal').classList.add('hidden');
    document.getElementById('dayAuditModal').classList.remove('flex');
}

function markDayAuditVerified() {
    logAction(`Staff/CA verified day-wise audit summary for ${todayStr}`);
    alert(`Day-Wise Summary for ${todayStr} Locked & Verified by Staff/CA!`);
    closeDayWiseAuditModal();
}

function sendAppointmentWhatsAppLinks(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if(appt) {
        const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
        const pageUrl = window.location.href.split('#')[0];
        const msg = `*N.S. DENTAL CARE - PATIENT PORTAL ACCESS*%0A%0ADear *${appt.name}*,%0AYour appointment/record has been updated!%0A%0A*Patient ID:* ${appt.patientId}%0A*Token #:* ${appt.token || 'TK-01'}%0A*Doctor:* ${appt.doctor}%0A*Next Visit:* ${appt.nextVisit || appt.date}%0A%0A*Download Prescription & Receipt:*%0A${pageUrl}%0A(Verify with Name + Patient ID to view & print)`;
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    }
}

function deletePatientRecordATOZ(pid) {
    if(confirm(`PERMANENTLY DELETE all patient data, medical records, and receipts for ${pid}?`)) {
        patients = patients.filter(p => p.patientId !== pid);
        appointments = appointments.filter(a => a.patientId !== pid);
        ledgers = ledgers.filter(l => l.patientId !== pid);
        delete medicalRecords[pid];

        localStorage.setItem('ns_patients', JSON.stringify(patients));
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));
        localStorage.setItem('ns_records', JSON.stringify(medicalRecords));

        renderAppointments();
        renderLedgers();
        calculateAdminStats();
        updateMetricCards();
        logAction(`Deleted entire record for patient ${pid}`);
        alert("Patient purged permanently!");
    }
}

function approveAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        appt.status = 'CONFIRMED';
        appt.modifiedToday = true;
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));
        renderAppointments();
        renderPublicTokenQueue();
        updateMetricCards();
        logAction(`Approved appointment ${id} for ${appt.name}.`);
        alert("Appointment Approved!");
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
        updateMetricCards();
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
        updateMetricCards();
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
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    }
}

function renderAdminUserTable() {
    const tbl = document.getElementById('adminUserManagementTable');
    if(tbl) {
        tbl.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${u.name}</td>
                <td class="p-2.5 uppercase font-bold text-red-400">${u.role}</td>
                <td class="p-2.5 font-mono text-slate-300">${u.phone}</td>
                <td class="p-2.5 text-slate-400">${u.email}</td>
                <td class="p-2.5 font-mono text-amber-400 font-bold">${u.password}</td>
                <td class="p-2.5"><span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">${u.status}</span></td>
                <td class="p-2.5 flex gap-1">
                    <button onclick="adminEditFullUserProfile(${u.id})" class="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">Edit Profile</button>
                    <button onclick="adminToggleUserStatus(${u.id})" class="bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold">Access</button>
                </td>
            </tr>
        `).join('');
    }
}

function adminEditFullUserProfile(userId) {
    const u = users.find(x => x.id === userId);
    if(u) {
        const name = prompt("Edit Full Name:", u.name);
        const phone = prompt("Edit Mobile #:", u.phone);
        const email = prompt("Edit Email:", u.email);
        const pwd = prompt("Edit Password (PLAIN TEXT):", u.password);

        if(name && phone && pwd) {
            u.name = name;
            u.phone = phone;
            u.email = email;
            u.password = pwd;

            localStorage.setItem('ns_users', JSON.stringify(users));
            renderAdminUserTable();
            logAction(`Admin modified complete profile & password for ${u.name}`);
            alert("Staff profile & credentials updated!");
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
                <p class="text-[10px] text-amber-400 font-bold">Next Follow-Up: ${a.nextVisit || a.date}</p>
            </div>
        `).join('');
    }
}

function handleManualPatientUpload(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('man_pphone').value.replace(/[^0-9a-zA-Z-]/g, '');
    const name = document.getElementById('man_pname').value;
    const ageGender = document.getElementById('man_page_gender').value;
    const doctor = document.getElementById('man_pdoctor').value;
    const reason = document.getElementById('man_preason').value;
    const rx = document.getElementById('man_prx').value;
    const date = document.getElementById('man_pdate').value;
    const nextVisit = document.getElementById('man_pnext').value || date;
    const fee = parseFloat(document.getElementById('man_pfee').value) || 0;

    const bp = document.getElementById('man_vitals_bp').value;
    const sugar = document.getElementById('man_vitals_sugar').value;
    const risk = document.getElementById('man_vitals_risk').value;

    let patient = patients.find(p => p.phone === phoneInput || p.patientId.toLowerCase() === phoneInput.toLowerCase());
    if(!patient) {
        patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone: phoneInput, ageGender };
        patients.push(patient);
    } else {
        patient.name = name;
        patient.ageGender = ageGender;
    }
    localStorage.setItem('ns_patients', JSON.stringify(patients));

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    const token = "TK-0" + (appointments.length + 1);
    appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone: patient.phone, ageGender, doctor, date, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason, nextVisit, modifiedToday: true, queueStatus: "In Waiting Room", bp, sugar, risk });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    if(!medicalRecords[patient.patientId]) medicalRecords[patient.patientId] = [];
    medicalRecords[patient.patientId].push({ id: "RX-" + Date.now(), date, diagnosis: reason, rx, doctor, nextVisit });
    localStorage.setItem('ns_records', JSON.stringify(medicalRecords));

    const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
    ledgers.push({ id: recId, apptId, patientId: patient.patientId, patientName: name, purpose: reason, totalCost: fee, paidAmount: fee, dueAmount: 0, date });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    logAction(`Record saved for ${name} (${patient.patientId})`);
    alert(`Patient Visit Saved! Patient ID: ${patient.patientId} | Token: ${token}`);
    e.target.reset();
    document.getElementById('man_existing_badge').classList.add('hidden-section');
    renderAppointments();
    renderCalendar();
    renderLedgers();
    renderPublicTokenQueue();
    calculateAdminStats();
    updateMetricCards();
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
        const pLedgers = ledgers.filter(l => l.patientId === matchedPatient.patientId);

        container.innerHTML = `
            <div class="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                    <span class="text-xs text-red-500 font-mono font-bold">${matchedPatient.patientId}</span>
                    <h3 class="text-base font-bold text-white">${matchedPatient.name}</h3>
                    <p class="text-[11px] text-slate-400">Age/Gender: ${matchedPatient.ageGender || '34 / Male'}</p>
                </div>
                <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">Verified Patient Timeline</span>
            </div>
            
            <div class="space-y-2">
                <h4 class="text-xs font-bold text-red-400 uppercase">Itemized Patient Visit Logs:</h4>
                <div class="space-y-2">
                    ${appts.map(a => {
                        const l = pLedgers.find(x => x.apptId === a.id) || {};
                        return `
                            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                                <div class="flex justify-between font-bold text-white">
                                    <span>Date: ${a.date} (${a.slot})</span>
                                    <span class="text-amber-400 font-mono">Token: ${a.token || 'TK-01'}</span>
                                </div>
                                <p class="text-slate-300">Doctor: ${a.doctor} | Problem: ${a.reason}</p>
                                <p class="text-slate-400 text-[11px]">BP: ${a.bp || '120/80'} | Risk: ${a.risk || 'None'} | Charged: ₹${l.totalCost || 0} (Paid: ₹${l.paidAmount || 0})</p>
                                <span class="text-emerald-400 font-bold text-[11px] block">Next Scheduled Follow-Up: ${a.nextVisit || a.date}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <h4 class="text-xs font-bold text-emerald-400 uppercase">Prescription Downloads (PDF View):</h4>
                <div class="space-y-2">
                    ${recs.length > 0 ? recs.map(r => `
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                                <p class="font-bold text-white">Date: ${r.date} | Dr. ${r.doctor}</p>
                                <p class="text-slate-400 text-[11px]">Findings: ${r.diagnosis}</p>
                            </div>
                            <button onclick="publicViewReadOnlyPrescription('${matchedPatient.patientId}', '${r.id || ''}')" class="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Rx
                            </button>
                        </div>
                    `).join('') : '<p class="text-xs text-slate-500">No prescriptions found.</p>'}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <h4 class="text-xs font-bold text-amber-400 uppercase">Hospital Receipt Downloads:</h4>
                <div class="space-y-2">
                    ${pLedgers.length > 0 ? pLedgers.map(l => `
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                                <p class="font-bold text-white">${l.id || 'REC-1001'} | Total Fee: ₹${l.totalCost}</p>
                                <p class="text-slate-400 text-[11px]">${l.purpose} | Paid: ₹${l.paidAmount} | Due: ₹${l.dueAmount}</p>
                            </div>
                            <button onclick="publicViewReadOnlyReceipt('${l.id}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0">
                                <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Download Receipt
                            </button>
                        </div>
                    `).join('') : '<p class="text-xs text-slate-500">No receipt ledgers found.</p>'}
                </div>
            </div>
        `;
        lucide.createIcons();
    } else {
        container.innerHTML = `<p class="text-xs text-rose-400 font-semibold">Verification Failed: Patient Full Name and ID or Mobile Number do not match our database records.</p>`;
    }
}

function searchEHR() {
    const input = document.getElementById('ehrSearchInput').value.trim().toLowerCase();
    const container = document.getElementById('ehrHistoryContainer');

    if(!input) return;

    const matchedPatients = patients.filter(p => p.name.toLowerCase().includes(input) || p.patientId.toLowerCase().includes(input) || p.phone.includes(input));

    if(matchedPatients.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500">No matching EHR patient histories found.</p>`;
        return;
    }

    container.innerHTML = matchedPatients.map(p => {
        const pAppts = appointments.filter(a => a.patientId === p.patientId);
        const pLedgers = ledgers.filter(l => l.patientId === p.patientId);

        return `
            <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div>
                        <span class="text-xs text-red-500 font-mono font-bold">${p.patientId}</span>
                        <h4 class="text-sm font-bold text-white">${p.name} (${p.ageGender || '34 / Male'})</h4>
                        <p class="text-[11px] text-slate-400">Mobile: ${p.phone}</p>
                    </div>
                    <button onclick="openMasterEditModal('${p.patientId}')" class="bg-amber-500 text-slate-950 px-3 py-1 rounded-xl text-xs font-bold">Edit Full Profile</button>
                </div>

                <div class="space-y-1.5 text-xs">
                    <h5 class="font-bold text-slate-300 uppercase">Complete Visit History Timeline (${pAppts.length} Visits):</h5>
                    ${pAppts.map(a => {
                        const l = pLedgers.find(x => x.apptId === a.id) || {};
                        return `
                            <div class="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                                <div class="flex justify-between font-bold text-slate-200">
                                    <span>${a.date} - ${a.reason}</span>
                                    <span class="text-emerald-400">Total Fee: ₹${l.totalCost || 0}</span>
                                </div>
                                <p class="text-[11px] text-slate-400">Doctor: ${a.doctor} | Token: ${a.token || 'TK-01'} | Vitals: BP ${a.bp || '120/80'}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function publicViewReadOnlyPrescription(patientId, rxId) {
    const recs = medicalRecords[patientId] || [];
    const r = recs.find(x => x.id === rxId) || recs[0];
    const patient = patients.find(p => p.patientId === patientId) || { name: "Patient", ageGender: "34 / Male" };

    if(r) {
        document.getElementById('lh_pid').innerText = patientId;
        document.getElementById('lh_pname').innerText = patient.name;
        document.getElementById('lh_age_gender').innerText = patient.ageGender || "34 / Male";
        document.getElementById('lh_date').innerText = r.date;
        document.getElementById('lh_doctor').innerText = r.doctor;
        document.getElementById('lh_notes').value = r.diagnosis;
        document.getElementById('lh_rx').value = r.rx;
        document.getElementById('lh_next_visit').value = r.nextVisit || r.date;

        document.getElementById('odontogramWrapper').classList.add('hidden-section');
        document.getElementById('lh_notes').readOnly = true;
        document.getElementById('lh_rx').readOnly = true;
        document.getElementById('lh_next_visit').readOnly = true;
        document.getElementById('lh_save_btn').classList.add('hidden-section');
        document.getElementById('lh_wa_btn').classList.add('hidden-section');

        document.getElementById('letterheadModal').classList.remove('hidden');
        document.getElementById('letterheadModal').classList.add('flex');
    }
}

function publicViewReadOnlyReceipt(recId) {
    openReceiptModal(recId);
    document.getElementById('rc_edit_btn').classList.add('hidden-section');
}

function handlePublicBooking(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('bk_phone').value.replace(/[^0-9a-zA-Z-]/g, '');
    const name = document.getElementById('bk_name').value;
    const doctor = document.getElementById('bk_doctor').value;
    const date = document.getElementById('bk_date').value;
    const slot = document.getElementById('bk_slot').value;
    const reason = document.getElementById('bk_reason').value;

    let patient = patients.find(p => p.phone === phoneInput || p.patientId.toLowerCase() === phoneInput.toLowerCase());
    if(!patient) {
        patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone: phoneInput, ageGender: "34 / Male" };
        patients.push(patient);
    } else {
        patient.name = name;
    }
    localStorage.setItem('ns_patients', JSON.stringify(patients));

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    const token = "TK-0" + (appointments.length + 1);
    appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone: patient.phone, ageGender: patient.ageGender, doctor, date, slot, status: "PENDING", reason, nextVisit: date, modifiedToday: true, queueStatus: "In Waiting Room" });
    localStorage.setItem('ns_appointments', JSON.stringify(appointments));

    const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
    ledgers.push({ id: recId, apptId, patientId: patient.patientId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0, date });
    localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));

    alert(`Booking Request Submitted! Patient ID: ${patient.patientId} | Token: ${token}. Awaiting Staff Approval.`);
    document.getElementById('bk_existing_badge').classList.add('hidden-section');
    renderPublicTokenQueue();
    updateMetricCards();
    navigateTo('public-home');
}

function openLetterhead(id) {
    activePrescriptionApptId = id;
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        document.getElementById('lh_pid').innerText = appt.patientId;
        document.getElementById('lh_pname').innerText = appt.name;
        document.getElementById('lh_age_gender').innerText = appt.ageGender || "34 / Male";
        document.getElementById('lh_issue').innerText = appt.reason;
        document.getElementById('lh_date').innerText = new Date().toLocaleDateString();
        document.getElementById('lh_doctor').innerText = appt.doctor;
        document.getElementById('lh_next_visit').value = appt.nextVisit || appt.date;

        document.getElementById('odontogramWrapper').classList.remove('hidden-section');
        document.getElementById('lh_notes').readOnly = false;
        document.getElementById('lh_rx').readOnly = false;
        document.getElementById('lh_next_visit').readOnly = false;
        document.getElementById('lh_save_btn').classList.remove('hidden-section');
        document.getElementById('lh_wa_btn').classList.remove('hidden-section');

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
        medicalRecords[appt.patientId].push({ id: "RX-" + Date.now(), date: new Date().toLocaleDateString(), diagnosis: notes, rx: rx, doctor: appt.doctor, nextVisit: nextVisit });

        localStorage.setItem('ns_records', JSON.stringify(medicalRecords));
        appt.nextVisit = nextVisit;
        appt.modifiedToday = true;
        localStorage.setItem('ns_appointments', JSON.stringify(appointments));

        logAction(`Prescription saved for ${appt.patientId}.`);
        alert("Prescription saved & Next visit synced!");
        renderAppointments();
    }
}

function closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.add('hidden');
    document.getElementById('letterheadModal').classList.remove('flex');
}

function openReceiptModal(recId) {
    activeReceiptId = recId;
    const item = ledgers.find(l => l.id === recId) || ledgers[0];
    if(item) {
        document.getElementById('rc_num').innerText = item.id;
        document.getElementById('rc_pid').innerText = item.patientId;
        document.getElementById('rc_pname').innerText = item.patientName;
        document.getElementById('rc_date').innerText = item.date || todayStr;
        document.getElementById('rc_purpose').innerText = item.purpose;
        document.getElementById('rc_total').innerText = `₹${item.totalCost}`;
        document.getElementById('rc_sum_total').innerText = `₹${item.totalCost}`;
        document.getElementById('rc_sum_paid').innerText = `₹${item.paidAmount}`;
        document.getElementById('rc_sum_due').innerText = `₹${item.dueAmount}`;

        if(currentSession) {
            document.getElementById('rc_edit_btn').classList.remove('hidden-section');
        } else {
            document.getElementById('rc_edit_btn').classList.add('hidden-section');
        }

        document.getElementById('receiptModal').classList.remove('hidden');
        document.getElementById('receiptModal').classList.add('flex');
    }
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.add('hidden');
    document.getElementById('receiptModal').classList.remove('flex');
}

function renderLedgers() {
    document.getElementById('tblLedger').innerHTML = ledgers.map(l => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-mono text-red-500">${l.id}<br><span class="text-white font-sans font-bold">${l.patientName} (${l.patientId})</span></td>
            <td class="p-3">${l.purpose}</td>
            <td class="p-3 font-bold text-white">₹${l.totalCost}</td>
            <td class="p-3 text-emerald-400 font-bold">₹${l.paidAmount}</td>
            <td class="p-3 text-amber-400 font-bold">₹${l.dueAmount}</td>
            <td class="p-3 flex gap-1">
                <button onclick="openReceiptModal('${l.id}')" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-xs font-bold">Receipt</button>
                <button onclick="openMasterEditModal('${l.patientId}')" class="bg-amber-500 text-slate-950 px-2 py-1 rounded text-xs font-bold">Edit Charges</button>
                <button onclick="deleteLedgerRecord('${l.id}')" class="bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-xs">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteLedgerRecord(id) {
    if(confirm("Are you sure you want to delete this receipt ledger?")) {
        ledgers = ledgers.filter(l => l.id !== id);
        localStorage.setItem('ns_ledgers', JSON.stringify(ledgers));
        renderLedgers();
        calculateAdminStats();
        updateMetricCards();
        logAction(`Deleted ledger receipt ${id}`);
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
