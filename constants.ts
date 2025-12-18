import { Hall, UserRole, Program, Batch } from './types';

export const INSTITUTION_NAME = "Nursing Training College, Wa";

export const INITIAL_HALLS: Hall[] = [
  {
    id: 'h1',
    name: 'Agongo Hall',
    description: 'Named after Dr. Erasmus Agongo, former Upper West Regional Health Director.',
    history: 'Dr. Erasmus Agongo spearheaded the formation of the school, ensuring the region had a dedicated training center for nurses. This hall honors his visionary leadership.',
    imagePlaceholder: 'https://picsum.photos/800/400?random=1'
  },
  {
    id: 'h2',
    name: 'Segnitome Hall',
    description: 'Named after Dr. George Yaw Segnitome.',
    history: 'Dr. George Yaw Segnitome served as the very first Principal of the school. His foundational work established the academic excellence NTC Wa is known for.',
    imagePlaceholder: 'https://picsum.photos/800/400?random=2'
  },
  {
    id: 'h3',
    name: 'Putiaha Hall',
    description: 'Named after Mr. Nuhu Putiaha.',
    history: 'Honoring Mr. Nuhu Putiaha, the former Municipal Chief Executive (MCE) of Wa Municipal, for his political and infrastructural support to the college.',
    imagePlaceholder: 'https://picsum.photos/800/400?random=3'
  },
  {
    id: 'h4',
    name: 'Jong Hall',
    description: 'Named after the traditional landowners.',
    history: 'This hall pays tribute to the Jong landowners who generously donated the vast land on which the Nursing Training College is built.',
    imagePlaceholder: 'https://picsum.photos/800/400?random=4'
  }
];

export const INITIAL_BATCHES: Batch[] = [
  { id: 'b1', name: 'NAC 19', program: Program.NAC, isActive: true },
  { id: 'b2', name: 'NAC 20', program: Program.NAC, isActive: true },
  { id: 'b3', name: 'RGN 10', program: Program.RGN, isActive: true },
  { id: 'b4', name: 'RGN 11', program: Program.RGN, isActive: true },
  { id: 'b5', name: 'RGN 12', program: Program.RGN, isActive: true },
];

export const DEFAULT_DUES = 20;

export const DEMO_USERS = [
  {
    id: 'admin',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@ntcwa.edu.gh',
    role: UserRole.SUPER_ADMIN,
    password: 'password'
  },
  {
    id: 'hm_agongo',
    firstName: 'Master',
    lastName: 'Agongo',
    email: 'master@agongo.edu.gh',
    role: UserRole.HALL_MASTER,
    hallId: 'h1',
    password: 'password'
  },
  {
    id: 'exec_agongo',
    firstName: 'Exec',
    lastName: 'Agongo',
    email: 'exec@agongo.edu.gh',
    role: UserRole.HALL_EXECUTIVE,
    hallId: 'h1',
    password: 'password'
  },
  {
    id: 'student_1',
    firstName: 'Kwame',
    lastName: 'Mensah',
    email: 'student@ntcwa.edu.gh',
    role: UserRole.STUDENT,
    hallId: 'h1',
    program: Program.RGN,
    batchId: 'b5',
    studentId: 'NTCW/23/001',
    password: 'password'
  }
];