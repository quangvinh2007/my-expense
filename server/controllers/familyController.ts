import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dbStore } from '../config/database.ts';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const createFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên nhóm gia đình.',
      });
      return;
    }

    const user = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    if (user.familyId) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên của một nhóm gia đình. Vui lòng rời nhóm hiện tại trước khi tạo nhóm mới.',
      });
      return;
    }

    // Generate unique code
    let inviteCode = generateInviteCode();
    while (dbStore.data.families.some((f) => f.inviteCode === inviteCode)) {
      inviteCode = generateInviteCode();
    }

    const newId = `fam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newFamily = {
      _id: newId,
      id: newId,
      name: String(name).trim(),
      inviteCode,
      createdBy: userId,
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    dbStore.data.families.push(newFamily);
    user.familyId = newId;
    dbStore.save();

    res.status(201).json({
      success: true,
      message: 'Tạo nhóm gia đình thành công!',
      data: {
        ...newFamily,
        isOwner: true,
        membersCount: 1,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo nhóm gia đình.',
    });
  }
};

export const getMyFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = dbStore.data.users.find((u) => String(u._id || u.id) === userId);

    if (!user || !user.familyId) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'Bạn chưa tham gia nhóm gia đình nào.',
      });
      return;
    }

    const family = dbStore.data.families.find(
      (f) => String(f._id || f.id) === String(user.familyId)
    );

    if (!family) {
      // Family was deleted or inconsistency
      user.familyId = null;
      dbStore.save();
      res.status(200).json({
        success: true,
        data: null,
      });
      return;
    }

    // Populate members
    const membersDetail = (family.members || []).map((m: any) => {
      const u = dbStore.data.users.find((usr) => String(usr._id || usr.id) === String(m.userId));
      return {
        userId: String(m.userId),
        name: u?.name || 'Thành viên ẩn',
        email: u?.email || '',
        role: m.role || 'member',
        joinedAt: m.joinedAt,
        isCurrentUser: String(m.userId) === userId,
      };
    });

    const isOwner = String(family.createdBy) === userId;

    res.status(200).json({
      success: true,
      data: {
        id: String(family._id || family.id),
        _id: String(family._id || family.id),
        name: family.name,
        inviteCode: family.inviteCode,
        createdBy: String(family.createdBy),
        isOwner,
        members: membersDetail,
        membersCount: membersDetail.length,
        createdAt: family.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhóm gia đình.',
    });
  }
};

export const joinFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { inviteCode } = req.body;

    if (!inviteCode || !String(inviteCode).trim()) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã mời tham gia gia đình.',
      });
      return;
    }

    const cleanCode = String(inviteCode).trim().toUpperCase();

    const user = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
      return;
    }

    if (user.familyId) {
      res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên của một nhóm gia đình. Vui lòng rời nhóm hiện tại trước khi tham gia nhóm mới.',
      });
      return;
    }

    const family = dbStore.data.families.find(
      (f) => f.inviteCode.toUpperCase() === cleanCode
    );

    if (!family) {
      res.status(404).json({
        success: false,
        message: 'Mã mời không tồn tại hoặc không chính xác. Vui lòng kiểm tra lại.',
      });
      return;
    }

    // Check if already in members array
    const isMember = family.members.some((m: any) => String(m.userId) === userId);
    if (!isMember) {
      family.members.push({
        userId,
        role: 'member',
        joinedAt: new Date(),
      });
    }

    const familyIdStr = String(family._id || family.id);
    user.familyId = familyIdStr;
    family.updatedAt = new Date();
    dbStore.save();

    res.status(200).json({
      success: true,
      message: `Bạn đã tham gia nhóm gia đình "${family.name}" thành công!`,
      data: {
        id: familyIdStr,
        name: family.name,
        inviteCode: family.inviteCode,
        isOwner: String(family.createdBy) === userId,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tham gia nhóm gia đình.',
    });
  }
};

export const updateFamily = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({
        success: false,
        message: 'Tên nhóm gia đình không được để trống.',
      });
      return;
    }

    const family = dbStore.data.families.find(
      (f) => String(f._id || f.id) === id
    );

    if (!family) {
      res.status(404).json({ success: false, message: 'Không tìm thấy nhóm gia đình.' });
      return;
    }

    if (String(family.createdBy) !== userId) {
      res.status(403).json({
        success: false,
        message: 'Chỉ người tạo nhóm (Trưởng nhóm) mới có quyền đổi tên gia đình.',
      });
      return;
    }

    family.name = String(name).trim();
    family.updatedAt = new Date();
    dbStore.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật tên gia đình thành công!',
      data: {
        id: String(family._id || family.id),
        name: family.name,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin gia đình.',
    });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const { id: familyId, userId: targetUserId } = req.params;

    const family = dbStore.data.families.find(
      (f) => String(f._id || f.id) === familyId
    );

    if (!family) {
      res.status(404).json({ success: false, message: 'Không tìm thấy nhóm gia đình.' });
      return;
    }

    const isOwner = String(family.createdBy) === currentUserId;
    const isSelfLeaving = currentUserId === targetUserId;

    if (!isOwner && !isSelfLeaving) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa thành viên khác khỏi nhóm.',
      });
      return;
    }

    if (isOwner && isSelfLeaving) {
      // Owner is leaving
      if (family.members.length > 1) {
        // Transfer ownership to the next member
        const nextMember = family.members.find((m: any) => String(m.userId) !== currentUserId);
        if (nextMember) {
          nextMember.role = 'owner';
          family.createdBy = nextMember.userId;
        }
      }
    }

    // Remove from members
    family.members = family.members.filter(
      (m: any) => String(m.userId) !== targetUserId
    );

    // If no members remain, remove family
    if (family.members.length === 0) {
      const idx = dbStore.data.families.findIndex((f) => String(f._id || f.id) === familyId);
      if (idx !== -1) {
        dbStore.data.families.splice(idx, 1);
      }
    }

    // Reset user's familyId
    const targetUser = dbStore.data.users.find((u) => String(u._id || u.id) === targetUserId);
    if (targetUser && String(targetUser.familyId) === familyId) {
      targetUser.familyId = null;
    }

    dbStore.save();

    res.status(200).json({
      success: true,
      message: isSelfLeaving ? 'Bạn đã rời nhóm gia đình.' : 'Đã xóa thành viên khỏi nhóm thành công.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý xóa thành viên.',
    });
  }
};
