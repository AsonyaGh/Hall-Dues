export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HALL_MASTER = 'HALL_MASTER',
  HALL_EXECUTIVE = 'HALL_EXECUTIVE',
  STUDENT = 'STUDENT',
}

export enum Program {
  NAC = 'NAC', // Nurse Assistant Clinical (2 years)
  RGN = 'RGN', // Registered General Nursing (3 years)
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export enum SemesterStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
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
  program: Program;
  isActive: boolean; // Only active batches can register
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  hallId?: string; // Null for Super Admin
  program?: Program; // For students
  batchId?: string; // For students
  studentId?: string; // For students (index number)
  isDismissed?: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string; // Denormalized for easier reporting
  hallId: string;
  semester: string; // e.g., "2023/2024 - Sem 1"
  amount: number;
  receiptNumber: string;
  datePaid: string;
  recordedBy: string; // User ID of executive
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

export interface SystemSettings {
  currentAcademicYear: string;
  currentSemester: number; // 1 or 2
  defaultDuesAmount: number;
  isSemesterOpen: boolean; // Controlled by Super Admin / Hall Master logic
}

export interface DashboardStats {
  totalStudents: number;
  totalCollected: number;
  pendingComplaints: number;
  paidPercentage: number;
}