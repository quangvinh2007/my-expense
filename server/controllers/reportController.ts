import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dbStore } from '../config/database.ts';

export const getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { scope = 'personal', year } = req.query;
    const targetScope = scope === 'family' ? 'family' : 'personal';

    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (targetScope === 'family' && !currentUser?.familyId) {
      res.status(200).json({
        success: true,
        data: {
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
          transactionCount: 0,
          averageMonthlyExpense: 0,
        },
      });
      return;
    }

    const targetYear = year ? parseInt(year as string, 10) : new Date().getFullYear();

    const items = dbStore.data.transactions.filter((t) => {
      const matchScope =
        targetScope === 'personal'
          ? (t.scope === 'personal' || !t.scope) && String(t.userId) === userId
          : t.scope === 'family' && String(t.familyId) === String(currentUser?.familyId);

      if (!matchScope) return false;
      const d = new Date(t.date);
      return d.getFullYear() === targetYear;
    });

    let totalIncome = 0;
    let totalExpense = 0;

    items.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const currentMonthIndex = new Date().getMonth() + 1;
    const monthsPassed = targetYear === new Date().getFullYear() ? currentMonthIndex : 12;
    const averageMonthlyExpense = Math.round(totalExpense / Math.max(1, monthsPassed));

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: items.length,
        averageMonthlyExpense,
        year: targetYear,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải dữ liệu báo cáo tổng quan.',
    });
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { scope = 'personal', year } = req.query;
    const targetScope = scope === 'family' ? 'family' : 'personal';

    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (targetScope === 'family' && !currentUser?.familyId) {
      const emptyMonths = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        monthName: `T${i + 1}`,
        fullName: `Tháng ${i + 1}`,
        income: 0,
        expense: 0,
        balance: 0,
      }));
      res.status(200).json({ success: true, data: emptyMonths });
      return;
    }

    const targetYear = year ? parseInt(year as string, 10) : new Date().getFullYear();

    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: `T${i + 1}`,
      fullName: `Tháng ${i + 1}`,
      income: 0,
      expense: 0,
      balance: 0,
    }));

    const items = dbStore.data.transactions.filter((t) => {
      const matchScope =
        targetScope === 'personal'
          ? (t.scope === 'personal' || !t.scope) && String(t.userId) === userId
          : t.scope === 'family' && String(t.familyId) === String(currentUser?.familyId);

      if (!matchScope) return false;
      const d = new Date(t.date);
      return d.getFullYear() === targetYear;
    });

    items.forEach((t) => {
      const m = new Date(t.date).getMonth();
      if (m >= 0 && m < 12) {
        if (t.type === 'income') {
          monthsData[m].income += t.amount;
        } else {
          monthsData[m].expense += t.amount;
        }
      }
    });

    monthsData.forEach((m) => {
      m.balance = m.income - m.expense;
    });

    res.status(200).json({
      success: true,
      data: monthsData,
      year: targetYear,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tải báo cáo theo tháng.',
    });
  }
};

export const getCategoryReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { scope = 'personal', month, year, type = 'expense' } = req.query;
    const targetScope = scope === 'family' ? 'family' : 'personal';

    const currentUser = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (targetScope === 'family' && !currentUser?.familyId) {
      res.status(200).json({
        success: true,
        data: {
          categories: [],
          topTransactions: [],
          totalAmount: 0,
        },
      });
      return;
    }

    const now = new Date();
    const targetMonth = month !== undefined && month !== '' ? parseInt(month as string, 10) - 1 : null;
    const targetYear = year ? parseInt(year as string, 10) : now.getFullYear();

    const items = dbStore.data.transactions.filter((t) => {
      const matchScope =
        targetScope === 'personal'
          ? (t.scope === 'personal' || !t.scope) && String(t.userId) === userId
          : t.scope === 'family' && String(t.familyId) === String(currentUser?.familyId);

      if (!matchScope) return false;
      if (t.type !== type) return false;

      const d = new Date(t.date);
      if (d.getFullYear() !== targetYear) return false;
      if (targetMonth !== null && d.getMonth() !== targetMonth) return false;

      return true;
    });

    const categoryMap: Record<string, { id: string; name: string; amount: number; count: number; icon: string }> = {};
    let totalAmount = 0;

    items.forEach((t) => {
      totalAmount += t.amount;
      const cat = dbStore.data.categories.find((c) => String(c.id || c._id) === String(t.categoryId));
      const catId = String(t.categoryId);
      const catName = cat ? cat.name : 'Khác';
      const icon = cat ? cat.icon || 'tag' : 'tag';

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          id: catId,
          name: catName,
          amount: 0,
          count: 0,
          icon,
        };
      }
      categoryMap[catId].amount += t.amount;
      categoryMap[catId].count += 1;
    });

    const categoryList = Object.values(categoryMap)
      .map((item) => ({
        ...item,
        percentage: totalAmount > 0 ? parseFloat(((item.amount / totalAmount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top transactions
    const topTransactions = [...items]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => {
        const cat = dbStore.data.categories.find((c) => String(c.id || c._id) === String(t.categoryId));
        return {
          id: String(t._id || t.id),
          amount: t.amount,
          note: t.note || (cat ? cat.name : 'Giao dịch'),
          categoryName: cat ? cat.name : 'Khác',
          date: t.date,
        };
      });

    res.status(200).json({
      success: true,
      data: {
        categories: categoryList,
        topTransactions,
        totalAmount,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tải báo cáo theo danh mục.',
    });
  }
};
