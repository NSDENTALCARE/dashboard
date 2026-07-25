// ==========================================================================
// IMMUTABLE ASSISTANT TIMECARD & WORK ACTIVITY TRACKING ENGINE (v2.4.0)
// ==========================================================================

function renderAssistantPunchStatusUI() {
    const badge = document.getElementById('punch_live_status_badge');
    const txtTime = document.getElementById('punch_last_action_time');
    const btnIn = document.getElementById('btn_punch_in');
    const btnOut = document.getElementById('btn_punch_out');

    if (!currentSession) return;

    const userPunches = assistantPunchLogs.filter(p => p.staffId === currentSession.id);
    const activePunch = userPunches.find(p => p.punchOutTime === null);

    if (activePunch) {
        if (badge) {
            badge.innerText = "PUNCHED IN (ACTIVE SHIFT)";
            badge.className = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold";
        }
        if (txtTime) txtTime.innerText = `Punched in today at ${activePunch.punchInTime} on ${activePunch.date}`;
        if (btnIn) btnIn.classList.add('hidden-section');
        if (btnOut) btnOut.classList.remove('hidden-section');
    } else {
        if (badge) {
            badge.innerText = "PUNCHED OUT";
            badge.className = "bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold";
        }
        const lastCompleted = userPunches[userPunches.length - 1];
        if (txtTime) {
            txtTime.innerText = lastCompleted ? `Last shift ended at ${lastCompleted.punchOutTime} on ${lastCompleted.date} (${lastCompleted.durationHrs})` : "Punches are permanently locked upon submission & auto-synced to Doctor/Admin.";
        }
        if (btnIn) btnIn.classList.remove('hidden-section');
        if (btnOut) btnOut.classList.add('hidden-section');
    }
}

async function executeAssistantPunch(actionType) {
    if (!currentSession) {
        alert("Please log in to record your shift punch!");
        return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    if (actionType === 'PUNCH_IN') {
        const newPunch = {
            id: "PUNCH-" + Date.now(),
            staffId: currentSession.id,
            staffName: currentSession.name,
            date: currentLiveDateStr,
            punchInTime: timeStr,
            punchOutTime: null,
            durationHrs: "In Progress",
            deviceInfo: `${navigator.platform || 'Client Device'}`
        };

        assistantPunchLogs.unshift(newPunch);
        await storageEngine.setItem('ns_asst_punches', assistantPunchLogs);
        logAssistantWorkActivity(`Punched IN for shift at ${timeStr}`);
        logAction(`Timecard: ${currentSession.name} punched IN at ${timeStr}`);
        alert(`Shift Punch-In Recorded successfully at ${timeStr}!`);
    } else if (actionType === 'PUNCH_OUT') {
        const activePunch = assistantPunchLogs.find(p => p.staffId === currentSession.id && p.punchOutTime === null);
        if (activePunch) {
            activePunch.punchOutTime = timeStr;
            activePunch.durationHrs = "8.0 hrs (Shift Completed)";

            await storageEngine.setItem('ns_asst_punches', assistantPunchLogs);
            logAssistantWorkActivity(`Punched OUT of shift at ${timeStr}`);
            logAction(`Timecard: ${currentSession.name} punched OUT at ${timeStr}`);
            alert(`Shift Punch-Out Recorded successfully at ${timeStr}!`);
        }
    }

    renderAssistantPunchStatusUI();
    renderAssistantPunchTable();
}

function renderAssistantPunchTable() {
    const tbl = document.getElementById('tblAssistantPunchLogs');
    if (!tbl) return;

    tbl.innerHTML = assistantPunchLogs.map(p => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-2.5 font-bold text-white">${p.staffName}</td>
            <td class="p-2.5 font-mono text-amber-400">${p.date}</td>
            <td class="p-2.5 text-emerald-400 font-bold">${p.punchInTime}</td>
            <td class="p-2.5 text-rose-400 font-bold">${p.punchOutTime || 'IN PROGRESS'}</td>
            <td class="p-2.5 font-bold text-white">${p.durationHrs}</td>
            <td class="p-2.5 text-[10px] text-slate-400">${p.deviceInfo}</td>
        </tr>
    `).join('');
}

async function logAssistantWorkActivity(actionDescription) {
    if (!currentSession) return;

    const newLog = {
        id: "ACT-" + Date.now(),
        staffId: currentSession.id,
        staffName: currentSession.name,
        date: currentLiveDateStr,
        timestamp: new Date().toLocaleTimeString(),
        action: actionDescription
    };

    assistantWorkActivity.unshift(newLog);
    await storageEngine.setItem('ns_asst_activity', assistantWorkActivity);
    renderAssistantWorkActivityLog();
}

function setAsstActivityFilter(filterType) {
    asstActivityFilter = filterType;

    const btnDay = document.getElementById('btn_asst_filter_day');
    const btnWeek = document.getElementById('btn_asst_filter_week');
    const btnMonth = document.getElementById('btn_asst_filter_month');

    if (btnDay) btnDay.className = filterType === 'day' ? 'px-3 py-1 rounded-lg font-bold bg-red-700 text-white shadow' : 'px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white';
    if (btnWeek) btnWeek.className = filterType === 'week' ? 'px-3 py-1 rounded-lg font-bold bg-red-700 text-white shadow' : 'px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white';
    if (btnMonth) btnMonth.className = filterType === 'month' ? 'px-3 py-1 rounded-lg font-bold bg-red-700 text-white shadow' : 'px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white';

    renderAssistantWorkActivityLog();
}

function renderAssistantWorkActivityLog() {
    const container = document.getElementById('asstActivityContainer');
    if (!container) return;

    let filtered = assistantWorkActivity;

    if (asstActivityFilter === 'day') {
        filtered = assistantWorkActivity.filter(a => a.date === currentLiveDateStr);
    } else if (asstActivityFilter === 'week') {
        const nowMs = Date.now();
        filtered = assistantWorkActivity.filter(a => (nowMs - new Date(a.date).getTime()) <= 7 * 24 * 60 * 60 * 1000);
    } else if (asstActivityFilter === 'month') {
        const currentMonthPrefix = currentLiveDateStr.slice(0, 7);
        filtered = assistantWorkActivity.filter(a => a.date && a.date.startsWith(currentMonthPrefix));
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p class="p-3 text-slate-500 italic">No assistant activity logged for this ${asstActivityFilter} period.</p>`;
        return;
    }

    container.innerHTML = filtered.map(a => `
        <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
            <div>
                <span class="text-amber-400 font-bold">${a.staffName}</span>
                <span class="text-slate-300 ml-2">${a.action}</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">${a.date} ${a.timestamp}</span>
        </div>
    `).join('');
}
