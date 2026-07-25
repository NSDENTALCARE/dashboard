// ==========================================================================
// INDEXEDB LOCAL DB + REAL-TIME FIREBASE CLOUD RELAY ENGINE (ROBUST FAILSAFE)
// ==========================================================================

const firebaseConfig = {
    databaseURL: "https://ns-dental-care-default-rtdb.asia-southeast1.firebasedatabase.app"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch(err) {
        console.warn("Firebase initialization skipped:", err);
    }
}

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
                resolve(null); // Failsafe fallback
            };
        });
    }

    async setItem(key, val, skipCloudPush = false) {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            if (!this.db) {
                localStorage.setItem(key, JSON.stringify(val));
                notifySyncBroadcast(key, val, skipCloudPush);
                return resolve(true);
            }
            try {
                const tx = this.db.transaction("clinic_store", "readwrite");
                const store = tx.objectStore("clinic_store");
                const req = store.put(val, key);
                req.onsuccess = () => {
                    notifySyncBroadcast(key, val, skipCloudPush);
                    resolve(true);
                };
                req.onerror = () => {
                    localStorage.setItem(key, JSON.stringify(val));
                    resolve(false);
                };
            } catch(e) {
                localStorage.setItem(key, JSON.stringify(val));
                resolve(false);
            }
        });
    }

    async getItem(key) {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            if (!this.db) {
                const lsData = localStorage.getItem(key);
                return resolve(lsData ? JSON.parse(lsData) : null);
            }
            try {
                const tx = this.db.transaction("clinic_store", "readonly");
                const store = tx.objectStore("clinic_store");
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
                req.onerror = () => resolve(null);
            } catch(e) {
                const lsData = localStorage.getItem(key);
                resolve(lsData ? JSON.parse(lsData) : null);
            }
        });
    }

    async clear() {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            if (this.db) {
                try {
                    const tx = this.db.transaction("clinic_store", "readwrite");
                    const store = tx.objectStore("clinic_store");
                    store.clear();
                } catch(e) {}
            }
            localStorage.clear();
            if (typeof firebase !== 'undefined' && firebase.database) {
                try { firebase.database().ref('clinic_live_store').remove(); } catch(e){}
            }
            resolve(true);
        });
    }
}

const storageEngine = new ClinicStorageEngine();

// REALTIME MULTI-TAB & CLOUD CROSS-DEVICE SYNC ENGINE
const syncChannel = window.BroadcastChannel ? new BroadcastChannel("ns_dental_sync_channel") : null;

function notifySyncBroadcast(key, val, skipCloudPush = false) {
    if (syncChannel) {
        try { syncChannel.postMessage({ type: "DATA_UPDATED", timestamp: Date.now() }); } catch(e){}
    }
    localStorage.setItem("ns_sync_trigger", Date.now().toString());

    // SAFE BACKGROUND CLOUD PUSH
    if (!skipCloudPush && typeof firebase !== 'undefined' && firebase.database) {
        try {
            firebase.database().ref('clinic_live_store/' + key).set(val);
            firebase.database().ref('last_update_trigger').set({
                key: key,
                sender: getDeviceId(),
                time: Date.now()
            });
        } catch(e) {
            console.warn("Cloud push warning:", e);
        }
    }
}

function getDeviceId() {
    let devId = localStorage.getItem("ns_device_id");
    if (!devId) {
        devId = "DEV-" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("ns_device_id", devId);
    }
    return devId;
}

// BACKGROUND LISTENERS FOR CLOUD SYNC
if (typeof firebase !== 'undefined' && firebase.database) {
    try {
        firebase.database().ref('last_update_trigger').on('value', async (snapshot) => {
            const data = snapshot.val();
            if (data && data.sender !== getDeviceId()) {
                firebase.database().ref('clinic_live_store/' + data.key).once('value', async (keySnap) => {
                    if (keySnap.exists()) {
                        await storageEngine.setItem(data.key, keySnap.val(), true);
                        await reloadDataAndRefreshUI();
                    }
                });
            }
        });
    } catch(err) {
        console.warn("Cloud listener standby.");
    }
}

// NON-BLOCKING BACKGROUND FETCH FROM CLOUD
async function pullFullStateFromCloud() {
    if (typeof firebase !== 'undefined' && firebase.database) {
        try {
            const snap = await Promise.race([
                firebase.database().ref('clinic_live_store').once('value'),
                new Promise((_, reject) => setTimeout(() => reject("Cloud timeout"), 2500))
            ]);
            if (snap && snap.exists()) {
                const cloudData = snap.val();
                for (const key in cloudData) {
                    if (cloudData[key]) {
                        await storageEngine.setItem(key, cloudData[key], true);
                    }
                }
            }
        } catch(e) {
            console.warn("Continuing with local storage state.");
        }
    }
}

// 1-CLICK FORCE CLOUD SYNC
async function forceSyncAllOnlineBrowsers() {
    const indicator = document.getElementById('cloud_sync_indicator');
    if(indicator) indicator.innerText = "● SYNCING...";

    await pullFullStateFromCloud();

    notifySyncBroadcast('ns_appointments', appointments);
    notifySyncBroadcast('ns_patients', patients);
    notifySyncBroadcast('ns_ledgers', ledgers);
    notifySyncBroadcast('ns_records', medicalRecords);
    notifySyncBroadcast('ns_doctors', doctors);
    notifySyncBroadcast('ns_treatment_plans', treatmentPlans);
    notifySyncBroadcast('ns_inventory', inventoryItems);
    notifySyncBroadcast('ns_expenses', clinicExpenses);
    notifySyncBroadcast('ns_lab_orders', labOrders);

    await reloadDataAndRefreshUI();
    if(indicator) indicator.innerText = "● CLOUD LIVE";
    alert("⚡ 1-Click Sync Complete! Data refreshed across mobile & desktop.");
}

// GLOBAL STATE VARIABLES
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

let treatmentPlans = [];
let inventoryItems = [];
let clinicExpenses = [];
let patientConsents = [];

let assistantPunchLogs = [];
let assistantWorkActivity = [];
let activeAsstActivityFilter = 'day';

let currentLiveDateStr = new Date().toISOString().split('T')[0];

let activePrescriptionApptId = null;
let activeReceiptId = null;
let selectedTeeth = [];
let currentSession = null;
let staffViewMode = 'list';
let sessionStartTime = null;
let sessionTimerInterval = null;

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth();
let selectedCalendarDateStr = currentLiveDateStr;

// LOAD DATABASE DATA WITH FAILSAFE FALLBACKS
async function loadStateFromIndexedDB() {
    currentLiveDateStr = new Date().toISOString().split('T')[0];

    // 1. Read Local Values First (Fast Display)
    hospitalEmail = await storageEngine.getItem('ns_hospital_email') || "info@nsdentalcare.com";
    doctorEmail = await storageEngine.getItem('ns_doctor_email') || "ayub@nsdentalcare.com";

    doctors = await storageEngine.getItem('ns_doctors');
    if (!doctors || doctors.length === 0) {
        doctors = [
            { id: "doc1", name: "Dr. Md Salahuddin Ayub", spec: "Cosmetic Dental Surgeon (Regd: A-6705)", phone: "8978883007", fee: 200 },
            { id: "doc2", name: "Dr. Tabassum Samreen", spec: "Cosmetic Dental Surgeon (Regd: A-7133)", phone: "7729025118", fee: 150 }
        ];
        await storageEngine.setItem('ns_doctors', doctors);
    }

    users = await storageEngine.getItem('ns_users');
    if (!users || users.length === 0) {
        users = [
            { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "8978883007", email: "ayub@nsdental.com", password: "123", status: "Approved", accessTier: "full", idProofBase64: null },
            { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "7729025118", email: "assistant@nsdental.com", password: "123", status: "Approved", accessTier: "limited", idProofBase64: null }
        ];
        await storageEngine.setItem('ns_users', users);
    }

    patients = await storageEngine.getItem('ns_patients');
    if (!patients || patients.length === 0) {
        patients = [
            { patientId: "PAT-1001", name: "Mohammed Ali", phone: "9876543210", email: "patient@example.com", ageGender: "34 / Male" }
        ];
        await storageEngine.setItem('ns_patients', patients);
    }

    appointments = await storageEngine.getItem('ns_appointments');
    if (!appointments || appointments.length === 0) {
        appointments = [
            { id: "NSD-1001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "9876543210", email: "patient@example.com", ageGender: "34 / Male", doctor: "Dr. Md Salahuddin Ayub", chair: "Chair 1 (Main Operatory)", date: currentLiveDateStr, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: currentLiveDateStr, modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "135", risk: "Diabetic" }
        ];
        await storageEngine.setItem('ns_appointments', appointments);
    }

    ledgers = await storageEngine.getItem('ns_ledgers');
    if (!ledgers || ledgers.length === 0) {
        ledgers = [
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
                date: currentLiveDateStr,
                paymentHistory: [
                    { amount: 3000, mode: "UPI (PhonePe/GPay)", timestamp: `${currentLiveDateStr} 10:30 AM` }
                ]
            }
        ];
        await storageEngine.setItem('ns_ledgers', ledgers);
    }

    labOrders = await storageEngine.getItem('ns_lab_orders') || [
        { id: "LAB-101", patientId: "PAT-1001", patientName: "Mohammed Ali", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: currentLiveDateStr, status: "In Lab Production", notes: "A2 Shade Translucent", fileBase64: null }
    ];

    medicalRecords = await storageEngine.getItem('ns_records') || {
        "PAT-1001": [
            { id: "RX-1001", date: currentLiveDateStr, diagnosis: "Teeth Selected: #14, #15 | Upper Molar Pulpitis", rx: "1. Tab Amoxicillin 500mg | 1-0-1 | After Food | 5 Days\n2. Tab Paracetamol 650mg | 1-0-1 | After Food | 3 Days", doctor: "Dr. Md Salahuddin Ayub", nextVisit: currentLiveDateStr, xrayBase64: null }
        ]
    };

    assistantPunchLogs = await storageEngine.getItem('ns_asst_punches') || [];
    assistantWorkActivity = await storageEngine.getItem('ns_asst_activity') || [];
    auditLogs = await storageEngine.getItem('ns_logs') || [{ time: new Date().toLocaleTimeString(), text: "System Initialized Ready." }];

    galleryPhotos = await storageEngine.getItem('ns_gallery') || [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80"
    ];

    allReviews = await storageEngine.getItem('ns_reviews') || [
        { author: "Afroze Ali", rating: 5, text: "Great experience at NS Dental Care. Professional staff and reasonable prices." },
        { author: "Mohammed Aslam", rating: 5, text: "Dr. Ayub & Dr. Samreen explain treatment clearly. Painless root canal treatment!" }
    ];

    treatmentPlans = await storageEngine.getItem('ns_treatment_plans') || [];
    inventoryItems = await storageEngine.getItem('ns_inventory') || [];
    clinicExpenses = await storageEngine.getItem('ns_expenses') || [];
    patientConsents = await storageEngine.getItem('ns_consents') || [];

    // 2. Fetch background cloud sync without blocking UI
    pullFullStateFromCloud().then(() => {
        if(typeof refreshAllUIViews === 'function') {
            refreshAllUIViews();
        }
    });
}

async function reloadDataAndRefreshUI() {
    const freshDocs = await storageEngine.getItem('ns_doctors');
    if (freshDocs && freshDocs.length > 0) doctors = freshDocs;

    const freshUsers = await storageEngine.getItem('ns_users');
    if (freshUsers && freshUsers.length > 0) users = freshUsers;

    const freshPts = await storageEngine.getItem('ns_patients');
    if (freshPts && freshPts.length > 0) patients = freshPts;

    const freshAppts = await storageEngine.getItem('ns_appointments');
    if (freshAppts && freshAppts.length > 0) appointments = freshAppts;

    const freshLedg = await storageEngine.getItem('ns_ledgers');
    if (freshLedg && freshLedg.length > 0) ledgers = freshLedg;

    const freshLab = await storageEngine.getItem('ns_lab_orders');
    if (freshLab) labOrders = freshLab;

    const freshRecs = await storageEngine.getItem('ns_records');
    if (freshRecs) medicalRecords = freshRecs;

    const freshPlans = await storageEngine.getItem('ns_treatment_plans');
    if (freshPlans) treatmentPlans = freshPlans;

    const freshInv = await storageEngine.getItem('ns_inventory');
    if (freshInv) inventoryItems = freshInv;

    const freshExp = await storageEngine.getItem('ns_expenses');
    if (freshExp) clinicExpenses = freshExp;

    if(typeof refreshAllUIViews === 'function') {
        refreshAllUIViews();
    }
}

async function updateStorageMeter() {
    const txt = document.getElementById('storage_usage_text');
    const bar = document.getElementById('storage_usage_bar');

    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
        const pct = Math.min(Math.round((estimate.usage / estimate.quota) * 100), 100);

        if (txt) txt.innerText = `${usedMB} MB / ${quotaMB} MB Available (Multi-Device Auto-Sync Engine)`;
        if (bar) {
            bar.style.width = `${Math.max(pct, 2)}%`;
            bar.className = "h-full rounded-full transition-all bg-emerald-500";
        }
    }
}
