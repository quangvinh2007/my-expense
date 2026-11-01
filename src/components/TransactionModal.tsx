import React, { useState, useEffect } from "react";
import { X, ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  Category,
  Transaction,
  categoryApi,
  transactionApi,
} from "../services/api.ts";

import { useAuth } from "../context/AuthContext.tsx";
import { toInputDateFormat } from "../utils/format.ts";

// ============================================
// HELPER FUNCTIONS
// ============================================

// Chuyển số tiền thành định dạng VNĐ: 8346307 -> 8.346.307
const formatAmount = (value: string | number): string => {
  const digits = String(value).replace(/\D/g, "");

  if (!digits) return "";

  return new Intl.NumberFormat("vi-VN").format(Number(digits));
};

// Chỉ giữ lại chữ số để lưu vào state
const parseAmount = (value: string): string => {
  return value.replace(/\D/g, "");
};

// ============================================
// COMPONENT PROPS
// ============================================

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction, isEdit: boolean) => void;
  initialData?: Transaction | null;
  defaultScope?: "personal" | "family";
}

// ============================================
// TRANSACTION MODAL
// ============================================

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultScope = "personal",
}) => {
  const { user, showToast } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(toInputDateFormat());
  const [note, setNote] = useState<string>("");
  const [scope, setScope] = useState<"personal" | "family">(defaultScope);

  // ============================================
  // INITIALIZE FORM
  // ============================================

  useEffect(() => {
    if (!isOpen) return;

    loadCategories();

    if (initialData) {
      setType(initialData.type);
      setAmount(parseAmount(String(initialData.amount)));
      setCategoryId(
        String(initialData.categoryId || initialData.category?.id || ""),
      );
      setDate(toInputDateFormat(initialData.date));
      setNote(initialData.note || "");
      setScope(initialData.scope || "personal");
    } else {
      setType("expense");
      setAmount("");
      setCategoryId("");
      setDate(toInputDateFormat());
      setNote("");
      setScope(defaultScope);
    }

    setError("");
  }, [isOpen, initialData, defaultScope]);

  // ============================================
  // LOAD CATEGORIES
  // ============================================

  const loadCategories = async () => {
    try {
      const res = await categoryApi.getCategories();

      if (res.success && res.data) {
        setCategories(res.data);

        if (!initialData && res.data.length > 0) {
          const firstCat = res.data.find(
            (category: Category) => category.type === type,
          );

          if (firstCat) {
            setCategoryId(firstCat.id);
          }
        }
      }
    } catch (err) {
      console.warn("Lỗi tải danh mục:", err);
    }
  };

  // ============================================
  // CHANGE TRANSACTION TYPE
  // ============================================

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);

    const available = categories.filter(
      (category) => category.type === newType,
    );

    if (available.length > 0) {
      setCategoryId(available[0].id);
    } else {
      setCategoryId("");
    }
  };

  // ============================================
  // HANDLE AMOUNT CHANGE
  // ============================================

  const handleAmountChange = (value: string) => {
    const digits = parseAmount(value);
    setAmount(digits);
  };

  // ============================================
  // SUBMIT FORM
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);

    if (!amount || !Number.isSafeInteger(numAmount) || numAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }

    if (!categoryId) {
      setError("Vui lòng chọn danh mục cho giao dịch.");
      return;
    }

    setLoading(true);

    try {
      if (initialData) {
        // Update existing transaction
        const res = await transactionApi.updateTransaction(initialData.id, {
          type,
          amount: numAmount,
          categoryId,
          note,
          date,
        });

        if (res.success) {
          showToast("Đã cập nhật giao dịch thành công!", "success");
          onSuccess(res.data, true);
          onClose();
        }
      } else {
        // Create new transaction
        const res = await transactionApi.createTransaction({
          scope,
          type,
          amount: numAmount,
          categoryId,
          note,
          date,
        });

        if (res.success) {
          showToast("Đã thêm giao dịch mới thành công!", "success");
          onSuccess(res.data, false);
          onClose();
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Có lỗi xảy ra khi lưu giao dịch.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (category) => category.type === type,
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {initialData ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error */}
          {error && (
            <div
              role="alert"
              className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Scope Selector */}
          {user?.familyId && !initialData && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Phạm vi chi tiêu
              </label>

              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg gap-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setScope("personal")}
                  className={`py-1.5 rounded-md transition-colors ${
                    scope === "personal"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cá nhân
                </button>

                <button
                  type="button"
                  onClick={() => setScope("family")}
                  className={`py-1.5 rounded-md transition-colors ${
                    scope === "family"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Gia đình
                </button>
              </div>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Loại giao dịch
            </label>

            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg gap-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors ${
                  type === "expense"
                    ? "bg-white text-rose-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>Khoản chi tiêu</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md transition-colors ${
                  type === "income"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Khoản thu nhập</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Số tiền (VNĐ) <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatAmount(amount)}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="VD: 50.000"
                required
                className="w-full px-3.5 py-2.5 pr-14 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
              />

              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                VNĐ
              </span>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Danh mục <span className="text-rose-500">*</span>
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="" disabled>
                -- Chọn danh mục --
              </option>

              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ngày giao dịch <span className="text-rose-500">*</span>
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ghi chú thêm
            </label>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Ăn trưa văn phòng, Mua sữa cho bé..."
              maxLength={200}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading
                ? "Đang lưu..."
                : initialData
                  ? "Lưu thay đổi"
                  : "Thêm giao dịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
