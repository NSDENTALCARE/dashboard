// ==========================================================================
// CLINICAL PRESCRIPTION BUILDER, LETTERHEAD & ODONTOGRAM
// ==========================================================================

function openLetterhead(id) {
    activePrescriptionApptId = id;
    const appt = appointments.find(a => a.id === id);
    if(appt) {
        document.getElementById('lh_pid').innerText = appt.patientId;
        document.getElementById('lh_pname').innerText = appt.name;
        document.getElementById('lh_age_gender').innerText = appt.ageGender || "34 / Male";
        document.getElementById('lh_issue').innerText = appt.reason;
        document.getElementById('lh_date').innerText = currentLiveDateStr;
        document.getElementById('lh_doctor').innerText = appt.doctor;
        document.getElementById('lh_next_visit').value = appt.nextVisit || appt.date;

        document.getElementById('odontogramWrapper').classList.remove('hidden-section');
        document.getElementById('rxPresetsBar').classList.remove('hidden-section');
        document.getElementById('lh_notes').readOnly = false;
        document.getElementById('lh_rx').readOnly = false;
        document.getElementById('lh_next_visit').readOnly = false;
        document.getElementById('lh_save_btn').classList.remove('hidden-section');
        document.getElementById('lh_wa_btn').classList.remove('hidden-section');

        document.getElementById('letterheadModal').classList.remove('hidden');
        document.getElementById('letterheadModal').classList.add('flex');
    }
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
        document.getElementById('rxPresetsBar').classList.add('hidden-section');
        document.getElementById('lh_notes').readOnly = true;
        document.getElementById('lh_rx').readOnly = true;
        document.getElementById('lh_next_visit').readOnly = true;
        document.getElementById('lh_save_btn').classList.add('hidden-section');
        document.getElementById('lh_wa_btn').classList.add('hidden-section');

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
        medicalRecords[appt.patientId].push({ id: "RX-" + Date.now(), date: currentLiveDateStr, diagnosis: notes, rx: rx, doctor: appt.doctor, nextVisit: nextVisit });

        await storageEngine.setItem('ns_records', medicalRecords);
        appt.nextVisit = nextVisit;
        appt.modifiedToday = true;
        await storageEngine.setItem('ns_appointments', appointments);

        logAction(`Prescription saved for ${appt.patientId}.`);
        if(currentSession && currentSession.role === 'assistant') {
            logAssistantWorkActivity(`Updated Prescription & Next Visit Date for ${appt.name} (${appt.patientId})`);
        }
        alert("Prescription saved & Next visit synced!");
        refreshAllUIViews();
    }
}

function sendPrescriptionWhatsApp() {
    const appt = appointments.find(a => a.id === activePrescriptionApptId);
    if(appt) {
        const notes = document.getElementById('lh_notes').value;
        const rx = document.getElementById('lh_rx').value;
        const nextVisit = document.getElementById('lh_next_visit').value;

        const cleanPhone = appt.phone.replace(/[^0-9]/g, '');
        const msg = `*N.S. DENTAL CARE - DIGITAL PRESCRIPTION*%0A%0APatient: *${appt.name}* (ID: ${appt.patientId})%0ADoctor: ${appt.doctor}%0A%0A*Findings & Reason:* ${notes}%0A*Rx / Medications Schedule:*%0A${rx}%0A%0A*Next Follow-Up Visit:* ${nextVisit}`;
        window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
    }
}

function applyRxPreset(type) {
    const rxArea = document.getElementById('lh_rx');
    if(!rxArea) return;

    if(type === 'rct') {
        rxArea.value = "1. Tab Amoxicillin 500mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Zero-P (Aceclofenac + Paracetamol) | Morning-Evening (1-0-1) | After Food | 3 Days\n3. Cap Pantoprazole 40mg | Morning (1-0-0) | Before Breakfast | 5 Days";
    } else if(type === 'extraction') {
        rxArea.value = "1. Tab Augmentin 625mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Ketorol DT | Morning-Evening (1-0-1) | Dissolve in 1/2 glass water | 3 Days\n3. Chlorhexidine Mouthwash 0.2% | Rinse 10ml twice daily for 7 days";
    } else if(type === 'scaling') {
        rxArea.value = "1. Gum Paint (Tannic Acid) | Apply gently on gums twice daily\n2. Chlorhexidine 0.2% Mouthwash | Rinse 10ml twice daily after meals for 7 days";
    }
    logAction(`Applied Rx Speed-Dial preset: ${type.toUpperCase()}`);
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

    document.getElementById('lh_notes').value = `Teeth Selected: #${selectedTeeth.join(', #')} | Clinical Procedure Planned: `;
}
