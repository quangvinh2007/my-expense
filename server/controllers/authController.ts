import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.ts';
import { dbStore, isMongooseConnected } from '../config/database.ts';
import { UserModel } from '../models/User.ts';
import { AuthRequest } from '../middleware/auth.ts';

function generateToken(userId: string, email: string) {
  return jwt.sign({ id: userId, email }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.',
      });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu xác nhận không khớp.',
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check existing
    let existingUser: any = null;
    if (isMongooseConnected) {
      existingUser = await UserModel.findOne({ email: cleanEmail });
    }
    if (!existingUser) {
      existingUser = dbStore.data.users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
    }

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newId = crypto.randomUUID ? crypto.randomUUID() : `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const newUser = {
      _id: String(newId),
      id: String(newId),
      name: String(name).trim(),
      email: cleanEmail,
      password: hashedPassword,
      familyId: null,
      createdAt: now,
      updatedAt: now,
    };

    if (isMongooseConnected) {
      try {
        const created = await UserModel.create({
          name: newUser.name,
          email: newUser.email,
          password: hashedPassword,
          familyId: null,
        });
        newUser._id = String(created._id);
        newUser.id = String(created._id);
      } catch (e) {
        console.warn('Fallback to local store on mongoose save:', e);
      }
    }

    dbStore.data.users.push(newUser);
    dbStore.save();

    const token = generateToken(newUser.id, newUser.email);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        token,
        user: {
          id: newUser.id,
          _id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          familyId: null,
          createdAt: newUser.createdAt,
        },
      },
    });
  } catch (err: any) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ trong quá trình đăng ký.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu.',
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();

    let user: any = null;
    if (isMongooseConnected) {
      user = await UserModel.findOne({ email: cleanEmail }).select('+password');
    }

    if (!user) {
      user = dbStore.data.users.find(
        (u) => u.email.toLowerCase() === cleanEmail
      );
    }

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
      return;
    }

    const userId = String(user._id || user.id);
    const token = generateToken(userId, user.email);

    // Get family info if joined
    let family = null;
    if (user.familyId) {
      family = dbStore.data.families.find(
        (f) => String(f._id || f.id) === String(user.familyId)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        token,
        user: {
          id: userId,
          _id: userId,
          name: user.name,
          email: user.email,
          familyId: user.familyId ? String(user.familyId) : null,
          family: family
            ? {
                id: String(family._id || family.id),
                name: family.name,
                inviteCode: family.inviteCode,
                isOwner: String(family.createdBy) === userId,
              }
            : null,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err: any) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi máy chủ trong quá trình đăng nhập.',
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = dbStore.data.users.find((u) => String(u._id || u.id) === userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin tài khoản.',
      });
      return;
    }

    let family = null;
    if (user.familyId) {
      const fam = dbStore.data.families.find(
        (f) => String(f._id || f.id) === String(user.familyId)
      );
      if (fam) {
        family = {
          id: String(fam._id || fam.id),
          _id: String(fam._id || fam.id),
          name: fam.name,
          inviteCode: fam.inviteCode,
          createdBy: String(fam.createdBy),
          isOwner: String(fam.createdBy) === userId,
          membersCount: fam.members ? fam.members.length : 1,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: String(user._id || user.id),
        _id: String(user._id || user.id),
        name: user.name,
        email: user.email,
        familyId: user.familyId ? String(user.familyId) : null,
        family,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thông tin tài khoản.',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, currentPassword, newPassword } = req.body;

    const user = dbStore.data.users.find((u) => String(u._id || u.id) === userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản.',
      });
      return;
    }

    if (name) {
      user.name = String(name).trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng.',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    user.updatedAt = new Date();
    dbStore.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      data: {
        id: String(user._id || user.id),
        name: user.name,
        email: user.email,
        familyId: user.familyId,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin.',
    });
  }
};
