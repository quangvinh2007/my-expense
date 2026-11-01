import mongoose, { Document, Schema } from 'mongoose';

export interface IUser {
  _id?: any;
  name: string;
  email: string;
  password?: string;
  familyId?: any;
  createdAt: Date;
  updatedAt?: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
      trim: true,
      maxlength: [100, 'Họ và tên không được vượt quá 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Vui lòng nhập địa chỉ email hợp lệ',
      ],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false,
    },
    familyId: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for email search
UserSchema.index({ email: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
