
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, AlertTriangle } from 'lucide-react';
import * as firebaseAuth from 'firebase/auth';
import { auth } from '../services/firebase';
import { DEMO_USERS } from '../constants';

const { signInWithEmailAndPassword } = firebaseAuth as any;

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will detect change and redirect
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. ' + err.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (email: string) => {
    setEmail(email);
    setPassword('password'); 
    setError('Ensure this user exists in Firebase Auth! If not, Register new account.');
  };

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 bg-green-50 border-b border-green-100 text-center">
          <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-green-800" />
          </div>
          <h1 className="text-2xl font-bold text-green-900">NTC Wa</h1>
          <p className="text-green-700">Hall Management System</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="name@ntcwa.edu.gh"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            
            <div className="text-center pt-2">
                <p className="text-sm text-gray-600">Don't have an account?</p>
                <Link to="/register" className="text-green-700 font-bold hover:underline">Register as Student</Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500 mb-4 uppercase tracking-wider font-semibold">
              Demo Credentials (Pre-fill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => demoLogin(u.email)}
                  className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 p-2 rounded text-gray-600 transition-colors"
                >
                  {u.role.replace('_', ' ')}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2">
                Note: You must manually register these emails first, or create them in Firebase Console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
