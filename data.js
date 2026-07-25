// ==========================================================================
// LOCKED PERMANENT DATA REPOSITORY (v2.4.0)
// ==========================================================================

const INITIAL_CLINIC_DATA = {
    doctors: [
        { id: 1, name: "Dr. Md Salahuddin Ayub", spec: "B.D.S (Osmania), Cosmetic Surgeon", phone: "8978883007", fee: 200 }
    ],

    patients: [
        { patientId: "PAT-1001", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male" },
        { patientId: "PAT-1002", name: "Syeda Fatima", phone: "9812345678", ageGender: "28 / Female" }
    ],

    appointments: [
        { id: "NSD-5001", patientId: "PAT-1001", token: "TK-01", name: "Mohammed Ali", phone: "9876543210", ageGender: "34 / Male", doctor: "Dr. Md Salahuddin Ayub", date: new Date().toISOString().split('T')[0], slot: "10:00 AM - 02:00 PM", status: "APPROVED", reason: "Root Canal Treatment", nextVisit: new Date().toISOString().split('T')[0], modifiedToday: true, queueStatus: "In Waiting Room", bp: "120/80", sugar: "140 mg/dL", risk: "None", source: "Manual Staff" },
        { id: "NSD-5002", patientId: "PAT-1002", token: "TK-02", name: "Syeda Fatima", phone: "9812345678", ageGender: "28 / Female", doctor: "Dr. Md Salahuddin Ayub", date: new Date().toISOString().split('T')[0], slot: "05:00 PM - 10:00 PM", status: "PENDING", reason: "Crown Fitting", nextVisit: new Date().toISOString().split('T')[0], modifiedToday: false, queueStatus: "In Waiting Room", bp: "110/70", sugar: "Normal", risk: "None", source: "Public Portal" }
    ],

    medicalRecords: {
        "PAT-1001": [
            { id: "RX-9001", date: new Date().toISOString().split('T')[0], diagnosis: "Deep Caries #14 Molar", rx: "1. Tab Amoxicillin 500mg | Morning-Evening (1-0-1) | After Food | 5 Days\n2. Tab Paracetamol 650mg | As needed for pain", doctor: "Dr. Md Salahuddin Ayub", nextVisit: new Date().toISOString().split('T')[0] }
        ]
    },

    ledgers: [
        { id: "REC-1001", apptId: "NSD-5001", patientId: "PAT-1001", patientName: "Mohammed Ali", purpose: "Root Canal Treatment", totalCost: 4500, paidAmount: 2000, dueAmount: 2500, lastPaymentMode: "UPI (PhonePe/GPay)", date: new Date().toISOString().split('T')[0], paymentHistory: [{ amount: 2000, mode: "UPI (PhonePe/GPay)", timestamp: `${new Date().toISOString().split('T')[0]} 10:30:00 AM` }] },
        { id: "REC-1002", apptId: "NSD-5002", patientId: "PAT-1002", patientName: "Syeda Fatima", purpose: "Zirconia Crown", totalCost: 6000, paidAmount: 6000, dueAmount: 0, lastPaymentMode: "Cash", date: new Date().toISOString().split('T')[0], paymentHistory: [{ amount: 6000, mode: "Cash", timestamp: `${new Date().toISOString().split('T')[0]} 05:45:00 PM` }] }
    ],

    labOrders: [
        { id: "LAB-8001", patientId: "PAT-1002", patientName: "Syeda Fatima", tooth: "#14 Upper Molar", material: "Zirconia Crown", labName: "Apex Dental Lab", date: new Date().toISOString().split('T')[0], status: "In Lab Production", notes: "A2 Shade", fileBase64: null }
    ],

    users: [
        { id: 1, name: "Dr. Md Salahuddin Ayub", role: "doctor", phone: "8978883007", email: "ayubm3262@gmail.com", password: "123", status: "Approved", accessTier: "full", idProofBase64: null },
        { id: 2, name: "Assistant Staff", role: "assistant", phone: "9000000000", email: "assistant@nsdentalcare.com", password: "123", status: "Approved", accessTier: "limited", idProofBase64: null }
    ],

    galleryPhotos: [
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80"
    ],

    reviews: [
        { author: "Mirza Ahmed", rating: 5, text: "Dr. Ayub is extremely gentle. Best dental clinic in Santosh Nagar!" },
        { author: "K. Venkatesh", rating: 5, text: "Clean, hygienic, and very transparent with consultation and crown fees." },
        { author: "Farida Begum", rating: 5, text: "Painless root canal treatment done here. Highly recommended for families." },
        { author: "Sheikh Ibrahim", rating: 5, text: "Excellent patient care, prompt appointment scheduling on WhatsApp." }
    ]
};
