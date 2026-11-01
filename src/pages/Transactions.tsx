import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Transaction,
  Category,
  transactionApi,
  categoryApi,
} from '../services/api.ts';
import { formatCurrency, formatDate } from '../utils/format.ts';
import { TransactionModal } from '../components/TransactionModal.tsx';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';

export const Transactions: React.FC = () => {
  const { user, activeScope, showToast } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeScope, searchTerm, selectedType, selectedCategory, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchTransactions();
  }, [activeScope, currentPage, searchTerm, selectedType, selectedCategory, selectedMonth, selectedYear]);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục:', err);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      if (activeScope === 'family' && !user?.familyId) {
        setTransactions([]);
        setTotalPages(1);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const params: any = {
        scope: activeScope,
        page: currentPage,
        limit: 15,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedCategory !== 'all') params.categoryId = selectedCategory;
      if (selectedMonth) params.month = Number(selectedMonth);
      if (selectedYear) params.year = Number(selectedYear);

      const res = await transactionApi.getTransactions(params);
      if (res.success) {
        setTransactions(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.total);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải giao dịch:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSaved = () => {
    fetchTransactions();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTxId) return;
    setDeleteLoading(true);
    try {
      const res = await transactionApi.deleteTransaction(deletingTxId);
      if (res.success) {
        showToast('Đã xóa giao dịch thành công!', 'success');
        setDeletingTxId(null);
        fetchTransactions();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa giao dịch.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedMonth('');
    setSelectedYear('');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedMonth ||
    selectedYear;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý Giao dịch {activeScope === 'family' ? '(Gia đình)' : '(Cá nhân)'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: <span className="font-semibold text-slate-700">{totalCount}</span> giao dịch
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm giao dịch mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ghi chú hoặc danh mục..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-600"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-600"
            >
              <option value="all">Tất cả loại giao dịch</option>
              <option value="expense">Chi tiêu (-)</option>
              <option value="income">Thu nhập (+)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-600"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'income' ? 'Thu' : 'Chi'})
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-600"
            >
              <option value="">Tất cả các tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Đang áp dụng bộ lọc dữ liệu</span>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Đang tải dữ liệu giao dịch...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Không tìm thấy giao dịch nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Không có kết quả phù hợp với bộ lọc hiện tại. Thử xóa bớt điều kiện lọc.'
                : 'Chưa có khoản thu hoặc chi nào được ghi chép trong mục này.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTx(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm giao dịch ngay</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ngày</th>
                  <th className="py-3 px-4">Loại</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  {activeScope === 'family' && <th className="py-3 px-4">Người tạo</th>}
                  <th className="py-3 px-4 text-right">Số tiền (VNĐ)</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>{tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {tx.category?.name || 'Khác'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {tx.note || '-'}
                    </td>
                    {activeScope === 'family' && (
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {tx.creatorName || 'Thành viên'}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold font-mono tabular-nums text-sm ${
                          tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTx(tx);
                            setIsModalOpen(true);
                          }}
                          title="Chỉnh sửa giao dịch"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTxId(tx.id)}
                          title="Xóa giao dịch"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Trang <span className="font-semibold text-slate-900">{currentPage}</span> / {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
