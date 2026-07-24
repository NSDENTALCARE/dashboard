lucide.createIcons();

// ==========================================================================
// 1. INDEXEDB HIGH-CAPACITY LOCAL STORAGE ENGINE
// ==========================================================================
class ClinicStorageEngine {
    constructor() {
        this.dbName = "NSDentalCareDB";
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("clinic_store")) {
                    db.createObjectStore("clinic_store");
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB initialization error:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    async setItem(key, val) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("clinic_store", "readwrite");
            const store = tx.objectStore("clinic_store");
            const req = store.put(val, key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async getItem(key) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("clinic_store", "readonly");
            const store = tx.objectStore("clinic_store");
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async clear() {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("clinic_store", "readwrite");
            const store = tx.objectStore("clinic_store");
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }
}

const storageEngine = new ClinicStorageEngine();

// ==========================================================================
// 2. GLOBAL CLINIC APPLICATION STATE
// ==========================================================================
let hospitalEmail = "info@nsdentalcare.com";
let doctorEmail = "ayub@nsdentalcare.com";
let doctors = [];
let users = [];
let auditLogs = [];
let galleryPhotos = [];
let allReviews = [];
let patients = [];
let appointments = [];
let labOrders = [];
let medicalRecords = {};
let ledgers = [];

const todayStr = new Date().toISOString().split('T')[0];

let activePrescriptionApptId = null;
let activeReceiptId = null;
let selectedTeeth = [];
let currentSession = null;

let currentCalYear = 2026;
let currentCalMonth = 6;
let selectedCalendarDateStr = todayStr;

// ==========================================================================
// 3. SYSTEM INITIALIZATION & DATA LOADING
// ==========================================================================
async function initApp() {
    await storageEngine.init();
    await loadStateFromIndexedDB();

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
    renderCalendar();
    updateStorageMeter();
}

async function loadStateFromIndexedDB() {
    hospitalEmail = await storageEngine.getItem('ns_hospital_email') || "info@nsdentalcare.com";
    doctorEmail = await storageEngine.getItem('ns_doctor_email') || "ayub@nsdentalcare.com";

    doctors = await storageEngine.getItem('ns_doctors') || [
        { id: "doc1", name: "Dr. Md Salahuddin Ayub", spec: "Cosmetic Dental Surgeon (Regd: A-6705)", phone: "8978883007", fee: 200 },
        { id: "doc2", name: "Dr. Tabassum Samreen", spec: "Cosmetic Dental Surgeon (Regd: A-7133)", phone: "7729025118", fee: 150 }
    ];

    users = await storageEngine.getItem('ns_users') || [
        { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "8978883007", email: "ayub@nsdental.com", password: "123", status: "Approved" },
        { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "7729025118", email: "assistant@nsdental.com", password: "123", status: "Approved" }
    ];

    auditLogs = await storageEngine.getItem('ns_logs') || [{ time: new Date().toLocaleTimeString(), text: "System Initialized with Multi-Mode Payments Engine." }];

    galleryPhotos = await storageEngine.getItem('ns_gallery') || [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80"
    ];

    allReviews = await storageEngine.getItem('ns_reviews') || [
        { author: "Afroze Ali", rating: 5, text: "Great experience at NS Dental Care. Professional staff and reasonable prices." },
        { author: "Mohammed Aslam", rating: 5, text: "Dr. Ayub & Dr. Samreen explain treatment clearly. Painless root canal treatment!" },
        { author: "Syeda Afroz", rating: 5, text: "Hygienic clinic and friendly doctors. Best dental clinic in Edi Bazar." },
        { author: "Mirza Faizan Baig", rating: 5, text: "Very gentle treatment. Got my wisdom tooth extracted without any pain!" },
        { author: "Khaja Moinuddin", rating: 5, text: "Clean environment, expert surgeons, and fair fee structure in Santosh Nagar." }
    ];

    patients = await storageEngine.getItem('ns_patients') || [
        { patientId: "PAT-1001", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male" }
    ];

    appointments = await storageEngine.getItem('ns_appointments') || [
        { id: "NSD-1001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male", doctor: "Dr. Md Salahuddin Ayub", date: todayStr, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: todayStr, modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "135", risk: "Diabetic" }
    ];

    labOrders = await storageEngine.getItem('ns_lab_orders') || [
        { id: "LAB-101", patientId: "PAT-1001", patientName: "Mohammed Ali", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: todayStr, status: "In Lab Production", notes: "A2 Shade Translucent", fileBase64: null }
    ];

    medicalRecords = await storageEngine.getItem('ns_records') || {
        "PAT-1001": [
            { id: "RX-1001", date: todayStr, diagnosis: "Teeth Selected: #14, #15 | Upper Molar Pulpitis", rx: "Tab Amoxicillin 500mg (1-0-1)\nTab Paracetamol 650mg (1-0-1)", doctor: "Dr. Md Salahuddin Ayub", nextVisit: todayStr, xrayBase64: null }
        ]
    };

    ledgers = await storageEngine.getItem('ns_ledgers') || [
        { 
            id: "REC-1001", 
            apptId: "NSD-1001", 
            patientId: "PAT-1001", 
            patientName: "Mohammed Ali", 
            purpose: "Root Canal Treatment", 
            totalCost: 5000, 
            paidAmount: 3000, 
            dueAmount: 2000, 
            lastPaymentMode: "UPI (PhonePe/GPay)", 
            date: todayStr,
            paymentHistory: [
                { amount: 3000, mode: "UPI (PhonePe/GPay)", timestamp: `${todayStr} 10:30 AM` }
            ]
        }
    ];
}

async function updateStorageMeter() {
    const txt = document.getElementById('storage_usage_text');
    const bar = document.getElementById('storage_usage_bar');

    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
        const pct = Math.min(Math.round((estimate.usage / estimate.quota) * 100), 100);

        if (txt) txt.innerText = `${usedMB} MB / ${quotaMB} MB Available (IndexedDB Active)`;
        if (bar) {
            bar.style.width = `${Math.max(pct, 2)}%`;
            bar.className = "h-full rounded-full transition-all bg-emerald-500";
        }
    }
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

// POPULATE ALL DOCTOR DROPDOWNS INCLUDING MASTER EDIT MODAL
function renderDoctorOptions() {
    const opts = doctors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    if(document.getElementById('bk_doctor')) document.getElementById('bk_doctor').innerHTML = opts;
    if(document.getElementById('man_pdoctor')) document.getElementById('man_pdoctor').innerHTML = opts;
    if(document.getElementById('med_doctor')) document.getElementById('med_doctor').innerHTML = opts;
}

// ==========================================================================
// 4. MASTER EDIT & RECORD MODIFICATION
// ==========================================================================
function openMasterEditModal(pid) {
    renderDoctorOptions();

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
    
    const docSelect = document.getElementById('med_doctor');
    if(docSelect) {
        docSelect.value = appt.doctor || doctors[0].name;
    }

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

async function handleMasterEditSubmit(e) {
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

    await storageEngine.setItem('ns_patients', patients);
    await storageEngine.setItem('ns_appointments', appointments);
    await storageEngine.setItem('ns_ledgers', ledgers);

    renderAppointments();
    renderLedgers();
    renderPublicTokenQueue();
    calculateAdminStats();
    updateMetricCards();
    renderCalendar();

    logAction(`Advanced modal edit applied to patient ${pid}`);
    alert("Patient Record Updated via Master Editor!");
    closeMasterEditModal();
}

// ==========================================================================
// 5. RECEIPT GENERATOR & INSTALLMENT COLLECTION
// ==========================================================================
function openReceiptModal(recId) {
    activeReceiptId = recId;
    let item = ledgers.find(l => l.id === recId);

    if(!item) {
        item = ledgers.find(l => l.patientId === recId) || ledgers[0];
    }

    if(item) {
        document.getElementById('rc_num').innerText = item.id;
        document.getElementById('rc_pid').innerText = item.patientId;
        document.getElementById('rc_pname').innerText = item.patientName;
        document.getElementById('rc_date').innerText = item.date || todayStr;
        document.getElementById('rc_mode').innerText = item.lastPaymentMode || "Cash";
        document.getElementById('rc_sum_total').innerText = `₹${item.totalCost.toLocaleString('en-IN')}`;
        document.getElementById('rc_sum_paid').innerText = `₹${item.paidAmount.toLocaleString('en-IN')}`;
        document.getElementById('rc_sum_due').innerText = `₹${item.dueAmount.toLocaleString('en-IN')}`;

        const historyBox = document.getElementById('rc_payment_history_box');
        if(historyBox) {
            if(item.paymentHistory && item.paymentHistory.length > 0) {
                historyBox.innerHTML = item.paymentHistory.map((ph, idx) => `
                    <div class="flex justify-between border-b border-slate-200 pb-0.5">
                        <span>${idx+1}. ${ph.timestamp} (${ph.mode})</span>
                        <strong class="text-emerald-700">₹${ph.amount}</strong>
                    </div>
                `).join('');
            } else {
                historyBox.innerHTML = `<div class="flex justify-between"><span>Full Settlement (${item.lastPaymentMode || 'Cash'})</span><strong class="text-emerald-700">₹${item.paidAmount}</strong></div>`;
            }
        }

        document.getElementById('receiptModal').classList.remove('hidden');
        document.getElementById('receiptModal').classList.add('flex');
    } else {
        alert("Receipt ledger entry not found!");
    }
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.add('hidden');
    document.getElementById('receiptModal').classList.remove('flex');
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

function openAddPaymentModal(recId) {
    const item = ledgers.find(l => l.id === recId);
    if(!item) return;

    document.getElementById('pay_target_recid').value = item.id;
    document.getElementById('pay_rec_badge').innerText = item.id;
    document.getElementById('pay_pname').value = item.patientName;
    document.getElementById('pay_total_disp').innerText = `₹${item.totalCost.toLocaleString('en-IN')}`;
    document.getElementById('pay_due_disp').innerText = `₹${item.dueAmount.toLocaleString('en-IN')}`;
    document.getElementById('pay_amount_input').value = item.dueAmount;
    document.getElementById('pay_timestamp').value = `${todayStr} ${new Date().toLocaleTimeString()}`;

    document.getElementById('addPaymentModal').classList.remove('hidden');
    document.getElementById('addPaymentModal').classList.add('flex');
}

function closeAddPaymentModal() {
    document.getElementById('addPaymentModal').classList.add('hidden');
    document.getElementById('addPaymentModal').classList.remove('flex');
}

async function handleAddPaymentSubmit(e) {
    e.preventDefault();
    const recId = document.getElementById('pay_target_recid').value;
    const item = ledgers.find(l => l.id === recId);

    if(!item) return;

    const newPaymentVal = parseFloat(document.getElementById('pay_amount_input').value) || 0;
    const mode = document.getElementById('pay_mode_select').value;
    const timeStr = document.getElementById('pay_timestamp').value;

    if(newPaymentVal <= 0) {
        alert("Please enter a valid payment amount!");
        return;
    }

    item.paidAmount += newPaymentVal;
    item.dueAmount = Math.max(0, item.totalCost - item.paidAmount);
    item.lastPaymentMode = mode;

    if(!item.paymentHistory) item.paymentHistory = [];
    item.paymentHistory.push({
        amount: newPaymentVal,
        mode: mode,
        timestamp: timeStr
    });

    await storageEngine.setItem('ns_ledgers', ledgers);
    renderLedgers();
    calculateAdminStats();
    updateMetricCards();

    logAction(`Added ₹${newPaymentVal} via ${mode} for Receipt ${recId} (${item.patientName})`);
    alert(`Payment of ₹${newPaymentVal} recorded successfully via ${mode}!`);
    closeAddPaymentModal();
}

function renderLedgers() {
    const tbl = document.getElementById('tblLedger');
    if(!tbl) return;

    tbl.innerHTML = ledgers.map(l => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-mono text-red-500">${l.id}<br><span class="text-white font-sans font-bold">${l.patientName} (${l.patientId})</span></td>
            <td class="p-3">${l.purpose}</td>
            <td class="p-3">
                <span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold block w-fit">${l.lastPaymentMode || 'Cash'}</span>
                <span class="text-[10px] text-slate-400 font-mono">${l.date}</span>
            </td>
            <td class="p-3 font-bold text-white">₹${l.totalCost}</td>
            <td class="p-3 text-emerald-400 font-bold">₹${l.paidAmount}</td>
            <td class="p-3 text-amber-400 font-bold">₹${l.dueAmount}</td>
            <td class="p-3 flex gap-1 flex-wrap">
                <button onclick="openReceiptModal('${l.id}')" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded text-xs font-bold">Receipt</button>
                ${l.dueAmount > 0 ? `<button onclick="openAddPaymentModal('${l.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold shadow">+ Collect Due</button>` : ''}
                <button onclick="openMasterEditModal('${l.patientId}')" class="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-1 rounded text-xs font-bold">Edit</button>
                <button onclick="deleteLedgerRecord('${l.id}')" class="bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-xs">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function deleteLedgerRecord(id) {
    if(confirm("Are you sure you want to delete this receipt ledger?")) {
        ledgers = ledgers.filter(l => l.id !== id);
        await storageEngine.setItem('ns_ledgers', ledgers);
        renderLedgers();
        calculateAdminStats();
        updateMetricCards();
        logAction(`Deleted ledger receipt ${id}`);
    }
}

function calculateAdminStats() {
    let totalRev = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    let totalDue = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.dueAmount) || 0), 0);

    let cashRev = 0, upiRev = 0, cardRev = 0;

    ledgers.forEach(l => {
        if(l.paymentHistory && l.paymentHistory.length > 0) {
            l.paymentHistory.forEach(ph => {
                if(ph.mode.includes('Cash')) cashRev += ph.amount;
                else if(ph.mode.includes('UPI')) upiRev += ph.amount;
                else cardRev += ph.amount;
            });
        } else {
            const m = l.lastPaymentMode || 'Cash';
            if(m.includes('Cash')) cashRev += l.paidAmount;
            else if(m.includes('UPI')) upiRev += l.paidAmount;
            else cardRev += l.paidAmount;
        }
    });

    if(document.getElementById('adm_mode_cash')) document.getElementById('adm_mode_cash').innerText = `₹${cashRev.toLocaleString('en-IN')}`;
    if(document.getElementById('adm_mode_upi')) document.getElementById('adm_mode_upi').innerText = `₹${upiRev.toLocaleString('en-IN')}`;
    if(document.getElementById('adm_mode_card')) document.getElementById('adm_mode_card').innerText = `₹${cardRev.toLocaleString('en-IN')}`;
    if(document.getElementById('adm_stat_due')) document.getElementById('adm_stat_due').innerText = `₹${totalDue.toLocaleString('en-IN')}`;
}

// ==========================================================================
// 6. INTERACTIVE CALENDAR WITH DIRECT PATIENT LINKING & SCHEDULING
// ==========================================================================
function renderCalendar() {
    const grid = document.getElementById('calendarMonthlyGrid');
    const title = document.getElementById('cal_month_title');
    if(!grid) return;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if(title) title.innerText = `${monthNames[currentCalMonth]} ${currentCalYear}`;

    const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();

    let html = '';

    for(let e = 0; e < firstDay; e++) html += `<div class="p-2 border border-slate-900/40 bg-slate-950/20 rounded-xl"></div>`;

    for(let d = 1; d <= daysInMonth; d++) {
        const mStr = (currentCalMonth + 1) < 10 ? '0' + (currentCalMonth + 1) : '' + (currentCalMonth + 1);
        const dStr = d < 10 ? '0' + d : '' + d;
        const fullDateStr = `${currentCalYear}-${mStr}-${dStr}`;

        const dayAppts = appointments.filter(a => a.date === fullDateStr);
        const isToday = fullDateStr === todayStr;
        const isSelected = fullDateStr === selectedCalendarDateStr;

        html += `
            <div onclick="selectCalendarDate('${fullDateStr}')" class="p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between h-20 ${isSelected ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold' : isToday ? 'border-red-500 bg-red-950/40 text-white font-bold' : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'}">
                <div class="flex justify-between items-center text-[10px] font-mono">
                    <span class="${isToday ? 'bg-red-600 text-white px-1.5 py-0.5 rounded font-bold' : ''}">${d}</span>
                    ${dayAppts.length > 0 ? `<span class="bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full text-[9px]">${dayAppts.length}</span>` : ''}
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
    renderSelectedCalendarAgenda();
}

function selectCalendarDate(dateStr) {
    selectedCalendarDateStr = dateStr;
    renderCalendar();
}

function renderSelectedCalendarAgenda() {
    const container = document.getElementById('calendarAgendaList');
    const heading = document.getElementById('cal_selected_date_heading');
    const badge = document.getElementById('cal_selected_count');

    if(!container) return;

    if(heading) heading.innerText = `Visits Scheduled for ${selectedCalendarDateStr}`;

    const dayAppts = appointments.filter(a => a.date === selectedCalendarDateStr);
    if(badge) badge.innerText = `${dayAppts.length} Appointments`;

    if(dayAppts.length === 0) {
        container.innerHTML = `<p class="text-slate-500 italic text-xs">No patient visits scheduled for this date. Click "+ Add/Link Visit on Selected Date" above to add one.</p>`;
    } else {
        container.innerHTML = dayAppts.map(a => `
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-amber-400 font-mono font-bold">${a.token || 'TK-01'}</span>
                        <strong class="text-white">${a.name} (${a.patientId})</strong>
                    </div>
                    <p class="text-slate-400 text-[11px]">Doctor: ${a.doctor} | Purpose: ${a.reason} | Slot: ${a.slot}</p>
                </div>
                <button onclick="openMasterEditModal('${a.patientId}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-xl font-bold text-xs shadow">
                    Modify Record
                </button>
            </div>
        `).join('');
    }
}

function openCalendarQuickAddModal() {
    switchDashTab('manualPatient');
    document.getElementById('man_pdate').value = selectedCalendarDateStr;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeCalendarMonth(delta) {
    currentCalMonth += delta;
    if(currentCalMonth < 0) { currentCalMonth = 11; currentCalYear--; }
    else if(currentCalMonth > 11) { currentCalMonth = 0; currentCalYear++; }
    renderCalendar();
}

// ==========================================================================
// 7. MANUAL PATIENT UPLOADER & RECEPTION OPERATIONS
// ==========================================================================
async function handleManualPatientUpload(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('man_pphone').value.replace(/[^0-9a-zA-Z-]/g, '');
    const name = document.getElementById('man_pname').value;
    const ageGender = document.getElementById('man_page_gender').value;
    const doctor = document.getElementById('man_pdoctor').value;
    const reason = document.getElementById('man_preason').value;
    const rx = document.getElementById('man_prx').value;
    const date = document.getElementById('man_pdate').value;
    const nextVisit = document.getElementById('man_pnext').value || date;

    const totalFee = parseFloat(document.getElementById('man_pfee').value) || 0;
    const paidAmount = parseFloat(document.getElementById('man_ppaid').value) || 0;
    const payMode = document.getElementById('man_pmode').value;

    const bp = document.getElementById('man_vitals_bp').value;
    const sugar = document.getElementById('man_vitals_sugar').value;
    const risk = document.getElementById('man_vitals_risk').value;

    const xrayFileInput = document.getElementById('man_xray_file');

    async function saveRecordWithXray(xrayBase64) {
        let patient = patients.find(p => p.phone === phoneInput || p.patientId.toLowerCase() === phoneInput.toLowerCase());
        if(!patient) {
            patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone: phoneInput, ageGender };
            patients.push(patient);
        } else {
            patient.name = name;
            patient.ageGender = ageGender;
        }
        await storageEngine.setItem('ns_patients', patients);

        const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
        const token = getNextTokenForDate(date);

        appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone: patient.phone, ageGender, doctor, date, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason, nextVisit, modifiedToday: true, queueStatus: "In Waiting Room", bp, sugar, risk });
        await storageEngine.setItem('ns_appointments', appointments);

        if(!medicalRecords[patient.patientId]) medicalRecords[patient.patientId] = [];
        medicalRecords[patient.patientId].push({ id: "RX-" + Date.now(), date, diagnosis: reason, rx, doctor, nextVisit, xrayBase64: xrayBase64 || null });
        await storageEngine.setItem('ns_records', medicalRecords);

        const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
        const dueAmount = Math.max(0, totalFee - paidAmount);

        ledgers.push({ 
            id: recId, 
            apptId, 
            patientId: patient.patientId, 
            patientName: name, 
            purpose: reason, 
            totalCost: totalFee, 
            paidAmount: paidAmount, 
            dueAmount: dueAmount, 
            lastPaymentMode: payMode, 
            date,
            paymentHistory: [
                { amount: paidAmount, mode: payMode, timestamp: `${date} ${new Date().toLocaleTimeString()}` }
            ]
        });
        await storageEngine.setItem('ns_ledgers', ledgers);

        logAction(`Record saved for ${name} (${patient.patientId}) with ${payMode} payment of ₹${paidAmount}`);
        alert(`Patient Visit & Payment Logged! Patient ID: ${patient.patientId} | Token: ${token}`);
        e.target.reset();
        document.getElementById('man_existing_badge').classList.add('hidden-section');
        renderAppointments();
        renderLedgers();
        renderPublicTokenQueue();
        calculateAdminStats();
        updateMetricCards();
        renderCalendar();
    }

    if(xrayFileInput && xrayFileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            await saveRecordWithXray(evt.target.result);
        };
        reader.readAsDataURL(xrayFileInput.files[0]);
    } else {
        await saveRecordWithXray(null);
    }
}

function handleManualTokenAssignSubmit() {
    const pid = document.getElementById('manual_token_pid').value.trim();
    const tokenVal = document.getElementById('manual_token_val').value.trim();

    if(!pid || !tokenVal) {
        alert("Please enter Patient ID/Phone and Token Number!");
        return;
    }

    const appt = appointments.find(a => (a.patientId.toLowerCase() === pid.toLowerCase() || a.phone === pid) && a.date === todayStr) 
              || appointments.find(a => a.patientId.toLowerCase() === pid.toLowerCase() || a.phone === pid);

    if(appt) {
        appt.token = tokenVal;
        appt.modifiedToday = true;
        storageEngine.setItem('ns_appointments', appointments);
        renderAppointments();
        renderPublicTokenQueue();
        updateMetricCards();
        logAction(`Assigned token ${tokenVal} to Patient ${appt.patientId}`);
        alert(`Token ${tokenVal} assigned to ${appt.name} (${appt.patientId})!`);
        document.getElementById('manual_token_pid').value = '';
        document.getElementById('manual_token_val').value = '';
    } else {
        alert("Patient appointment record not found!");
    }
}

// ==========================================================================
// 8. PUBLIC SEARCH, VERIFICATION & EHR LOOKUP
// ==========================================================================
function handleVerifiedPatientSearch(e) {
    e.preventDefault();
    const inputName = document.getElementById('ver_name').value.trim().toLowerCase();
    const inputId = document.getElementById('ver_identifier').value.trim();

    const matchedPatient = patients.find(p => p.name.toLowerCase().includes(inputName) && (p.patientId === inputId || p.phone === inputId));
    const container = document.getElementById('verifiedResultContainer');
    container.classList.remove('hidden-section');

    if(matchedPatient) {
        const appts = appointments.filter(a => a.patientId === matchedPatient.patientId);
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
                                <p class="text-slate-400 text-[11px]">BP: ${a.bp || '120/80'} | Mode: ${l.lastPaymentMode || 'Cash'} | Fee: ₹${l.totalCost || 0} (Paid: ₹${l.paidAmount || 0})</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <h4 class="text-xs font-bold text-amber-400 uppercase">Hospital Receipt Downloads:</h4>
                <div class="space-y-2">
                    ${pLedgers.length > 0 ? pLedgers.map(l => `
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                                <p class="font-bold text-white">${l.id || 'REC-1001'} | Total Fee: ₹${l.totalCost}</p>
                                <p class="text-slate-400 text-[11px]">${l.purpose} | Mode: ${l.lastPaymentMode || 'Cash'} | Paid: ₹${l.paidAmount}</p>
                            </div>
                            <button onclick="openReceiptModal('${l.id}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0">
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

async function handlePublicBooking(e) {
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
    await storageEngine.setItem('ns_patients', patients);

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    const token = getNextTokenForDate(date);

    appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone: patient.phone, ageGender: patient.ageGender, doctor, date, slot, status: "PENDING", reason, nextVisit: date, modifiedToday: true, queueStatus: "In Waiting Room" });
    await storageEngine.setItem('ns_appointments', appointments);

    const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
    ledgers.push({ id: recId, apptId, patientId: patient.patientId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0, lastPaymentMode: "Cash", date });
    await storageEngine.setItem('ns_ledgers', ledgers);

    alert(`Booking Request Submitted! Patient ID: ${patient.patientId} | Token: ${token}. Awaiting Staff Approval.`);
    document.getElementById('bk_existing_badge').classList.add('hidden-section');
    renderPublicTokenQueue();
    updateMetricCards();
    renderCalendar();
    navigateTo('public-home');
}

// ==========================================================================
// 9. PUBLIC NAVIGATION & AUTHENTICATION ROUTINES
// ==========================================================================
function navigateTo(id) {
    document.querySelectorAll('main > section').forEach(el => el.classList.add('hidden-section'));
    document.getElementById(id).classList.remove('hidden-section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    document.getElementById('portalRegForm').classList.add('hidden-section');

    if(tab === 'login') document.getElementById('portalLoginForm').classList.remove('hidden-section');
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

async function handleStaffRegistration(e) {
    e.preventDefault();
    const role = document.getElementById('regRole').value;
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    users.push({ id: Date.now(), name, role, phone, email, password, status: "Pending" });
    await storageEngine.setItem('ns_users', users);

    logAction(`New ${role} registration request for ${name}.`);
    alert("Registration request submitted!");
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
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;

    document.getElementById('welc_role_badge').innerText = `AUTHENTICATED ROLE: ${currentSession.role.toUpperCase()}`;
    document.getElementById('welc_staff_name').innerText = `Welcome, ${currentSession.name}`;
    document.getElementById('welc_staff_contact').innerText = `Phone: ${currentSession.phone || 'Registered Staff'} | Authorized Access Active`;
    document.getElementById('welc_session_token').innerText = `Session Token: SEC-${Date.now().toString().slice(-6)}`;

    if(currentSession.role === 'admin') {
        document.getElementById('tabBtnAdminMaster').classList.remove('hidden-section');
        renderAdminUserTable();
        renderAuditLogs();
        calculateAdminStats();
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    switchDashTab('welcome');

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
    navigateTo('public-home');
}

function switchDashTab(tab) {
    document.querySelectorAll('.sidebar-menu-btn').forEach(btn => btn.classList.remove('active-tab'));

    document.getElementById('viewWelcome').classList.add('hidden-section');
    document.getElementById('viewAppts').classList.add('hidden-section');
    document.getElementById('viewManualPatient').classList.add('hidden-section');
    document.getElementById('viewLabTracker').classList.add('hidden-section');
    document.getElementById('viewCalendar').classList.add('hidden-section');
    document.getElementById('viewEHR').classList.add('hidden-section');
    document.getElementById('viewLedger').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');
    document.getElementById('viewAdminMaster').classList.add('hidden-section');

    if(tab === 'welcome') { document.getElementById('viewWelcome').classList.remove('hidden-section'); document.getElementById('tabBtnWelcome').classList.add('active-tab'); }
    if(tab === 'appts') { document.getElementById('viewAppts').classList.remove('hidden-section'); document.getElementById('tabBtnAppts').classList.add('active-tab'); }
    if(tab === 'manualPatient') { document.getElementById('viewManualPatient').classList.remove('hidden-section'); document.getElementById('tabBtnManualPatient').classList.add('active-tab'); }
    if(tab === 'labTracker') { document.getElementById('viewLabTracker').classList.remove('hidden-section'); document.getElementById('tabBtnLabTracker').classList.add('active-tab'); }
    if(tab === 'calendar') { document.getElementById('viewCalendar').classList.remove('hidden-section'); document.getElementById('tabBtnCalendar').classList.add('active-tab'); }
    if(tab === 'ehr') { document.getElementById('viewEHR').classList.remove('hidden-section'); document.getElementById('tabBtnEHR').classList.add('active-tab'); }
    if(tab === 'ledger') { document.getElementById('viewLedger').classList.remove('hidden-section'); document.getElementById('tabBtnLedger').classList.add('active-tab'); }
    if(tab === 'approvals') { document.getElementById('viewApprovals').classList.remove('hidden-section'); document.getElementById('tabBtnApprovals').classList.add('active-tab'); }
    if(tab === 'adminMaster') { document.getElementById('viewAdminMaster').classList.remove('hidden-section'); document.getElementById('tabBtnAdminMaster').classList.add('active-tab'); }
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

// ==========================================================================
// 10. ADMIN LAYOUT TOGGLER & PERMISSION MATRIX
// ==========================================================================
function toggleAdminPageLayout(sectionId, isVisible) {
    const targetEl = document.getElementById(sectionId);
    if(targetEl) {
        if(isVisible) targetEl.classList.remove('hidden-section');
        else targetEl.classList.add('hidden-section');
        logAction(`Admin toggled ${sectionId}: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
    }
}

function togglePerm(key) {
    const current = localStorage.getItem(`ns_${key}`) === 'true';
    localStorage.setItem(`ns_${key}`, (!current).toString());
    logAction(`Updated permission flag: ${key} = ${!current}`);
}

// ==========================================================================
// 11. CLINICAL APPOINTMENTS, LAB ORDERS & PRESCRIPTION KITS
// ==========================================================================
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
                <button onclick="openMasterEditModal('${a.patientId}')" class="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">Edit</button>
                <button onclick="openLetterhead('${a.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px]">Rx</button>
                <button onclick="sendAppointmentWhatsAppLinks('${a.id}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">WhatsApp</button>
                ${(currentSession.role === 'admin' || currentSession.role === 'doctor') ? `<button onclick="deletePatientRecordATOZ('${a.patientId}')" class="bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-[10px]">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function renderLabOrders() {
    const tbl = document.getElementById('tblLabOrders');
    if(tbl) {
        tbl.innerHTML = labOrders.map(o => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${o.id}<br><span class="text-amber-400 font-normal text-[11px]">${o.patientName} (${o.patientId})</span></td>
                <td class="p-2.5 font-mono text-amber-400 font-bold">${o.tooth}</td>
                <td class="p-2.5 font-bold">${o.material}</td>
                <td class="p-2.5">${o.labName}</td>
                <td class="p-2.5">
                    ${o.fileBase64 ? `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded">Scan Attached</span>` : `<span class="text-slate-500 text-[10px]">No Scan</span>`}
                </td>
                <td class="p-2.5"><span class="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-[10px] font-bold border border-sky-500/30">${o.status}</span></td>
                <td class="p-2.5">
                    <button onclick="editLabOrderDetails('${o.id}')" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1 rounded text-[10px] shadow">Edit Order</button>
                </td>
            </tr>
        `).join('');
    }
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

        document.getElementById('letterheadModal').classList.remove('hidden');
        document.getElementById('letterheadModal').classList.add('flex');
    }
}

function closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.add('hidden');
    document.getElementById('letterheadModal').classList.remove('flex');
}

async function savePrescriptionAndSync() {
    const appt = appointments.find(a => a.id === activePrescriptionApptId);
    if(appt) {
        const notes = document.getElementById('lh_notes').value;
        const rx = document.getElementById('lh_rx').value;
        const nextVisit = document.getElementById('lh_next_visit').value;

        if(!medicalRecords[appt.patientId]) medicalRecords[appt.patientId] = [];
        medicalRecords[appt.patientId].push({ id: "RX-" + Date.now(), date: new Date().toLocaleDateString(), diagnosis: notes, rx: rx, doctor: appt.doctor, nextVisit: nextVisit });

        await storageEngine.setItem('ns_records', medicalRecords);
        appt.nextVisit = nextVisit;
        appt.modifiedToday = true;
        await storageEngine.setItem('ns_appointments', appointments);

        logAction(`Prescription saved for ${appt.patientId}.`);
        alert("Prescription saved & Next visit synced!");
        renderAppointments();
    }
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

function applyRxPreset(type) {
    const rxArea = document.getElementById('lh_rx');
    if(!rxArea) return;

    if(type === 'rct') {
        rxArea.value = "1. Tab Amoxicillin 500mg | 1-0-1 | After Food (5 Days)\n2. Tab Zero-P (Aceclofenac + Paracetamol) | 1-0-1 | After Food (3 Days)\n3. Cap Pantoprazole 40mg | 1-0-0 | Before Breakfast (5 Days)";
    } else if(type === 'extraction') {
        rxArea.value = "1. Tab Augmentin 625mg | 1-0-1 | After Food (5 Days)\n2. Tab Ketorol DT | 1-0-1 | Dissolve in water (3 Days)\n3. Chlorhexidine Mouthwash | Rinse 2 times daily";
    } else if(type === 'scaling') {
        rxArea.value = "1. Gum Paint (Tannic Acid) | Apply on gums twice daily\n2. Chlorhexidine 0.2% Mouthwash | Rinse 10ml twice daily for 7 days";
    }
    logAction(`Doctor applied Rx Speed-Dial preset: ${type.toUpperCase()}`);
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

    document.getElementById('lh_notes').value = `Teeth Selected: #${selectedTeeth.join(', #')} | Procedure Planned: `;
}

// ==========================================================================
// 12. PUBLIC RENDERERS, REVIEWS & GALLERY
// ==========================================================================
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

function renderGallery() {
    const publicGrid = document.getElementById('publicGalleryGrid');
    if(publicGrid) {
        publicGrid.innerHTML = galleryPhotos.map((url) => `
            <div class="relative overflow-hidden rounded-xl border border-slate-800 h-28 sm:h-32 bg-slate-950">
                <img src="${url}" class="w-full h-full object-cover">
            </div>
        `).join('');
    }
}

async function uploadClinicPhotoFile(e) {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
        galleryPhotos.unshift(evt.target.result);
        await storageEngine.setItem('ns_gallery', galleryPhotos);
        renderGallery();
        logAction("Staff uploaded photo into gallery.");
        alert("Photo Uploaded!");
    };
    reader.readAsDataURL(file);
}

function initShufflingReviews10Sec() {
    const container = document.getElementById('shufflingReviewsContainer');
    let currentIndex = 0;

    function shuffle10() {
        if(!container || allReviews.length === 0) return;
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

// ==========================================================================
// 13. ADMIN USER MANAGEMENT & CREDENTIAL OVERRIDES
// ==========================================================================
function renderAdminUserTable() {
    const tbl = document.getElementById('adminUserManagementTable');
    if(tbl) {
        tbl.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-800/50">
                <td class="p-2.5 font-bold text-white">${u.name}</td>
                <td class="p-2.5 uppercase font-bold text-red-400">${u.role}</td>
                <td class="p-2.5 font-mono text-slate-300">${u.phone}</td>
                <td class="p-2.5 font-mono text-amber-400 font-bold">${u.password}</td>
                <td class="p-2.5"><span class="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">${u.status}</span></td>
                <td class="p-2.5">
                    <button onclick="adminEditFullUserProfile(${u.id})" class="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">Edit Credentials</button>
                </td>
            </tr>
        `).join('');
    }
}

async function adminEditFullUserProfile(userId) {
    const u = users.find(x => x.id === userId);
    if(u) {
        const name = prompt("Edit Full Name:", u.name);
        const phone = prompt("Edit Mobile #:", u.phone);
        const pwd = prompt("Edit Password (PLAIN TEXT):", u.password);

        if(name && phone && pwd) {
            u.name = name;
            u.phone = phone;
            u.password = pwd;

            await storageEngine.setItem('ns_users', users);
            renderAdminUserTable();
            logAction(`Admin updated credentials for ${u.name}`);
            alert("Staff account credentials updated!");
        }
    }
}

function renderApprovals() {
    const tbl = document.getElementById('tblApprovals');
    const pending = users.filter(u => u.status === 'Pending');

    if(tbl) {
        if(pending.length === 0) {
            tbl.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-500">No pending staff registrations.</td></tr>`;
        } else {
            tbl.innerHTML = pending.map(u => `
                <tr class="hover:bg-slate-800/50">
                    <td class="p-3 font-bold text-white">${u.name}</td>
                    <td class="p-3 uppercase font-bold text-amber-400">${u.role}</td>
                    <td class="p-3 font-mono text-slate-300">${u.phone}<br><span class="text-[10px] text-slate-500">${u.email}</span></td>
                    <td class="p-3 flex gap-2">
                        <button onclick="approveUserRegistration(${u.id})" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-xs shadow">Approve</button>
                        <button onclick="rejectUserRegistration(${u.id})" class="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded text-xs">Reject</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

async function approveUserRegistration(id) {
    const u = users.find(x => x.id === id);
    if(u) {
        u.status = "Approved";
        await storageEngine.setItem('ns_users', users);
        renderApprovals();
        renderAdminUserTable();
        logAction(`Approved staff registration for ${u.name}`);
        alert(`User ${u.name} approved!`);
    }
}

async function rejectUserRegistration(id) {
    if(confirm("Reject this staff account request?")) {
        users = users.filter(u => u.id !== id);
        await storageEngine.setItem('ns_users', users);
        renderApprovals();
        logAction(`Rejected staff registration #${id}`);
    }
}

// ==========================================================================
// 14. AUDIT TRAIL, DISPATCHERS & DATA BACKUPS
// ==========================================================================
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

function getNextTokenForDate(targetDate) {
    const existing = appointments.filter(a => a.date === targetDate);
    const count = existing.length + 1;
    return "TK-" + (count < 10 ? "0" + count : count);
}

async function logAction(msg) {
    auditLogs.unshift({ time: new Date().toLocaleTimeString(), text: msg });
    await storageEngine.setItem('ns_logs', auditLogs);
    renderAuditLogs();
}

function renderAuditLogs() {
    const box = document.getElementById('adminAuditLogs');
    if(box) box.innerHTML = auditLogs.map(l => `<div>[${l.time}] ${l.text}</div>`).join('');
}

async function checkPublicTicker() {
    const textEl = document.getElementById('disp_marquee_text');
    const saved = await storageEngine.getItem('ns_ticker_text');
    if(textEl) textEl.innerText = saved || "Dental consultation fees and appointment slots updated with effect from 1 July 2026. Prior booking mandatory for evening Sunday procedures.";
}

async function updateLiveTickerAdmin() {
    const inputEl = document.getElementById('adm_ticker_input');
    if(inputEl && inputEl.value) {
        await storageEngine.setItem('ns_ticker_text', inputEl.value);
        checkPublicTicker();
        logAction(`Admin updated marquee ticker: "${inputEl.value}"`);
        alert("Top Ticker Updated!");
    }
}

function syncAdminEmailInputs() {
    const elHdr = document.getElementById('disp_hdr_email');
    if(elHdr) elHdr.innerText = hospitalEmail;
}

function triggerWhatsAppDoctorBriefing() {
    const todays = appointments.filter(a => a.date === todayStr);
    let msg = `*N.S. DENTAL CARE - DAILY MORNING BRIEFING (${todayStr})*%0A%0ATotal Scheduled Patients: ${todays.length}%0A%0A`;
    todays.forEach((a, i) => {
        msg += `*${i+1}. Token ${a.token || 'TK-01'}* - ${a.name} (${a.patientId})%0A   Purpose: ${a.reason} | Slot: ${a.slot}%0A   BP: ${a.bp || '120/80'} | Risk: ${a.risk || 'None'}%0A%0A`;
    });
    window.open(`https://wa.me/918978883007?text=${msg}`, '_blank');
}

function sendDoctorDailyBriefingEmail() {
    const todays = appointments.filter(a => a.date === todayStr);
    let subject = `N.S. DENTAL CARE - Daily Schedule Briefing (${todayStr})`;
    let body = `N.S. DENTAL CARE DAILY CLINICAL SUMMARY (${todayStr})\n\nTotal Patients Scheduled: ${todays.length}\n\n`;

    todays.forEach((a, i) => {
        body += `${i+1}. Token ${a.token || 'TK-01'} | ${a.name} (${a.patientId})\n   Slot: ${a.slot} | Doctor: ${a.doctor}\n   Issue: ${a.reason}\n\n`;
    });

    window.location.href = `mailto:${doctorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    logAction(`Daily briefing email sent to ${doctorEmail}`);
}

function downloadExcelBackup() {
    let csv = "Visit Date,Patient ID,Patient Full Name,Mobile Phone,Doctor,Purpose,Total Fee (INR),Paid (INR),Due (INR)\n";
    appointments.forEach(a => {
        const l = ledgers.find(x => x.apptId === a.id) || {};
        csv += `"${a.date}","${a.patientId}","${a.name}","${a.phone}","${a.doctor}","${a.reason}",${l.totalCost || 0},${l.paidAmount || 0},${l.dueAmount || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NS_Dental_Care_Backup_${todayStr}.csv`;
    a.click();
}

function downloadJSONBackup() {
    const backupData = { patients, appointments, medicalRecords, ledgers, labOrders, users, galleryPhotos, allReviews, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NS_Dental_Care_Backup_${todayStr}.json`;
    a.click();
}

async function resetDailyTokens() {
    if(confirm("Reset token numbers for today's queue starting from TK-01?")) {
        let todays = appointments.filter(a => a.date === todayStr);
        todays.forEach((a, index) => {
            a.token = "TK-0" + (index + 1);
            a.queueStatus = "In Waiting Room";
            a.modifiedToday = true;
        });
        await storageEngine.setItem('ns_appointments', appointments);
        renderAppointments();
        renderPublicTokenQueue();
        updateMetricCards();
        alert("Tokens reset to TK-01!");
    }
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
    logAction(`Verified day-wise audit summary for ${todayStr}`);
    alert(`Day Summary Locked & Verified!`);
    closeDayWiseAuditModal();
}

function sendAppointmentWhatsAppLinks(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if(appt) {
        const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
        const pageUrl = window.location.href.split('#')[0];
        const msg = `*N.S. DENTAL CARE - PATIENT PORTAL ACCESS*%0A%0ADear *${appt.name}*,%0AYour appointment/record has been updated!%0A%0A*Patient ID:* ${appt.patientId}%0A*Token #:* ${appt.token || 'TK-01'}%0A*Doctor:* ${appt.doctor}%0A*Next Visit:* ${appt.nextVisit || appt.date}%0A%0A*Download Prescription & Receipt:*%0A${pageUrl}`;
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    }
}

async function deletePatientRecordATOZ(pid) {
    if(confirm(`PERMANENTLY DELETE all patient data, medical records, and receipts for ${pid}?`)) {
        patients = patients.filter(p => p.patientId !== pid);
        appointments = appointments.filter(a => a.patientId !== pid);
        ledgers = ledgers.filter(l => l.patientId !== pid);
        delete medicalRecords[pid];

        await storageEngine.setItem('ns_patients', patients);
        await storageEngine.setItem('ns_appointments', appointments);
        await storageEngine.setItem('ns_ledgers', ledgers);
        await storageEngine.setItem('ns_records', medicalRecords);

        renderAppointments();
        renderLedgers();
        calculateAdminStats();
        updateMetricCards();
        renderCalendar();
        logAction(`Deleted patient ${pid}`);
        alert("Patient purged permanently!");
    }
}

async function openNewLabOrderModal() {
    const pid = prompt("Enter Patient ID (e.g. PAT-1001):", "PAT-1001");
    const tooth = prompt("Enter Tooth # / Quadrant (e.g. #14 Upper Molar):", "#14 Upper Molar");
    const material = prompt("Enter Material (Zirconia, Ceramic, PFM):", "Zirconia Crown");
    const labName = prompt("Lab Partner Name:", "Apex Dental Lab");

    if(pid && tooth) {
        const patient = patients.find(p => p.patientId === pid) || { name: "Patient " + pid };
        labOrders.push({ id: "LAB-" + Date.now(), patientId: pid, patientName: patient.name, tooth, material, labName, date: todayStr, status: "Impression Taken", notes: "Standard Order", fileBase64: null });
        await storageEngine.setItem('ns_lab_orders', labOrders);
        renderLabOrders();
        updateMetricCards();
        logAction(`Lab order created for ${pid}`);
    }
}

function editLabOrderDetails(orderId) {
    const order = labOrders.find(o => o.id === orderId);
    if(!order) return;

    document.getElementById('lab_edit_target_id').value = order.id;
    document.getElementById('lab_edit_id_badge').innerText = order.id;
    document.getElementById('lab_edit_pname').value = order.patientName;
    document.getElementById('lab_edit_tooth').value = order.tooth;
    document.getElementById('lab_edit_material').value = order.material;
    document.getElementById('lab_edit_labname').value = order.labName;
    document.getElementById('lab_edit_date').value = order.date;
    document.getElementById('lab_edit_status').value = order.status;
    document.getElementById('lab_edit_notes').value = order.notes || '';

    const fileBadge = document.getElementById('lab_edit_current_file_badge');
    if(order.fileBase64) {
        fileBadge.innerText = "✓ Custom Scan File Attached";
    } else {
        fileBadge.innerText = "No impression file uploaded yet.";
    }

    document.getElementById('editLabOrderModal').classList.remove('hidden');
    document.getElementById('editLabOrderModal').classList.add('flex');
}

function closeEditLabOrderModal() {
    document.getElementById('editLabOrderModal').classList.add('hidden');
    document.getElementById('editLabOrderModal').classList.remove('flex');
}

async function handleSaveLabOrderEdit(e) {
    e.preventDefault();
    const orderId = document.getElementById('lab_edit_target_id').value;
    const order = labOrders.find(o => o.id === orderId);

    if(!order) return;

    order.patientName = document.getElementById('lab_edit_pname').value;
    order.tooth = document.getElementById('lab_edit_tooth').value;
    order.material = document.getElementById('lab_edit_material').value;
    order.labName = document.getElementById('lab_edit_labname').value;
    order.date = document.getElementById('lab_edit_date').value;
    order.status = document.getElementById('lab_edit_status').value;
    order.notes = document.getElementById('lab_edit_notes').value;

    const fileInput = document.getElementById('lab_edit_file_input');

    async function finishSave() {
        await storageEngine.setItem('ns_lab_orders', labOrders);
        renderLabOrders();
        updateMetricCards();
        logAction(`Updated lab order details and impression file for ${order.id}`);
        alert(`Lab Order ${order.id} Updated Successfully!`);
        closeEditLabOrderModal();
    }

    if(fileInput && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            order.fileBase64 = evt.target.result;
            await finishSave();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        await finishSave();
    }
}

async function adminFixMissingReceipts() {
    let created = 0;
    appointments.forEach(a => {
        let l = ledgers.find(x => x.apptId === a.id);
        if(!l) {
            ledgers.push({ id: "REC-" + Math.floor(1000 + Math.random()*9000), apptId: a.id, patientId: a.patientId, patientName: a.name, purpose: a.reason || "Consultation", totalCost: 200, paidAmount: 200, dueAmount: 0, lastPaymentMode: "Cash", date: a.date });
            created++;
        }
    });
    await storageEngine.setItem('ns_ledgers', ledgers);
    renderLedgers();
    calculateAdminStats();
    alert(`Repaired ${created} receipts.`);
}

async function adminMergeDuplicatePatients() {
    let uniquePatients = [];
    let phoneMap = new Set();
    patients.forEach(p => {
        if(!phoneMap.has(p.phone)) {
            phoneMap.add(p.phone);
            uniquePatients.push(p);
        }
    });
    patients = uniquePatients;
    await storageEngine.setItem('ns_patients', patients);
    alert("Duplicates merged!");
}

async function adminPurgeBase64Xrays() {
    if(confirm("Purge stored X-Ray binaries?")) {
        Object.keys(medicalRecords).forEach(pid => {
            medicalRecords[pid].forEach(r => { delete r.xrayBase64; });
        });
        await storageEngine.setItem('ns_records', medicalRecords);
        alert("X-Ray binaries cleared.");
    }
}

function adminForceLogoutAllSessions() {
    currentSession = null;
    logout();
    alert("All sessions locked!");
}

function calculateRevenueSplit() {
    const docPct = parseFloat(document.getElementById('adm_split_doc').value) || 40;
    const totalRev = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    const docShare = (totalRev * docPct) / 100;
    document.getElementById('adm_calc_doc_share').innerText = `₹${docShare.toLocaleString('en-IN')} (${docPct}%)`;
}

async function clearAuditLogs() {
    if(confirm("Clear audit logs?")) {
        auditLogs = [];
        await storageEngine.setItem('ns_logs', auditLogs);
        renderAuditLogs();
    }
}

async function resetSystemData() {
    if(confirm("Permanently erase all stored database records?")) {
        await storageEngine.clear();
        location.reload();
    }
}

// INITIALIZE APPLICATION
initApp();
