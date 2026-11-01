import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.ts';
import { dbStore, isMongooseConnected } from '../config/database.ts';
import { UserModel } from '../models/User.ts';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    _id: string;
    name: string;
    email: string;
    familyId?: string | null;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Yêu cầu đăng nhập để truy cập tính năng này.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Mã xác thực không hợp lệ.',
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string };

    let user: any = null;

    if (isMongooseConnected) {
      user = await UserModel.findById(decoded.id).select('-password');
    }

    if (!user) {
      user = dbStore.data.users.find(
        (u) => String(u._id || u.id) === String(decoded.id)
      );
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc phiên đăng nhập đã hết hạn.',
      });
      return;
    }

    req.user = {
      id: String(user._id || user.id),
      _id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      familyId: user.familyId ? String(user.familyId) : null,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
  }
};
