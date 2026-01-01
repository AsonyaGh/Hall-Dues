
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HALL_MASTER = 'HALL_MASTER',
  HALL_EXECUTIVE = 'HALL_EXECUTIVE',
  STUDENT = 'STUDENT',
}

// Keep for legacy type safety in code, but UI will use dynamic lists
export enum Program {
  NAC = 'NAC', 
  RGN = 'RGN', 
}

export interface AcademicProgram {
  id: string;
  name: string; // e.g., "Registered General Nursing"
  code: string; // e.g., "RGN"
  durationYears: number;
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export interface Hall {
  id: string;
  name: string;
  description: string;
  history: string;
  imagePlaceholder: string;
}

export interface Batch {
  id: string;
  name: string; // e.g., "NAC 19", "RGN 12"
  program: string; // Changed from Enum to string to support dynamic programs
  isActive: boolean; 
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  hallId?: string; 
  program?: string; // string
  batchId?: string; 
  studentId?: string; 
  isDismissed?: boolean;
}

export interface Semester {
  id: string;
  academicYear: string; // "2025/2026"
  semesterNumber: number; // 1 or 2
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  duesAmount: number;
  isActive: boolean; // Only one active at a time
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string; 
  hallId: string;
  semester: string; // e.g., "2025/2026 - Sem 1"
  semesterId?: string; // Link to specific semester config
  amount: number;
  receiptNumber: string;
  datePaid: string;
  recordedBy: string; 
}

export interface Expense {
  id: string;
  hallId: string; // 'GENERAL' or specific Hall ID
  title: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  recordedBy: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  hallId: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  dateSubmitted: string;
  dateUpdated?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  senderName: string;
  senderRole: UserRole;
  targetHallId: string; // 'ALL' or specific hall ID
  datePosted: string;
}

export interface SystemSettings {
  currentSemesterId?: string; // Reference to the active Semester document
  currentAcademicYear: string; // Fallback
  currentSemester: number; // Fallback
  defaultDuesAmount: number; // Fallback
  isSemesterOpen: boolean; 
}

export interface DashboardStats {
  totalStudents: number;
  totalCollected: number;
  pendingComplaints: number;
  paidPercentage: number;
}

// Fix for missing react-router-dom types in environment
declare module 'react-router-dom' {
    export const Link: any;
    export const useLocation: any;
    export const useNavigate: any;
    export const BrowserRouter: any;
    export const Routes: any;
    export const Route: any;
    export const Navigate: any;
    export const Outlet: any;
}
