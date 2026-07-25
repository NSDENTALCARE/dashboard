// ==========================================================================
// INDEXEDB LOCAL DB + REAL-TIME FIREBASE CLOUD RELAY ENGINE
// ==========================================================================

// Initialize Firebase Engine for Instant Cross-Device Sync (Mobile <-> Desktop)
const firebaseConfig = {
    databaseURL: "https://ns-dental-care-default-rtdb.asia-southeast1.firebasedatabase.app"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch(err) {
        console.log("Firebase initialized");
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
            req.onsuccess = () => {
                notifySyncBroadcast(key, val);
                resolve(true);
            };
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
            req.onsuccess = () => {
                notifySyncBroadcast('clear', null);
                resolve(true);
            };
            req.onerror = () => reject(req.error);
        });
    }
}

const storageEngine = new ClinicStorageEngine();

// REALTIME MULTI-TAB & CLOUD CROSS-DEVICE SYNC ENGINE
const syncChannel = window.BroadcastChannel ? new BroadcastChannel("ns_dental_sync_channel") : null;

function notifySyncBroadcast(key, val) {
    if (syncChannel) {
        syncChannel.postMessage({ type: "DATA_UPDATED", timestamp: Date.now() });
    }
    localStorage.setItem("ns_sync_trigger", Date.now().toString());

    // PUSH IMMEDIATELY TO ONLINE CLOUD RELAY FOR DESKTOP LISTENERS
    if (typeof firebase !== 'undefined' && firebase.database) {
        try {
            firebase.database().ref('clinic_live_store/' + key).set(val);
            firebase.database().ref('last_update_trigger').set({
                key: key,
                sender: getDeviceId(),
                time: Date.now()
            });
        } catch(e) {
            console.warn("Cloud push notice:", e);
        }
    }
}

// REALTIME CLOUD LISTENER (INSTANTLY RECEIVES MOBILE EDITS ON DESKTOP)
if (typeof firebase !== 'undefined' && firebase.database) {
    try {
        firebase.database().ref('last_update_trigger').on('value', async (snapshot) => {
            const data = snapshot.val();
            if (data && data.sender !== getDeviceId()) {
                // Fetch updated key directly from cloud and save to local IndexedDB
                firebase.database().ref('clinic_live_store/' + data.key).once('value', async (keySnap) => {
                    if (keySnap.exists()) {
                        await storageEngine.setItem(data.key, keySnap.val());
                        await reloadDataAndRefreshUI();
                    }
                });
            }
        });
    } catch(err) {
        console.warn("Cloud listener active locally.");
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

// MANUAL 1-CLICK FORCE SYNC TRIGGER FOR MOBILE & DESKTOP BROWSERS
async function forceSyncAllOnlineBrowsers() {
    notifySyncBroadcast('ns_appointments', appointments);
    notifySyncBroadcast('ns_patients', patients);
    notifySyncBroadcast('ns_ledgers', ledgers);
    notifySyncBroadcast('ns_records', medicalRecords);
    
    await reloadDataAndRefreshUI();
    alert("⚡ Cloud Sync Completed! Mobile & Desktop browsers updated across all devices.");
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

// LOAD DATABASE DATA
async function loadStateFromIndexedDB() {
    currentLiveDateStr = new Date().toISOString().split('T')[0];

    hospitalEmail = await storageEngine.getItem('ns_hospital_email') || "info@nsdentalcare.com";
    doctorEmail = await storageEngine.getItem('ns_doctor_email') || "ayub@nsdentalcare.com";

    doctors = await storageEngine.getItem('ns_doctors') || [
        { id: "doc1", name: "Dr. Md Salahuddin Ayub", spec: "Cosmetic Dental Surgeon (Regd: A-6705)", phone: "8978883007", fee: 200 },
        { id: "doc2", name: "Dr. Tabassum Samreen", spec: "Cosmetic Dental Surgeon (Regd: A-7133)", phone: "7729025118", fee: 150 }
    ];

    users = await storageEngine.getItem('ns_users') || [
        { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "8978883007", email: "ayub@nsdental.com", password: "123", status: "Approved", accessTier: "full", idProofBase64: null },
        { id: 2, name: "Clinic Assistant Staff", role: "assistant", phone: "7729025118", email: "assistant@nsdental.com", password: "123", status: "Approved", accessTier: "limited", idProofBase64: null }
    ];

    assistantPunchLogs = await storageEngine.getItem('ns_asst_punches') || [];
    assistantWorkActivity = await storageEngine.getItem('ns_asst_activity') || [];

    auditLogs = await storageEngine.getItem('ns_logs') || [{ time: new Date().toLocaleTimeString(), text: "System Initialized with Real-Time Cloud Sync." }];

    galleryPhotos = await storageEngine.getItem('ns_gallery') || [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=400&q=80"
    ];

    allReviews = await storageEngine.getItem('ns_reviews') || [
        { author: "Afroze Ali", rating: 5, text: "Great experience at NS Dental Care. Professional staff and reasonable prices." },
        { author: "Mohammed Aslam", rating: 5, text: "Dr. Ayub & Dr. Samreen explain treatment clearly. Painless root canal treatment!" }
    ];

    patients = await storageEngine.getItem('ns_patients') || [
        { patientId: "PAT-1001", name: "Mohammed Ali", phone: "9876543210", email: "patient@example.com", ageGender: "34 / Male" }
    ];

    appointments = await storageEngine.getItem('ns_appointments') || [
        { id: "NSD-1001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "9876543210", email: "patient@example.com", ageGender: "34 / Male", doctor: "Dr. Md Salahuddin Ayub", chair: "Chair 1 (Main Operatory)", date: currentLiveDateStr, slot: "10:00 AM - 02:00 PM", status: "CONFIRMED", reason: "Root Canal Treatment", nextVisit: currentLiveDateStr, modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "135", risk: "Diabetic" }
    ];

    labOrders = await storageEngine.getItem('ns_lab_orders') || [
        { id: "LAB-101", patientId: "PAT-1001", patientName: "Mohammed Ali", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: currentLiveDateStr, status: "In Lab Production", notes: "A2 Shade Translucent", fileBase64: null }
    ];

    medicalRecords = await storageEngine.getItem('ns_records') || {
        "PAT-1001": [
            { id: "RX-1001", date: currentLiveDateStr, diagnosis: "Teeth Selected: #14, #15 | Upper Molar Pulpitis", rx: "1. Tab Amoxicillin 500mg | 1-0-1 | After Food | 5 Days\n2. Tab Paracetamol 650mg | 1-0-1 | After Food | 3 Days", doctor: "Dr. Md Salahuddin Ayub", nextVisit: currentLiveDateStr, xrayBase64: null }
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
            date: currentLiveDateStr,
            paymentHistory: [
                { amount: 3000, mode: "UPI (PhonePe/GPay)", timestamp: `${currentLiveDateStr} 10:30 AM` }
            ]
        }
    ];

    treatmentPlans = await storageEngine.getItem('ns_treatment_plans') || [];
    inventoryItems = await storageEngine.getItem('ns_inventory') || [];
    clinicExpenses = await storageEngine.getItem('ns_expenses') || [];
    patientConsents = await storageEngine.getItem('ns_consents') || [];
}

async function reloadDataAndRefreshUI() {
    await loadStateFromIndexedDB();
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
