import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Users2,
  PieChart,
  UserCheck,
  LogOut,
  User as UserIcon,
  Home,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, activeScope, setActiveScope, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/transactions', label: 'Giao dịch', icon: Receipt },
    { to: '/categories', label: 'Danh mục', icon: Tags },
    { to: '/family', label: 'Gia đình', icon: Users2 },
    { to: '/reports', label: 'Báo cáo', icon: PieChart },
    { to: '/profile', label: 'Tài khoản', icon: UserCheck },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold text-base shadow-xs">
            M
          </div>
          <span>My Expense</span>
        </NavLink>
        <button
          onClick={onCloseMobile}
          className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-md"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scope Switcher: Cá nhân / Gia đình */}
      <div className="p-4 border-b border-slate-100">
        <div className="text-xs font-medium text-slate-400 mb-2 px-1">Chế độ xem dữ liệu</div>
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveScope('personal')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all ${
              activeScope === 'personal'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Cá nhân</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveScope('family');
              if (!user?.familyId) {
                navigate('/family');
              }
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all ${
              activeScope === 'family'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Gia đình</span>
          </button>
        </div>
        {activeScope === 'family' && user?.family?.name && (
          <div className="mt-2 text-[11px] text-blue-700 font-medium px-1 flex items-center gap-1 truncate">
            <span>Nhóm:</span>
            <span className="truncate">{user.family.name}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-64 max-w-xs h-full bg-white shadow-xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
