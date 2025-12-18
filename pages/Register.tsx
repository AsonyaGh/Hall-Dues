import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, User as UserIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserRole, Program, User } from '../types';
import { getBatches, getHalls } from '../services/storageService';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [program, setProgram] = useState<Program>(Program.NAC);
  const [batchId, setBatchId] = useState('');
  const [hallId, setHallId] = useState('');
  const [studentId, setStudentId] = useState(''); // Index Number

  // Data for dropdowns
  const [batches, setBatches] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        const [b, h] = await Promise.all([getBatches(), getHalls()]);
        setBatches(b.filter(x => x.isActive));
        setHalls(h);
        if (b.length > 0) setBatchId(b[0].id);
        if (h.length > 0) setHallId(h[0].id);
    };
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Determine Role (Auto-assign Admin for specific email for demo purposes)
      let role = UserRole.STUDENT;
      if (email === 'admin@ntcwa.edu.gh') role = UserRole.SUPER_ADMIN;
      else if (email.includes('master')) role = UserRole.HALL_MASTER;
      else if (email.includes('exec')) role = UserRole.HALL_EXECUTIVE;

      // 3. Create Firestore Profile
      const newUser: User = {
        id: uid, // Use Auth UID as ID
        firstName,
        lastName,
        email,
        role,
        // Only add student specific fields if student
        ...(role === UserRole.STUDENT ? {
            program,
            batchId,
            hallId,
            studentId,
        } : {
            // For demo convenience, assign admin/masters to first hall if needed or keep undefined
            hallId: role !== UserRole.SUPER_ADMIN ? hallId : undefined
        })
      };

      // We use email as doc ID in the original code, but mixing UID and Email is confusing.
      // The services/storageService.ts currently looks up by EMAIL in getUserProfile.
      // So we MUST save with Email as ID to be consistent with existing service code.
      // Ideally we refactor to use UID, but to minimize changes:
      await setDoc(doc(db, 'users', email), newUser); 
      
      // Navigate to dashboard (AuthContext will pick up the login)
      navigate('/dashboard');

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Registration failed. ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side (Info) */}
        <div className="bg-green-800 text-green-100 p-8 flex flex-col justify-center md:w-1/3 text-center md:text-left">
             <div className="mb-6 flex justify-center md:justify-start">
                <div className="bg-green-700 p-3 rounded-full">
                    <GraduationCap className="h-8 w-8 text-yellow-400" />
                </div>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Join NTC Wa</h2>
             <p className="text-sm opacity-90">Create your account to access the Hall Management System, pay dues, and track academic life.</p>
        </div>

        {/* Right Side (Form) */}
        <div className="p-8 md:w-2/3">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Student Registration</h2>
          
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                    <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="Kwame" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                    <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="Mensah" />
                </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="student@ntcwa.edu.gh" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="••••••••" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase">Index Number</label>
                     <input required type="text" value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="NTCW/..." />
                </div>
                <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase">Program</label>
                     <select value={program} onChange={e => setProgram(e.target.value as Program)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                        {Object.values(Program).map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase">Batch</label>
                     <select value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                     </select>
                </div>
                <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase">Hall</label>
                     <select value={hallId} onChange={e => setHallId(e.target.value)} className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none">
                        {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                     </select>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin"/>}
              Complete Registration
            </button>
            
            <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account? <Link to="/login" className="text-green-700 font-bold hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;