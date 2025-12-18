
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Hall, Batch, Payment, Complaint, SystemSettings, UserRole, ComplaintStatus, Semester, AcademicProgram } from '../types';
import { INITIAL_HALLS, INITIAL_BATCHES, DEFAULT_DUES, DEMO_USERS } from '../constants';

// Collection References
const USERS_COL = 'users';
const HALLS_COL = 'halls';
const BATCHES_COL = 'batches';
const PAYMENTS_COL = 'payments';
const COMPLAINTS_COL = 'complaints';
const SETTINGS_COL = 'settings';
const SEMESTERS_COL = 'semesters';
const PROGRAMS_COL = 'programs';
const SETTINGS_DOC_ID = 'global_config';

// --- INITIALIZATION (SEEDING) ---
export const initializeData = async () => {
  const settingsRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
  const snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    console.log("Seeding Database...");
    
    // 1. Programs
    const initialPrograms: AcademicProgram[] = [
        { id: 'NAC', code: 'NAC', name: 'Nurse Assistant Clinical', durationYears: 2 },
        { id: 'RGN', code: 'RGN', name: 'Registered General Nursing', durationYears: 3 }
    ];
    for(const p of initialPrograms) {
        await setDoc(doc(db, PROGRAMS_COL, p.id), p);
    }

    // 2. Settings (Pre-2025/2026 default)
    const defaultSettings: SystemSettings = {
      currentAcademicYear: '2025/2026',
      currentSemester: 1,
      defaultDuesAmount: DEFAULT_DUES,
      isSemesterOpen: true,
    };
    await setDoc(settingsRef, defaultSettings);

    // 3. Halls
    for (const hall of INITIAL_HALLS) {
      await setDoc(doc(db, HALLS_COL, hall.id), hall);
    }

    // 4. Batches
    for (const batch of INITIAL_BATCHES) {
      await setDoc(doc(db, BATCHES_COL, batch.id), batch);
    }

    // 5. Users 
    for (const user of DEMO_USERS) {
      const { password, ...userData } = user as any; 
      await setDoc(doc(db, USERS_COL, userData.email), userData); 
    }
    console.log("Database Seeded!");
  }
};

// --- GENERIC HELPERS ---
const fetchCollection = async <T>(colName: string): Promise<T[]> => {
  const snapshot = await getDocs(collection(db, colName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
};

// --- PROGRAMS ---
export const getPrograms = async (): Promise<AcademicProgram[]> => fetchCollection<AcademicProgram>(PROGRAMS_COL);

export const addProgram = async (program: AcademicProgram) => {
    await setDoc(doc(db, PROGRAMS_COL, program.id), program);
};

// --- SEMESTERS ---
export const getSemesters = async (): Promise<Semester[]> => fetchCollection<Semester>(SEMESTERS_COL);

export const getActiveSemester = async (): Promise<Semester | null> => {
    const settings = await getSettings();
    if (settings.currentSemesterId) {
        const snap = await getDoc(doc(db, SEMESTERS_COL, settings.currentSemesterId));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Semester;
    }
    // Fallback if no ID but settings exist (legacy)
    return null; 
};

export const setupNewSemester = async (semesterData: Omit<Semester, 'id' | 'createdAt' | 'isActive'>) => {
    // 1. Deactivate all existing semesters
    const allSemesters = await getSemesters();
    const batch = writeBatch(db);
    
    allSemesters.forEach(sem => {
        if(sem.isActive) {
            batch.update(doc(db, SEMESTERS_COL, sem.id), { isActive: false });
        }
    });

    // 2. Create new semester
    const newSemRef = doc(collection(db, SEMESTERS_COL));
    const newSemester: Semester = {
        id: newSemRef.id,
        ...semesterData,
        isActive: true,
        createdAt: new Date().toISOString()
    };
    batch.set(newSemRef, newSemester);

    // 3. Update Global Settings
    const settingsRef = doc(db, SETTINGS_COL, SETTINGS_DOC_ID);
    batch.update(settingsRef, {
        currentAcademicYear: semesterData.academicYear,
        currentSemester: semesterData.semesterNumber,
        currentSemesterId: newSemRef.id,
        defaultDuesAmount: semesterData.duesAmount,
        isSemesterOpen: true // Explicitly open upon creation
    });

    await batch.commit();
    return newSemester;
};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => fetchCollection<User>(USERS_COL);

export const getUserProfile = async (email: string): Promise<User | null> => {
  const docRef = doc(db, USERS_COL, email);
  const snap = await getDoc(docRef);
  if (snap.exists()) return { id: snap.id, ...snap.data() } as User;
  return null;
};

export const updateUser = async (user: User) => {
    const docRef = doc(db, USERS_COL, user.email);
    const data = JSON.parse(JSON.stringify(user));
    await updateDoc(docRef, data);
};

export const createUserProfile = async (user: User) => {
  const docRef = doc(db, USERS_COL, user.email);
  const data = JSON.parse(JSON.stringify(user));
  await setDoc(docRef, data, { merge: true });
};

// SECURITY: This allows admin to simulate a password reset. 
// In a real production app, this must be a Cloud Function using admin.auth().updateUser().
// The client SDK cannot change another user's password.
export const adminUpdatePassword = async (userId: string, newPass: string) => {
    console.log(`[MOCK SECURITY] Request to update password for user ${userId} to: ${newPass}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true; 
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
  return { currentAcademicYear: '2025/2026', currentSemester: 1, defaultDuesAmount: 20, isSemesterOpen: true };
};

// --- ANALYTICS HELPERS ---
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
