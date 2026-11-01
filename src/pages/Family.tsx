import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  KeyRound,
  Copy,
  Check,
  Edit2,
  Trash2,
  LogOut,
  Crown,
  User,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Family, familyApi } from '../services/api.ts';
import { formatDate } from '../utils/format.ts';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal.tsx';

export const FamilyPage: React.FC = () => {
  const { user, refreshUser, showToast, setActiveScope } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms for non-joined state
  const [actionTab, setActionTab] = useState<'create' | 'join'>('create');
  const [newFamilyName, setNewFamilyName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Edit Name Modal
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);

  // Copy code state
  const [copied, setCopied] = useState<boolean>(false);

  // Delete/Leave Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = async () => {
    setLoading(true);
    try {
      const res = await familyApi.getMyFamily();
      if (res.success && res.data) {
        setFamily(res.data);
      } else {
        setFamily(null);
      }
    } catch (err) {
      console.warn('Lỗi tải thông tin nhóm gia đình:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newFamilyName.trim()) {
      setFormError('Vui lòng nhập tên cho nhóm gia đình.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await familyApi.createFamily({ name: newFamilyName.trim() });
      if (res.success) {
        showToast('Tạo nhóm gia đình mới thành công!', 'success');
        await refreshUser();
        await fetchFamily();
        setActiveScope('family');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể tạo nhóm gia đình.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!joinCode.trim()) {
      setFormError('Vui lòng nhập mã mời.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await familyApi.joinFamily({ inviteCode: joinCode.trim() });
      if (res.success) {
        showToast(res.message || 'Tham gia gia đình thành công!', 'success');
        await refreshUser();
        await fetchFamily();
        setActiveScope('family');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Mã mời không chính xác hoặc đã hết hạn.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!family?.inviteCode) return;
    navigator.clipboard.writeText(family.inviteCode);
    setCopied(true);
    showToast('Đã sao chép mã mời vào bộ nhớ tạm!', 'info');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family || !editName.trim()) return;

    setEditLoading(true);
    try {
      const res = await familyApi.updateFamily(family.id, { name: editName.trim() });
      if (res.success) {
        showToast('Đổi tên nhóm gia đình thành công!', 'success');
        setIsEditOpen(false);
        await refreshUser();
        await fetchFamily();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đổi tên gia đình.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const promptRemoveMember = (targetUserId: string, targetName: string) => {
    if (!family) return;
    setConfirmModal({
      isOpen: true,
      title: 'Xóa thành viên khỏi nhóm',
      message: `Bạn có chắc chắn muốn xóa "${targetName}" khỏi nhóm gia đình? Thành viên này sẽ không còn quyền truy cập các khoản thu chi chung.`,
      action: async () => {
        setActionInProgress(true);
        try {
          const res = await familyApi.removeMember(family.id, targetUserId);
          if (res.success) {
            showToast('Đã xóa thành viên khỏi nhóm!', 'success');
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            fetchFamily();
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || 'Lỗi khi xóa thành viên.', 'error');
        } finally {
          setActionInProgress(false);
        }
      },
    });
  };

  const promptLeaveFamily = () => {
    if (!family || !user) return;
    setConfirmModal({
      isOpen: true,
      title: 'Rời khỏi nhóm gia đình',
      message: `Bạn có chắc chắn muốn rời nhóm "${family.name}"? Dữ liệu chi tiêu cá nhân của bạn vẫn được giữ nguyên an toàn.`,
      action: async () => {
        setActionInProgress(true);
        try {
          const res = await familyApi.removeMember(family.id, user.id);
          if (res.success) {
            showToast('Bạn đã rời nhóm gia đình.', 'info');
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            setActiveScope('personal');
            await refreshUser();
            await fetchFamily();
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || 'Không thể rời nhóm gia đình.', 'error');
        } finally {
          setActionInProgress(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Đang tải thông tin nhóm gia đình...
      </div>
    );
  }

  // View when user HAS NOT joined a family
  if (!family) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Chi tiêu Gia đình
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Kết nối với các thành viên trong gia đình để cùng chia sẻ, ghi chép và theo dõi ngân sách chung một cách minh bạch.
          </p>
        </div>

        {/* Action Choice Tabs */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex border-b border-slate-100 mb-6">
            <button
              type="button"
              onClick={() => {
                setActionTab('create');
                setFormError('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                actionTab === 'create'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tạo nhóm gia đình mới
            </button>
            <button
              type="button"
              onClick={() => {
                setActionTab('join');
                setFormError('');
              }}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                actionTab === 'join'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tham gia bằng mã mời
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {formError}
            </div>
          )}

          {actionTab === 'create' ? (
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Đặt tên cho nhóm gia đình <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="VD: Gia đình Hạnh Phúc, Tổ ấm nhỏ..."
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Sau khi tạo, hệ thống sẽ tự động tạo một mã mời riêng biệt để bạn chia sẻ cho các thành viên.
                </p>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {formLoading ? 'Đang tạo nhóm...' : 'Tạo nhóm ngay'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nhập mã mời tham gia <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="VD: 7A9K3Z"
                    maxLength={10}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono uppercase tracking-widest"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Nhập mã gồm 6 ký tự do trưởng nhóm gia đình của bạn cung cấp.
                </p>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {formLoading ? 'Đang kết nối...' : 'Tham gia nhóm'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // View when user HAS ALREADY joined a family
  return (
    <div className="space-y-6">
      {/* Family Info Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {family.name}
              </h2>
              {family.isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setEditName(family.name);
                    setIsEditOpen(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                  title="Đổi tên gia đình"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Được thành lập ngày {formatDate(family.createdAt)}</span>
              <span>·</span>
              <span>{family.membersCount} thành viên</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={promptLeaveFamily}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Rời nhóm</span>
            </button>
          </div>
        </div>

        {/* Invite Code Box */}
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-700">Mã mời tham gia nhóm</div>
            <div className="text-[11px] text-slate-500">
              Chia sẻ mã này để người thân có thể nhập và tham gia vào nhóm chi tiêu chung.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold tracking-widest text-blue-700 bg-white px-3.5 py-1.5 border border-slate-200 rounded-md">
              {family.inviteCode}
            </span>
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members List Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Danh sách thành viên ({family.membersCount})
            </h3>
            <p className="text-xs text-slate-500">Mọi thành viên đều có thể ghi chép và theo dõi giao dịch chung</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {family.members.map((member) => (
            <div
              key={member.userId}
              className="py-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {member.name}
                    </span>
                    {member.isCurrentUser && (
                      <span className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-medium">
                        Bạn
                      </span>
                    )}
                    {member.role === 'owner' ? (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-0.5">
                        <Crown className="w-3 h-3 text-amber-600" />
                        Trưởng nhóm
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        Thành viên
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {member.email} · Tham gia {formatDate(member.joinedAt)}
                  </div>
                </div>
              </div>

              {/* Owner actions: can remove other members */}
              {family.isOwner && !member.isCurrentUser && (
                <button
                  type="button"
                  onClick={() => promptRemoveMember(member.userId, member.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Xóa thành viên khỏi nhóm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Name Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Đổi tên nhóm gia đình
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tên mới cho nhóm
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {editLoading ? 'Đang lưu...' : 'Lưu tên mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Leave Confirm Modal */}
      <DeleteConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        loading={actionInProgress}
      />
    </div>
  );
};
