import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { Toast } from './components/Toast.tsx';
import { TransactionModal } from './components/TransactionModal.tsx';

// Pages
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Transactions } from './pages/Transactions.tsx';
import { Categories } from './pages/Categories.tsx';
import { FamilyPage } from './pages/Family.tsx';
import { Reports } from './pages/Reports.tsx';
import { Profile } from './pages/Profile.tsx';

// Protected Layout Component
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading, activeScope } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        Đang khởi động My Expense...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Get Page Title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Tổng quan';
      case '/transactions':
        return 'Giao dịch';
      case '/categories':
        return 'Danh mục';
      case '/family':
        return 'Gia đình';
      case '/reports':
        return 'Báo cáo thống kê';
      case '/profile':
        return 'Thông tin tài khoản';
      default:
        return 'My Expense';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenAddTransaction={() => setIsTxModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Add Transaction Modal from Header */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={() => {
          // Trigger custom event or reload current page view
          window.dispatchEvent(new Event('transaction_created'));
        }}
        defaultScope={activeScope}
      />

      {/* Global Toast Component */}
      <Toast />
    </div>
  );
};

// Route Guard for unauthenticated routes (Login, Register)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        Đang tải...
      </div>
    );
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/transactions"
            element={
              <AppLayout>
                <Transactions />
              </AppLayout>
            }
          />
          <Route
            path="/categories"
            element={
              <AppLayout>
                <Categories />
              </AppLayout>
            }
          />
          <Route
            path="/family"
            element={
              <AppLayout>
                <FamilyPage />
              </AppLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <AppLayout>
                <Reports />
              </AppLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AppLayout>
                <Profile />
              </AppLayout>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
