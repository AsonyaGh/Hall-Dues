import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Landmark, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return <>{children}</>;

  const getNavItems = () => {
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Halls', path: '/admin/halls', icon: Landmark },
          { name: 'Batches', path: '/admin/batches', icon: GraduationCap },
          { name: 'Reports', path: '/admin/reports', icon: FileText },
        ];
      case UserRole.HALL_MASTER:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/hall/students', icon: Users },
          { name: 'Payments', path: '/hall/payments', icon: Wallet },
          { name: 'Complaints', path: '/hall/complaints', icon: FileText },
        ];
      case UserRole.HALL_EXECUTIVE:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Record Payment', path: '/hall/payment-entry', icon: Wallet },
          { name: 'Complaints', path: '/hall/complaints', icon: FileText },
        ];
      case UserRole.STUDENT:
        return [
          { name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My History', path: '/student/history', icon: FileText },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap className="h-8 w-8 text-yellow-400" />
            <span>NTC Wa</span>
          </div>
          <p className="text-xs text-green-200 mt-1">Hall Management System</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {getNavItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-green-800 text-yellow-400 font-medium'
                  : 'hover:bg-green-800/50 text-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-green-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold">
              {user.firstName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-green-300 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-200 hover:text-white hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10 p-4 md:hidden flex justify-between items-center">
             <div className="flex items-center gap-2 font-bold text-xl text-green-900">
                <GraduationCap className="h-6 w-6" />
                <span>NTC Wa</span>
              </div>
             <button onClick={handleLogout} className="text-gray-600"><LogOut className="h-5 w-5"/></button>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;