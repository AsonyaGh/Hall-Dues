
import React, { useState } from 'react';
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
  GraduationCap,
  UserCog,
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (!user) return <>{children}</>;

  const getNavItems = () => {
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/admin/students', icon: Users },
          { name: 'Hall Masters', path: '/admin/masters', icon: UserCog },
          { name: 'Hall Dues', path: '/dues', icon: Wallet },
          { name: 'Halls', path: '/admin/halls', icon: Landmark },
          { name: 'Academics', path: '/admin/academics', icon: GraduationCap }, 
          { name: 'Reports', path: '/admin/reports', icon: FileText },
        ];
      case UserRole.HALL_MASTER:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/hall/students', icon: Users },
          { name: 'Hall Dues', path: '/dues', icon: Wallet },
          { name: 'Programs', path: '/programs', icon: BookOpen }, 
          { name: 'Complaints', path: '/hall/complaints', icon: FileText },
        ];
      case UserRole.HALL_EXECUTIVE:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Hall Dues', path: '/dues', icon: Wallet },
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

  const NavContent = () => (
    <>
      <div className="p-6">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <GraduationCap className="h-8 w-8 text-yellow-400" />
            <span>NTC Wa</span>
          </div>
          <p className="text-xs text-green-200 mt-1">Hall Management System</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {getNavItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
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
            <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-sm font-bold text-white">
              {user.firstName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
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
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col hidden md:flex h-full">
        <NavContent />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobileMenu}></div>
          {/* Drawer */}
          <div className="relative w-64 bg-green-900 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
             <button onClick={closeMobileMenu} className="absolute top-4 right-4 text-green-200 hover:text-white">
                <X className="h-6 w-6" />
             </button>
             <NavContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm sticky top-0 z-10 p-4 md:hidden flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2 font-bold text-xl text-green-900">
                <GraduationCap className="h-6 w-6" />
                <span>NTC Wa</span>
              </div>
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
               <Menu className="h-6 w-6"/>
             </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
