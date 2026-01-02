import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import HallDashboard from './pages/hall/HallDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import DuesManagement from './pages/DuesManagement';
import ProgramsList from './pages/ProgramsList';
import Announcements from './pages/Announcements';
import { Loader2, AlertTriangle } from 'lucide-react';

// Placeholder components for routes not fully detailed in this snippet
const Placeholder = ({ title }: { title: string }) => (
    <div className="p-4 text-center text-gray-500">
        <h2 className="text-xl font-bold">{title}</h2>
        <p>This module is under construction.</p>
    </div>
);

const NotFound = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Page Not Found</h2>
        <p className="text-gray-500 mt-2">The requested page could not be found within the application.</p>
    </div>
);

// Wrapper for protected routes
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-green-700 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Loading System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Shared Route */}
                  <Route path="/dues" element={<DuesManagement />} />
                  <Route path="/programs" element={<ProgramsList />} />
                  <Route path="/announcements" element={<Announcements />} />

                  {/* Admin Routes */}
                  <Route path="/admin/halls" element={<AdminDashboard />} /> 
                  <Route path="/admin/academics" element={<AdminDashboard />} />
                  <Route path="/admin/students" element={<AdminDashboard />} />
                  <Route path="/admin/masters" element={<AdminDashboard />} />
                  <Route path="/admin/reports" element={<AdminDashboard />} />

                  {/* Hall Routes */}
                  <Route path="/hall/students" element={<HallDashboard />} />
                  <Route path="/hall/expenses" element={<HallDashboard />} />
                  <Route path="/hall/payments" element={<Navigate to="/dues" replace />} /> 
                  <Route path="/hall/payment-entry" element={<Navigate to="/dues" replace />} />
                  <Route path="/hall/complaints" element={<HallDashboard />} />

                  {/* Student Routes */}
                  <Route path="/student/history" element={<StudentDashboard />} />
                  
                  {/* Catch-all for inside app */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;