// ==========================================================================
// INDEXEDB LOCAL DB + REAL-TIME FIREBASE CLOUD RELAY ENGINE
// ==========================================================================

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

// BROADCAST CHANNEL FOR MULTI-TAB LOCAL SYNC
const syncChannel = window.BroadcastChannel ? new BroadcastChannel("ns_dental_sync_channel") : null;

if (syncChannel) {
    syncChannel.onmessage = async (e) => {
        if (e.data && e.data.type === "DATA_UPDATED") {
            await reloadDataAndRefreshUI();
        }
    };
}

function notifySyncBroadcast(key, val) {
    if (syncChannel) {
        syncChannel.postMessage({ type: "DATA_UPDATED", key: key, timestamp: Date.now() });
    }
    localStorage.setItem("ns_sync_trigger", Date.now().toString());

    // INSTANT PUSH TO CLOUD FOR REALTIME DESKTOP & PUBLIC QUEUE UPDATES
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

// REALTIME FAILSAFE CLOUD LISTENER (RECIEVES ALL MOBILE & PUBLIC QUEUE CHANGES INSTANTLY)
if (typeof firebase !== 'undefined' && firebase.database) {
    try {
        firebase.database().ref('clinic_live_store').on('child_changed', async (snapshot) => {
            const updatedKey = snapshot.key;
            const updatedVal = snapshot.val();
            if (updatedKey && updatedVal) {
                // Save updated data to IndexedDB
                const tx = storageEngine.db.transaction("clinic_store", "readwrite");
                tx.objectStore("clinic_store").put(updatedVal, updatedKey);
                tx.oncomplete = async () => {
                    await reloadDataAndRefreshUI();
                };
            }
        });

        firebase.database().ref('last_update_trigger').on('value', async (snapshot) => {
            const data = snapshot.val();
            if (data && data.sender !== getDeviceId()) {
                firebase.database().ref('clinic_live_store/' + data.key).once('value', async (keySnap) => {
                    if (keySnap.exists()) {
                        const tx = storageEngine.db.transaction("clinic_store", "readwrite");
                        tx.objectStore("clinic_store").put(keySnap.val(), data.key);
                        tx.oncomplete = async () => {
                            await reloadDataAndRefreshUI();
                        };
                    }
                });
            }
        });
    } catch(err) {
        console.warn("Cloud listener active locally:", err);
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

// MANUAL 1-CLICK FORCE SYNC TRIGGER
async function forceSyncAllOnlineBrowsers() {
    notifySyncBroadcast('ns_appointments', appointments);
    notifySyncBroadcast('ns_patients', patients);
    notifySyncBroadcast('ns_ledgers', ledgers);
    notifySyncBroadcast('ns_records', medicalRecords);
    
    await reloadDataAndRefreshUI();
    alert("⚡ Cloud Sync Completed! Mobile & Desktop browsers updated across all devices.");
}

// ==========================================================================
// MANUAL JSON IMPORT / PASTE DATA TRANSFER PROCESSORS
// ==========================================================================

async function handleJSONFileUpload() {
    const fileInput = document.getElementById('json_file_input');
    if (!fileInput || !fileInput.files[0]) {
        alert("Please select a JSON backup file to upload!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const parsedData = JSON.parse(e.target.result);
            await importFullStateFromJSON(parsedData);
            alert("✓ JSON File Imported Successfully! All clinic data updated.");
            fileInput.value = "";
        } catch (err) {
            alert("Error parsing JSON file. Please ensure it is a valid format.");
        }
    };

    reader.readAsText(file);
}

async function handleJSONTextPasteImport() {
    const pasteInput = document.getElementById('json_paste_input');
    if (!pasteInput || !pasteInput.value.trim()) {
        alert("Please paste the raw JSON text into the box first!");
        return;
    }

    try {
        const parsedData = JSON.parse(pasteInput.value.trim());
        await importFullStateFromJSON(parsedData);
        alert("✓ JSON Text Applied Successfully! All records refreshed.");
        pasteInput.value = "";
    } catch (err) {
        alert("Invalid JSON format! Please check the text you pasted.");
    }
}

async function importFullStateFromJSON(data) {
    if (data.patients) {
        patients = data.patients;
        await storageEngine.setItem('ns_patients', patients);
    }
    if (data.appointments) {
        appointments = data.appointments;
        await storageEngine.setItem('ns_appointments', appointments);
    }
    if (data.ledgers) {
        ledgers = data.ledgers;
        await storageEngine.setItem('ns_ledgers', ledgers);
    }
    if (data.medicalRecords) {
        medicalRecords = data.medicalRecords;
        await storageEngine.setItem('ns_records', medicalRecords);
    }
    if (data.labOrders) {
        labOrders = data.labOrders;
        await storageEngine.setItem('ns_lab_orders', labOrders);
    }
    if (data.users) {
        users = data.users;
        await storageEngine.setItem('ns_users', users);
    }
    if (data.treatmentPlans) {
        treatmentPlans = data.treatmentPlans;
        await storageEngine.setItem('ns_treatment_plans', treatmentPlans);
    }
    if (data.inventoryItems) {
        inventoryItems = data.inventoryItems;
        await storageEngine.setItem('ns_inventory', inventoryItems);
    }
    if (data.clinicExpenses) {
        clinicExpenses = data.clinicExpenses;
        await storageEngine.setItem('ns_expenses', clinicExpenses);
    }

    await reloadDataAndRefreshUI();
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

// LOAD DATABASE DATA (SAFE-FAILFALLBACK TO PRESERVE EXISTING DATA)
async function loadStateFromIndexedDB() {
    currentLiveDateStr = new Date().toISOString().split('T')[0];

    hospitalEmail = await storageEngine.getItem('ns_hospital_email') || hospitalEmail;
    doctorEmail = await storageEngine.getItem('ns_doctor_email') || doctorEmail;

    const savedDocs = await storageEngine.getItem('ns_doctors');
    if (savedDocs && savedDocs.length > 0) doctors = savedDocs;

    const savedUsers = await storageEngine.getItem('ns_users');
    if (savedUsers && savedUsers.length > 0) users = savedUsers;

    const savedP = await storageEngine.getItem('ns_patients');
    if (savedP && savedP.length > 0) patients = savedP;

    const savedAppts = await storageEngine.getItem('ns_appointments');
    if (savedAppts && savedAppts.length > 0) appointments = savedAppts;

    const savedLed = await storageEngine.getItem('ns_ledgers');
    if (savedLed && savedLed.length > 0) ledgers = savedLed;

    const savedRecs = await storageEngine.getItem('ns_records');
    if (savedRecs) medicalRecords = savedRecs;

    const savedLab = await storageEngine.getItem('ns_lab_orders');
    if (savedLab) labOrders = savedLab;

    const savedPlans = await storageEngine.getItem('ns_treatment_plans');
    if (savedPlans) treatmentPlans = savedPlans;

    const savedInv = await storageEngine.getItem('ns_inventory');
    if (savedInv) inventoryItems = savedInv;

    const savedExp = await storageEngine.getItem('ns_expenses');
    if (savedExp) clinicExpenses = savedExp;

    const savedConsents = await storageEngine.getItem('ns_consents');
    if (savedConsents) patientConsents = savedConsents;
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
