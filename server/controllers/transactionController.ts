import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dbStore } from '../config/database.ts';

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      scope = 'personal',
      type,
      categoryId,
      startDate,
      endDate,
      month,
      year,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const targetScope = scope === 'family' ? 'family' : 'personal';

    // If family scope, verify user belongs to a family
    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (targetScope === 'family' && !currentUser?.familyId) {
      res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, totalPages: 0, limit: Number(limit) },
        message: 'Bạn chưa tham gia nhóm gia đình nào.',
      });
      return;
    }

    let items = dbStore.data.transactions.filter((t) => {
      if (targetScope === 'personal') {
        return (t.scope === 'personal' || !t.scope) && String(t.userId) === userId;
      } else {
        return t.scope === 'family' && String(t.familyId) === String(currentUser?.familyId);
      }
    });

    // Filter by type
    if (type && type !== 'all') {
      items = items.filter((t) => t.type === type);
    }

    // Filter by category
    if (categoryId && categoryId !== 'all') {
      items = items.filter((t) => String(t.categoryId) === String(categoryId));
    }

    // Filter by month & year
    if (month && year) {
      const m = parseInt(month as string, 10) - 1;
      const y = parseInt(year as string, 10);
      items = items.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
    } else if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate as string);
        items = items.filter((t) => new Date(t.date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        items = items.filter((t) => new Date(t.date) <= end);
      }
    }

    // Search by note or category name
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      items = items.filter((t) => {
        const noteMatch = (t.note || '').toLowerCase().includes(q);
        const cat = dbStore.data.categories.find((c) => String(c.id || c._id) === String(t.categoryId));
        const catMatch = cat ? cat.name.toLowerCase().includes(q) : false;
        return noteMatch || catMatch;
      });
    }

    // Sort newest date first
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = items.length;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;
    const pagedItems = items.slice(offset, offset + limitNum);

    // Populate category and user details
    const populated = pagedItems.map((item) => {
      const category = dbStore.data.categories.find(
        (c) => String(c.id || c._id) === String(item.categoryId)
      ) || {
        id: item.categoryId,
        name: 'Chưa phân loại',
        type: item.type,
        icon: 'tag',
      };

      const creator = dbStore.data.users.find(
        (u) => String(u._id || u.id) === String(item.userId)
      );

      return {
        ...item,
        id: String(item._id || item.id),
        category: {
          id: String(category.id || category._id),
          name: category.name,
          type: category.type,
          icon: category.icon,
        },
        creatorName: creator?.name || 'Thành viên',
        isOwner: String(item.userId) === userId,
      };
    });

    res.status(200).json({
      success: true,
      data: populated,
      pagination: {
        total,
        page: pageNum,
        totalPages,
        limit: limitNum,
      },
    });
  } catch (err: any) {
    console.error('Lỗi khi lấy danh sách giao dịch:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách giao dịch.',
    });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { scope = 'personal', type, amount, categoryId, note = '', date } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Loại giao dịch phải là thu nhập (income) hoặc chi tiêu (expense).',
      });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Số tiền giao dịch phải là số dương lớn hơn 0.',
      });
      return;
    }

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng chọn danh mục cho giao dịch.',
      });
      return;
    }

    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    let familyId = null;

    if (scope === 'family') {
      if (!currentUser?.familyId) {
        res.status(400).json({
          success: false,
          message: 'Bạn chưa tham gia nhóm gia đình nào. Không thể tạo giao dịch gia đình.',
        });
        return;
      }
      familyId = String(currentUser.familyId);
    }

    const txDate = date ? new Date(date) : new Date();
    if (isNaN(txDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Ngày giao dịch không hợp lệ.',
      });
      return;
    }

    const newId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newTx = {
      _id: newId,
      id: newId,
      userId,
      familyId,
      scope: scope === 'family' ? 'family' : 'personal',
      type,
      amount: numericAmount,
      categoryId: String(categoryId),
      note: String(note || '').trim(),
      date: txDate,
      createdAt: now,
      updatedAt: now,
    };

    dbStore.data.transactions.unshift(newTx);
    dbStore.save();

    // Populate category info for response
    const category = dbStore.data.categories.find(
      (c) => String(c.id || c._id) === String(categoryId)
    );

    res.status(201).json({
      success: true,
      message: 'Ghi chép giao dịch thành công!',
      data: {
        ...newTx,
        category: category || { id: categoryId, name: 'Khác', type },
        creatorName: currentUser?.name || 'Tôi',
        isOwner: true,
      },
    });
  } catch (err: any) {
    console.error('Lỗi khi tạo giao dịch:', err);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ khi thêm giao dịch.',
    });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { type, amount, categoryId, note, date } = req.body;

    const tx = dbStore.data.transactions.find((t) => String(t._id || t.id) === id);
    if (!tx) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch cần chỉnh sửa.',
      });
      return;
    }

    // Permission check
    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (tx.scope === 'personal') {
      if (String(tx.userId) !== userId) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chỉnh sửa giao dịch cá nhân của người khác.',
        });
        return;
      }
    } else if (tx.scope === 'family') {
      if (String(tx.familyId) !== String(currentUser?.familyId)) {
        res.status(403).json({
          success: false,
          message: 'Bạn không thuộc nhóm gia đình chứa giao dịch này.',
        });
        return;
      }
    }

    if (type && ['income', 'expense'].includes(type)) {
      tx.type = type;
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Số tiền giao dịch phải lớn hơn 0.',
        });
        return;
      }
      tx.amount = numericAmount;
    }

    if (categoryId) {
      tx.categoryId = String(categoryId);
    }

    if (note !== undefined) {
      tx.note = String(note).trim();
    }

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        tx.date = d;
      }
    }

    tx.updatedAt = new Date();
    dbStore.save();

    const category = dbStore.data.categories.find(
      (c) => String(c.id || c._id) === String(tx.categoryId)
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật giao dịch thành công!',
      data: {
        ...tx,
        id: String(tx._id || tx.id),
        category: category || { id: tx.categoryId, name: 'Khác', type: tx.type },
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật giao dịch.',
    });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const txIndex = dbStore.data.transactions.findIndex(
      (t) => String(t._id || t.id) === id
    );

    if (txIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch để xóa.',
      });
      return;
    }

    const tx = dbStore.data.transactions[txIndex];
    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);

    // Permission check
    if (tx.scope === 'personal') {
      if (String(tx.userId) !== userId) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa giao dịch cá nhân này.',
        });
        return;
      }
    } else if (tx.scope === 'family') {
      if (String(tx.familyId) !== String(currentUser?.familyId)) {
        res.status(403).json({
          success: false,
          message: 'Bạn không thuộc nhóm gia đình chứa giao dịch này.',
        });
        return;
      }
    }

    dbStore.data.transactions.splice(txIndex, 1);
    dbStore.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa giao dịch thành công!',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa giao dịch.',
    });
  }
};

export const getStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { scope = 'personal', month, year } = req.query;
    const targetScope = scope === 'family' ? 'family' : 'personal';

    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (targetScope === 'family' && !currentUser?.familyId) {
      res.status(200).json({
        success: true,
        data: {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
          categoryBreakdown: [],
        },
      });
      return;
    }

    let items = dbStore.data.transactions.filter((t) => {
      if (targetScope === 'personal') {
        return (t.scope === 'personal' || !t.scope) && String(t.userId) === userId;
      } else {
        return t.scope === 'family' && String(t.familyId) === String(currentUser?.familyId);
      }
    });

    const now = new Date();
    const targetMonth = month ? parseInt(month as string, 10) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year as string, 10) : now.getFullYear();

    items = items.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { name: string; amount: number; type: string; count: number }> = {};

    items.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }

      const cat = dbStore.data.categories.find(
        (c) => String(c.id || c._id) === String(t.categoryId)
      );
      const catName = cat ? cat.name : 'Khác';
      const catKey = String(t.categoryId);

      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = {
          name: catName,
          amount: 0,
          type: t.type,
          count: 0,
        };
      }
      categoryTotals[catKey].amount += t.amount;
      categoryTotals[catKey].count += 1;
    });

    const balance = totalIncome - totalExpense;

    const categoryBreakdown = Object.values(categoryTotals).sort(
      (a, b) => b.amount - a.amount
    );

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance,
        transactionCount: items.length,
        categoryBreakdown,
        month: targetMonth + 1,
        year: targetYear,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tính toán thống kê.',
    });
  }
};
