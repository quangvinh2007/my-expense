import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Plus,
  ArrowRight,
  PieChart as PieIcon,
  Home,
  Users2,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Transaction,
  StatisticsData,
  transactionApi,
} from '../services/api.ts';
import { formatCurrency, formatDate } from '../utils/format.ts';
import { TransactionModal } from '../components/TransactionModal.tsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';

// Distinct minimalist color palette for pie chart segments
const CATEGORY_COLORS = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#0D9488', // Teal
  '#EA580C', // Orange
  '#475569', // Slate
  '#DB2777', // Pink
];

export const Dashboard: React.FC = () => {
  const { user, activeScope, setActiveScope, showToast } = useAuth();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, [activeScope, selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // If family scope and no family joined, skip api error
      if (activeScope === 'family' && !user?.familyId) {
        setStats(null);
        setRecentTransactions([]);
        setLoading(false);
        return;
      }

      const [statsRes, txRes] = await Promise.all([
        transactionApi.getStatistics({
          scope: activeScope,
          month: selectedMonth,
          year: selectedYear,
        }),
        transactionApi.getTransactions({
          scope: activeScope,
          month: selectedMonth,
          year: selectedYear,
          limit: 5,
        }),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (txRes.success) {
        setRecentTransactions(txRes.data);
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu trang tổng quan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSaved = () => {
    fetchDashboardData();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTxId) return;
    setDeleteLoading(true);
    try {
      const res = await transactionApi.deleteTransaction(deletingTxId);
      if (res.success) {
        showToast('Đã xóa giao dịch thành công!', 'success');
        setDeletingTxId(null);
        fetchDashboardData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa giao dịch.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Pie chart data preparation
  const expenseCategories = (stats?.categoryBreakdown || [])
    .filter((c) => c.type === 'expense')
    .map((c) => ({
      name: c.name,
      value: c.amount,
    }));

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {activeScope === 'personal' ? (
              <span>Chi tiêu cá nhân</span>
            ) : (
              <span className="flex items-center gap-1 text-blue-700">
                <Home className="w-3.5 h-3.5" />
                Gia đình: {user?.family?.name || 'Chưa tham gia'}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Tổng quan tài chính Tháng {selectedMonth}/{selectedYear}
          </h2>
        </div>

        {/* Time filters & New transaction button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden py-1 px-1"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden py-1 px-1 mr-1"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Unjoined Family Alert in Family Mode */}
      {activeScope === 'family' && !user?.familyId && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Users2 className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Bạn chưa tham gia nhóm gia đình nào
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
            Tạo một nhóm gia đình mới hoặc nhập mã mời từ người thân để cùng quản lý các khoản thu chi chung.
          </p>
          <Link
            to="/family"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <span>Đến trang Quản lý Gia đình</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng thu trong tháng</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums tracking-tight">
            +{formatCurrency(stats?.totalIncome || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tổng các khoản tiền nhận được
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng chi trong tháng</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums tracking-tight">
            -{formatCurrency(stats?.totalExpense || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tổng các khoản tiền đã chi tiêu
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Số dư còn lại</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${
              (stats?.balance || 0) >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatCurrency(stats?.balance || 0)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Thu nhập trừ chi tiêu trong tháng
          </div>
        </div>
      </div>

      {/* Main Grid: Category Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category Breakdown (2 columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Chi tiêu theo danh mục</h3>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[240px] text-xs text-slate-400">
              Đang tải biểu đồ...
            </div>
          ) : expenseCategories.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] text-center p-4">
              <Receipt className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500">Chưa có giao dịch chi tiêu trong tháng này.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseCategories.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Số tiền']}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Category List */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                {expenseCategories.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-slate-700 truncate">{c.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-900 font-medium ml-2">
                      {formatCurrency(c.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions List (3 columns) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Giao dịch gần đây</h3>
            <Link
              to="/transactions"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-[240px] text-xs text-slate-400">
              Đang tải danh sách...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[240px] text-center p-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">Chưa có giao dịch nào</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Bấm vào nút "Thêm giao dịch" ở góc trên để bắt đầu ghi chép các khoản thu chi của bạn.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {tx.category?.name || 'Khác'}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
                        <span>{formatDate(tx.date)}</span>
                        {tx.note && (
                          <>
                            <span>·</span>
                            <span className="truncate">{tx.note}</span>
                          </>
                        )}
                        {activeScope === 'family' && tx.creatorName && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">{tx.creatorName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-semibold font-mono tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSuccess={handleTransactionSaved}
        initialData={editingTx}
        defaultScope={activeScope}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTxId}
        title="Xác nhận xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này không? Dữ liệu sau khi xóa sẽ không thể khôi phục."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTxId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};
