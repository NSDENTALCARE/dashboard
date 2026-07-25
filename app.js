lucide.createIcons();

// ==========================================================================
// MAIN APPLICATION CONTROLLER & REAL-TIME DISPATCH ENGINE (v2.4.0)
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
    fetchDeviceAndIPDetails();
    updateStorageMeter();

    if (currentSession) {
        openDashboard();
    }

    setInterval(async () => {
        const freshDateStr = new Date().toISOString().split('T')[0];
        if (freshDateStr !== currentLiveDateStr) {
            currentLiveDateStr = freshDateStr;
            updateMetricCards();
            renderPublicTokenQueue();
        }

        const cloudUpdated = await pullDataFromCloudRelay();
        if (cloudUpdated) {
            refreshAllUIViews();
        }
    }, 3000);
}

function refreshAllUIViews() {
    renderAppointments();
    renderPublicTokenQueue();
    renderLedgers();
    renderLabOrders();
    renderCalendar();
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

        if (currentSession && sessionStartTime) {
            const elapsedMs = now.getTime() - sessionStartTime;
            const secTotal = Math.floor(elapsedMs / 1000);
            const hrs = String(Math.floor(secTotal / 3600)).padStart(2, '0');
            const mins = String(Math.floor((secTotal % 3600) / 60)).padStart(2, '0');
            const secs = String(secTotal % 60).padStart(2, '0');

            const timerBadge = document.getElementById('hdr_session_timer');
            if (timerBadge) {
                timerBadge.innerText = `${hrs}:${mins}:${secs}`;
            }
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function updateMetricCards() {
    currentLiveDateStr = new Date().toISOString().split('T')[0];

    const todayAppts = appointments.filter(a => a.date === currentLiveDateStr);
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

    const labPending = labOrders.filter(o => o.status !== 'Delivered & Fitted');
    const riskCount = todayAppts.filter(a => a.risk && a.risk !== 'None').length;

    const lbl1 = document.getElementById('kpi_date_label_1');
    const lbl2 = document.getElementById('kpi_date_label_2');
    if(lbl1) lbl1.innerText = `Visits Today (${currentLiveDateStr})`;
    if(lbl2) lbl2.innerText = `Today Collections (${currentLiveDateStr})`;

    if(document.getElementById('card_stat_visits')) document.getElementById('card_stat_visits').innerText = todayAppts.length;
    if(document.getElementById('card_stat_queue')) document.getElementById('card_stat_queue').innerText = activeQueue.length;
    if(document.getElementById('card_stat_revenue')) document.getElementById('card_stat_revenue').innerText = `₹${todayRev.toLocaleString('en-IN')}`;
    if(document.getElementById('card_stat_lab')) document.getElementById('card_stat_lab').innerText = labPending.length;
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
                    <p class="text-[11px] text-slate-400">Doctor: ${appt.doctor || 'Unassigned'} | Reason: ${appt.reason || 'N/A'}</p>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="openMasterEditModal('${p.patientId}')" class="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg font-bold">Edit Record</button>
                    ${appt.id ? `<button onclick="openLetterhead('${appt.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-lg">Rx</button>` : ''}
                    ${ledger.id ? `<button onclick="openReceiptModal('${ledger.id}')" class="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg">Receipt</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function updateAppointmentStatus(apptId, actionType) {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    if (actionType === 'APPROVE' || actionType === 'CONFIRM') {
        appt.status = 'APPROVED';
        appt.modifiedToday = true;
        await saveAndNotifyAppointmentAction(appt, 'Approved');
    } else if (actionType === 'DECLINE') {
        if (confirm(`Are you sure you want to decline the appointment request for ${appt.name}?`)) {
            appt.status = 'DECLINED';
            appt.modifiedToday = true;
            await saveAndNotifyAppointmentAction(appt, 'Declined');
        }
    } else if (actionType === 'POSTPONE') {
        openPostponeModal(apptId);
    }
}

function openPostponeModal(apptId) {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const newDate = prompt(`Select New Appointment Date for ${appt.name} (YYYY-MM-DD):`, appt.date);
    if (!newDate) return;

    const newSlot = prompt(`Select Time Slot:\n1. 10:00 AM - 02:00 PM\n2. 05:00 PM - 10:00 PM`, appt.slot) || appt.slot;

    appt.date = newDate;
    appt.slot = newSlot;
    appt.status = 'POSTPONED';
    appt.nextVisit = newDate;
    appt.modifiedToday = true;

    saveAndNotifyAppointmentAction(appt, `Postponed to ${newDate} (${newSlot})`);
}

async function saveAndNotifyAppointmentAction(appt, actionStatusText) {
    await storageEngine.setItem('ns_appointments', appointments);
    refreshAllUIViews();

    const doctorObj = doctors.find(d => d.name === appt.doctor) || doctors[0];
    const cleanPatientPhone = appt.phone.replace(/[^0-9]/g, '');
    const cleanDoctorPhone = doctorObj.phone.replace(/[^0-9]/g, '');

    const patientMsg = `*N.S. DENTAL CARE - APPOINTMENT UPDATE*%0A%0ADear *${appt.name}*,%0AYour appointment status has been updated:%0A%0A*Status:* ${actionStatusText}%0A*Date:* ${appt.date}%0A*Slot:* ${appt.slot}%0A*Doctor:* ${appt.doctor}%0A*Token #:* ${appt.token || 'TK-01'}%0A%0AFor queries, call +91 8978883007.`;
    const doctorMsg = `*N.S. DENTAL CARE - DOCTOR ALERT*%0A%0APatient Appointment *${actionStatusText}*%0A%0A*Patient:* ${appt.name} (${appt.patientId})%0A*Date:* ${appt.date} | *Slot:* ${appt.slot}%0A*Token:* ${appt.token || 'TK-01'}%0A*Reason:* ${appt.reason}`;

    if (confirm(`Appointment status updated to "${actionStatusText}". Send WhatsApp confirmation to Patient (${cleanPatientPhone})?`)) {
        window.open(`https://wa.me/91${cleanPatientPhone}?text=${patientMsg}`, '_blank');
    }

    if (confirm(`Notify Dr. ${appt.doctor} via WhatsApp?`)) {
        window.open(`https://wa.me/91${cleanDoctorPhone}?text=${doctorMsg}`, '_blank');
    }

    const emailSubject = encodeURIComponent(`N.S. Dental Care - Appointment Status: ${actionStatusText}`);
    const emailBody = encodeURIComponent(`Appointment Status Update:\n\nPatient: ${appt.name} (${appt.patientId})\nStatus: ${actionStatusText}\nDate: ${appt.date}\nSlot: ${appt.slot}\nDoctor: ${appt.doctor}\nReason: ${appt.reason}`);
    window.location.href = `mailto:${doctorEmail}?subject=${emailSubject}&body=${emailBody}`;

    if (confirm(`Send direct Mobile SMS alert to Patient (${cleanPatientPhone})?`)) {
        const smsText = `NS Dental Care: Hello ${appt.name}, your appointment on ${appt.date} (${appt.slot}) is now ${actionStatusText}. Token: ${appt.token || 'TK-01'}. Clinic: 8978883007`;
        window.open(`sms:+91${cleanPatientPhone}?body=${encodeURIComponent(smsText)}`, '_blank');
    }

    logAction(`Appointment ${appt.id} status updated to ${actionStatusText}`);
}

function renderAppointments() {
    const tbl = document.getElementById('tblAppointments');
    if(!tbl) return;

    tbl.innerHTML = appointments.map(a => `
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
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'APPROVED' || a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : a.status === 'DECLINED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'}">
                    ${a.status} ${a.status === 'PENDING' ? '(Public Request)' : ''}
                </span>
            </td>
            <td class="p-3">
                <div class="flex gap-1 flex-wrap">
                    <button onclick="updateAppointmentStatus('${a.id}', 'APPROVE')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow">
                        ${a.status === 'PENDING' ? 'Approve & Notify' : 'Re-Approve'}
                    </button>
                    <button onclick="updateAppointmentStatus('${a.id}', 'POSTPONE')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold">Postpone</button>
                    <button onclick="updateAppointmentStatus('${a.id}', 'DECLINE')" class="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">Decline</button>
                    <button onclick="openMasterEditModal('${a.patientId}')" class="bg-slate-700 hover:bg-slate-600 text-white px-2 py-0.5 rounded text-[10px]">Edit</button>
                    <button onclick="openLetterhead('${a.id}')" class="bg-red-600/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[10px]">Rx</button>
                </div>
            </td>
        </tr>
    `).join('');
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

        const dayAppts = appointments.filter(a => a.date === fullDateStr);
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

        appointments.push({ 
            id: apptId, 
            patientId: patient.patientId, 
            token, 
            name, 
            phone: patient.phone, 
            ageGender, 
            doctor, 
            date, 
            slot: "10:00 AM - 02:00 PM", 
            status: "APPROVED", 
            reason, 
            nextVisit, 
            modifiedToday: true, 
            queueStatus: "In Waiting Room", 
            bp, 
            sugar, 
            risk, 
            source: "Manual Staff" 
        });
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

        logAction(`Manual Entry: Patient Visit & Ledger created for ${name} (${patient.patientId}) - Auto-Approved.`);
        if(currentSession && currentSession.role === 'assistant') {
            logAssistantWorkActivity(`Registered Patient & Logged Payment for ${name} (${patient.patientId})`);
        }
        alert(`Patient Visit Logged & Auto-Confirmed! Patient ID: ${patient.patientId} | Token: ${token}`);
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
    const slotVal = document.getElementById('manual_token_slot').value;

    if(!pid || !tokenVal) {
        alert("Please enter Patient ID / Mobile # and Token Number!");
        return;
    }

    const appt = appointments.find(a => (a.patientId.toLowerCase() === pid.toLowerCase() || a.phone === pid) && a.date === currentLiveDateStr) 
              || appointments.find(a => a.patientId.toLowerCase() === pid.toLowerCase() || a.phone === pid);

    if(appt) {
        appt.token = tokenVal;
        appt.slot = slotVal;
        appt.modifiedToday = true;
        storageEngine.setItem('ns_appointments', appointments);
        refreshAllUIViews();
        logAction(`Assigned token ${tokenVal} and slot ${slotVal} to Patient ${appt.patientId}`);
        alert(`Token ${tokenVal} and Slot (${slotVal}) assigned to ${appt.name} (${appt.patientId})!`);
        document.getElementById('manual_token_pid').value = '';
        document.getElementById('manual_token_val').value = '';
    } else {
        alert("Patient appointment record not found for today!");
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

    appointments.push({ 
        id: apptId, 
        patientId: patient.patientId, 
        token, 
        name, 
        phone: patient.phone, 
        ageGender: patient.ageGender, 
        doctor, 
        date, 
        slot, 
        status: "PENDING", 
        reason, 
        nextVisit: date, 
        modifiedToday: true, 
        queueStatus: "In Waiting Room", 
        source: "Public Portal" 
    });
    await storageEngine.setItem('ns_appointments', appointments);

    const recId = "REC-" + Math.floor(1000 + Math.random()*9000);
    ledgers.push({ id: recId, apptId, patientId: patient.patientId, patientName: name, purpose: reason || "Consultation", totalCost: 0, paidAmount: 0, dueAmount: 0, lastPaymentMode: "Cash", date });
    await storageEngine.setItem('ns_ledgers', ledgers);

    alert(`Booking Request Submitted! Patient ID: ${patient.patientId} | Token: ${token}.\n\nYour appointment is currently PENDING and will be confirmed shortly by clinic staff upon approval.`);
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
    const remember24 = document.getElementById('portalRemember24').checked;

    let authenticatedUser = null;

    if (role === 'admin' && identifier === 'admin' && pwd === '9290') {
        authenticatedUser = { id: 999, role: 'admin', name: 'Developer Admin', phone: '+91 8978883007', email: 'admin@nsdentalcare.com' };
    } else {
        const u = users.find(x => x.role === role && (x.email === identifier || x.phone === identifier) && x.password === pwd);
        if (u && u.status === 'Approved') {
            authenticatedUser = u;
        }
    }

    if (authenticatedUser) {
        currentSession = authenticatedUser;
        sessionStartTime = Date.now();

        if (remember24) {
            const expiry = sessionStartTime + (24 * 60 * 60 * 1000);
            localStorage.setItem('ns_saved_session_24h', JSON.stringify({
                session: authenticatedUser,
                startTime: sessionStartTime,
                expiry: expiry
            }));
        } else {
            localStorage.removeItem('ns_saved_session_24h');
        }

        logAction(`${authenticatedUser.role.toUpperCase()} logged in: ${authenticatedUser.name} (24h Persist: ${remember24})`);
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
        renderAdminUsers();
        renderAuditLogs();
        calculateAdminStats();
    } else {
        document.getElementById('tabBtnAdminMaster').classList.add('hidden-section');
    }

    switchDashTab('welcome');
    refreshAllUIViews();
}

function logout() {
    currentSession = null;
    sessionStartTime = null;
    localStorage.removeItem('ns_saved_session_24h');

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
    document.getElementById('viewAsstLogs').classList.add('hidden-section');
    document.getElementById('viewApprovals').classList.add('hidden-section');
    document.getElementById('viewAdminMaster').classList.add('hidden-section');

    if(tab === 'welcome') { document.getElementById('viewWelcome').classList.remove('hidden-section'); document.getElementById('tabBtnWelcome').classList.add('active-tab'); }
    if(tab === 'appts') { document.getElementById('viewAppts').classList.remove('hidden-section'); document.getElementById('tabBtnAppts').classList.add('active-tab'); }
    if(tab === 'manualPatient') { document.getElementById('viewManualPatient').classList.remove('hidden-section'); document.getElementById('tabBtnManualPatient').classList.add('active-tab'); }
    if(tab === 'labTracker') { document.getElementById('viewLabTracker').classList.remove('hidden-section'); document.getElementById('tabBtnLabTracker').classList.add('active-tab'); }
    if(tab === 'calendar') { document.getElementById('viewCalendar').classList.remove('hidden-section'); document.getElementById('tabBtnCalendar').classList.add('active-tab'); }
    if(tab === 'ehr') { document.getElementById('viewEHR').classList.remove('hidden-section'); document.getElementById('tabBtnEHR').classList.add('active-tab'); }
    if(tab === 'ledger') { document.getElementById('viewLedger').classList.remove('hidden-section'); document.getElementById('tabBtnLedger').classList.add('active-tab'); }
    if(tab === 'asstLogs') { document.getElementById('viewAsstLogs').classList.remove('hidden-section'); document.getElementById('tabBtnAsstLogs').classList.add('active-tab'); }
    if(tab === 'approvals') { document.getElementById('viewApprovals').classList.remove('hidden-section'); document.getElementById('tabBtnApprovals').classList.add('active-tab'); }
    if(tab === 'adminMaster') { document.getElementById('viewAdminMaster').classList.remove('hidden-section'); document.getElementById('tabBtnAdminMaster').classList.add('active-tab'); }
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
        refreshAllUIViews();
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

async function openNewLabOrderModal() {
    const pid = prompt("Enter Patient ID (e.g. PAT-1001):", "PAT-1001");
    const tooth = prompt("Enter Tooth # / Quadrant (e.g. #14 Upper Molar):", "#14 Upper Molar");
    const material = prompt("Enter Material (Zirconia, Ceramic, PFM):", "Zirconia Crown");
    const labName = prompt("Lab Partner Name:", "Apex Dental Lab");

    if(pid && tooth) {
        const patient = patients.find(p => p.patientId === pid) || { name: "Patient " + pid };
        labOrders.push({ id: "LAB-" + Date.now(), patientId: pid, patientName: patient.name, tooth, material, labName, date: currentLiveDateStr, status: "Impression Taken", notes: "Standard Order", fileBase64: null });
        await storageEngine.setItem('ns_lab_orders', labOrders);
        refreshAllUIViews();
        logAction(`Lab order created for ${pid}`);
    }
}

function renderPublicTokenQueue() {
    const tbl = document.getElementById('publicQueueTable');
    const todays = appointments.filter(a => a.date === currentLiveDateStr);

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
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'APPROVED' || a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}">
                            ${a.status === 'PENDING' ? 'Awaiting Approval' : 'Confirmed'}
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

function syncAdminEmailInputs() {
    const elHdr = document.getElementById('disp_hdr_email');
    if(elHdr) elHdr.innerText = hospitalEmail;
}

function triggerWhatsAppDoctorBriefing() {
    const todays = appointments.filter(a => a.date === currentLiveDateStr);
    let msg = `*N.S. DENTAL CARE - DAILY MORNING BRIEFING (${currentLiveDateStr})*%0A%0ATotal Scheduled Patients: ${todays.length}%0A%0A`;
    todays.forEach((a, i) => {
        msg += `*${i+1}. Token ${a.token || 'TK-01'}* - ${a.name} (${a.patientId})%0A   Purpose: ${a.reason} | Slot: ${a.slot}%0A   BP: ${a.bp || '120/80'} | Risk: ${a.risk || 'None'}%0A%0A`;
    });
    window.open(`https://wa.me/918978883007?text=${msg}`, '_blank');
}

function sendDoctorDailyBriefingEmail() {
    const todays = appointments.filter(a => a.date === currentLiveDateStr);
    let subject = `N.S. DENTAL CARE - Daily Schedule Briefing (${currentLiveDateStr})`;
    let body = `N.S. DENTAL CARE DAILY CLINICAL SUMMARY (${currentLiveDateStr})\n\nTotal Patients Scheduled: ${todays.length}\n\n`;

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
    a.download = `NS_Dental_Care_Backup_${currentLiveDateStr}.csv`;
    a.click();
}

function downloadJSONBackup() {
    const backupData = { patients, appointments, medicalRecords, ledgers, labOrders, users, assistantPunchLogs, assistantWorkActivity, galleryPhotos, allReviews, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NS_Dental_Care_Backup_${currentLiveDateStr}.json`;
    a.click();
}

async function resetDailyTokens() {
    if(confirm("Reset token numbers for today's queue starting from TK-01?")) {
        let todays = appointments.filter(a => a.date === currentLiveDateStr);
        todays.forEach((a, index) => {
            a.token = "TK-0" + (index + 1);
            a.queueStatus = "In Waiting Room";
            a.modifiedToday = true;
        });
        await storageEngine.setItem('ns_appointments', appointments);
        refreshAllUIViews();
        alert("Tokens reset to TK-01!");
    }
}

function openDayWiseAuditModal() {
    const todaysAppts = appointments.filter(a => a.date === currentLiveDateStr);
    const todaysLedgers = ledgers.filter(l => l.date === currentLiveDateStr || l.date === undefined);

    let totRev = todaysLedgers.reduce((acc, curr) => acc + (parseFloat(curr.paidAmount) || 0), 0);
    let totDue = todaysLedgers.reduce((acc, curr) => acc + (parseFloat(curr.dueAmount) || 0), 0);

    document.getElementById('audit_date_display').innerText = currentLiveDateStr;
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
    logAction(`Verified day-wise audit summary for ${currentLiveDateStr}`);
    alert(`Day Summary Locked & Verified!`);
    closeDayWiseAuditModal();
}

initApp();
