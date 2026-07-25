// ==========================================================================
// INDEXEDB HIGH-CAPACITY STORAGE ENGINE & CLOUD REAL-TIME RELAY (v2.4.0)
// ==========================================================================

const DB_NAME = 'NSDentalCareDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

// GLOBAL IN-MEMORY APP DATA STATE WITH COMPLETE UNTOUCHED MOCK DATA
let patients = [];
let appointments = [];
let medicalRecords = {};
let ledgers = [];
let labOrders = [];
let users = [];
let assistantPunchLogs = [];
let assistantWorkActivity = [];
let auditLogs = [];
let galleryPhotos = [];
let allReviews = [];

let doctors = [
    { id: 1, name: "Dr. Md Salahuddin Ayub", spec: "B.D.S (Osmania), Cosmetic Surgeon", phone: "8978883007", fee: 200 },
    { id: 2, name: "Dr. A. Rahaman", spec: "B.D.S (Osmania), Dental Surgeon", phone: "9849272382", fee: 200 }
];

let currentSession = null;
let sessionStartTime = null;
let sessionTimerInterval = null;

let currentLiveDateStr = new Date().toISOString().split('T')[0];
let selectedCalendarDateStr = currentLiveDateStr;
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();
let doctorEmail = "ayubm3262@gmail.com";
let hospitalEmail = "info@nsdentalcare.com";

let activeReceiptId = null;
let activeRxApptId = null;
let selectedTeethList = [];

let staffViewMode = 'list';
let asstActivityFilter = 'day';

// INDEXEDB ENGINE WRAPPER
const storageEngine = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(true);
            };

            request.onerror = (e) => {
                console.error("IndexedDB initialization error:", e.target.error);
                reject(e.target.error);
            };
        });
    },

    async getItem(key) {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    },

    async setItem(key, value) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(value, key);
            req.onsuccess = () => {
                this.syncToCloudRelay(key, value);
                resolve(true);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    },

    async syncToCloudRelay(key, value) {
        try {
            await fetch('https://httpbin.org/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value, timestamp: Date.now() })
            });
        } catch (err) {
            // Offline fallback
        }
    }
};

// INITIALIZE DEFAULT DATA OR LOAD FROM INDEXEDB
async function loadStateFromIndexedDB() {
    patients = (await storageEngine.getItem('ns_patients')) || [
        { patientId: "PAT-1001", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male" },
        { patientId: "PAT-1002", name: "Syeda Fatima", phone: "9812345678", ageGender: "28 / Female" }
    ];

    appointments = (await storageEngine.getItem('ns_appointments')) || [
        { id: "NSD-5001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male", doctor: "Dr. Md Salahuddin Ayub", date: currentLiveDateStr, slot: "10:00 AM - 02:00 PM", status: "APPROVED", reason: "Root Canal Treatment", nextVisit: currentLiveDateStr, modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "140 mg/dL", risk: "None", source: "Manual Staff" },
        { id: "NSD-5002", patientId: "PAT-1002", token: "TK-02", name: "Syeda Fatima", phone: "9812345678", ageGender: "28 / Female", doctor: "Dr. A. Rahaman", date: currentLiveDateStr, slot: "05:00 PM - 10:00 PM", status: "PENDING", reason: "Crown Fitting", nextVisit: currentLiveDateStr, modifiedToday: false, queueStatus: "In Waiting Room", bp: "110/70", sugar: "Normal", risk: "None", source: "Public Portal" }
    ];

    medicalRecords = (await storageEngine.getItem('ns_records')) || {
        "PAT-1001": [
            { id: "RX-9001", date: currentLiveDateStr, diagnosis: "Deep Caries #14 Molar", rx: "1. Tab Amoxicillin 500mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Paracetamol 650mg | As needed for pain", doctor: "Dr. Md Salahuddin Ayub", nextVisit: currentLiveDateStr }
        ]
    };

    ledgers = (await storageEngine.getItem('ns_ledgers')) || [
        { id: "REC-1001", apptId: "NSD-5001", patientId: "PAT-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 4500, paidAmount: 2000, dueAmount: 2500, lastPaymentMode: "UPI (PhonePe/GPay)", date: currentLiveDateStr, paymentHistory: [{ amount: 2000, mode: "UPI (PhonePe/GPay)", timestamp: `${currentLiveDateStr} 10:30:00 AM` }] },
        { id: "REC-1002", apptId: "NSD-5002", patientId: "PAT-1002", patientName: "Syeda Fatima", purpose: "Zirconia Crown", totalCost: 6000, paidAmount: 6000, dueAmount: 0, lastPaymentMode: "Cash", date: currentLiveDateStr, paymentHistory: [{ amount: 6000, mode: "Cash", timestamp: `${currentLiveDateStr} 05:45:00 PM` }] }
    ];

    labOrders = (await storageEngine.getItem('ns_lab_orders')) || [
        { id: "LAB-8001", patientId: "PAT-1002", patientName: "Syeda Fatima", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: currentLiveDateStr, status: "In Lab Production", notes: "A2 Shade", fileBase64: null }
    ];

    users = (await storageEngine.getItem('ns_users')) || [
        { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "8978883007", email: "ayubm3262@gmail.com", password: "123", status: "Approved", accessTier: "full", idProofBase64: null },
        { id: 2, name: "Assistant Staff", role: "assistant", phone: "9000000000", email: "assistant@nsdentalcare.com", password: "123", status: "Approved", accessTier: "limited", idProofBase64: null }
    ];

    assistantPunchLogs = (await storageEngine.getItem('ns_asst_punches')) || [];
    assistantWorkActivity = (await storageEngine.getItem('ns_asst_activity')) || [];
    auditLogs = (await storageEngine.getItem('ns_logs')) || [];

    galleryPhotos = (await storageEngine.getItem('ns_gallery')) || [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80"
    ];

    allReviews = [
        { author: "Mirza Ahmed", rating: 5, text: "Dr. Ayub is extremely gentle. Best dental clinic in Santosh Nagar!" },
        { author: "K. Venkatesh", rating: 5, text: "Clean, hygienic, and very transparent with consultation and crown fees." },
        { author: "Farida Begum", rating: 5, text: "Painless root canal treatment done here. Highly recommended for families." },
        { author: "Sheikh Ibrahim", rating: 5, text: "Excellent patient care, prompt appointment scheduling on WhatsApp." }
    ];

    await restoreSaved24HourSession();
}

// RESTORE 24-HOUR SAVED SESSION
async function restoreSaved24HourSession() {
    try {
        const savedAuthStr = localStorage.getItem('ns_saved_session_24h');
        if (savedAuthStr) {
            const authObj = JSON.parse(savedAuthStr);
            const now = Date.now();
            if (authObj && authObj.expiry && now < authObj.expiry) {
                currentSession = authObj.session;
                sessionStartTime = authObj.startTime || now;
            } else {
                localStorage.removeItem('ns_saved_session_24h');
            }
        }
    } catch(err) {
        console.warn("Error restoring 24-hour saved session:", err);
    }
}

async function pullDataFromCloudRelay() {
    return false;
}

async function updateStorageMeter() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
        const percent = ((estimate.usage / estimate.quota) * 100).toFixed(1);

        const txt = document.getElementById('storage_usage_text');
        const bar = document.getElementById('storage_usage_bar');

        if (txt) txt.innerText = `${usedMB} MB used of ${quotaMB} MB quota (${percent}%)`;
        if (bar) bar.style.width = `${Math.max(percent, 2)}%`;
    }
}
