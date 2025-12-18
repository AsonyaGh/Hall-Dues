import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, getPayments, getHalls, getSettings, addPayment } from '../services/storageService';
import { User, Payment, UserRole, Hall, SystemSettings } from '../types';
import { Loader2, Search, Wallet, CheckCircle, XCircle, Filter, Download } from 'lucide-react';

const DuesManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [students, setStudents] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHall, setSelectedHall] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  // Payment Modal
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [payAmount, setPayAmount] = useState(20);
  const [payReceipt, setPayReceipt] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [uList, pList, hList, sList] = await Promise.all([
            getUsers(),
            getPayments(),
            getHalls(),
            getSettings()
        ]);

        let filteredStudents = uList.filter(u => u.role === UserRole.STUDENT || u.role === UserRole.HALL_EXECUTIVE);
        
        // If not Admin, filter by user's hall
        if (user?.role !== UserRole.SUPER_ADMIN && user?.hallId) {
            filteredStudents = filteredStudents.filter(u => u.hallId === user.hallId);
            setSelectedHall(user.hallId); // Lock filter
        }

        setStudents(filteredStudents);
        setPayments(pList);
        setHalls(hList);
        setSettings(sList);
        setPayAmount(sList.defaultDuesAmount || 20);

    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const currentSemesterKey = settings ? `${settings.currentAcademicYear} - Sem ${settings.currentSemester}` : '';

  const isPaid = (studentId: string) => {
      // Check payment by Student ID or Auth ID (handling legacy vs new)
      return payments.some(p => 
          (p.studentId === studentId) && 
          p.semester === currentSemesterKey
      );
  };

  const getFilteredStudents = () => {
      return students.filter(s => {
          const matchesSearch = 
            s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.studentId || '').toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesHall = selectedHall === 'ALL' || s.hallId === selectedHall;

          const paidStatus = isPaid(s.studentId || s.id);
          const matchesStatus = 
            statusFilter === 'ALL' || 
            (statusFilter === 'PAID' && paidStatus) || 
            (statusFilter === 'UNPAID' && !paidStatus);

          return matchesSearch && matchesHall && matchesStatus;
      });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudent || !user) return;
      setProcessing(true);

      try {
          const newPayment: Payment = {
              id: '',
              studentId: selectedStudent.studentId || selectedStudent.id, // Prefer Index Number
              studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
              hallId: selectedStudent.hallId || user.hallId || '',
              amount: payAmount,
              semester: currentSemesterKey,
              receiptNumber: payReceipt,
              datePaid: new Date().toISOString(),
              recordedBy: user.id
          };
          
          await addPayment(newPayment);
          await loadData(); // Refresh to update status
          setSelectedStudent(null);
          setPayReceipt('');
      } catch (err) {
          alert('Failed to record payment');
      } finally {
          setProcessing(false);
      }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Hall Dues Management</h1>
            <p className="text-sm text-gray-500">Semester: <span className="font-semibold text-green-700">{currentSemesterKey}</span></p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search name or ID..." 
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none focus:border-green-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            {/* Hall Filter (Admin Only) */}
            {user?.role === UserRole.SUPER_ADMIN && (
                <select 
                    value={selectedHall} 
                    onChange={e => setSelectedHall(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
                >
                    <option value="ALL">All Halls</option>
                    {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            )}
             <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value as any)}
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
            >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
            </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Student</th>
                        <th className="px-6 py-3">Hall</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {getFilteredStudents().length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">No students found matching criteria.</td></tr>
                    ) : (
                        getFilteredStudents().map(student => {
                            const paid = isPaid(student.studentId || student.id);
                            return (
                                <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                                        <div className="text-xs text-gray-500">{student.studentId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {halls.find(h => h.id === student.hallId)?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {paid ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                <CheckCircle className="h-3 w-3"/> Paid
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                <XCircle className="h-3 w-3"/> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!paid && (
                                            <button 
                                                onClick={() => setSelectedStudent(student)}
                                                className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 ml-auto"
                                            >
                                                <Wallet className="h-3 w-3" /> Collect Dues
                                            </button>
                                        )}
                                        {paid && (
                                            <span className="text-xs text-gray-400">Paid</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
          </div>
      </div>

      {/* Payment Modal */}
      {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                  <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Record Payment</h3>
                      <p className="text-sm text-gray-500 mb-4">Collecting dues from <span className="font-semibold text-gray-800">{selectedStudent.firstName} {selectedStudent.lastName}</span></p>
                      
                      <form onSubmit={handleRecordPayment} className="space-y-4">
                          <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase">Amount (GH₵)</label>
                              <input 
                                type="number" 
                                value={payAmount} 
                                onChange={e => setPayAmount(Number(e.target.value))}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-semibold text-gray-500 uppercase">Receipt Number <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                required
                                placeholder="Enter Receipt #"
                                value={payReceipt} 
                                onChange={e => setPayReceipt(e.target.value)}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-500 outline-none"
                              />
                          </div>

                          <div className="flex gap-3 pt-2">
                              <button 
                                type="button" 
                                onClick={() => setSelectedStudent(null)}
                                className="flex-1 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 font-medium"
                              >
                                  Cancel
                              </button>
                              <button 
                                type="submit" 
                                disabled={processing}
                                className="flex-1 py-2 text-white bg-green-700 rounded hover:bg-green-800 font-medium flex justify-center items-center"
                              >
                                  {processing ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Confirm Payment'}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DuesManagement;