import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dbStore, DEFAULT_CATEGORIES } from '../config/database.ts';

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { type } = req.query;

    let list = dbStore.data.categories.filter((c) => {
      // Show default global categories (userId: null) or user's custom categories
      return !c.userId || String(c.userId) === userId;
    });

    if (type && ['income', 'expense'].includes(type as string)) {
      list = list.filter((c) => c.type === type);
    }

    // Map fields
    const formatted = list.map((c) => ({
      id: String(c.id || c._id),
      _id: String(c.id || c._id),
      name: c.name,
      type: c.type,
      scope: c.scope || 'both',
      icon: c.icon || 'tag',
      isDefault: !c.userId,
      isOwner: c.userId ? String(c.userId) === userId : false,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh mục.',
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, type, scope = 'both', icon = 'tag' } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống.',
      });
      return;
    }

    if (!type || !['income', 'expense'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Loại danh mục phải là thu nhập (income) hoặc chi tiêu (expense).',
      });
      return;
    }

    const cleanName = String(name).trim();

    // Check duplicate name for this user & type
    const exists = dbStore.data.categories.some(
      (c) =>
        (!c.userId || String(c.userId) === userId) &&
        c.type === type &&
        c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
      res.status(400).json({
        success: false,
        message: `Danh mục "${cleanName}" (${type === 'income' ? 'Thu nhập' : 'Chi tiêu'}) đã tồn tại.`,
      });
      return;
    }

    const newId = `cat_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCategory = {
      _id: newId,
      id: newId,
      name: cleanName,
      type,
      scope,
      icon,
      userId,
      createdAt: new Date(),
    };

    dbStore.data.categories.push(newCategory);
    dbStore.save();

    res.status(201).json({
      success: true,
      message: 'Thêm danh mục mới thành công!',
      data: {
        ...newCategory,
        isDefault: false,
        isOwner: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo danh mục.',
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, icon } = req.body;

    const cat = dbStore.data.categories.find((c) => String(c.id || c._id) === id);
    if (!cat) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục.',
      });
      return;
    }

    if (!cat.userId) {
      res.status(403).json({
        success: false,
        message: 'Không thể chỉnh sửa danh mục mặc định của hệ thống.',
      });
      return;
    }

    if (String(cat.userId) !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa danh mục này.',
      });
      return;
    }

    if (name && String(name).trim()) {
      cat.name = String(name).trim();
    }
    if (icon) {
      cat.icon = icon;
    }

    dbStore.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công!',
      data: {
        id: String(cat.id || cat._id),
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        isDefault: false,
        isOwner: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật danh mục.',
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const catIndex = dbStore.data.categories.findIndex(
      (c) => String(c.id || c._id) === id
    );

    if (catIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục cần xóa.',
      });
      return;
    }

    const cat = dbStore.data.categories[catIndex];

    if (!cat.userId) {
      res.status(403).json({
        success: false,
        message: 'Không thể xóa danh mục mặc định của hệ thống.',
      });
      return;
    }

    if (String(cat.userId) !== userId) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa danh mục này.',
      });
      return;
    }

    // Check if any transaction is using this category
    const isUsed = dbStore.data.transactions.some(
      (t) => String(t.categoryId) === id
    );

    if (isUsed) {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục đang có giao dịch sử dụng.',
      });
      return;
    }

    dbStore.data.categories.splice(catIndex, 1);
    dbStore.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa danh mục thành công!',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa danh mục.',
    });
  }
};
