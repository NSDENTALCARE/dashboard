// ==========================================================================
// ASSISTANT TIMECARD PUNCH & WORK ACTIVITY TRACKER
// ==========================================================================

async function executeAssistantPunch(type) {
    if (!currentSession) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];
    const epochMs = now.getTime();
    const deviceName = document.getElementById('disp_device_name') ? document.getElementById('disp_device_name').innerText : "Desktop Browser";

    let activePunch = assistantPunchLogs.find(p => p.staffName === currentSession.name && p.status === 'ACTIVE');

    if (type === 'PUNCH_IN') {
        if (activePunch) {
            alert("You are already Punched In!");
            return;
        }

        const newPunch = {
            id: "PUNCH-" + Date.now(),
            staffName: currentSession.name,
            staffPhone: currentSession.phone || "",
            date: dateStr,
            inTime: timeStr,
            inEpoch: epochMs,
            outTime: "In Shift...",
            outEpoch: null,
            duration: "In Shift...",
            device: deviceName,
            status: "ACTIVE",
            immutable: true
        };

        assistantPunchLogs.unshift(newPunch);
        await storageEngine.setItem('ns_asst_punches', assistantPunchLogs);
        await logAssistantWorkActivity("Punched In for Shift");
        alert(`PUNCH-IN RECORDED at ${timeStr}. Timecard locked.`);
    } else if (type === 'PUNCH_OUT') {
        if (!activePunch) {
            alert("No active Punch-In shift found!");
            return;
        }

        const diffMs = epochMs - activePunch.inEpoch;
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const totalHoursDecimal = (diffMs / (1000 * 60 * 60)).toFixed(2);

        let durationText = "";
        if (totalMinutes < 60) {
            durationText = `${totalMinutes} mins (${totalHoursDecimal} hrs)`;
        } else {
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            durationText = `${hrs} hr ${mins} mins (${totalHoursDecimal} hrs)`;
        }

        activePunch.outTime = timeStr;
        activePunch.outEpoch = epochMs;
        activePunch.duration = durationText;
        activePunch.status = "COMPLETED";

        await storageEngine.setItem('ns_asst_punches', assistantPunchLogs);
        await logAssistantWorkActivity(`Punched Out. Shift Duration: ${durationText}`);
        alert(`PUNCH-OUT RECORDED at ${timeStr}. Total Shift: ${durationText}`);
    }

    refreshAllUIViews();
}

async function logAssistantWorkActivity(actionDetails) {
    if (!currentSession) return;
    const now = new Date();
    const activityEntry = {
        id: "ACT-" + Date.now(),
        staffName: currentSession.name,
        role: currentSession.role,
        action: actionDetails,
        date: now.toISOString().split('T')[0],
        timestamp: `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString()}`
    };

    assistantWorkActivity.unshift(activityEntry);
    await storageEngine.setItem('ns_asst_activity', assistantWorkActivity);
}

function renderAssistantPunchStatusUI() {
    const bar = document.getElementById('asstTimecardHeaderBar');
    const badge = document.getElementById('punch_live_status_badge');
    const timeTxt = document.getElementById('punch_last_action_time');
    const btnIn = document.getElementById('btn_punch_in');
    const btnOut = document.getElementById('btn_punch_out');

    if (!bar) return;

    if (currentSession && currentSession.role === 'assistant') {
        bar.classList.remove('hidden-section');
        const activePunch = assistantPunchLogs.find(p => p.staffName === currentSession.name && p.status === 'ACTIVE');

        if (activePunch) {
            badge.innerText = "PUNCHED IN (SHIFT ACTIVE)";
            badge.className = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold animate-pulse";
            timeTxt.innerText = `Punched In Today at ${activePunch.inTime} on ${activePunch.device}`;
            btnIn.classList.add('hidden-section');
            btnOut.classList.remove('hidden-section');
        } else {
            badge.innerText = "PUNCHED OUT";
            badge.className = "bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold";
            timeTxt.innerText = "Timecard records are permanently locked upon submission & auto-synced.";
            btnIn.classList.remove('hidden-section');
            btnOut.classList.add('hidden-section');
        }
    } else {
        bar.classList.add('hidden-section');
    }
}

function renderAssistantPunchTable() {
    const tbl = document.getElementById('tblAssistantPunchLogs');
    if (!tbl) return;

    if (assistantPunchLogs.length === 0) {
        tbl.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-500">No assistant shift punches recorded yet.</td></tr>`;
        return;
    }

    tbl.innerHTML = assistantPunchLogs.map(p => `
        <tr class="hover:bg-slate-800/50">
            <td class="p-2.5 font-bold text-white">${p.staffName}</td>
            <td class="p-2.5 text-amber-400 font-bold">${p.date}</td>
            <td class="p-2.5 text-emerald-400">${p.inTime}</td>
            <td class="p-2.5 text-rose-400">${p.outTime}</td>
            <td class="p-2.5 font-bold text-white">${p.duration}</td>
            <td class="p-2.5 text-[10px] text-slate-400">${p.device}</td>
        </tr>
    `).join('');
}

function setAsstActivityFilter(filter) {
    activeAsstActivityFilter = filter;
    const btnDay = document.getElementById('btn_asst_filter_day');
    const btnWeek = document.getElementById('btn_asst_filter_week');
    const btnMonth = document.getElementById('btn_asst_filter_month');

    if(btnDay) btnDay.className = "px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white";
    if(btnWeek) btnWeek.className = "px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white";
    if(btnMonth) btnMonth.className = "px-3 py-1 rounded-lg font-bold text-slate-400 hover:text-white";

    if(filter === 'day' && btnDay) btnDay.className = "px-3 py-1 rounded-lg font-bold bg-red-700 text-white shadow";
    if(filter === 'week' && btnWeek) btnWeek.className = "px-3 py-1 rounded-lg font-bold bg-red-700 text-white shadow";
    if(filter === 'month' && btnMonth) btnMonth.className = "px-3 py-1 rounded-lg font-bold bg-red-700 text-white shadow";

    renderAssistantWorkActivityLog();
}

function renderAssistantWorkActivityLog() {
    const container = document.getElementById('asstActivityContainer');
    if (!container) return;

    const now = new Date();
    let filtered = assistantWorkActivity;

    if (activeAsstActivityFilter === 'day') {
        filtered = assistantWorkActivity.filter(a => a.date === currentLiveDateStr);
    } else if (activeAsstActivityFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = assistantWorkActivity.filter(a => new Date(a.date) >= weekAgo);
    } else if (activeAsstActivityFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = assistantWorkActivity.filter(a => new Date(a.date) >= monthAgo);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-slate-500 italic p-3">No assistant work activity recorded for selected range (${activeAsstActivityFilter.toUpperCase()}).</p>`;
        return;
    }

    container.innerHTML = filtered.map((act, i) => `
        <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-slate-300">
            <div>
                <span class="text-amber-400 font-bold">${i+1}. [${act.timestamp}]</span>
                <strong class="text-white font-sans ml-1">${act.staffName} (${act.role.toUpperCase()})</strong>
                <p class="text-slate-400 text-[11px] font-sans mt-0.5">${act.action}</p>
            </div>
            <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded">Verified Log</span>
        </div>
    `).join('');
}
