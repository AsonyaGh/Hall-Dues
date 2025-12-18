
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    getHalls, getBatches, getUsers, getPayments, saveBatch, updateUser, getSettings, 
    createUserProfile, getPrograms, addProgram, setupNewSemester, getSemesters, getActiveSemester 
} from '../../services/storageService';
import { Batch, UserRole, Hall, User, Payment, SystemSettings, AcademicProgram, Semester } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Wallet, Building2, Plus, Loader2, Search, Edit2, Shield, ShieldAlert, UserX, CheckCircle, AlertTriangle, X, UserCog, Calendar, BookOpen, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'students' | 'masters'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [halls, setHalls] = useState<Hall[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createType, setCreateType] = useState<'STUDENT' | 'MASTER'>('STUDENT');
  const [newUser, setNewUser] = useState<Partial<User>>({
      firstName: '', lastName: '', email: '', studentId: '', program: 'NAC'
  });

  // Academic Modals
  const [showSemModal, setShowSemModal] = useState(false);
  const [newSem, setNewSem] = useState({
      academicYear: '2025/2026', semesterNumber: 1, startDate: '', endDate: '', duesAmount: 20
  });
  const [showProgModal, setShowProgModal] = useState(false);
  const [newProg, setNewProg] = useState({ id: '', code: '', name: '', durationYears: 2 });

  useEffect(() => {
    if (location.pathname.includes('/admin/students')) setActiveTab('students');
    else if (location.pathname.includes('/admin/academics') || location.pathname.includes('/admin/batches')) setActiveTab('academics');
    else if (location.pathname.includes('/admin/masters')) setActiveTab('masters');
  }, [location]);

  const loadData = async () => {
    try {
        const [h, b, u, p, s, prog, sem, activeSem] = await Promise.all([
            getHalls(),
            getBatches(),
            getUsers(),
            getPayments(),
            getSettings(),
            getPrograms(),
            getSemesters(),
            getActiveSemester()
        ]);
        setHalls(h);
        setBatches(b);
        setUsers(u);
        setPayments(p);
        setSettings(s);
        setPrograms(prog);
        setSemesters(sem);
        setActiveSemester(activeSem);
    } catch (error) {
        console.error("Failed to load admin data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers ---
  const toggleBatch = async (batch: Batch) => {
    setLoading(true);
    const updatedBatch = { ...batch, isActive: !batch.isActive };
    await saveBatch(updatedBatch);
    await loadData();
  };

  const handleDismiss = async (user: User) => {
    const action = user.isDismissed ? 'Re-activate' : 'Dismiss';
    if (!window.confirm(`${action} student account for ${user.firstName}?`)) return;
    const updated = { ...user, isDismissed: !user.isDismissed };
    setLoading(true);
    await updateUser(updated);
    await loadData();
  };

  const saveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    await updateUser(editingUser);
    setEditingUser(null);
    await loadData();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          await createUserProfile({
              id: '', // Auth will assign
              firstName: newUser.firstName!,
              lastName: newUser.lastName!,
              email: newUser.email!,
              role: createType === 'MASTER' ? UserRole.HALL_MASTER : UserRole.STUDENT,
              hallId: newUser.hallId,
              studentId: createType === 'STUDENT' ? newUser.studentId : undefined,
              program: createType === 'STUDENT' ? newUser.program : undefined,
              batchId: createType === 'STUDENT' ? newUser.batchId : undefined
          } as User);
          alert(`Profile created for ${newUser.email}.`);
          setShowCreateUser(false);
          setNewUser({ firstName: '', lastName: '', email: '', studentId: '', program: 'NAC' });
          await loadData();
      } catch (err) {
          alert('Error: ' + err);
      } finally {
          setLoading(false);
      }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!window.confirm("Setting up a new semester will close the previous one. Continue?")) return;
      setLoading(true);
      try {
          await setupNewSemester(newSem);
          setShowSemModal(false);
          await loadData();
      } catch (err) {
          alert("Error setting up semester");
      } finally {
          setLoading(false);
      }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          const prog: AcademicProgram = { ...newProg, id: newProg.code }; // Use Code as ID
          await addProgram(prog);
          setShowProgModal(false);
          setNewProg({ id: '', code: '', name: '', durationYears: 2 });
          await loadData();
      } catch (err) {
          alert("Error adding program");
      } finally {
          setLoading(false);
      }
  };

  // --- Render Helpers ---
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalStudents = users.filter(u => u.role === UserRole.STUDENT || u.role === UserRole.HALL_EXECUTIVE).length;

  const revenueByHall = halls.map(hall => {
    const amount = payments
      .filter(p => p.hallId === hall.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return { name: hall.name, amount };
  });

  const getFilteredUsers = (role: 'STUDENT' | 'MASTER') => {
    return users.filter(u => {
        const isRoleMatch = role === 'STUDENT' 
            ? (u.role === UserRole.STUDENT || u.role === UserRole.HALL_EXECUTIVE)
            : (u.role === UserRole.HALL_MASTER);
        const matchesSearch = 
            u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
        return isRoleMatch && matchesSearch;
    });
  };

  if (loading && !settings) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">System Administration</h1>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          Current Semester: <span className="font-bold text-green-700">{settings?.currentAcademicYear} - Sem {settings?.currentSemester}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 bg-white px-4 pt-4 rounded-t-xl overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Overview</button>
        <button onClick={() => setActiveTab('students')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'students' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Students</button>
        <button onClick={() => setActiveTab('masters')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'masters' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Hall Masters</button>
        <button onClick={() => setActiveTab('academics')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'academics' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Academics & Settings</button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500 uppercase font-semibold">Total Revenue</p>
                     <h3 className="text-2xl font-bold text-gray-800 mt-1">GH₵ {totalRevenue}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500 uppercase font-semibold">Total Students</p>
                     <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalStudents}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500 uppercase font-semibold">Programs</p>
                     <h3 className="text-2xl font-bold text-gray-800 mt-1">{programs.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <p className="text-xs text-gray-500 uppercase font-semibold">Active Batches</p>
                     <h3 className="text-2xl font-bold text-gray-800 mt-1">{batches.filter(b => b.isActive).length}</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue per Hall</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByHall}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `GH₵ ${value}`} />
                    <Bar dataKey="amount" fill="#166534" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* --- ACADEMICS TAB (SEMESTERS, PROGRAMS, BATCHES) --- */}
      {activeTab === 'academics' && (
          <div className="space-y-6">
              
              {/* 1. SEMESTER SETUP */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-green-700" />
                              Semester Configuration
                          </h3>
                          <p className="text-sm text-gray-500">Manage the active academic period and dues.</p>
                      </div>
                      <button onClick={() => setShowSemModal(true)} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          Setup New Semester
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                          <p className="text-xs font-semibold text-green-600 uppercase mb-1">Current Active Semester</p>
                          <div className="text-xl font-bold text-green-900">{activeSemester?.academicYear || settings?.currentAcademicYear}</div>
                          <div className="text-lg text-green-800 font-medium">Semester {activeSemester?.semesterNumber || settings?.currentSemester}</div>
                      </div>
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Dues Collection Period</p>
                          {activeSemester ? (
                              <>
                                <p className="text-sm"><strong>Open:</strong> {new Date(activeSemester.startDate).toLocaleDateString()}</p>
                                <p className="text-sm"><strong>Close:</strong> {new Date(activeSemester.endDate).toLocaleDateString()}</p>
                              </>
                          ) : <p className="text-sm italic text-gray-400">Not configured</p>}
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                           <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Hall Dues Amount</p>
                           <div className="text-2xl font-bold text-blue-900">GH₵ {activeSemester?.duesAmount || settings?.defaultDuesAmount}</div>
                           <p className="text-xs text-blue-700">Per student / semester</p>
                      </div>
                  </div>
              </div>

              {/* 2. PROGRAMS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-green-700" /> Academic Programs
                      </h3>
                      <button onClick={() => setShowProgModal(true)} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 flex items-center gap-1">
                          <Plus className="h-3 w-3" /> Add Program
                      </button>
                  </div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                              <th className="px-6 py-3">Code</th>
                              <th className="px-6 py-3">Program Name</th>
                              <th className="px-6 py-3">Duration (Years)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {programs.map(prog => (
                              <tr key={prog.id} className="border-b border-gray-50">
                                  <td className="px-6 py-3 font-medium">{prog.code}</td>
                                  <td className="px-6 py-3">{prog.name}</td>
                                  <td className="px-6 py-3">{prog.durationYears} Years</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* 3. BATCHES */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-green-700" /> Student Batches
                      </h3>
                  </div>
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                              <th className="px-6 py-3">Batch Name</th>
                              <th className="px-6 py-3">Program</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3 text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody>
                          {batches.map((batch) => (
                              <tr key={batch.id} className="border-b border-gray-50">
                                  <td className="px-6 py-3 font-medium">{batch.name}</td>
                                  <td className="px-6 py-3">{batch.program}</td>
                                  <td className="px-6 py-3">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${batch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {batch.isActive ? 'Active' : 'Archived'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                      <button onClick={() => toggleBatch(batch)} className={`text-xs font-medium px-3 py-1 rounded border ${batch.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                          {batch.isActive ? 'Deactivate' : 'Activate'}
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- STUDENTS TAB --- */}
      {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-gray-800">Student Directory</h3>
                      <button onClick={() => { setCreateType('STUDENT'); setShowCreateUser(true); }} className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1">
                          <Plus className="h-3 w-3" /> New Student
                      </button>
                  </div>
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500" />
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Info</th>
                        <th className="px-6 py-3">Program/Batch</th>
                        <th className="px-6 py-3">Hall</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {getFilteredUsers('STUDENT').map((student) => (
                        <tr key={student.email} className={`border-b border-gray-50 hover:bg-gray-50/50 ${student.isDismissed ? 'bg-red-50' : ''}`}>
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                                <div className="text-xs text-gray-500">{student.studentId}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium">{student.program}</div>
                                <div className="text-xs text-gray-500">{batches.find(b => b.id === student.batchId)?.name || student.batchId}</div>
                            </td>
                            <td className="px-6 py-4">{halls.find(h => h.id === student.hallId)?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4">
                                {student.isDismissed ? <span className="text-red-700 font-bold text-xs">DISMISSED</span> : 
                                <span className={`px-2 py-1 rounded text-xs font-bold ${student.role === UserRole.HALL_EXECUTIVE ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {student.role === UserRole.HALL_EXECUTIVE ? 'EXECUTIVE' : 'STUDENT'}
                                </span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => setEditingUser(student)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => handleDismiss(student)} className={`p-1.5 rounded ${student.isDismissed ? 'text-green-600' : 'text-red-600'}`}>{student.isDismissed ? <CheckCircle className="h-4 w-4"/> : <UserX className="h-4 w-4" />}</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* --- MASTERS TAB --- */}
      {activeTab === 'masters' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-gray-800">Hall Masters</h3>
                      <button onClick={() => { setCreateType('MASTER'); setShowCreateUser(true); }} className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"><Plus className="h-3 w-3" /> New Master</button>
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Hall</th><th className="px-6 py-3 text-center">Edit</th></tr>
                    </thead>
                    <tbody>
                    {getFilteredUsers('MASTER').map((master) => (
                        <tr key={master.email} className="border-b border-gray-50">
                            <td className="px-6 py-4 font-medium">{master.firstName} {master.lastName}</td>
                            <td className="px-6 py-4">{master.email}</td>
                            <td className="px-6 py-4">{halls.find(h => h.id === master.hallId)?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4 text-center"><button onClick={() => setEditingUser(master)} className="p-1.5 text-blue-600"><Edit2 className="h-4 w-4" /></button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* --- CREATE USER MODAL --- */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between mb-4"><h3 className="font-bold">Create User</h3><button onClick={() => setShowCreateUser(false)}><X className="h-5 w-5"/></button></div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="First Name" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="border p-2 rounded w-full"/>
                        <input required placeholder="Last Name" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="border p-2 rounded w-full"/>
                    </div>
                    <input required type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="border p-2 rounded w-full"/>
                    {createType === 'STUDENT' && (
                        <>
                            <input required placeholder="Index Number" value={newUser.studentId} onChange={e => setNewUser({...newUser, studentId: e.target.value})} className="border p-2 rounded w-full"/>
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newUser.program} onChange={e => setNewUser({...newUser, program: e.target.value})} className="border p-2 rounded w-full">
                                    {programs.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                                </select>
                                <select value={newUser.batchId} onChange={e => setNewUser({...newUser, batchId: e.target.value})} className="border p-2 rounded w-full">
                                    <option value="">Batch</option>
                                    {batches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <select required value={newUser.hallId} onChange={e => setNewUser({...newUser, hallId: e.target.value})} className="border p-2 rounded w-full">
                        <option value="">Select Hall</option>
                        {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                    <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-2 rounded">Create Profile</button>
                </form>
             </div>
        </div>
      )}

      {/* --- SEMESTER SETUP MODAL --- */}
      {showSemModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Setup New Semester</h3><button onClick={() => setShowSemModal(false)}><X className="h-5 w-5"/></button></div>
                  <form onSubmit={handleCreateSemester} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500">Academic Year</label>
                          <input type="text" required value={newSem.academicYear} onChange={e => setNewSem({...newSem, academicYear: e.target.value})} className="border p-2 rounded w-full" placeholder="2025/2026"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Semester</label>
                          <select value={newSem.semesterNumber} onChange={e => setNewSem({...newSem, semesterNumber: Number(e.target.value)})} className="border p-2 rounded w-full">
                              <option value={1}>Semester 1</option>
                              <option value={2}>Semester 2</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500">Dues Open Date</label>
                              <input type="date" required value={newSem.startDate} onChange={e => setNewSem({...newSem, startDate: e.target.value})} className="border p-2 rounded w-full"/>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500">Dues Close Date</label>
                              <input type="date" required value={newSem.endDate} onChange={e => setNewSem({...newSem, endDate: e.target.value})} className="border p-2 rounded w-full"/>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Hall Dues Amount (GH₵)</label>
                          <input type="number" required value={newSem.duesAmount} onChange={e => setNewSem({...newSem, duesAmount: Number(e.target.value)})} className="border p-2 rounded w-full"/>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800">
                          Warning: This will close any currently open semester and set this one as Active.
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-2 rounded">Setup & Activate</button>
                  </form>
              </div>
          </div>
      )}

      {/* --- ADD PROGRAM MODAL --- */}
      {showProgModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                  <div className="flex justify-between mb-4"><h3 className="font-bold">Add Academic Program</h3><button onClick={() => setShowProgModal(false)}><X className="h-5 w-5"/></button></div>
                  <form onSubmit={handleAddProgram} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500">Program Code</label>
                          <input type="text" required value={newProg.code} onChange={e => setNewProg({...newProg, code: e.target.value.toUpperCase()})} className="border p-2 rounded w-full" placeholder="e.g. MID"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Program Name</label>
                          <input type="text" required value={newProg.name} onChange={e => setNewProg({...newProg, name: e.target.value})} className="border p-2 rounded w-full" placeholder="e.g. Midwifery"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Duration (Years)</label>
                          <input type="number" required value={newProg.durationYears} onChange={e => setNewProg({...newProg, durationYears: Number(e.target.value)})} className="border p-2 rounded w-full"/>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-2 rounded">Add Program</button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;
