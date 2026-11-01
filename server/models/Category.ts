import mongoose, { Schema } from 'mongoose';

export interface ICategory {
  _id?: any;
  name: string;
  type: 'income' | 'expense';
  scope: 'personal' | 'family' | 'both';
  userId?: any;
  icon?: string;
  createdAt?: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [50, 'Tên danh mục không quá 50 ký tự'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Loại danh mục là bắt buộc (income hoặc expense)'],
    },
    scope: {
      type: String,
      enum: ['personal', 'family', 'both'],
      default: 'both',
    },
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      default: null, // null means standard global category
    },
    icon: {
      type: String,
      default: 'tag',
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ userId: 1, type: 1 });
CategorySchema.index({ type: 1 });

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
