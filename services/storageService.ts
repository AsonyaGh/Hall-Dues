import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Hall, Batch, Payment, Complaint, SystemSettings, UserRole, ComplaintStatus } from '../types';
import { INITIAL_HALLS, INITIAL_BATCHES, DEFAULT_DUES, DEMO_USERS } from '../constants';

// Collection References
const USERS_COL = 'users';
const HALLS_COL = 'halls';
const BATCHES_COL = 'batches';
const PAYMENTS_COL = 'payments';
const COMPLAINTS_COL = 'complaints';
const SETTINGS_COL = 'settings';
const SETTINGS_DOC_ID = 'global_config';

// --- INITIALIZATION (SEEDING) ---
export const initializeData = async () => {
  // Check if we have settings. If not, assume DB is empty and seed it.
  const settingsRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
  const snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    console.log("Seeding Database...");
    
    // Seed Settings
    const defaultSettings: SystemSettings = {
      currentAcademicYear: '2023/2024',
      currentSemester: 1,
      defaultDuesAmount: DEFAULT_DUES,
      isSemesterOpen: true,
    };
    await setDoc(settingsRef, defaultSettings);

    // Seed Halls
    for (const hall of INITIAL_HALLS) {
      await setDoc(doc(db, HALLS_COL, hall.id), hall);
    }

    // Seed Batches
    for (const batch of INITIAL_BATCHES) {
      await setDoc(doc(db, BATCHES_COL, batch.id), batch);
    }

    // Seed Demo Users (Note: Auth accounts must be created separately in Firebase Console or via Sign Up, 
    // but we store profile data here for the dashboard to work)
    for (const user of DEMO_USERS) {
      // In a real app, we'd use the Auth UID as the doc ID. 
      // For seeding purposes, we use the demo IDs.
      // Important: You must manually create these users in Firebase Auth to log in, 
      // or use the 'signup' feature if we add one.
      const { password, ...userData } = user as any; 
      await setDoc(doc(db, USERS_COL, userData.email), userData); // Using email as ID for demo simplicity to map auth
    }
    console.log("Database Seeded!");
  }
};

// --- GENERIC HELPERS ---
const fetchCollection = async <T>(colName: string): Promise<T[]> => {
  const snapshot = await getDocs(collection(db, colName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  return fetchCollection<User>(USERS_COL);
};

export const getUserProfile = async (email: string): Promise<User | null> => {
  // We are storing user profiles keyed by Email for this demo migration 
  // (In production, use Auth UID)
  const docRef = doc(db, USERS_COL, email);
  const snap = await getDoc(docRef);
  if (snap.exists()) return { id: snap.id, ...snap.data() } as User;
  return null;
};

// --- HALLS ---
export const getHalls = async (): Promise<Hall[]> => fetchCollection<Hall>(HALLS_COL);

// --- BATCHES ---
export const getBatches = async (): Promise<Batch[]> => fetchCollection<Batch>(BATCHES_COL);

export const saveBatch = async (batch: Batch) => {
  await setDoc(doc(db, BATCHES_COL, batch.id), batch, { merge: true });
};

// --- PAYMENTS ---
export const getPayments = async (): Promise<Payment[]> => fetchCollection<Payment>(PAYMENTS_COL);

export const addPayment = async (payment: Payment) => {
  // Let Firestore generate ID
  const { id, ...data } = payment; 
  await addDoc(collection(db, PAYMENTS_COL), data);
};

// --- COMPLAINTS ---
export const getComplaints = async (): Promise<Complaint[]> => fetchCollection<Complaint>(COMPLAINTS_COL);

export const addComplaint = async (complaint: Complaint) => {
  const { id, ...data } = complaint;
  await addDoc(collection(db, COMPLAINTS_COL), data);
};

export const updateComplaintStatus = async (id: string, status: ComplaintStatus) => {
  const docRef = doc(db, COMPLAINTS_COL, id);
  await updateDoc(docRef, { 
    status, 
    dateUpdated: new Date().toISOString() 
  });
};

// --- SETTINGS ---
export const getSettings = async (): Promise<SystemSettings> => {
  const docRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data() as SystemSettings;
  return { currentAcademicYear: '2023/2024', currentSemester: 1, defaultDuesAmount: 20, isSemesterOpen: true };
};

// --- ANALYTICS HELPERS ---
// Note: In Firestore, it's better to calculate stats on the server or use aggregation queries.
// For this scale, client-side filtering is okay.
export const getHallStats = async (hallId: string) => {
  const [allUsers, allPayments, allComplaints, settings] = await Promise.all([
    getUsers(),
    getPayments(),
    getComplaints(),
    getSettings()
  ]);

  const users = allUsers.filter(u => u.hallId === hallId && u.role === UserRole.STUDENT);
  const payments = allPayments.filter(p => p.hallId === hallId);
  const complaints = allComplaints.filter(c => c.hallId === hallId && c.status === ComplaintStatus.PENDING);
  
  const semesterKey = `${settings.currentAcademicYear} - Sem ${settings.currentSemester}`;
  const paidCount = new Set(payments.filter(p => p.semester === semesterKey).map(p => p.studentId)).size;

  return {
      totalStudents: users.length,
      totalCollected: payments.reduce((sum, p) => sum + p.amount, 0),
      pendingComplaints: complaints.length,
      paidPercentage: users.length > 0 ? (paidCount / users.length) * 100 : 0
  };
};