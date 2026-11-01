import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useAuth();

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border shadow-sm text-sm ${
          toast.type === 'success'
            ? 'bg-white border-emerald-200 text-emerald-900'
            : toast.type === 'error'
            ? 'bg-white border-rose-200 text-rose-900'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="shrink-0 pt-0.5">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
        </div>
        <div className="flex-1 font-medium leading-tight">{toast.message}</div>
        <button
          onClick={hideToast}
          className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
