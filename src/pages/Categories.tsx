import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Category, categoryApi } from '../services/api.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';

export const Categories: React.FC = () => {
  const { showToast } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Delete modal
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType(activeTab);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatType(c.type);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!catName.trim()) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingCategory) {
        const res = await categoryApi.updateCategory(editingCategory.id, {
          name: catName.trim(),
        });
        if (res.success) {
          showToast('Cập nhật danh mục thành công!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await categoryApi.createCategory({
          name: catName.trim(),
          type: catType,
        });
        if (res.success) {
          showToast('Thêm danh mục mới thành công!', 'success');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCatId) return;
    setDeleteLoading(true);
    try {
      const res = await categoryApi.deleteCategory(deletingCatId);
      if (res.success) {
        showToast('Đã xóa danh mục thành công!', 'success');
        setDeletingCatId(null);
        fetchCategories();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa danh mục này.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentCategories = categories.filter((c) => c.type === activeTab);
  const defaultCategories = currentCategories.filter((c) => c.isDefault);
  const customCategories = currentCategories.filter((c) => !c.isDefault);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Quản lý Danh mục
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại rõ ràng các khoản thu nhập và chi tiêu của bạn
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* Tabs: Chi tiêu / Thu nhập */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'expense'
              ? 'bg-white text-rose-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-rose-600" />
          <span>Danh mục Chi tiêu ({categories.filter((c) => c.type === 'expense').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'income'
              ? 'bg-white text-emerald-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span>Danh mục Thu nhập ({categories.filter((c) => c.type === 'income').length})</span>
        </button>
      </div>

      {/* Custom Categories Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Danh mục tùy chỉnh của bạn
            </h3>
            <p className="text-xs text-slate-500">Các danh mục do bạn tự tạo và có thể sửa hoặc xóa</p>
          </div>
        </div>

        {customCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Bạn chưa tạo danh mục tùy chỉnh nào cho loại {activeTab === 'expense' ? 'chi tiêu' : 'thu nhập'}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {customCategories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <Tags className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-900 truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                    title="Đổi tên danh mục"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCatId(c.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Xóa danh mục"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default System Categories Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Danh mục mặc định của hệ thống
            </h3>
            <p className="text-xs text-slate-500">Các danh mục chuẩn đã được tích hợp sẵn</p>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {defaultCategories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2.5 p-3.5 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Tags className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-800 truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingCategory ? 'Sửa tên danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {!editingCategory && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Loại danh mục
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg gap-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setCatType('expense')}
                      className={`py-1.5 rounded-md transition-colors ${
                        catType === 'expense'
                          ? 'bg-white text-rose-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Chi tiêu (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatType('income')}
                      className={`py-1.5 rounded-md transition-colors ${
                        catType === 'income'
                          ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Thu nhập (+)
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="VD: Cà phê, Du lịch, Tiền thưởng dự án..."
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {formLoading ? 'Đang lưu...' : editingCategory ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCatId}
        title="Xác nhận xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Lưu ý: Không thể xóa danh mục đang có giao dịch sử dụng."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingCatId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};
