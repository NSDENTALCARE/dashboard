// ==========================================================================
// ODONTOGRAM CHARTING, PRESCRIPTION PRESETS & LETTERHEAD DISPATCHER (v2.4.0)
// ==========================================================================

function renderOdontogram() {
    const grid = document.getElementById('odontogramGrid');
    if (!grid) return;

    // 32-TOOTH ADULT DENTAL CHARTING
    const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
    const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

    let html = '<div class="w-full flex flex-wrap gap-1 mb-2"><span class="text-[10px] font-bold text-amber-400 uppercase w-full">Upper Arch:</span>';
    
    upperTeeth.forEach(t => {
        const isSelected = selectedTeethList.includes(t);
        html += `<button type="button" onclick="toggleToothSelection(${t})" class="px-2 py-1 rounded border text-[10px] font-mono font-bold ${isSelected ? 'tooth-btn-selected' : 'bg-slate-900 border-slate-700 text-slate-300'}">#${t}</button>`;
    });

    html += '</div><div class="w-full flex flex-wrap gap-1"><span class="text-[10px] font-bold text-amber-400 uppercase w-full">Lower Arch:</span>';

    lowerTeeth.forEach(t => {
        const isSelected = selectedTeethList.includes(t);
        html += `<button type="button" onclick="toggleToothSelection(${t})" class="px-2 py-1 rounded border text-[10px] font-mono font-bold ${isSelected ? 'tooth-btn-selected' : 'bg-slate-900 border-slate-700 text-slate-300'}">#${t}</button>`;
    });

    html += '</div>';
    grid.innerHTML = html;
}

function toggleToothSelection(toothNum) {
    if (selectedTeethList.includes(toothNum)) {
        selectedTeethList = selectedTeethList.filter(t => t !== toothNum);
    } else {
        selectedTeethList.push(toothNum);
    }
    renderOdontogram();
}

function applyRxPreset(presetType) {
    const rxBox = document.getElementById('lh_rx');
    if (!rxBox) return;

    if (presetType === 'rct') {
        rxBox.value = "1. Tab Amoxicillin 500mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Zero-P (Aceclofenac + Paracetamol) | Morning-Evening (1-0-1) | After Food | 3 Days\n3. Cap Pantoprazole 40mg | Morning (1-0-0) | Before Food | 5 Days\n4. Chlorhexidine Mouthwash 0.2% | Rinse twice daily";
    } else if (presetType === 'extraction') {
        rxBox.value = "1. Tab Augmentin 625mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Ketorolac DT 10mg | Dissolve in water as needed for pain\n3. Cap Omeprazole 20mg | Morning (1-0-0) | Before Food | 5 Days\n* Soft diet, avoid hot food/smoking for 24 hours.";
    } else if (presetType === 'scaling') {
        rxBox.value = "1. Chlorhexidine Mouthwash 0.2% | Rinse with 10ml for 1 minute twice daily for 7 days\n2. Potassium Nitrate Sensodyne Paste | Apply on teeth gently twice daily";
    }
}

function openLetterhead(apptId) {
    activeRxApptId = apptId;
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const p = patients.find(x => x.patientId === appt.patientId) || {};
    const recs = medicalRecords[appt.patientId] || [];
    const latestRx = recs[recs.length - 1] || {};

    selectedTeethList = [];
    renderOdontogram();

    document.getElementById('lh_pid').innerText = appt.patientId;
    document.getElementById('lh_pname').innerText = appt.name;
    document.getElementById('lh_age_gender').innerText = appt.ageGender || "34 / Male";
    document.getElementById('lh_issue').innerText = appt.reason;
    document.getElementById('lh_date').innerText = appt.date;
    document.getElementById('lh_doctor').innerText = appt.doctor;
    document.getElementById('lh_notes').value = latestRx.diagnosis || appt.reason;
    document.getElementById('lh_rx').value = latestRx.rx || "1. Tab Amoxicillin 500mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Paracetamol 650mg | As needed for pain";
    document.getElementById('lh_next_visit').value = appt.nextVisit || appt.date;

    document.getElementById('letterheadModal').classList.remove('hidden');
    document.getElementById('letterheadModal').classList.add('flex');
}

function closeLetterheadModal() {
    document.getElementById('letterheadModal').classList.add('hidden');
    document.getElementById('letterheadModal').classList.remove('flex');
}

async function savePrescriptionAndSync() {
    const pid = document.getElementById('lh_pid').innerText;
    const doctor = document.getElementById('lh_doctor').innerText;
    const diagnosis = document.getElementById('lh_notes').value;
    const rx = document.getElementById('lh_rx').value;
    const nextVisit = document.getElementById('lh_next_visit').value;

    if (!medicalRecords[pid]) medicalRecords[pid] = [];

    const teethStr = selectedTeethList.length > 0 ? ` [Teeth: #${selectedTeethList.join(', #')}]` : '';

    medicalRecords[pid].push({
        id: "RX-" + Date.now(),
        date: currentLiveDateStr,
        diagnosis: diagnosis + teethStr,
        rx: rx,
        doctor: doctor,
        nextVisit: nextVisit
    });

    await storageEngine.setItem('ns_records', medicalRecords);

    const appt = appointments.find(a => a.id === activeRxApptId);
    if (appt) {
        appt.nextVisit = nextVisit;
        appt.modifiedToday = true;
        await storageEngine.setItem('ns_appointments', appointments);
    }

    if (currentSession && currentSession.role === 'assistant') {
        logAssistantWorkActivity(`Saved Prescription Record for Patient ID ${pid}`);
    }

    refreshAllUIViews();
    logAction(`Saved Prescription & EHR for Patient ${pid}`);
    alert("Prescription Saved to EHR & Visit Synced!");
    closeLetterheadModal();
}

function sendPrescriptionWhatsApp() {
    const pid = document.getElementById('lh_pid').innerText;
    const pname = document.getElementById('lh_pname').innerText;
    const rx = document.getElementById('lh_rx').value;
    const nextVisit = document.getElementById('lh_next_visit').value;

    const p = patients.find(x => x.patientId === pid);
    if (!p) return;

    const cleanPhone = p.phone.replace(/[^0-9]/g, '');
    const pageUrl = window.location.href.split('#')[0];

    const msg = `*N.S. DENTAL CARE - OFFICIAL PRESCRIPTION*%0A%0ADear *${pname}* (${pid}),%0A%0A*Prescribed Medication:*%0A${encodeURIComponent(rx)}%0A%0A*Next Visit Date:* ${nextVisit}%0A%0A*Download Digital PDF Prescription & Receipt:*%0A${pageUrl}`;

    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
}

function publicViewReadOnlyPrescription(pid, rxId) {
    const recs = medicalRecords[pid] || [];
    const r = recs.find(x => x.id === rxId) || recs[recs.length - 1];

    if (r) {
        const appt = appointments.find(a => a.patientId === pid) || { id: "NSD-5001", patientId: pid, name: "Verified Patient", ageGender: "34 / Male", doctor: r.doctor, date: r.date, reason: r.diagnosis, nextVisit: r.nextVisit };
        openLetterhead(appt.id);
    } else {
        alert("Prescription record not found!");
    }
}
