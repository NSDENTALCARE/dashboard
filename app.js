lucide.createIcons();

// ==========================================================================
// CORE UI ROUTING, STRICT KPIS & REAL-TIME AUTO-UPDATE APPLICATION CONTROLLER
// ==========================================================================

let apptSortCriterion = 'token'; 
let isVoiceDictating = false;
let speechRecognitionObj = null;

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
    fetchDeviceAndIPDetails();
    updateStorageMeter();
    checkSaved24hSession();

    // AUTO-POLLING HEARTBEAT (3 SECONDS)
    setInterval(async () => {
        const freshDateStr = new Date().toISOString().split('T')[0];
        if (freshDateStr !== currentLiveDateStr) {
            currentLiveDateStr = freshDateStr;
            updateMetricCards();
            renderPublicTokenQueue();
        }
        await loadStateFromIndexedDB();
        refreshAllUIViews();
    }, 3000);
}

function refreshAllUIViews() {
    renderAppointments();
    renderPublicTokenQueue();
    renderLedgers();
    renderLabOrders();
    renderCalendar();
    renderTreatmentPlans();
    renderInventoryTable();
    renderExpensesTable();
    renderCampaignTargetList();
    updateMetricCards();
    calculateAdminStats();
    renderAssistantPunchStatusUI();
    renderAssistantPunchTable();
    renderAssistantWorkActivityLog();
    renderApprovals();
    if (currentSession && currentSession.role === 'admin') {
        renderAdminUsers();
        renderAuditLogs();
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

function checkSaved24hSession() {
    const savedToken = localStorage.getItem("ns_saved_session_24h");
    if (savedToken) {
        try {
            const data = JSON.parse(savedToken);
            const now = Date.now();
            if (data.expiry && now < data.expiry && data.user) {
                currentSession = data.user;
                logAction(`Restored 24-hour saved session for ${currentSession.name}`);
                openDashboard();
            } else {
                localStorage.removeItem("ns_saved_session_24h");
            }
        } catch (e) {
            localStorage.removeItem("ns_saved_session_24h");
        }
    }
}

function changeApptSorting(criterion) {
    apptSortCriterion = criterion;
    renderAppointments();
    logAction(`Appointment roster sorted by: ${criterion.toUpperCase()}`);
}

function updateMetricCards() {
    currentLiveDateStr = new Date().toISOString().split('T')[0];

    const todayAppts = appointments.filter(a => a.date === currentLiveDateStr && a.status !== 'DECLINED');
    const activeQueue = todayAppts.filter(a => a.queueStatus === 'In Waiting Room' || a.queueStatus === 'In Consultation');
    
    const todayLedgers = ledgers.filter(l => l.date === currentLiveDateStr);
    let todayRev = 0;

    todayLedgers.forEach(l => {
        if(l.paymentHistory && l.paymentHistory.length > 0) {
            l.paymentHistory.forEach(ph => {
                if(ph.timestamp && ph.timestamp.startsWith(currentLiveDateStr)) {
                    todayRev += (parseFloat(ph.amount) || 0);
                }
            });
        } else {
            todayRev += (parseFloat(l.paidAmount) || 0);
        }
    });

    const todayExp = clinicExpenses.filter(e => e.date === currentLiveDateStr).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const estProfit = todayRev - todayExp;

    const lowStockItems = inventoryItems.filter(i => i.stock <= i.minThreshold).length;
    const labPending = labOrders.filter(o => o.status !== 'Delivered & Fitted').length;
    const riskCount = todayAppts.filter(a => a.risk && a.risk !== 'None').length;

    const lbl1 = document.getElementById('kpi_date_label_1');
    const lbl2 = document.getElementById('kpi_date_label_2');
    if(lbl1) lbl1.innerText = `Visits Today (${currentLiveDateStr})`;
    if(lbl2) lbl2.innerText = `Today Collections (${currentLiveDateStr})`;

    if(document.getElementById('card_stat_visits')) document.getElementById('card_stat_visits').innerText = todayAppts.length;
    if(document.getElementById('card_stat_queue')) document.getElementById('card_stat_queue').innerText = activeQueue.length;
    if(document.getElementById('card_stat_revenue')) document.getElementById('card_stat_revenue').innerText = `₹${todayRev.toLocaleString('en-IN')}`;
    if(document.getElementById('card_stat_profit')) document.getElementById('card_stat_profit').innerText = `₹${estProfit.toLocaleString('en-IN')}`;
    if(document.getElementById('card_stat_lab')) document.getElementById('card_stat_lab').innerText = `${labPending} Lab / ${lowStockItems} Stock`;
    if(document.getElementById('card_stat_risk')) document.getElementById('card_stat_risk').innerText = riskCount;
}

function handleUniversalStaffSearch() {
    const input = document.getElementById('staffUniversalSearchInput').value.trim().toLowerCase();
    const container = document.getElementById('staffUniversalSearchResult');
    if(!container) return;

    if(!input) {
        container.classList.add('hidden-section');
        return;
    }

    const matchedPatients = patients.filter(p => p.name.toLowerCase().includes(input) || p.patientId.toLowerCase().includes(input) || p.phone.includes(input));

    container.classList.remove('hidden-section');

    if(matchedPatients.length === 0) {
        container.innerHTML = `<p class="p-3 text-slate-400 text-xs italic">No matching patient record found for "${input}".</p>`;
        return;
    }

    container.innerHTML = matchedPatients.map(p => {
        const appt = appointments.find(a => a.patientId === p.patientId) || {};
        const ledger = ledgers.find(l => l.patientId === p.patientId) || {};
        return `
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center text-xs gap-2">
                <div>
                    <span class="text-amber-400 font-mono font-bold">${p.patientId}</span>
                    <strong class="text-white ml-2">${p.name}</strong>
                    <span class="text-slate-400 ml-2 font-mono">📞 ${p.phone}</span>
                    <p class="text-[11px] text-slate-400">Doctor: ${appt.doctor || 'Unassigned'} | Reason: ${appt.reason || 'N/A'} | Slot: ${appt.slot || 'N/A'}</p>
                </div>
                <div class="flex gap-1.5 flex-wrap">
                    <button onclick="openMasterEditModal('${p.patientId}')" class="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg font-bold">Edit Record</button>
                    <button onclick="openDigitalConsentModal('${p.patientId}')" class="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg">Consent Sign</button>
                    <button onclick="openPhotoComparisonModal('${p.patientId}')" class="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg">Before/After</button>
                    ${appt.id ? `<button onclick="openLetterhead('${appt.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg">Rx</button>` : ''}
                    ${ledger.id ? `<button onclick="openReceiptModal('${ledger.id}')" class="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg">Receipt</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function fetchDeviceAndIPDetails() {
    const ua = navigator.userAgent;
    let deviceName = "Desktop Browser";
    let osName = "Windows OS";

    if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
        deviceName = /iPhone/i.test(ua) ? "Apple iPhone" : /iPad/i.test(ua) ? "Apple iPad" : "Android Mobile Device";
    } else if (/Macintosh/i.test(ua)) {
        deviceName = "Apple Mac Workstation";
    }

    if (/Windows/i.test(ua)) osName = "Windows OS";
    else if (/Mac OS/i.test(ua)) osName = "macOS";
    else if (/Android/i.test(ua)) osName = "Android OS";
    else if (/iOS|iPhone|iPad/i.test(ua)) osName = "iOS";

    const dispDevice = document.getElementById('disp_device_name');
    const dispOS = document.getElementById('disp_device_os');
    const dispIP = document.getElementById('disp_device_ip');

    if(dispDevice) dispDevice.innerText = deviceName;
    if(dispOS) dispOS.innerText = osName;

    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        if(dispIP) dispIP.innerText = data.ip || "127.0.0.1 (Local)";
    } catch(err) {
        if(dispIP) dispIP.innerText = "Active Network Client";
    }
}

function renderDoctorOptions() {
    const opts = doctors.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    if(document.getElementById('bk_doctor')) document.getElementById('bk_doctor').innerHTML = opts;
    if(document.getElementById('man_pdoctor')) document.getElementById('man_pdoctor').innerHTML = opts;
    if(document.getElementById('med_doctor')) document.getElementById('med_doctor').innerHTML = opts;
}

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
    document.getElementById('med_next_visit').value = appt.nextVisit || currentLiveDateStr;
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

    if(currentSession && currentSession.role === 'assistant') {
        logAssistantWorkActivity(`Modified Full Master Profile for ${p.name} (${pid})`);
    }

    refreshAllUIViews();
    logAction(`Advanced modal edit applied to patient ${pid}`);
    alert("Patient Record Updated via Master Editor!");
    closeMasterEditModal();
}

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
        document.getElementById('rc_date').innerText = item.date || currentLiveDateStr;
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

        const editBtn = document.getElementById('rc_edit_btn');
        if (currentSession) {
            editBtn.classList.remove('hidden-section');
        } else {
            editBtn.classList.add('hidden-section');
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
    document.getElementById('pay_timestamp').value = `${currentLiveDateStr} ${new Date().toLocaleTimeString()}`;

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
    if(currentSession && currentSession.role === 'assistant') {
        logAssistantWorkActivity(`Collected ₹${newPaymentVal} via ${mode} for Receipt ${recId} (${item.patientName})`);
    }
    refreshAllUIViews();

    logAction(`Added ₹${newPaymentVal} via ${mode} for Receipt ${recId} (${item.patientName})`);
    alert(`Payment of ₹${newPaymentVal} recorded successfully via ${mode}!`);
    closeAddPaymentModal();
}

function renderLedgers() {
    const tbl = document.getElementById('tblLedger');
    if(!tbl) return;

    if (ledgers.length === 0) {
        tbl.innerHTML = `<tr><td colspan="8" class="p-3 text-center text-slate-500">No ledger entries found.</td></tr>`;
        return;
    }

    tbl.innerHTML = ledgers.map((l, idx) => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-3 font-mono font-black text-amber-400 text-center">${idx + 1}</td>
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
                <button onclick="deleteLedgerRecord('${l.id}')" class="bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-xs font-bold">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function deleteLedgerRecord(id) {
    if(confirm("Are you sure you want to delete this receipt ledger entry?")) {
        ledgers = ledgers.filter(l => l.id !== id);
        await storageEngine.setItem('ns_ledgers', ledgers);
        refreshAllUIViews();
        logAction(`Deleted ledger entry ${id}`);
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

        const dayAppts = appointments.filter(a => a.date === fullDateStr && a.status !== 'DECLINED');
        const isToday = fullDateStr === currentLiveDateStr;
        const isSelected = fullDateStr === selectedCalendarDateStr;

        html += `
            <div onclick="selectCalendarDate('${fullDateStr}')" class="p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between h-20 ${isSelected ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-lg' : isToday ? 'border-red-500 bg-red-950/40 text-white font-bold' : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'}">
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

    const dayAppts = appointments.filter(a => a.date === selectedCalendarDateStr && a.status !== 'DECLINED');
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
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">${a.status}</span>
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

async function handleManualPatientUpload(e) {
    e.preventDefault();
    const phoneInput = document.getElementById('man_pphone').value.replace(/[^0-9a-zA-Z-]/g, '');
    const name = document.getElementById('man_pname').value;
    const email = document.getElementById('man_pemail') ? document.getElementById('man_pemail').value : '';
    const ageGender = document.getElementById('man_page_gender').value;
    const doctor = document.getElementById('man_pdoctor').value;
    const slot = document.getElementById('man_pslot') ? document.getElementById('man_pslot').value : "10:00 AM - 02:00 PM";
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
            patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone: phoneInput, email, ageGender };
            patients.push(patient);
        } else {
            patient.name = name;
            patient.ageGender = ageGender;
            if(email) patient.email = email;
        }
        await storageEngine.setItem('ns_patients', patients);

        const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
        const token = getNextTokenForDate(date);

        appointments.push({ id: apptId, patientId: patient.patientId, token, name, phone: patient.phone, email: patient.email || '', ageGender, doctor, chair: "Chair 1 (Main Operatory)", date, slot, status: "CONFIRMED", reason, nextVisit, modifiedToday: true, queueStatus: "In Waiting Room", bp, sugar, risk });
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

        logAction(`Staff registered patient ${name} (${patient.patientId}) - Auto Confirmed.`);
        if(currentSession && currentSession.role === 'assistant') {
            logAssistantWorkActivity(`Registered Patient & Payment Entry for ${name} (${patient.patientId})`);
        }
        alert(`Patient Visit & Payment Logged! Patient ID: ${patient.patientId} | Token: ${token} | Slot: ${slot}`);
        e.target.reset();
        document.getElementById('man_existing_badge').classList.add('hidden-section');
        refreshAllUIViews();
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
    const slotVal = document.getElementById('manual_token_slot') ? document.getElementById('manual_token_slot').value : "10:00 AM - 02:00 PM";
    const chairVal = document.getElementById('manual_token_chair') ? document.getElementById('manual_token_chair').value : "Chair 1 (Main Operatory)";

    if(!pid || !tokenVal) {
        alert("Please enter Patient ID/Phone and Token Number!");
        return;
    }

    const appt = appointments.find(a => (a.patientId.toLowerCase() === pid.toLowerCase() || a.phone === pid) && a.date === currentLiveDateStr) 
              || appointments.find(a => a.patientId.toLowerCase() === pid.toLowerCase() || a.phone === pid);

    if(appt) {
        appt.token = tokenVal;
        appt.slot = slotVal;
        appt.chair = chairVal;
        appt.modifiedToday = true;
        storageEngine.setItem('ns_appointments', appointments);
        refreshAllUIViews();
        logAction(`Assigned token ${tokenVal}, slot ${slotVal}, and ${chairVal} to Patient ${appt.patientId}`);
        alert(`Token ${tokenVal}, Slot ${slotVal} & ${chairVal} assigned to ${appt.name} (${appt.patientId})!`);
        document.getElementById('manual_token_pid').value = '';
        document.getElementById('manual_token_val').value = '';
    } else {
        alert("Patient appointment record not found!");
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
                                    <span class="text-amber-400 font-mono">Token: ${a.token || 'TK-01'} | ${a.status}</span>
                                </div>
                                <p class="text-slate-300">Doctor: ${a.doctor} | Purpose: ${a.reason}</p>
                                <p class="text-slate-400 text-[11px]">BP: ${a.bp || '120/80'} | Mode: ${l.lastPaymentMode || 'Cash'} | Fee: ₹${l.totalCost || 0} (Paid: ₹${l.paidAmount || 0})</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="space-y-2 pt-2">
                <h4 class="text-xs font-bold text-emerald-400 uppercase">Official Prescription Downloads:</h4>
                <div class="space-y-2">
                    ${recs.length > 0 ? recs.map(r => `
                        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                            <div>
                                <p class="font-bold text-white">Prescription Date: ${r.date} | Dr. ${r.doctor}</p>
                                <p class="text-slate-400 text-[11px]">Reason/Diagnosis: ${r.diagnosis}</p>
                            </div>
                            <button onclick="publicViewReadOnlyPrescription('${matchedPatient.patientId}', '${r.id || ''}')" class="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0 shadow">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i> Download Rx
                            </button>
                        </div>
                    `).join('') : '<p class="text-xs text-slate-500">No prescriptions uploaded yet.</p>'}
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
                            <button onclick="openReceiptModal('${l.id}')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0 shadow">
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
                        <p class="text-[11px] text-slate-400">Mobile: ${p.phone} | Email: ${p.email || 'N/A'}</p>
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
                                    <span>${a.date} (${a.slot}) - ${a.reason}</span>
                                    <span class="text-emerald-400">Total Fee: ₹${l.totalCost || 0} | Status: ${a.status}</span>
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
    const email = document.getElementById('bk_email') ? document.getElementById('bk_email').value : '';
    const doctor = document.getElementById('bk_doctor').value;
    const date = document.getElementById('bk_date').value;
    const slot = document.getElementById('bk_slot').value;
    const reason = document.getElementById('bk_reason').value;

    let patient = patients.find(p => p.phone === phoneInput || p.patientId.toLowerCase() === phoneInput.toLowerCase());
    if(!patient) {
        patient = { patientId: "PAT-" + Math.floor(1000 + Math.random()*9000), name, phone: phoneInput, email, ageGender: "34 / Male" };
        patients.push(patient);
    } else {
        patient.name = name;
        if(email) patient.email = email;
    }
    await storageEngine.setItem('ns_patients', patients);

    const apptId = "NSD-" + Math.floor(1000 + Math.random()*9000);
    const token = getNextTokenForDate(date);

    appointments.push({ 
        id: apptId, 
        patientId: patient.patientId, 
        token, 
        name, 
        phone: patient.phone, 
        email: patient.email || '', 
        ageGender: patient.ageGender, 
        doctor, 
        chair: "Chair 1 (Main Operatory)",
        date, 
        slot, 
        status: "PENDING", 
        reason, 
        nextVisit: date, 
        modifiedToday: true, 
        queueStatus: "In Waiting Room" 
    });
    await storageEngine.setItem('ns_appointments', appointments);

    const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
    ledgers.push({ id: recId, apptId, patientId: patient.patientId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0, lastPaymentMode: "Cash", date });
    await storageEngine.setItem('ns_ledgers', ledgers);

    alert(`Booking Request Submitted Successfully!\nPatient ID: ${patient.patientId} | Token: ${token}\n\nStatus: PENDING STAFF APPROVAL.`);
    document.getElementById('bk_existing_badge').classList.add('hidden-section');
    refreshAllUIViews();
    navigateTo('public-home');
}

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
    const remember24h = document.getElementById('remember24h') ? document.getElementById('remember24h').checked : false;

    if (role === 'admin' && identifier === 'admin' && pwd === '9290') {
        currentSession = { role: 'admin', name: 'Developer Admin', phone: '+91 8978883007' };
        if (remember24h) {
            const expiry = Date.now() + (24 * 60 * 60 * 1000);
            localStorage.setItem("ns_saved_session_24h", JSON.stringify({ user: currentSession, expiry }));
        }
        logAction("Admin session started.");
        openDashboard();
        closePortalModal();
        return;
    }

    const u = users.find(x => x.role === role && (x.email === identifier || x.phone === identifier) && x.password === pwd);
    if (u && u.status === 'Approved') {
        currentSession = u;
        if (remember24h) {
            const expiry = Date.now() + (24 * 60 * 60 * 1000);
            localStorage.setItem("ns_saved_session_24h", JSON.stringify({ user: currentSession, expiry }));
        }
        logAction(`${u.role.toUpperCase()} logged in: ${u.name}`);
        openDashboard();
        closePortalModal();
    } else {
        alert("Invalid login credentials or account access revoked/disabled!");
    }
}

async function handleStaffRegistration(e) {
    e.preventDefault();
    const role = document.getElementById('regRole').value;
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    users.push({ id: Date.now(), name, role, phone, email, password, status: "Pending", accessTier: "limited", idProofBase64: null });
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
    const activeTimerContainer = document.getElementById('hdr_active_timer_container');
    const forceSyncBtn = document.getElementById('hdr_force_sync_btn');

    if(hdrBadge && currentSession) {
        hdrRole.innerText = `ROLE: ${currentSession.role.toUpperCase()}`;
        hdrName.innerText = currentSession.name;
        hdrBadge.classList.remove('hidden-section');
        if(loginBtn) loginBtn.classList.add('hidden-section');
        // REVEAL FORCE SYNC BUTTON STRICTLY TO LOGGED-IN STAFF
        if(forceSyncBtn) forceSyncBtn.classList.remove('hidden-section');
    }

    if(activeTimerContainer) {
        activeTimerContainer.classList.remove('hidden-section');
        sessionStartTime = Date.now();
        if(sessionTimerInterval) clearInterval(sessionTimerInterval);
        sessionTimerInterval = setInterval(updateActiveSessionTimer, 1000);
    }

    document.getElementById('dashBadge').innerText = `ROLE: ${currentSession.role.toUpperCase()}`;
    document.getElementById('dashWelcome').innerText = `Welcome, ${currentSession.name}`;

    document.getElementById('welc_role_badge').innerText = `AUTHENTICATED ROLE: ${currentSession.role.toUpperCase()}`;
    document.getElementById('welc_staff_name').innerText = `Welcome, ${currentSession.name}`;
    document.getElementById('welc_staff_contact').innerText = `Phone: ${currentSession.phone || 'Registered Staff'} | Authorized Access Active`;
    document.getElementById('welc_session_token').innerText = `Session Token: SEC-${Date.now().toString().slice(-6)}`;

    if(currentSession.role === 'admin') {
        document.getElementById('tabBtnAdminMaster').classList.remove('hidden-section');
        renderAdminUsers();
        renderAuditLogs();
        calculateAdminStats();
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    switchDashTab('welcome');
    refreshAllUIViews();
}

function updateActiveSessionTimer() {
    if(!sessionStartTime) return;
    const diffSec = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const secs = String(diffSec % 60).padStart(2, '0');
    
    const timerDisplay = document.getElementById('hdr_session_timer');
    if(timerDisplay) timerDisplay.innerText = `${hrs}:${mins}:${secs}`;
}

function logout() {
    currentSession = null;
    sessionStartTime = null;
    if(sessionTimerInterval) clearInterval(sessionTimerInterval);
    localStorage.removeItem("ns_saved_session_24h");

    const activeTimerContainer = document.getElementById('hdr_active_timer_container');
    if(activeTimerContainer) activeTimerContainer.classList.add('hidden-section');

    const forceSyncBtn = document.getElementById('hdr_force_sync_btn');
    if(forceSyncBtn) forceSyncBtn.classList.add('hidden-section');

    document.getElementById('hdr_user_badge').classList.add('hidden-section');
    document.getElementById('btn_staff_login').classList.remove('hidden-section');
    navigateTo('public-home');
}

function switchDashTab(tab) {
    document.querySelectorAll('.sidebar-menu-btn').forEach(btn => btn.classList.remove('active-tab'));

    const views = ['viewWelcome', 'viewAppts', 'viewManualPatient', 'viewTreatmentPlan', 'viewCalendar', 'viewInventory', 'viewExpenses', 'viewCampaigns', 'viewLabTracker', 'viewEHR', 'viewLedger', 'viewAsstLogs', 'viewApprovals', 'viewAdminMaster'];
    views.forEach(v => { if(document.getElementById(v)) document.getElementById(v).classList.add('hidden-section'); });

    if(tab === 'welcome') { document.getElementById('viewWelcome').classList.remove('hidden-section'); document.getElementById('tabBtnWelcome').classList.add('active-tab'); }
    if(tab === 'appts') { document.getElementById('viewAppts').classList.remove('hidden-section'); document.getElementById('tabBtnAppts').classList.add('active-tab'); }
    if(tab === 'manualPatient') { document.getElementById('viewManualPatient').classList.remove('hidden-section'); document.getElementById('tabBtnManualPatient').classList.add('active-tab'); }
    if(tab === 'treatmentPlan') { document.getElementById('viewTreatmentPlan').classList.remove('hidden-section'); document.getElementById('tabBtnTreatmentPlan').classList.add('active-tab'); }
    if(tab === 'calendar') { document.getElementById('viewCalendar').classList.remove('hidden-section'); document.getElementById('tabBtnCalendar').classList.add('active-tab'); }
    if(tab === 'inventory') { document.getElementById('viewInventory').classList.remove('hidden-section'); document.getElementById('tabBtnInventory').classList.add('active-tab'); }
    if(tab === 'expenses') { document.getElementById('viewExpenses').classList.remove('hidden-section'); document.getElementById('tabBtnExpenses').classList.add('active-tab'); }
    if(tab === 'campaigns') { document.getElementById('viewCampaigns').classList.remove('hidden-section'); document.getElementById('tabBtnCampaigns').classList.add('active-tab'); }
    if(tab === 'labTracker') { document.getElementById('viewLabTracker').classList.remove('hidden-section'); document.getElementById('tabBtnLabTracker').classList.add('active-tab'); }
    if(tab === 'ehr') { document.getElementById('viewEHR').classList.remove('hidden-section'); document.getElementById('tabBtnEHR').classList.add('active-tab'); }
    if(tab === 'ledger') { document.getElementById('viewLedger').classList.remove('hidden-section'); document.getElementById('tabBtnLedger').classList.add('active-tab'); }
    if(tab === 'asstLogs') { document.getElementById('viewAsstLogs').classList.remove('hidden-section'); document.getElementById('tabBtnAsstLogs').classList.add('active-tab'); }
    if(tab === 'approvals') { document.getElementById('viewApprovals').classList.remove('hidden-section'); document.getElementById('tabBtnApprovals').classList.add('active-tab'); }
    if(tab === 'adminMaster') { document.getElementById('viewAdminMaster').classList.remove('hidden-section'); document.getElementById('tabBtnAdminMaster').classList.add('active-tab'); }
}

function renderAppointments() {
    const tbl = document.getElementById('tblAppointments');
    if(!tbl) return;

    let sortedAppts = [...appointments];

    sortedAppts.sort((a, b) => {
        if (apptSortCriterion === 'pending') {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return (a.token || '').localeCompare(b.token || '');
        } else if (apptSortCriterion === 'name') {
            return (a.name || '').localeCompare(b.name || '');
        } else if (apptSortCriterion === 'status') {
            return (a.status || '').localeCompare(b.status || '');
        } else if (apptSortCriterion === 'date') {
            return (a.date || '').localeCompare(b.date || '');
        } else if (apptSortCriterion === 'id') {
            return (a.patientId || '').localeCompare(b.patientId || '');
        } else {
            const tA = parseInt((a.token || '0').replace(/[^0-9]/g, '')) || 999;
            const tB = parseInt((b.token || '0').replace(/[^0-9]/g, '')) || 999;
            return tA - tB;
        }
    });

    if (sortedAppts.length === 0) {
        tbl.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-slate-500 italic">No appointments registered yet.</td></tr>`;
        return;
    }

    tbl.innerHTML = sortedAppts.map((a, idx) => `
        <tr class="${a.modifiedToday ? 'modified-today' : 'hover:bg-slate-800/50'}">
            <td class="p-3 font-mono font-black text-amber-400 text-center">${idx + 1}</td>
            <td class="p-3 font-mono text-red-500">${a.patientId}<br><span class="text-white font-sans font-bold">${a.name}</span></td>
            <td class="p-3 font-mono font-bold text-amber-400 text-sm">${a.token || 'TK-01'}</td>
            <td class="p-3 text-[11px]">
                <p>BP: <strong class="text-white">${a.bp || '120/80'}</strong> | Sugar: <strong class="text-white">${a.sugar || 'N/A'}</strong></p>
                <span class="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">${a.risk || 'None'}</span>
            </td>
            <td class="p-3 text-[11px]">
                <strong class="text-white block">${a.doctor}</strong>
                <span class="text-amber-400 font-bold block">${a.chair || 'Chair 1'}</span>
            </td>
            <td class="p-3">${a.date}<br><span class="text-[10px] text-slate-400 font-bold">${a.slot}</span></td>
            <td class="p-3 font-bold text-amber-400 font-mono">${a.nextVisit || a.date}</td>
            <td class="p-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                    a.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                    a.status === 'POSTPONED' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }">
                    ${a.status}
                </span>
            </td>
            <td class="p-3 flex gap-1 flex-wrap">
                ${a.status === 'PENDING' ? `
                    <button onclick="approveAppointment('${a.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] shadow">Approve</button>
                    <button onclick="declineAppointment('${a.id}')" class="bg-rose-600 hover:bg-rose-500 text-white font-bold px-2 py-1 rounded text-[10px] shadow">Decline</button>
                ` : ''}
                
                <button onclick="openPostponeModal('${a.id}')" class="bg-sky-600 hover:bg-sky-500 text-white font-bold px-2 py-1 rounded text-[10px] shadow">Postpone</button>
                <button onclick="openMasterEditModal('${a.patientId}')" class="bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-bold">Edit</button>
                <button onclick="openLetterhead('${a.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded text-[10px]">Rx</button>
                
                <div class="flex gap-1">
                    <button onclick="sendAppointmentWhatsAppLinks('${a.id}')" title="WhatsApp Notice" class="bg-emerald-600 text-white px-1.5 py-1 rounded text-[10px] font-bold">WA</button>
                    <button onclick="sendAppointmentEmailNotification('${a.id}')" title="Email Notice" class="bg-sky-600 text-white px-1.5 py-1 rounded text-[10px] font-bold">Email</button>
                </div>

                ${(currentSession && (currentSession.role === 'admin' || currentSession.role === 'doctor')) ? `<button onclick="deletePatientRecordATOZ('${a.patientId}')" class="bg-rose-600/20 text-rose-300 border border-rose-500/30 px-2 py-1 rounded text-[10px]">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function approveAppointment(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    appt.status = "CONFIRMED";
    appt.modifiedToday = true;
    await storageEngine.setItem('ns_appointments', appointments);

    logAction(`Staff approved appointment #${apptId} for ${appt.name}`);
    refreshAllUIViews();
    
    triggerMultiChannelNotifications(appt, "CONFIRMED", `Your appointment at N.S. Dental Care on ${appt.date} (${appt.slot}) with ${appt.doctor} has been CONFIRMED! Token #: ${appt.token}`);
    alert(`Appointment CONFIRMED for ${appt.name}!`);
}

async function declineAppointment(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    if (confirm(`Decline appointment request for ${appt.name}?`)) {
        appt.status = "DECLINED";
        appt.modifiedToday = true;
        await storageEngine.setItem('ns_appointments', appointments);

        logAction(`Staff declined appointment #${apptId} for ${appt.name}`);
        refreshAllUIViews();

        triggerMultiChannelNotifications(appt, "DECLINED", `Regretfully, your appointment request at N.S. Dental Care for ${appt.date} could not be scheduled.`);
        alert(`Appointment DECLINED for ${appt.name}.`);
    }
}

function openPostponeModal(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    document.getElementById('postpone_target_id').value = appt.id;
    document.getElementById('postpone_pname').value = `${appt.name} (${appt.patientId})`;
    document.getElementById('postpone_next_date').value = appt.date;
    document.getElementById('postpone_next_slot').value = appt.slot || "10:00 AM - 02:00 PM";
    document.getElementById('postpone_reason').value = "";

    document.getElementById('postponeModal').classList.remove('hidden');
    document.getElementById('postponeModal').classList.add('flex');
}

function closePostponeModal() {
    document.getElementById('postponeModal').classList.add('hidden');
    document.getElementById('postponeModal').classList.remove('flex');
}

async function handlePostponeSubmit(e) {
    e.preventDefault();
    const apptId = document.getElementById('postpone_target_id').value;
    const nextDate = document.getElementById('postpone_next_date').value;
    const nextSlot = document.getElementById('postpone_next_slot').value;
    const reasonNote = document.getElementById('postpone_reason').value;

    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const prevDate = appt.date;
    appt.date = nextDate;
    appt.slot = nextSlot;
    appt.nextVisit = nextDate;
    appt.status = "POSTPONED";
    appt.modifiedToday = true;

    await storageEngine.setItem('ns_appointments', appointments);

    logAction(`Postponed appointment #${apptId} for ${appt.name} to ${nextDate}`);
    refreshAllUIViews();
    closePostponeModal();

    const notifMsg = `NOTICE: Your appointment at N.S. Dental Care has been POSTPONED to ${nextDate} (${nextSlot}). Reason: ${reasonNote || 'Schedule adjustment'}. Token: ${appt.token}`;
    triggerMultiChannelNotifications(appt, "POSTPONED", notifMsg);
    alert(`Appointment Postponed to ${nextDate}!`);
}

function triggerMultiChannelNotifications(appt, statusType, messageText) {
    const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
    const encodedMsg = encodeURIComponent(`*N.S. DENTAL CARE - APPOINTMENT UPDATE (${statusType})*%0A%0ADear *${appt.name}*,%0A${messageText}%0A%0A*Doctor:* ${appt.doctor}%0A*Patient ID:* ${appt.patientId}`);
    
    window.open(`https://wa.me/91${cleanPhone}?text=${encodedMsg}`, '_blank');
}

function sendAppointmentWhatsAppLinks(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if(appt) {
        const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
        const pageUrl = window.location.href.split('#')[0];
        const msg = `*N.S. DENTAL CARE - PATIENT PORTAL ACCESS*%0A%0ADear *${appt.name}*,%0AYour appointment status is: *${appt.status}*%0A%0A*Patient ID:* ${appt.patientId}%0A*Token #:* ${appt.token || 'TK-01'}%0A*Date & Slot:* ${appt.date} (${appt.slot})%0A*Doctor:* ${appt.doctor}%0A%0A*Download Prescription & Receipt:*%0A${pageUrl}`;
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    }
}

function sendAppointmentEmailNotification(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if(appt) {
        const targetEmail = appt.email || doctorEmail;
        const subject = encodeURIComponent(`N.S. Dental Care - Appointment Status: ${appt.status}`);
        const body = encodeURIComponent(`Dear ${appt.name},\n\nYour appointment at N.S. Dental Care status: ${appt.status}.\n\nThank you.`);
        window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    }
}

// 1. TREATMENT PLAN MODAL CONTROLS
function renderTreatmentPlans() {
    const container = document.getElementById('treatmentPlanListContainer');
    if(!container) return;

    if(treatmentPlans.length === 0) {
        container.innerHTML = `<p class="text-slate-500 italic text-xs">No active treatment plans created yet.</p>`;
        return;
    }

    container.innerHTML = treatmentPlans.map((tp, idx) => `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                    <span class="text-purple-400 font-mono font-bold">${tp.id}</span>
                    <strong class="text-white ml-2">${tp.patientName} (${tp.patientId})</strong>
                </div>
                <span class="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">${tp.status}</span>
            </div>
            <p class="text-slate-300">Phase 1: ${tp.phase1}</p>
            <p class="text-slate-300">Phase 2: ${tp.phase2}</p>
            <div class="flex justify-between items-center pt-2 border-t border-slate-800 font-bold">
                <span class="text-amber-400">Total Estimated Fee: ₹${tp.totalEstimate}</span>
                <button onclick="convertPlanToLedger('${tp.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs shadow">Convert to Ledger</button>
            </div>
        </div>
    `).join('');
}

function openNewTreatmentPlanModal() {
    document.getElementById('newTreatmentPlanModal').classList.remove('hidden');
    document.getElementById('newTreatmentPlanModal').classList.add('flex');
}

function closeNewTreatmentPlanModal() {
    document.getElementById('newTreatmentPlanModal').classList.add('hidden');
    document.getElementById('newTreatmentPlanModal').classList.remove('flex');
}

async function handleNewTreatmentPlanSubmit(e) {
    e.preventDefault();
    const pid = document.getElementById('tp_pid').value.trim();
    const p1 = document.getElementById('tp_phase1').value.trim();
    const p2 = document.getElementById('tp_phase2').value.trim();
    const est = parseFloat(document.getElementById('tp_total_estimate').value) || 0;

    const p = patients.find(x => x.patientId.toLowerCase() === pid.toLowerCase() || x.phone === pid) || { name: "Patient " + pid, patientId: pid };

    const newPlan = { id: "TP-" + Date.now().toString().slice(-4), patientId: p.patientId, patientName: p.name, phase1: p1, phase2: p2, totalEstimate: est, status: "Proposed" };
    treatmentPlans.unshift(newPlan);
    await storageEngine.setItem('ns_treatment_plans', treatmentPlans);
    refreshAllUIViews();
    closeNewTreatmentPlanModal();
    alert(`Treatment Plan ${newPlan.id} Created for ${p.name}!`);
}

async function convertPlanToLedger(planId) {
    const plan = treatmentPlans.find(t => t.id === planId);
    if(!plan) return;

    const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
    ledgers.unshift({ id: recId, apptId: "TP-LINK", patientId: plan.patientId, patientName: plan.patientName, purpose: `${plan.phase1} + ${plan.phase2}`, totalCost: plan.totalEstimate, paidAmount: 0, dueAmount: plan.totalEstimate, lastPaymentMode: "Cash", date: currentLiveDateStr });
    plan.status = "Approved & Billed";

    await storageEngine.setItem('ns_ledgers', ledgers);
    await storageEngine.setItem('ns_treatment_plans', treatmentPlans);
    refreshAllUIViews();
    alert(`Treatment Plan ${plan.id} converted into Receipt Ledger ${recId}!`);
}

// 2. DENTAL INVENTORY MODAL CONTROLS
function renderInventoryTable() {
    const tbl = document.getElementById('tblInventory');
    if(!tbl) return;

    tbl.innerHTML = inventoryItems.map((inv, i) => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-2.5 font-mono text-amber-400 font-bold">${i+1}</td>
            <td class="p-2.5 font-bold text-white">${inv.name}</td>
            <td class="p-2.5">${inv.category}</td>
            <td class="p-2.5 font-mono font-bold ${inv.stock <= inv.minThreshold ? 'text-rose-400' : 'text-emerald-400'}">${inv.stock} units</td>
            <td class="p-2.5 font-mono text-slate-400">${inv.minThreshold} units</td>
            <td class="p-2.5">
                ${inv.stock <= inv.minThreshold ? `<span class="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">Low Stock Alert</span>` : `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">In Stock</span>`}
            </td>
            <td class="p-2.5">
                <button onclick="restockItem('${inv.id}')" class="bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px] shadow">+ Restock</button>
            </td>
        </tr>
    `).join('');
}

function openNewInventoryModal() {
    document.getElementById('newInventoryModal').classList.remove('hidden');
    document.getElementById('newInventoryModal').classList.add('flex');
}

function closeNewInventoryModal() {
    document.getElementById('newInventoryModal').classList.add('hidden');
    document.getElementById('newInventoryModal').classList.remove('flex');
}

async function handleNewInventorySubmit(e) {
    e.preventDefault();
    const name = document.getElementById('inv_name').value.trim();
    const category = document.getElementById('inv_category').value;
    const stock = parseInt(document.getElementById('inv_stock').value) || 0;
    const min = parseInt(document.getElementById('inv_min').value) || 3;

    inventoryItems.push({ id: "INV-" + Date.now().toString().slice(-4), name, category, stock, minThreshold: min });
    await storageEngine.setItem('ns_inventory', inventoryItems);
    refreshAllUIViews();
    closeNewInventoryModal();
    alert(`Inventory Item "${name}" Added!`);
}

async function restockItem(id) {
    const item = inventoryItems.find(i => i.id === id);
    if(!item) return;
    const addQty = parseInt(prompt(`Add restock quantity for ${item.name}:`, "5")) || 0;
    item.stock += addQty;
    await storageEngine.setItem('ns_inventory', inventoryItems);
    refreshAllUIViews();
}

// 3. LAB ORDER MODAL FORM CREATION & EDITING CONTROLS
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

function openNewLabOrderModal() {
    document.getElementById('newLabOrderModal').classList.remove('hidden');
    document.getElementById('newLabOrderModal').classList.add('flex');
}

function closeNewLabOrderModal() {
    document.getElementById('newLabOrderModal').classList.add('hidden');
    document.getElementById('newLabOrderModal').classList.remove('flex');
}

async function handleNewLabOrderSubmit(e) {
    e.preventDefault();
    const pid = document.getElementById('lab_add_pid').value.trim();
    const tooth = document.getElementById('lab_add_tooth').value.trim();
    const material = document.getElementById('lab_add_material').value.trim();
    const labName = document.getElementById('lab_add_labname').value.trim();
    const notes = document.getElementById('lab_add_notes').value.trim();
    const fileInput = document.getElementById('lab_add_file_input');

    const patient = patients.find(p => p.patientId.toLowerCase() === pid.toLowerCase() || p.phone === pid) || { name: "Patient " + pid, patientId: pid };

    async function finishLabSave(fileBase64) {
        labOrders.unshift({ id: "LAB-" + Date.now().toString().slice(-4), patientId: patient.patientId, patientName: patient.name, tooth, material, labName, date: currentLiveDateStr, status: "Impression Taken", notes, fileBase64 });
        await storageEngine.setItem('ns_lab_orders', labOrders);
        refreshAllUIViews();
        closeNewLabOrderModal();
        alert(`Lab Order Created for ${patient.name}!`);
    }

    if(fileInput && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            await finishLabSave(evt.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        await finishLabSave(null);
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
        refreshAllUIViews();
        closeEditLabOrderModal();
        alert(`Lab Order ${order.id} Updated!`);
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

// 4. EXPENSES & P&L LEDGER
function renderExpensesTable() {
    const tbl = document.getElementById('tblExpenses');
    const revEl = document.getElementById('pnl_total_revenue');
    const expEl = document.getElementById('pnl_total_expenses');
    const netEl = document.getElementById('pnl_net_profit');

    const totRev = ledgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    const totExp = clinicExpenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const net = totRev - totExp;

    if(revEl) revEl.innerText = `₹${totRev.toLocaleString('en-IN')}`;
    if(expEl) expEl.innerText = `₹${totExp.toLocaleString('en-IN')}`;
    if(netEl) netEl.innerText = `₹${net.toLocaleString('en-IN')}`;

    if(!tbl) return;

    tbl.innerHTML = clinicExpenses.map((exp, i) => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-2.5 font-bold text-amber-400">${i+1}</td>
            <td class="p-2.5 text-slate-400">${exp.date}</td>
            <td class="p-2.5 text-white font-sans font-bold">${exp.desc}</td>
            <td class="p-2.5">${exp.category}</td>
            <td class="p-2.5 text-rose-400 font-bold">₹${exp.amount}</td>
            <td class="p-2.5 text-slate-300">${exp.paidVia}</td>
        </tr>
    `).join('');
}

async function openAddExpenseModal() {
    const desc = prompt("Expense Description:", "Dental Materials / Rent / Salary");
    if(!desc) return;
    const category = prompt("Category (Materials/Rent/Utility/Salary):", "Materials");
    const amount = parseFloat(prompt("Expense Amount (₹):", "1000")) || 0;
    const paidVia = prompt("Payment Mode (Cash/UPI/NetBanking):", "UPI");

    clinicExpenses.unshift({ id: "EXP-" + Date.now().toString().slice(-4), date: currentLiveDateStr, desc, category, amount, paidVia });
    await storageEngine.setItem('ns_expenses', clinicExpenses);
    refreshAllUIViews();
}

// 5. WHATSAPP BULK CAMPAIGN RECALL
function renderCampaignTargetList() {
    const container = document.getElementById('campaignTargetList');
    if(!container) return;

    const segment = document.getElementById('camp_segment_select') ? document.getElementById('camp_segment_select').value : 'all';
    let targets = patients;

    if(segment === 'pending') {
        const pendingPids = appointments.filter(a => a.status === 'PENDING').map(a => a.patientId);
        targets = patients.filter(p => pendingPids.includes(p.patientId));
    }

    container.innerHTML = targets.map((p, i) => `
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
            <div>
                <strong class="text-white font-sans">${i+1}. ${p.name}</strong>
                <span class="text-slate-400 ml-2">📞 ${p.phone}</span>
            </div>
            <button onclick="triggerWhatsAppCampaignSingle('${p.phone}', '${p.name}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs shadow flex items-center gap-1">
                <i data-lucide="send" class="w-3 h-3"></i> Send WA Recall
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function triggerWhatsAppCampaignSingle(phone, name) {
    const tmpl = document.getElementById('camp_msg_template').value;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = tmpl.replace('{NAME}', name);
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

// 6. DIGITAL CONSENT & CANVAS SIGNATURE
function openDigitalConsentModal(pid) {
    const p = patients.find(x => x.patientId === pid);
    if(!p) return;

    document.getElementById('consent_target_pid').value = pid;
    document.getElementById('consent_pname').value = `${p.name} (${pid})`;

    document.getElementById('digitalConsentModal').classList.remove('hidden');
    document.getElementById('digitalConsentModal').classList.add('flex');
    initConsentSignatureCanvas();
}

function closeDigitalConsentModal() {
    document.getElementById('digitalConsentModal').classList.add('hidden');
    document.getElementById('digitalConsentModal').classList.remove('flex');
}

function initConsentSignatureCanvas() {
    const cvs = document.getElementById('consentSignatureCanvas');
    if(!cvs) return;
    const ctx = cvs.getContext('2d');
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;

    let drawing = false;
    cvs.onmousedown = cvs.ontouchstart = (e) => { drawing = true; ctx.beginPath(); };
    cvs.onmouseup = cvs.ontouchend = () => { drawing = false; };
    cvs.onmousemove = cvs.ontouchmove = (e) => {
        if(!drawing) return;
        const rect = cvs.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };
}

function clearConsentSignatureCanvas() {
    const cvs = document.getElementById('consentSignatureCanvas');
    if(cvs) {
        const ctx = cvs.getContext('2d');
        ctx.clearRect(0, 0, cvs.width, cvs.height);
    }
}

async function handleDigitalConsentSave(e) {
    e.preventDefault();
    const pid = document.getElementById('consent_target_pid').value;
    const proc = document.getElementById('consent_procedure_type').value;
    const cvs = document.getElementById('consentSignatureCanvas');

    const sigData = cvs ? cvs.toDataURL() : null;

    patientConsents.unshift({ id: "CNS-" + Date.now(), patientId: pid, procedure: proc, date: currentLiveDateStr, sigData });
    await storageEngine.setItem('ns_consents', patientConsents);
    alert(`Informed Digital Consent Form Locked & Signed for ${pid}!`);
    closeDigitalConsentModal();
}

// 7. BEFORE & AFTER PHOTO COMPARISON VIEWER
function openPhotoComparisonModal(pid) {
    document.getElementById('comp_pid_badge').innerText = pid;
    document.getElementById('photoComparisonModal').classList.remove('hidden');
    document.getElementById('photoComparisonModal').classList.add('flex');
}

function closePhotoComparisonModal() {
    document.getElementById('photoComparisonModal').classList.add('hidden');
    document.getElementById('photoComparisonModal').classList.remove('flex');
}

function handleComparisonPhotoUpload(evt) {
    const files = evt.target.files;
    if(files.length >= 2) {
        const reader1 = new FileReader();
        const reader2 = new FileReader();
        reader1.onload = (e1) => {
            document.getElementById('comp_before_box').innerHTML = `<img src="${e1.target.result}" class="h-full w-full object-cover">`;
        };
        reader2.onload = (e2) => {
            document.getElementById('comp_after_box').innerHTML = `<img src="${e2.target.result}" class="h-full w-full object-cover">`;
        };
        reader1.readAsDataURL(files[0]);
        reader2.readAsDataURL(files[1]);
    } else {
        alert("Please select at least 2 image files for Before & After comparison!");
    }
}

// 8. AI VOICE DICTATION FOR PRESCRIPTIONS
function toggleVoiceDictation(targetInputId) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Voice speech recognition is not supported in this browser.");
        return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = document.getElementById('btn_voice_rx');

    if (isVoiceDictating) {
        if(speechRecognitionObj) speechRecognitionObj.stop();
        isVoiceDictating = false;
        if(btn) btn.innerHTML = `<i data-lucide="mic" class="w-3 h-3"></i> AI Voice Dictate`;
    } else {
        speechRecognitionObj = new SpeechRec();
        speechRecognitionObj.continuous = true;
        speechRecognitionObj.interimResults = true;
        speechRecognitionObj.lang = 'en-US';

        speechRecognitionObj.onstart = () => {
            isVoiceDictating = true;
            if(btn) btn.innerHTML = `<i data-lucide="mic-off" class="w-3 h-3 text-rose-400 animate-pulse"></i> Listening...`;
        };

        speechRecognitionObj.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            const inputEl = document.getElementById(targetInputId);
            if(inputEl) inputEl.value += " " + transcript;
        };

        speechRecognitionObj.start();
    }
    lucide.createIcons();
}

function toggleCashbookLock(isLocked) {
    const badge = document.getElementById('cashbook_lock_status_badge');
    if(badge) {
        if(isLocked) {
            badge.innerText = "🔒 Daily Cashbook Locked (CA Approved)";
            badge.className = "bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30";
        } else {
            badge.innerText = "Payment Audit Active";
            badge.className = "bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30";
        }
    }
    logAction(`Cashbook lock set to: ${isLocked}`);
}

// INITIALIZE APPLICATION
initApp();
