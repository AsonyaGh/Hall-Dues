import React, { useState, useEffect } from 'react';
import { getHalls, getBatches, getUsers, getPayments, saveBatch } from '../../services/storageService';
import { Batch, UserRole, Hall, User, Payment } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, GraduationCap, Wallet, Building2, Plus, Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches'>('overview');
  const [loading, setLoading] = useState(true);
  
  const [halls, setHalls] = useState<Hall[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadData = async () => {
        try {
            const [h, b, u, p] = await Promise.all([
                getHalls(),
                getBatches(),
                getUsers(),
                getPayments()
            ]);
            setHalls(h);
            setBatches(b);
            setUsers(u);
            setPayments(p);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;

  const revenueByHall = halls.map(hall => {
    const amount = payments
      .filter(p => p.hallId === hall.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return { name: hall.name, amount };
  });

  const toggleBatch = async (batch: Batch) => {
    setLoading(true);
    const updatedBatch = { ...batch, isActive: !batch.isActive };
    await saveBatch(updatedBatch);
    // Reload local state
    const newBatches = await getBatches();
    setBatches(newBatches);
    setLoading(false);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">System Administration</h1>
        <div className="text-sm text-gray-500">
          Academic Year: <span className="font-semibold text-green-700">2023/2024</span>
        </div>
      </div>

      {/* Stats Grid */}
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

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-4 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
        >
          Revenue Overview
        </button>
        <button 
          onClick={() => setActiveTab('batches')}
          className={`pb-2 px-4 text-sm font-medium ${activeTab === 'batches' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}
        >
          Manage Batches
        </button>
      </div>

      {activeTab === 'overview' && (
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
      )}

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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;