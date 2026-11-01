import React, { useState } from 'react';
import { UserCheck, KeyRound, Shield, Users2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { authApi } from '../services/api.ts';
import { formatDate } from '../utils/format.ts';

export const Profile: React.FC = () => {
  const { user, refreshUser, logout, showToast } = useAuth();

  // Name update state
  const [name, setName] = useState<string>(user?.name || '');
  const [nameLoading, setNameLoading] = useState<boolean>(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Họ và tên không được để trống.', 'error');
      return;
    }

    setNameLoading(true);
    try {
      const res = await authApi.updateProfile({ name: name.trim() });
      if (res.success) {
        showToast('Cập nhật họ và tên thành công!', 'success');
        await refreshUser();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật tên.', 'error');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Vui lòng điền mật khẩu hiện tại và mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authApi.updateProfile({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        showToast('Đổi mật khẩu thành công!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Title */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Thông tin Tài khoản
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
        </p>
      </div>

      {/* Account Info Summary Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-500" />
          <span>Hồ sơ người dùng</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Địa chỉ Email:</span>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">{user?.email}</div>
          </div>
          <div>
            <span className="text-slate-500">Ngày tham gia:</span>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">
              {formatDate(user?.createdAt)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Nhóm gia đình hiện tại:</span>
            <div className="font-semibold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{user?.family?.name || 'Chưa tham gia'}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500">Vai trò trong nhóm:</span>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">
              {user?.family?.isOwner ? 'Trưởng nhóm (Quản trị)' : user?.family ? 'Thành viên' : 'Người dùng cá nhân'}
            </div>
          </div>
        </div>
      </div>

      {/* Change Name Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          Cập nhật Họ và tên
        </h3>

        <form onSubmit={handleUpdateName} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Họ và tên hiển thị
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={nameLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {nameLoading ? 'Đang lưu...' : 'Lưu họ và tên'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-500" />
          <span>Đổi mật khẩu</span>
        </h3>

        {passwordError && (
          <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>

      {/* Logout Action */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Đăng xuất tài khoản</div>
          <div className="text-xs text-slate-500">Đăng xuất phiên làm việc hiện tại trên thiết bị này</div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
