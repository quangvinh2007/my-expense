import React from 'react';
import { Menu, Plus, Home, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  title: string;
  onOpenMobileSidebar: () => void;
  onOpenAddTransaction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileSidebar,
  onOpenAddTransaction,
}) => {
  const { user, activeScope, setActiveScope } = useAuth();

  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Mở danh mục"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Current Scope indicator / quick toggle on top bar */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveScope('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
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
            onClick={() => setActiveScope('family')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeScope === 'family'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Gia đình</span>
          </button>
        </div>

        {onOpenAddTransaction && (
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ghi chép mới</span>
            <span className="sm:hidden">Thêm</span>
          </button>
        )}
      </div>
    </header>
  );
};
