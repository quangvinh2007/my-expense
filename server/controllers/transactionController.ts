import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.ts";
import {
  TransactionModel,
  UserModel,
  CategoryModel,
} from "../config/database.ts";

// ============================================
// HELPERS
// ============================================

// Tìm theo field `id` (string) hoặc _id (ObjectId) nếu hợp lệ
const idFilter = (id: string) => {
  const conditions: any[] = [{ id: String(id) }];
  if (mongoose.isValidObjectId(id)) {
    conditions.push({ _id: id });
  }
  return { $or: conditions };
};

const findUserById = async (userId?: string) => {
  if (!userId) return null;
  return UserModel.findOne(idFilter(userId)).lean() as any;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Khoảng thời gian của 1 tháng (UTC, khớp với ngày dạng YYYY-MM-DD gửi từ client)
const monthRange = (month: number, year: number) => ({
  $gte: new Date(Date.UTC(year, month - 1, 1)),
  $lt: new Date(Date.UTC(year, month, 1)),
});

const buildScopeFilter = (
  targetScope: "personal" | "family",
  userId: string,
  familyId?: string | null,
) => {
  if (targetScope === "personal") {
    return {
      userId: String(userId),
      $or: [
        { scope: "personal" },
        { scope: { $exists: false } },
        { scope: null },
      ],
    };
  }
  return { scope: "family", familyId: String(familyId) };
};

const serializeTransaction = (
  tx: any,
  categoryMap: Map<string, any>,
  userMap: Map<string, any>,
  currentUserId?: string,
) => {
  const id = String(tx.id || tx._id);
  const cat = categoryMap.get(String(tx.categoryId));
  const creator = userMap.get(String(tx.userId));

  return {
    ...tx,
    _id: String(tx._id),
    id,
    category: cat
      ? {
          id: String(cat.id || cat._id),
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
        }
      : {
          id: String(tx.categoryId),
          name: "Chưa phân loại",
          type: tx.type,
          icon: "tag",
        },
    creatorName: creator?.name || "Thành viên",
    isOwner: String(tx.userId) === String(currentUserId),
  };
};

const loadCategoryMap = async (categoryIds: string[]) => {
  const uniqueIds = [...new Set(categoryIds.map(String))];
  const cats = (await CategoryModel.find({
    id: { $in: uniqueIds },
  }).lean()) as any[];
  return new Map<string, any>(cats.map((c) => [String(c.id || c._id), c]));
};

const loadUserMap = async (userIds: string[]) => {
  const uniqueIds = [...new Set(userIds.map(String))];
  const objectIds = uniqueIds.filter((i) => mongoose.isValidObjectId(i));
  const users = (await UserModel.find({
    $or: [{ id: { $in: uniqueIds } }, { _id: { $in: objectIds } }],
  }).lean()) as any[];

  const map = new Map<string, any>();
  users.forEach((u) => {
    map.set(String(u._id), u);
    if (u.id) map.set(String(u.id), u);
  });
  return map;
};

// ============================================
// GET TRANSACTIONS
// ============================================

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const {
      scope = "personal",
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

    const targetScope = scope === "family" ? "family" : "personal";
    const currentUser = await findUserById(userId);

    if (targetScope === "family" && !currentUser?.familyId) {
      res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, totalPages: 0, limit: Number(limit) },
        message: "Bạn chưa tham gia nhóm gia đình nào.",
      });
      return;
    }

    const conditions: any[] = [
      buildScopeFilter(targetScope, userId, currentUser?.familyId),
    ];

    if (type && type !== "all") {
      conditions.push({ type: String(type) });
    }

    if (categoryId && categoryId !== "all") {
      conditions.push({ categoryId: String(categoryId) });
    }

    // Lọc theo tháng / năm
    if (month) {
      const m = parseInt(month as string, 10);
      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();
      if (m >= 1 && m <= 12 && !isNaN(y)) {
        conditions.push({ date: monthRange(m, y) });
      }
    } else if (year) {
      const y = parseInt(year as string, 10);
      if (!isNaN(y)) {
        conditions.push({
          date: {
            $gte: new Date(Date.UTC(y, 0, 1)),
            $lt: new Date(Date.UTC(y + 1, 0, 1)),
          },
        });
      }
    } else if (startDate || endDate) {
      const range: any = {};
      if (startDate) {
        const start = new Date(startDate as string);
        if (!isNaN(start.getTime())) range.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate as string);
        if (!isNaN(end.getTime())) {
          end.setUTCHours(23, 59, 59, 999);
          range.$lte = end;
        }
      }
      if (Object.keys(range).length > 0) conditions.push({ date: range });
    }

    // Tìm theo ghi chú hoặc tên danh mục
    if (search && String(search).trim()) {
      const regex = new RegExp(escapeRegex(String(search).trim()), "i");
      const matchedCats = (await CategoryModel.find({
        name: regex,
      }).lean()) as any[];
      const matchedCatIds = matchedCats.map((c) => String(c.id || c._id));

      conditions.push({
        $or: [{ note: regex }, { categoryId: { $in: matchedCatIds } }],
      });
    }

    const query = { $and: conditions };

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const [total, items] = await Promise.all([
      TransactionModel.countDocuments(query),
      TransactionModel.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(offset)
        .limit(limitNum)
        .lean() as Promise<any[]>,
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    const [categoryMap, userMap] = await Promise.all([
      loadCategoryMap(items.map((i) => i.categoryId)),
      loadUserMap(items.map((i) => i.userId)),
    ]);

    const populated = items.map((item) =>
      serializeTransaction(item, categoryMap, userMap, userId),
    );

    res.status(200).json({
      success: true,
      data: populated,
      pagination: { total, page: pageNum, totalPages, limit: limitNum },
    });
  } catch (err: any) {
    console.error("Lỗi khi lấy danh sách giao dịch:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tải danh sách giao dịch.",
    });
  }
};

// ============================================
// CREATE TRANSACTION
// ============================================

export const createTransaction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const {
      scope = "personal",
      type,
      amount,
      categoryId,
      note = "",
      date,
    } = req.body;

    if (!type || !["income", "expense"].includes(type)) {
      res.status(400).json({
        success: false,
        message:
          "Loại giao dịch phải là thu nhập (income) hoặc chi tiêu (expense).",
      });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({
        success: false,
        message: "Số tiền giao dịch phải là số dương lớn hơn 0.",
      });
      return;
    }

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: "Vui lòng chọn danh mục cho giao dịch.",
      });
      return;
    }

    const currentUser = await findUserById(userId);
    let familyId: string | null = null;

    if (scope === "family") {
      if (!currentUser?.familyId) {
        res.status(400).json({
          success: false,
          message:
            "Bạn chưa tham gia nhóm gia đình nào. Không thể tạo giao dịch gia đình.",
        });
        return;
      }
      familyId = String(currentUser.familyId);
    }

    const txDate = date ? new Date(date) : new Date();
    if (isNaN(txDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Ngày giao dịch không hợp lệ.",
      });
      return;
    }

    const _id = new mongoose.Types.ObjectId();

    const created = await TransactionModel.create({
      _id,
      id: String(_id),
      userId: String(userId),
      familyId,
      scope: scope === "family" ? "family" : "personal",
      type,
      amount: numericAmount,
      categoryId: String(categoryId),
      note: String(note || "").trim(),
      date: txDate,
    });

    const tx = created.toObject();
    const categoryMap = await loadCategoryMap([tx.categoryId]);
    const userMap = new Map<string, any>();
    if (currentUser) {
      userMap.set(String(currentUser._id), currentUser);
      if (currentUser.id) userMap.set(String(currentUser.id), currentUser);
    }

    res.status(201).json({
      success: true,
      message: "Ghi chép giao dịch thành công!",
      data: serializeTransaction(tx, categoryMap, userMap, userId),
    });
  } catch (err: any) {
    console.error("Lỗi khi tạo giao dịch:", err);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi thêm giao dịch.",
    });
  }
};

// ============================================
// UPDATE TRANSACTION
// ============================================

export const updateTransaction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const { id } = req.params;
    const { type, amount, categoryId, note, date } = req.body;

    const tx = await TransactionModel.findOne(idFilter(id));
    if (!tx) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch cần chỉnh sửa.",
      });
      return;
    }

    const currentUser = await findUserById(userId);

    if (tx.scope === "family") {
      if (
        !currentUser?.familyId ||
        String(tx.familyId) !== String(currentUser.familyId)
      ) {
        res.status(403).json({
          success: false,
          message: "Bạn không thuộc nhóm gia đình chứa giao dịch này.",
        });
        return;
      }
    } else if (String(tx.userId) !== String(userId)) {
      res.status(403).json({
        success: false,
        message:
          "Bạn không có quyền chỉnh sửa giao dịch cá nhân của người khác.",
      });
      return;
    }

    if (type && ["income", "expense"].includes(type)) {
      tx.type = type;
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400).json({
          success: false,
          message: "Số tiền giao dịch phải lớn hơn 0.",
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

    await tx.save();

    const plain = tx.toObject();
    const [categoryMap, userMap] = await Promise.all([
      loadCategoryMap([plain.categoryId]),
      loadUserMap([plain.userId]),
    ]);

    res.status(200).json({
      success: true,
      message: "Cập nhật giao dịch thành công!",
      data: serializeTransaction(plain, categoryMap, userMap, userId),
    });
  } catch (err: any) {
    console.error("Lỗi khi cập nhật giao dịch:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi cập nhật giao dịch.",
    });
  }
};

// ============================================
// DELETE TRANSACTION
// ============================================

export const deleteTransaction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const { id } = req.params;

    const tx = await TransactionModel.findOne(idFilter(id));
    if (!tx) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch để xóa.",
      });
      return;
    }

    const currentUser = await findUserById(userId);

    if (tx.scope === "family") {
      if (
        !currentUser?.familyId ||
        String(tx.familyId) !== String(currentUser.familyId)
      ) {
        res.status(403).json({
          success: false,
          message: "Bạn không thuộc nhóm gia đình chứa giao dịch này.",
        });
        return;
      }
    } else if (String(tx.userId) !== String(userId)) {
      res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa giao dịch cá nhân này.",
      });
      return;
    }

    await TransactionModel.deleteOne({ _id: tx._id });

    res.status(200).json({
      success: true,
      message: "Đã xóa giao dịch thành công!",
    });
  } catch (err: any) {
    console.error("Lỗi khi xóa giao dịch:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa giao dịch.",
    });
  }
};

// ============================================
// STATISTICS
// ============================================

export const getStatistics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const { scope = "personal", month, year } = req.query;
    const targetScope = scope === "family" ? "family" : "personal";

    const currentUser = await findUserById(userId);

    if (targetScope === "family" && !currentUser?.familyId) {
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

    const now = new Date();
    const targetMonth = month
      ? parseInt(month as string, 10)
      : now.getMonth() + 1;
    const targetYear = year ? parseInt(year as string, 10) : now.getFullYear();

    const items = (await TransactionModel.find({
      $and: [
        buildScopeFilter(targetScope, userId, currentUser?.familyId),
        { date: monthRange(targetMonth, targetYear) },
      ],
    }).lean()) as any[];

    const categoryMap = await loadCategoryMap(items.map((i) => i.categoryId));

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<
      string,
      { name: string; amount: number; type: string; count: number }
    > = {};

    items.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }

      const catKey = String(t.categoryId);
      if (!categoryTotals[catKey]) {
        categoryTotals[catKey] = {
          name: categoryMap.get(catKey)?.name || "Khác",
          amount: 0,
          type: t.type,
          count: 0,
        };
      }
      categoryTotals[catKey].amount += t.amount;
      categoryTotals[catKey].count += 1;
    });

    const categoryBreakdown = Object.values(categoryTotals).sort(
      (a, b) => b.amount - a.amount,
    );

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: items.length,
        categoryBreakdown,
        month: targetMonth,
        year: targetYear,
      },
    });
  } catch (err: any) {
    console.error("Lỗi tính toán thống kê:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi tính toán thống kê.",
    });
  }
};
