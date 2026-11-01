import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeScope: 'personal' | 'family';
  setActiveScope: (scope: 'personal' | 'family') => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('my_expense_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('my_expense_token');
  });
  const [activeScope, setActiveScope] = useState<'personal' | 'family'>('personal');
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const hideToast = () => setToast(null);

  const logout = () => {
    localStorage.removeItem('my_expense_token');
    localStorage.removeItem('my_expense_user');
    setToken(null);
    setUser(null);
    setActiveScope('personal');
    showToast('Đã đăng xuất khỏi hệ thống.', 'info');
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('my_expense_token', newToken);
    localStorage.setItem('my_expense_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    showToast(`Chào mừng ${newUser.name} quay trở lại!`, 'success');
  };

  const refreshUser = async () => {
    if (!localStorage.getItem('my_expense_token')) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('my_expense_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Lỗi khi làm mới thông tin tài khoản:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth_logout', handleAuthLogout);
    return () => window.removeEventListener('auth_logout', handleAuthLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeScope,
        setActiveScope,
        login,
        logout,
        refreshUser,
        loading,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
