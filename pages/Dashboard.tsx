import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import AdminDashboard from './admin/AdminDashboard';
import HallDashboard from './hall/HallDashboard';
import StudentDashboard from './student/StudentDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Safety check, though ProtectedRoute handles this.
  if (!user) {
      return <div className="p-4 text-center">Loading dashboard...</div>;
  }

  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      return <AdminDashboard />;
    case UserRole.HALL_MASTER:
    case UserRole.HALL_EXECUTIVE:
      return <HallDashboard />;
    case UserRole.STUDENT:
      return <StudentDashboard />;
    default:
      return <div className="p-8 text-center text-red-600">Access Denied: Unknown Role</div>;
  }
};

export default Dashboard;