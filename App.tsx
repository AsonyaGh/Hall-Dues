import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import HallDashboard from './pages/hall/HallDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

// Placeholder components for routes not fully detailed in this snippet
const Placeholder = ({ title }: { title: string }) => (
    <div className="p-4 text-center text-gray-500">
        <h2 className="text-xl font-bold">{title}</h2>
        <p>This module is under construction.</p>
    </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Admin Routes */}
                <Route path="/admin/halls" element={<AdminDashboard />} /> 
                <Route path="/admin/batches" element={<AdminDashboard />} />
                <Route path="/admin/reports" element={<Placeholder title="Global Reports" />} />

                {/* Hall Routes (Reusing the HallDashboard with specific tabs or just same view for demo) */}
                <Route path="/hall/students" element={<HallDashboard />} />
                <Route path="/hall/payments" element={<HallDashboard />} />
                <Route path="/hall/payment-entry" element={<HallDashboard />} />
                <Route path="/hall/complaints" element={<HallDashboard />} />

                {/* Student Routes */}
                <Route path="/student/history" element={<StudentDashboard />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;