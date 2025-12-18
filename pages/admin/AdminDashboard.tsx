import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getHalls, getBatches, getUsers, getPayments, saveBatch, updateUser, getSettings, createUserProfile } from '../../services/storageService';
import { Batch, UserRole, Hall, User, Payment, Program, SystemSettings } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Wallet, Building2, Plus, Loader2, Search, Edit2, Shield, ShieldAlert, UserX, CheckCircle, AlertTriangle, X, UserCog } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'students' | 'masters'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [halls, setHalls] = useState<Hall[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Create User Modal State
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createType, setCreateType] = useState<'STUDENT' | 'MASTER'>('STUDENT');
  const [newUser, setNewUser] = useState<Partial<User>>({
      firstName: '', lastName: '', email: '', studentId: '', program: Program.NAC
  });

  useEffect(() => {
    if (location.pathname.includes('/admin/students')) setActiveTab('students');
    else if (location.pathname.includes('/admin/batches')) setActiveTab('batches');
    else if (location.pathname.includes('/admin/masters')) setActiveTab('masters');
  }, [location]);

  const loadData = async () => {
    try {
        const [h, b, u, p, s] = await Promise.all([
            getHalls(),
            getBatches(),
            getUsers(),
            getPayments(),
            getSettings()
        ]);
        setHalls(h);
        setBatches(b);
        setUsers(u);
        setPayments(p);
        setSettings(s);
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
    await loadData(); // Reload all
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
          const userToCreate: User = {
              id: '', // Will be assigned by Auth when they register, but for now we rely on Email key
              firstName: newUser.firstName!,
              lastName: newUser.lastName!,
              email: newUser.email!,
              role: createType === 'MASTER' ? UserRole.HALL_MASTER : UserRole.STUDENT,
              hallId: newUser.hallId,
              studentId: createType === 'STUDENT' ? newUser.studentId : undefined,
              program: createType === 'STUDENT' ? newUser.program : undefined,
              batchId: createType === 'STUDENT' ? newUser.batchId : undefined
          };

          await createUserProfile(userToCreate);
          alert(`User profile created for ${newUser.email}. They must Register with this email to set a password.`);
          setShowCreateUser(false);
          setNewUser({ firstName: '', lastName: '', email: '', studentId: '', program: Program.NAC });
          await loadData();
      } catch (err) {
          alert('Error creating user profile: ' + err);
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
          Academic Year: <span className="font-bold text-green-700">{settings?.currentAcademicYear}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 bg-white px-4 pt-4 rounded-t-xl overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Overview</button>
        <button onClick={() => setActiveTab('students')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'students' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Students</button>
        <button onClick={() => setActiveTab('masters')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'masters' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Hall Masters</button>
        <button onClick={() => setActiveTab('batches')} className={`pb-3 px-4 text-sm font-medium ${activeTab === 'batches' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Batches & Settings</button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">GH₵ {totalRevenue}</h3>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                    <Wallet className="h-5 w-5" />
                    </div>
                </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Students</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalStudents}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Users className="h-5 w-5" />
                    </div>
                </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Active Batches</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{batches.filter(b => b.isActive).length}</h3>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                    <GraduationCap className="h-5 w-5" />
                    </div>
                </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Halls</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{halls.length}</h3>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                    <Building2 className="h-5 w-5" />
                    </div>
                </div>
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

      {/* --- STUDENTS TAB --- */}
      {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-gray-800">Student Directory</h3>
                      <button 
                        onClick={() => { setCreateType('STUDENT'); setShowCreateUser(true); }}
                        className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"
                      >
                          <Plus className="h-3 w-3" /> New Student
                      </button>
                  </div>
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search by name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                      />
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Student Info</th>
                        <th className="px-6 py-3">Program / Batch</th>
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
                                <div className="text-xs text-gray-400">{student.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium">{student.program}</div>
                                <div className="text-xs text-gray-500">
                                    {batches.find(b => b.id === student.batchId)?.name || student.batchId}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {halls.find(h => h.id === student.hallId)?.name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4">
                                {student.isDismissed ? (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">DISMISSED</span>
                                ) : (
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${student.role === UserRole.HALL_EXECUTIVE ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                        {student.role === UserRole.HALL_EXECUTIVE ? 'EXECUTIVE' : 'STUDENT'}
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setEditingUser(student)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit Profile">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDismiss(student)} className={`p-1.5 rounded ${student.isDismissed ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`} title={student.isDismissed ? "Re-activate" : "Dismiss Student"}>
                                        {student.isDismissed ? <CheckCircle className="h-4 w-4"/> : <UserX className="h-4 w-4" />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* --- HALL MASTERS TAB --- */}
      {activeTab === 'masters' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-gray-800">Hall Masters Directory</h3>
                      <button 
                         onClick={() => { setCreateType('MASTER'); setShowCreateUser(true); }}
                         className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"
                      >
                          <Plus className="h-3 w-3" /> New Hall Master
                      </button>
                  </div>
                  <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                      />
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Name</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Assigned Hall</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {getFilteredUsers('MASTER').map((master) => (
                        <tr key={master.email} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {master.firstName} {master.lastName}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{master.email}</td>
                            <td className="px-6 py-4">
                                {halls.find(h => h.id === master.hallId)?.name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => setEditingUser(master)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit Profile">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}

      {/* --- BATCHES TAB --- */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-semibold text-gray-800">Academic Batches</h3>
             <button className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">
                <Plus className="h-4 w-4" /> New Batch
             </button>
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
                <tr key={batch.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{batch.name}</td>
                  <td className="px-6 py-4">{batch.program}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${batch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {batch.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleBatch(batch)}
                      className={`text-xs font-medium px-3 py-1 rounded border ${batch.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                    >
                      {batch.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-yellow-50 text-yellow-800 text-sm flex gap-2 items-center">
             <AlertTriangle className="h-5 w-5" />
             <p><strong>Note:</strong> Closing the Academic Year ({settings?.currentAcademicYear}) will archive current payment records and prepare the system for the next cycle.</p>
          </div>
        </div>
      )}

      {/* --- CREATE USER MODAL --- */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                 <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-gray-800">Create New {createType === 'STUDENT' ? 'Student' : 'Hall Master'}</h3>
                    <button onClick={() => setShowCreateUser(false)}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleCreateUser} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                            <input required type="text" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                            <input required type="text" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                         <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" placeholder="email@ntcwa.edu.gh" />
                    </div>

                    {/* Student Specific Fields */}
                    {createType === 'STUDENT' && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Index Number</label>
                                <input required type="text" value={newUser.studentId} onChange={e => setNewUser({...newUser, studentId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Program</label>
                                    <select value={newUser.program} onChange={e => setNewUser({...newUser, program: e.target.value as Program})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                        {Object.values(Program).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Batch</label>
                                    <select value={newUser.batchId || ''} onChange={e => setNewUser({...newUser, batchId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                        <option value="">Select Batch</option>
                                        {batches.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Assigned Hall</label>
                        <select required value={newUser.hallId || ''} onChange={e => setNewUser({...newUser, hallId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                            <option value="">Select Hall</option>
                            {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>

                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <strong>Note:</strong> This creates the profile. The user must register with this email to set their password.
                    </p>

                     <button type="submit" disabled={loading} className="w-full py-2 text-white bg-green-700 rounded hover:bg-green-800 font-medium flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Create Profile'}
                    </button>
                </form>
             </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-gray-800">Edit Profile</h3>
                    <button onClick={() => setEditingUser(null)}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <form onSubmit={saveUserEdit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">First Name</label>
                            <input type="text" value={editingUser.firstName} onChange={e => setEditingUser({...editingUser, firstName: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Last Name</label>
                            <input type="text" value={editingUser.lastName} onChange={e => setEditingUser({...editingUser, lastName: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                        </div>
                    </div>
                    
                    {/* Role Editing */}
                    <div>
                         <label className="text-xs font-semibold text-gray-500 uppercase">Role</label>
                         <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full border p-2 rounded outline-none focus:border-green-500 bg-yellow-50">
                            <option value={UserRole.STUDENT}>Student</option>
                            <option value={UserRole.HALL_EXECUTIVE}>Hall Executive</option>
                            <option value={UserRole.HALL_MASTER}>Hall Master</option>
                            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                         </select>
                    </div>

                    {editingUser.role !== UserRole.SUPER_ADMIN && (
                         <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Hall</label>
                            <select value={editingUser.hallId || ''} onChange={e => setEditingUser({...editingUser, hallId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                <option value="">Select Hall</option>
                                {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                    )}

                    {(editingUser.role === UserRole.STUDENT || editingUser.role === UserRole.HALL_EXECUTIVE) && (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Index Number</label>
                                <input type="text" value={editingUser.studentId || ''} onChange={e => setEditingUser({...editingUser, studentId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Batch</label>
                                    <select value={editingUser.batchId || ''} onChange={e => setEditingUser({...editingUser, batchId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Program</label>
                                    <select value={editingUser.program || Program.NAC} onChange={e => setEditingUser({...editingUser, program: e.target.value as Program})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                        {Object.values(Program).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 font-medium">Cancel</button>
                        <button type="submit" className="flex-1 py-2 text-white bg-green-700 rounded hover:bg-green-800 font-medium flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;