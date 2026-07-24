lucide.createIcons();

// ==========================================================================
// CORE UI ROUTING, STRICT CURRENT-DAY KPIS & APPLICATION CONTROLLER
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

    // AUTO-POLLING HEARTBEAT FOR REAL-TIME AUTO-REFRESH
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

// STRICT CURRENT-DAY KPI CALCULATOR (NO PAST/FUTURE MIXING)
function updateMetricCards() {
    currentLiveDateStr = new Date().toISOString().split('T')[0];

    const todayAppts = appointments.filter(a => a.date === currentLiveDateStr);
    const activeQueue = todayAppts.filter(a => a.queueStatus === 'In Waiting Room' || a.queueStatus === 'In Consultation');
    
    const todayLedgers = ledgers.filter(l => l.date === currentLiveDateStr);
    let todayRev = 0;
    let todayDue = 0;

    todayLedgers.forEach(l => {
        todayDue += (parseFloat(l.dueAmount) || 0);
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

// UNIVERSAL STAFF PATIENT SEARCH (SEARCH BY NAME, PAT-ID, OR MOBILE)
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

// INTERACTIVE CALENDAR ENGINE
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

// INITIALIZE APPLICATION ON LOAD
initApp();
