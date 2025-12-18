import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getHalls, getBatches, getUsers, getPayments, saveBatch, updateUser, getSettings } from '../../services/storageService';
import { Batch, UserRole, Hall, User, Payment, Program, SystemSettings } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Wallet, Building2, Plus, Loader2, Search, Edit2, Shield, ShieldAlert, UserX, CheckCircle, AlertTriangle, X } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'students'>('overview');
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

  useEffect(() => {
    // If navigating directly to students via URL (optional future enhancement), or tab switching logic
    if (location.pathname.includes('/admin/students')) {
        setActiveTab('students');
    } else if (location.pathname.includes('/admin/batches')) {
        setActiveTab('batches');
    }
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

  const handlePromote = async (user: User) => {
    if (!window.confirm(`Are you sure you want to promote ${user.firstName} to Hall Executive?`)) return;
    const updated = { ...user, role: UserRole.HALL_EXECUTIVE };
    setLoading(true);
    await updateUser(updated);
    await loadData();
  };

  const handleDemote = async (user: User) => {
    if (!window.confirm(`Demote ${user.firstName} back to regular Student?`)) return;
    const updated = { ...user, role: UserRole.STUDENT };
    setLoading(true);
    await updateUser(updated);
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

  // --- Render Helpers ---
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalStudents = users.filter(u => u.role === UserRole.STUDENT || u.role === UserRole.HALL_EXECUTIVE).length;

  const revenueByHall = halls.map(hall => {
    const amount = payments
      .filter(p => p.hallId === hall.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return { name: hall.name, amount };
  });

  const getStudentList = () => {
    return users.filter(u => 
        (u.role === UserRole.STUDENT || u.role === UserRole.HALL_EXECUTIVE) && 
        (u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         u.studentId?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Calculate Year based on academic calendar
  const getAcademicYearLevel = (batchName?: string) => {
      // Very basic logic: If batch name has "23", and current year is "2025", diff is 2.
      // In production, this would rely on complex batch start date logic.
      // For this demo, we assume the Batch ID/Name stays constant.
      return "Calculated";
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
      <div className="flex gap-4 border-b border-gray-200 bg-white px-4 pt-4 rounded-t-xl">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 text-sm font-medium ${activeTab === 'students' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}
        >
          Student Management
        </button>
        <button 
          onClick={() => setActiveTab('batches')}
          className={`pb-3 px-4 text-sm font-medium ${activeTab === 'batches' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}
        >
          Batches & Settings
        </button>
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
                  <h3 className="font-semibold text-gray-800">Student Directory</h3>
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
                    {getStudentList().map((student) => (
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
                                    
                                    {student.role === UserRole.STUDENT && !student.isDismissed && (
                                        <button onClick={() => handlePromote(student)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Promote to Hall Executive">
                                            <Shield className="h-4 w-4" />
                                        </button>
                                    )}
                                    
                                    {student.role === UserRole.HALL_EXECUTIVE && !student.isDismissed && (
                                        <button onClick={() => handleDemote(student)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Demote to Student">
                                            <ShieldAlert className="h-4 w-4" />
                                        </button>
                                    )}

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

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-gray-800">Edit Student Profile</h3>
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
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Index Number</label>
                        <input type="text" value={editingUser.studentId} onChange={e => setEditingUser({...editingUser, studentId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Hall</label>
                            <select value={editingUser.hallId} onChange={e => setEditingUser({...editingUser, hallId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Batch</label>
                            <select value={editingUser.batchId} onChange={e => setEditingUser({...editingUser, batchId: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Program</label>
                        <select value={editingUser.program} onChange={e => setEditingUser({...editingUser, program: e.target.value as Program})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                            {Object.values(Program).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

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