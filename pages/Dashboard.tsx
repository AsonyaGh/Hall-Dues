import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import AdminDashboard from './admin/AdminDashboard';
import HallDashboard from './hall/HallDashboard';
import StudentDashboard from './student/StudentDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      return <AdminDashboard />;
    case UserRole.HALL_MASTER:
    case UserRole.HALL_EXECUTIVE:
      return <HallDashboard />;
    case UserRole.STUDENT:
      return <StudentDashboard />;
    default:
      return <div>Access Denied</div>;
  }
};

export default Dashboard;