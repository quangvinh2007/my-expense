import { apiClient } from '../config/api.ts';

export interface User {
  id: string;
  _id: string;
  name: string;
  email: string;
  familyId?: string | null;
  family?: {
    id: string;
    _id?: string;
    name: string;
    inviteCode: string;
    isOwner: boolean;
    membersCount?: number;
  } | null;
  createdAt: string;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  type: 'income' | 'expense';
  scope: 'personal' | 'family' | 'both';
  icon?: string;
  isDefault?: boolean;
  isOwner?: boolean;
}

export interface Transaction {
  id: string;
  _id?: string;
  userId: string;
  familyId?: string | null;
  scope: 'personal' | 'family';
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
  };
  note?: string;
  date: string;
  createdAt: string;
  creatorName?: string;
  isOwner: boolean;
}

export interface FamilyMember {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
  isCurrentUser: boolean;
}

export interface Family {
  id: string;
  _id?: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  isOwner: boolean;
  members: FamilyMember[];
  membersCount: number;
  createdAt: string;
}

export interface StatisticsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    type: string;
    count: number;
  }>;
  month?: number;
  year?: number;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { name: string; email: string; password: string; confirmPassword?: string }) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { name?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await apiClient.put('/auth/profile', data);
    return res.data;
  },
};

export const transactionApi = {
  getTransactions: async (params?: {
    scope?: 'personal' | 'family';
    type?: string;
    categoryId?: string;
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },
  createTransaction: async (data: {
    scope: 'personal' | 'family';
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    note?: string;
    date: string;
  }) => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },
  updateTransaction: async (
    id: string,
    data: {
      type?: 'income' | 'expense';
      amount?: number;
      categoryId?: string;
      note?: string;
      date?: string;
    }
  ) => {
    const res = await apiClient.put(`/transactions/${id}`, data);
    return res.data;
  },
  deleteTransaction: async (id: string) => {
    const res = await apiClient.delete(`/transactions/${id}`);
    return res.data;
  },
  getStatistics: async (params?: { scope?: 'personal' | 'family'; month?: number; year?: number }) => {
    const res = await apiClient.get('/transactions/statistics', { params });
    return res.data;
  },
};

export const familyApi = {
  getMyFamily: async () => {
    const res = await apiClient.get('/families');
    return res.data;
  },
  createFamily: async (data: { name: string }) => {
    const res = await apiClient.post('/families', data);
    return res.data;
  },
  joinFamily: async (data: { inviteCode: string }) => {
    const res = await apiClient.post('/families/join', data);
    return res.data;
  },
  updateFamily: async (id: string, data: { name: string }) => {
    const res = await apiClient.put(`/families/${id}`, data);
    return res.data;
  },
  removeMember: async (familyId: string, memberUserId: string) => {
    const res = await apiClient.delete(`/families/${familyId}/members/${memberUserId}`);
    return res.data;
  },
};

export const categoryApi = {
  getCategories: async (params?: { type?: 'income' | 'expense' }) => {
    const res = await apiClient.get('/categories', { params });
    return res.data;
  },
  createCategory: async (data: {
    name: string;
    type: 'income' | 'expense';
    scope?: 'personal' | 'family' | 'both';
    icon?: string;
  }) => {
    const res = await apiClient.post('/categories', data);
    return res.data;
  },
  updateCategory: async (id: string, data: { name?: string; icon?: string }) => {
    const res = await apiClient.put(`/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id: string) => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },
};

export const reportApi = {
  getOverview: async (params?: { scope?: 'personal' | 'family'; year?: number }) => {
    const res = await apiClient.get('/reports/overview', { params });
    return res.data;
  },
  getMonthly: async (params?: { scope?: 'personal' | 'family'; year?: number }) => {
    const res = await apiClient.get('/reports/monthly', { params });
    return res.data;
  },
  getCategories: async (params?: {
    scope?: 'personal' | 'family';
    month?: number;
    year?: number;
    type?: 'income' | 'expense';
  }) => {
    const res = await apiClient.get('/reports/categories', { params });
    return res.data;
  },
};
