import mongoose, { Schema } from "mongoose";

export interface ITransaction {
  _id?: any;
  userId: any;
  familyId?: any;
  scope: "personal" | "family";
  type: "income" | "expense";
  amount: number;
  categoryId: any;
  note?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId as any,
      ref: "User",
      required: [true, "Người tạo giao dịch là bắt buộc"],
    },
    familyId: {
      type: Schema.Types.ObjectId as any,
      ref: "Family",
      default: null,
    },
    scope: {
      type: String,
      enum: ["personal", "family"],
      required: [true, "Phạm vi giao dịch (personal hoặc family) là bắt buộc"],
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: [true, "Loại giao dịch (income hoặc expense) là bắt buộc"],
    },
    amount: {
      type: Number,
      required: [true, "Số tiền giao dịch là bắt buộc"],
      min: [1, "Số tiền phải lớn hơn 0"],
    },
    categoryId: {
      type: Schema.Types.ObjectId as any,
      ref: "Category",
      required: [true, "Danh mục giao dịch là bắt buộc"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được dài quá 500 ký tự"],
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Ngày giao dịch là bắt buộc"],
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

TransactionSchema.index({ userId: 1, scope: 1, date: -1 });
TransactionSchema.index({ familyId: 1, scope: 1, date: -1 });
TransactionSchema.index({ categoryId: 1 });
TransactionSchema.index({ date: -1 });

export const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
