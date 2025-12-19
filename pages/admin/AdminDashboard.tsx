
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    getHalls, getBatches, getUsers, getPayments, saveBatch, updateUser, getSettings, 
    registerUserWithPassword, getPrograms, addProgram, setupNewSemester, getSemesters, getActiveSemester, adminSendPasswordReset, deleteUserProfile,
    getExpenses, addExpense
} from '../../services/storageService';
import { Batch, UserRole, Hall, User, Payment, SystemSettings, AcademicProgram, Semester, Program, Expense } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Wallet, Building2, Plus, Loader2, Search, Edit2, Shield, ShieldAlert, UserX, CheckCircle, AlertTriangle, X, UserCog, Calendar, BookOpen, Clock, Lock, Key, Download, FileText, Filter, Trash2, Receipt } from 'lucide-react';

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'students' | 'masters' | 'expenses' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [halls, setHalls] = useState<Hall[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createType, setCreateType] = useState<'STUDENT' | 'MASTER'>('STUDENT');
  
  // Create User Form
  const [newUser, setNewUser] = useState<Partial<User>>({
      firstName: '', lastName: '', email: '', studentId: '', program: 'NAC', hallId: ''
  });
  const [newUserPassword, setNewUserPassword] = useState('password123'); // Default

  // Reports Filter State
  const [reportHallFilter, setReportHallFilter] = useState('ALL');
  const [reportYearFilter, setReportYearFilter] = useState('');
  const [reportSemFilter, setReportSemFilter] = useState('ALL');

  // Academic Modals
  const [showSemModal, setShowSemModal] = useState(false);
  const [newSem, setNewSem] = useState({
      academicYear: '2025/2026', semesterNumber: 1, startDate: '', endDate: '', duesAmount: 20
  });
  const [showProgModal, setShowProgModal] = useState(false);
  const [newProg, setNewProg] = useState({ id: '', code: '', name: '', durationYears: 2 });
  
  // Batch Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', program: 'NAC' });

  // Expense Modal
  const [showExpModal, setShowExpModal] = useState(false);
  const [newExp, setNewExp] = useState<Partial<Expense>>({
      title: '', amount: 0, category: 'Maintenance', description: '', hallId: 'GENERAL'
  });

  useEffect(() => {
    if (location.pathname.includes('/admin/students')) setActiveTab('students');
    else if (location.pathname.includes('/admin/academics') || location.pathname.includes('/admin/batches')) setActiveTab('academics');
    else if (location.pathname.includes('/admin/masters')) setActiveTab('masters');
    else if (location.pathname.includes('/admin/reports')) setActiveTab('reports');
  }, [location]);

  // Set default report filters based on active session
  useEffect(() => {
      if (currentUser?.role === UserRole.HALL_MASTER && currentUser.hallId) {
          setReportHallFilter(currentUser.hallId);
      }
      if (activeSemester) {
          setReportYearFilter(activeSemester.academicYear);
          setReportSemFilter(activeSemester.semesterNumber.toString());
      }
  }, [currentUser, activeSemester]);

  const loadData = async () => {
    try {
        const [h, b, u, p, s, prog, sem, activeSem, exp] = await Promise.all([
            getHalls(),
            getBatches(),
            getUsers(),
            getPayments(),
            getSettings(),
            getPrograms(),
            getSemesters(),
            getActiveSemester(),
            getExpenses()
        ]);
        setHalls(h);
        setBatches(b);
        setUsers(u);
        setPayments(p);
        setSettings(s);
        setPrograms(prog);
        setSemesters(sem);
        setActiveSemester(activeSem);
        setExpenses(exp);
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

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const batchId = newBatch.name.toLowerCase().replace(/\s+/g, '_');
        const batchData: Batch = {
            id: batchId,
            name: newBatch.name,
            program: newBatch.program,
            isActive: true
        };
        await saveBatch(batchData);
        setShowBatchModal(false);
        setNewBatch({ name: '', program: 'NAC' });
        await loadData();
    } catch (err) {
        alert("Error adding batch: " + err);
    } finally {
        setLoading(false);
    }
  };

  const handleDismiss = async (user: User) => {
    const action = user.isDismissed ? 'Re-activate' : 'Dismiss';
    if (!window.confirm(`${action} student account for ${user.firstName}?`)) return;
    const updated = { ...user, isDismissed: !user.isDismissed };
    setLoading(true);
    await updateUser(updated);
    await loadData();
  };

  const handleDeleteUser = async (user: User) => {
      if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE ${user.firstName} ${user.lastName} (${user.email})? This action cannot be undone.`)) return;
      
      setLoading(true);
      try {
          await deleteUserProfile(user.email);
          await loadData();
      } catch (e: any) {
          alert("Error deleting user: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const saveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
        await updateUser(editingUser);
        setEditingUser(null);
        await loadData();
    } catch (err) {
        alert("Error updating user: " + err);
    } finally {
        setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
      if(!editingUser) return;
      if(window.confirm(`Send password reset link to ${editingUser.email}?`)) {
          try {
              await adminSendPasswordReset(editingUser.email);
              alert(`Reset email sent to ${editingUser.email}`);
          } catch(e: any) {
              alert("Error: " + e.message);
          }
      }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Construct base user object without potential undefined student fields
          let userToCreate: User = {
              id: '', // Auth will assign
              firstName: newUser.firstName!,
              lastName: newUser.lastName!,
              email: newUser.email!,
              role: createType === 'MASTER' ? UserRole.HALL_MASTER : UserRole.STUDENT,
              hallId: newUser.hallId,
          };

          // Only add student fields if creating a student
          if (createType === 'STUDENT') {
              userToCreate = {
                  ...userToCreate,
                  studentId: newUser.studentId,
                  program: newUser.program,
                  batchId: newUser.batchId
              };
          }

          await registerUserWithPassword(userToCreate, newUserPassword);
          
          alert(`User created successfully with password: ${newUserPassword}`);
          setShowCreateUser(false);
          setNewUser({ firstName: '', lastName: '', email: '', studentId: '', program: 'NAC', hallId: '' });
          setNewUserPassword('password123');
          await loadData();
      } catch (err: any) {
          alert('Error creating user: ' + err.message);
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

  const handleAddExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      setLoading(true);
      try {
          const expense: Expense = {
              id: '',
              hallId: newExp.hallId || 'GENERAL',
              title: newExp.title || '',
              amount: Number(newExp.amount),
              category: newExp.category || 'Maintenance',
              description: newExp.description || '',
              date: new Date().toISOString(),
              recordedBy: currentUser.id
          };
          await addExpense(expense);
          setShowExpModal(false);
          setNewExp({ title: '', amount: 0, category: 'Maintenance', description: '', hallId: 'GENERAL' });
          await loadData();
      } catch (e: any) {
          alert("Error adding expense: " + e.message);
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

  // --- Report Helpers ---
  const getUniqueYears = () => Array.from(new Set(semesters.map(s => s.academicYear)));

  const getReportData = () => {
      // Find the specific semester config based on filters
      let targetSemester: Semester | undefined;
      
      if (reportYearFilter && reportSemFilter !== 'ALL') {
          targetSemester = semesters.find(s => s.academicYear === reportYearFilter && s.semesterNumber.toString() === reportSemFilter);
      } else {
          targetSemester = activeSemester || undefined;
      }
      
      const semDues = targetSemester?.duesAmount || 0;
      const semId = targetSemester?.id;

      // Filter Users (Eligible for payment)
      const eligibleStudents = users.filter(u => 
          (u.role === UserRole.STUDENT || u.role === UserRole.HALL_EXECUTIVE) && 
          !u.isDismissed &&
          (reportHallFilter === 'ALL' || u.hallId === reportHallFilter)
      );

      // Filter Payments
      const filteredPayments = payments.filter(p => {
          const matchSem = semId ? p.semesterId === semId : true; 
          const matchHall = reportHallFilter === 'ALL' || p.hallId === reportHallFilter;
          return matchSem && matchHall;
      });

      // Filter Expenses (Independent of Semester usually, but for report sake, we might check date range.
      // For simplicity here, we assume expenses are not tied to semester objects directly but we show all or maybe active one? 
      // Let's filter Expenses by hall. Date filtering is complex without semester dates. 
      // We will show total expenses filtered by Hall for now, or all if ALL.)
      const filteredExpenses = expenses.filter(e => {
          if (reportHallFilter === 'ALL') return true;
          return e.hallId === reportHallFilter;
      });

      const paidStudentIds = new Set(filteredPayments.map(p => p.studentId));
      const defaulters = eligibleStudents.filter(u => !paidStudentIds.has(u.studentId || u.id));

      const actualRevenue = filteredPayments.reduce((s, p) => s + p.amount, 0);
      const totalExpensesAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

      return {
          expectedRevenue: eligibleStudents.length * semDues,
          actualRevenue,
          totalExpensesAmount,
          netBalance: actualRevenue - totalExpensesAmount,
          defaulters,
          studentCount: eligibleStudents.length,
          targetSemester
      };
  };

  const reportData = getReportData();

  const downloadReport = () => {
    const headers = ["Index Number", "First Name", "Last Name", "Program", "Hall", "Amount Due", "Status"];
    const rows = reportData.defaulters.map(u => [
        u.studentId || '',
        u.firstName,
        u.lastName,
        u.program || '',
        halls.find(h => h.id === u.hallId)?.name || 'Unknown',
        reportData.targetSemester?.duesAmount.toString() || '0',
        'UNPAID'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${reportData.targetSemester?.academicYear.replace('/','_')}_sem${reportData.targetSemester?.semesterNumber}_${reportHallFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !settings) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">System Administration</h1>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hidden md:block">
          Active: <span className="font-bold text-green-700">{activeSemester?.academicYear} - Sem {activeSemester?.semesterNumber}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 bg-white px-4 pt-4 rounded-t-xl overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Overview</button>
        <button onClick={() => setActiveTab('students')} className={`pb-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'students' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Students</button>
        <button onClick={() => setActiveTab('masters')} className={`pb-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'masters' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Hall Masters</button>
        <button onClick={() => setActiveTab('expenses')} className={`pb-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'expenses' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Expenses</button>
        <button onClick={() => setActiveTab('academics')} className={`pb-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'academics' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Academics & Settings</button>
        <button onClick={() => setActiveTab('reports')} className={`pb-3 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'reports' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500 hover:text-green-600'}`}>Reports</button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* --- EXPENSES TAB --- */}
      {activeTab === 'expenses' && (
          <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Expenses & Maintenance</h3>
                    <p className="text-sm text-gray-500">Record operational costs for the school and halls.</p>
                  </div>
                  <button onClick={() => setShowExpModal(true)} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Add Expense
                  </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                              <th className="px-6 py-3">Date</th>
                              <th className="px-6 py-3">Title/Desc</th>
                              <th className="px-6 py-3">Hall</th>
                              <th className="px-6 py-3">Category</th>
                              <th className="px-6 py-3 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          {expenses.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No expenses recorded yet.</td></tr>
                          ) : (
                              expenses.slice().reverse().map(e => (
                                  <tr key={e.id} className="border-b border-gray-50">
                                      <td className="px-6 py-4 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">
                                          <div className="font-medium text-gray-900">{e.title}</div>
                                          <div className="text-xs text-gray-500">{e.description}</div>
                                      </td>
                                      <td className="px-6 py-4">{e.hallId === 'GENERAL' ? 'General/Admin' : halls.find(h => h.id === e.hallId)?.name || e.hallId}</td>
                                      <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{e.category}</span></td>
                                      <td className="px-6 py-4 text-right font-bold text-red-600">GH₵ {e.amount}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- REPORTS TAB --- */}
      {activeTab === 'reports' && (
          <div className="space-y-6">
              {/* Report Filters */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">Filters:</span>
                  </div>
                  
                  {/* Academic Year */}
                  <select 
                      value={reportYearFilter} 
                      onChange={e => setReportYearFilter(e.target.value)}
                      className="text-sm border rounded p-2 focus:border-green-500 outline-none"
                  >
                      <option value="">Select Year</option>
                      {getUniqueYears().map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                  {/* Semester */}
                  <select 
                      value={reportSemFilter} 
                      onChange={e => setReportSemFilter(e.target.value)}
                      className="text-sm border rounded p-2 focus:border-green-500 outline-none"
                  >
                      <option value="ALL">All Semesters</option>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                  </select>

                  {/* Hall Filter (Locked for Hall Masters) */}
                  <select 
                      value={reportHallFilter} 
                      onChange={(e) => setReportHallFilter(e.target.value)}
                      disabled={currentUser?.role === UserRole.HALL_MASTER}
                      className={`text-sm border rounded p-2 focus:border-green-500 outline-none ${currentUser?.role === UserRole.HALL_MASTER ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                      <option value="ALL">All Halls</option>
                      {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
              </div>

              {/* Report Stats */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-700" />
                      Financial Report: {reportData.targetSemester ? `${reportData.targetSemester.academicYear} - Sem ${reportData.targetSemester.semesterNumber}` : 'Custom Selection'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                       <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                           <p className="text-xs font-semibold text-gray-500 uppercase">Expected Revenue</p>
                           <p className="text-2xl font-bold text-gray-800">GH₵ {reportData.expectedRevenue}</p>
                           <p className="text-xs text-gray-400">Based on {reportData.studentCount} eligible students</p>
                       </div>
                       <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                           <p className="text-xs font-semibold text-green-600 uppercase">Actual Income</p>
                           <p className="text-2xl font-bold text-green-800">GH₵ {reportData.actualRevenue}</p>
                           <div className="w-full bg-green-200 h-1.5 rounded-full mt-2">
                               <div className="bg-green-600 h-1.5 rounded-full" style={{ width: reportData.expectedRevenue > 0 ? `${(reportData.actualRevenue / reportData.expectedRevenue) * 100}%` : '0%' }}></div>
                           </div>
                       </div>
                       <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                           <p className="text-xs font-semibold text-red-600 uppercase">Total Expenses</p>
                           <p className="text-2xl font-bold text-red-800">GH₵ {reportData.totalExpensesAmount}</p>
                       </div>
                       <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                           <p className="text-xs font-semibold text-blue-600 uppercase">Net Balance</p>
                           <p className={`text-2xl font-bold ${reportData.netBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>GH₵ {reportData.netBalance}</p>
                       </div>
                  </div>
              </div>

              {/* Report List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">Unpaid Students List</h3>
                      <button 
                        onClick={downloadReport}
                        className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2"
                      >
                          <Download className="h-4 w-4" /> Download Report (CSV)
                      </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Student Info</th>
                            <th className="px-6 py-3">Program</th>
                            <th className="px-6 py-3">Hall</th>
                            <th className="px-6 py-3 text-right">Amount Due</th>
                        </tr>
                        </thead>
                        <tbody>
                        {reportData.defaulters.slice(0, 50).map((student) => (
                            <tr key={student.email} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                                    <div className="text-xs text-gray-500">{student.studentId}</div>
                                </td>
                                <td className="px-6 py-4">{student.program}</td>
                                <td className="px-6 py-4">{halls.find(h => h.id === student.hallId)?.name || 'Unassigned'}</td>
                                <td className="px-6 py-4 text-right font-medium text-red-600">GH₵ {reportData.targetSemester?.duesAmount || 0}</td>
                            </tr>
                        ))}
                        {reportData.defaulters.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No defaulters found for this selection!</td></tr>
                        )}
                        {reportData.defaulters.length > 50 && (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-400 text-xs">Showing first 50 of {reportData.defaulters.length} records. Download CSV for full list.</td></tr>
                        )}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- ACADEMICS TAB --- */}
      {activeTab === 'academics' && (
          <div className="space-y-6">
              {/* Semester, Programs, Batches UI (Same as previous) */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                      <div>
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-green-700" />
                              Semester Configuration
                          </h3>
                          <p className="text-sm text-gray-500">Manage the active academic period and dues.</p>
                      </div>
                      <button onClick={() => setShowSemModal(true)} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium w-full md:w-auto">
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
               {/* Programs & Batches Tables (Kept concise for brevity, logic remains same) */}
               <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen className="h-5 w-5 text-green-700" /> Programs</h3>
                            <button onClick={() => setShowProgModal(true)} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded"><Plus className="h-3 w-3"/></button>
                        </div>
                        <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Duration</th></tr></thead>
                             <tbody>{programs.map(p => <tr key={p.id} className="border-b border-gray-50"><td className="px-6 py-3">{p.name} ({p.code})</td><td className="px-6 py-3">{p.durationYears} Years</td></tr>)}</tbody>
                        </table>
                    </div>
                     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-green-700" /> Batches</h3>
                            <button onClick={() => setShowBatchModal(true)} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded"><Plus className="h-3 w-3"/></button>
                        </div>
                         <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-gray-500 uppercase text-xs"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
                             <tbody>{batches.map(b => <tr key={b.id} className="border-b border-gray-50"><td className="px-6 py-3">{b.name}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs ${b.isActive?'bg-green-100 text-green-800':'bg-gray-100'}`}>{b.isActive?'Active':'Archived'}</span></td><td className="px-6 py-3 text-right"><button onClick={() => toggleBatch(b)} className="text-xs text-blue-600">Toggle</button></td></tr>)}</tbody>
                        </table>
                    </div>
               </div>
          </div>
      )}

      {/* --- STUDENTS TAB --- */}
      {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-gray-800">Student Directory</h3>
                      <button onClick={() => { setCreateType('STUDENT'); setShowCreateUser(true); }} className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 whitespace-nowrap">
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
                                <button onClick={() => handleDeleteUser(student)} className="p-1.5 text-red-600 hover:bg-red-50 rounded ml-1" title="Delete User"><Trash2 className="h-4 w-4" /></button>
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
                      <button onClick={() => { setCreateType('MASTER'); setShowCreateUser(true); }} className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 whitespace-nowrap"><Plus className="h-3 w-3" /> New Master</button>
                  </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Hall</th><th className="px-6 py-3 text-center">Actions</th></tr>
                    </thead>
                    <tbody>
                    {getFilteredUsers('MASTER').map((master) => (
                        <tr key={master.email} className="border-b border-gray-50">
                            <td className="px-6 py-4 font-medium">{master.firstName} {master.lastName}</td>
                            <td className="px-6 py-4">{master.email}</td>
                            <td className="px-6 py-4">{halls.find(h => h.id === master.hallId)?.name || 'Unassigned'}</td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => setEditingUser(master)} className="p-1.5 text-blue-600"><Edit2 className="h-4 w-4" /></button>
                                <button onClick={() => handleDeleteUser(master)} className="p-1.5 text-red-600 hover:bg-red-50 rounded ml-1" title="Delete User"><Trash2 className="h-4 w-4" /></button>
                            </td>
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
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between mb-4"><h3 className="font-bold">Create User</h3><button onClick={() => setShowCreateUser(false)}><X className="h-5 w-5"/></button></div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="First Name" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="border p-2 rounded w-full"/>
                        <input required placeholder="Last Name" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="border p-2 rounded w-full"/>
                    </div>
                    <input required type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="border p-2 rounded w-full"/>
                    
                    {/* NEW PASSWORD FIELD */}
                    <div className="bg-green-50 p-3 rounded border border-green-100">
                        <label className="text-xs font-bold text-green-800 uppercase block mb-1">Set Password</label>
                        <input required type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="border p-2 rounded w-full bg-white"/>
                    </div>

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

      {/* --- ADD EXPENSE MODAL --- */}
      {showExpModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between mb-4"><h3 className="font-bold">Record General Expense</h3><button onClick={() => setShowExpModal(false)}><X className="h-5 w-5"/></button></div>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500">Title</label>
                          <input required type="text" value={newExp.title} onChange={e => setNewExp({...newExp, title: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. Server Maintenance"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500">Amount (GH₵)</label>
                          <input required type="number" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: Number(e.target.value)})} className="w-full border p-2 rounded"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500">Category</label>
                          <select value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})} className="w-full border p-2 rounded">
                              <option value="Maintenance">Maintenance</option>
                              <option value="Utilities">Utilities</option>
                              <option value="Events">Events</option>
                              <option value="Supplies">Supplies</option>
                              <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Hall Allocation</label>
                          <select value={newExp.hallId} onChange={e => setNewExp({...newExp, hallId: e.target.value})} className="w-full border p-2 rounded">
                              <option value="GENERAL">General / Admin</option>
                              {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Description</label>
                          <textarea value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} className="w-full border p-2 rounded h-20" placeholder="Details..."/>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded">Record Expense</button>
                  </form>
              </div>
          </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                                    <select value={editingUser.program || Program.NAC} onChange={e => setEditingUser({...editingUser, program: e.target.value as any})} className="w-full border p-2 rounded outline-none focus:border-green-500">
                                        {Object.values(Program).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* Security Section */}
                     <div className="pt-2 border-t border-gray-100">
                        <button 
                            type="button"
                            onClick={handleSendResetEmail}
                            className="text-xs text-red-700 bg-red-50 py-2 rounded font-bold w-full flex items-center justify-center gap-2 hover:bg-red-100 uppercase tracking-wide"
                        >
                            <Lock className="h-3 w-3" /> 
                            Send Password Reset Email
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2 text-center">To set a password manually, create a new user account.</p>
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

       {/* --- ADD BATCH MODAL --- */}
       {showBatchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                  <div className="flex justify-between mb-4"><h3 className="font-bold">Add New Batch</h3><button onClick={() => setShowBatchModal(false)}><X className="h-5 w-5"/></button></div>
                  <form onSubmit={handleAddBatch} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500">Batch Name</label>
                          <input type="text" required value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} className="border p-2 rounded w-full" placeholder="e.g. NAC 21"/>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500">Program</label>
                           <select value={newBatch.program} onChange={e => setNewBatch({...newBatch, program: e.target.value})} className="border p-2 rounded w-full">
                                    {programs.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                            </select>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-green-700 text-white py-2 rounded">Create Batch</button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;
