import mongoose from "mongoose";
import { ENV } from "./env.ts";

// ============================================
// DATABASE CONFIGURATION
// ============================================

export let isMongooseConnected = false;

// ============================================
// DEFAULT CATEGORIES
// ============================================

export const DEFAULT_CATEGORIES = [
  // Chi tiêu
  {
    id: "cat_food",
    name: "Ăn uống",
    type: "expense",
    scope: "both",
    icon: "utensils",
    userId: null,
  },
  {
    id: "cat_shopping",
    name: "Mua sắm",
    type: "expense",
    scope: "both",
    icon: "shopping-bag",
    userId: null,
  },
  {
    id: "cat_transport",
    name: "Đi lại",
    type: "expense",
    scope: "both",
    icon: "car",
    userId: null,
  },
  {
    id: "cat_bills",
    name: "Hóa đơn",
    type: "expense",
    scope: "both",
    icon: "receipt",
    userId: null,
  },
  {
    id: "cat_housing",
    name: "Nhà ở",
    type: "expense",
    scope: "both",
    icon: "home",
    userId: null,
  },
  {
    id: "cat_entertainment",
    name: "Giải trí",
    type: "expense",
    scope: "both",
    icon: "film",
    userId: null,
  },
  {
    id: "cat_health",
    name: "Sức khỏe",
    type: "expense",
    scope: "both",
    icon: "heart-pulse",
    userId: null,
  },
  {
    id: "cat_education",
    name: "Giáo dục",
    type: "expense",
    scope: "both",
    icon: "graduation-cap",
    userId: null,
  },
  {
    id: "cat_other_exp",
    name: "Khác",
    type: "expense",
    scope: "both",
    icon: "more-horizontal",
    userId: null,
  },

  // Thu nhập
  {
    id: "cat_salary",
    name: "Lương",
    type: "income",
    scope: "both",
    icon: "wallet",
    userId: null,
  },
  {
    id: "cat_bonus",
    name: "Thưởng",
    type: "income",
    scope: "both",
    icon: "gift",
    userId: null,
  },
  {
    id: "cat_business",
    name: "Kinh doanh",
    type: "income",
    scope: "both",
    icon: "trending-up",
    userId: null,
  },
  {
    id: "cat_invest",
    name: "Đầu tư",
    type: "income",
    scope: "both",
    icon: "pie-chart",
    userId: null,
  },
  {
    id: "cat_other_inc",
    name: "Thu nhập khác",
    type: "income",
    scope: "both",
    icon: "circle-dollar-sign",
    userId: null,
  },
];

// ============================================
// LEGACY DB STORE
// Giữ tương thích với code cũ.
// Không sử dụng làm database chính.
// ============================================

export interface DbSchema {
  users: any[];
  families: any[];
  transactions: any[];
  categories: any[];
}

let memoryDb: DbSchema = {
  users: [],
  families: [],
  transactions: [],
  categories: [...DEFAULT_CATEGORIES],
};

// Giữ export cũ để tránh lỗi import.
// Lưu ý: dữ liệu trong đây chỉ nằm trong RAM.
export function saveDbFile(): void {
  console.warn(
    "[DATABASE] saveDbFile() là hàm tương thích cũ. " +
      "Hãy chuyển các thao tác lưu dữ liệu sang MongoDB.",
  );
}

export const dbStore = {
  get data(): DbSchema {
    return memoryDb;
  },

  save: saveDbFile,
};

// ============================================
// MONGOOSE MODELS
// ============================================

const userSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    familyId: { type: String, default: null },
  },
  { timestamps: true, collection: "users" },
);

const familySchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true },
    inviteCode: { type: String, unique: true, sparse: true },
    createdBy: { type: String, required: true },
    members: [
      {
        userId: { type: String, required: true },
        role: {
          type: String,
          enum: ["owner", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, collection: "families" },
);

const transactionSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    userId: { type: String, required: true, index: true },
    familyId: { type: String, default: null, index: true },
    scope: {
      type: String,
      enum: ["personal", "family"],
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: String, required: true },
    note: { type: String, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: true, collection: "transactions" },
);

const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    scope: { type: String, default: "both" },
    icon: { type: String, default: "circle-dollar-sign" },
    userId: { type: String, default: null },
  },
  { timestamps: true, collection: "categories" },
);

export const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

export const FamilyModel =
  mongoose.models.Family || mongoose.model("Family", familySchema);

export const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

// ============================================
// SEED DEFAULT CATEGORIES
// ============================================

async function seedDefaultCategories(): Promise<void> {
  const count = await CategoryModel.countDocuments();

  if (count > 0) {
    console.log("[DATABASE] Categories đã tồn tại, bỏ qua seed.");
    return;
  }

  await CategoryModel.insertMany(DEFAULT_CATEGORIES);

  console.log("[DATABASE] Đã khởi tạo danh mục mặc định.");
}

// ============================================
// CONNECT DATABASE
// ============================================

export async function connectDB(): Promise<void> {
  if (isMongooseConnected) {
    return;
  }

  try {
    console.log("[DATABASE] Đang kết nối MongoDB Atlas...");

    await mongoose.connect(ENV.MONGODB_URI, {
      dbName: ENV.DB_NAME,
      serverSelectionTimeoutMS: 10000,
    });

    isMongooseConnected = true;

    console.log("[DATABASE] Kết nối MongoDB thành công.");
    console.log(`[DATABASE] Database: ${ENV.DB_NAME}`);

    await seedDefaultCategories();
  } catch (error) {
    isMongooseConnected = false;

    console.error("[DATABASE] Không thể kết nối MongoDB:", error);

    throw new Error(
      "Không thể kết nối MongoDB. Kiểm tra MONGODB_URI, DB_NAME và Network Access.",
    );
  }
}

// ============================================
// DISCONNECT DATABASE
// ============================================

export async function disconnectDB(): Promise<void> {
  if (!isMongooseConnected) {
    return;
  }

  await mongoose.disconnect();
  isMongooseConnected = false;

  console.log("[DATABASE] Đã ngắt kết nối MongoDB.");
}
