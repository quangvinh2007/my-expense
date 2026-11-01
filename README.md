# My Expense - Quản lý Chi tiêu Cá nhân và Gia đình

Ứng dụng web tối giản, trực quan giúp người dùng ghi chép, quản lý và thống kê các khoản thu nhập, chi tiêu hằng ngày cho bản thân và gia đình.

---

## 1. Tính năng chính

- **Xác thực an toàn:** Đăng ký, đăng nhập với mã hóa mật khẩu bcryptjs và JWT token.
- **Quản lý chi tiêu cá nhân:** Ghi chép thu chi hàng ngày, tìm kiếm, lọc theo ngày/tháng/loại/danh mục, chỉnh sửa và xóa giao dịch.
- **Quản lý tài chính gia đình:**
  - Tạo nhóm gia đình với mã mời độc nhất (6 ký tự).
  - Người thân tham gia nhóm bằng mã mời.
  - Quản lý ngân sách chung, thêm thu chi gia đình, phân quyền trưởng nhóm / thành viên.
  - Tách bạch hoàn toàn giữa chi tiêu cá nhân và chi tiêu gia đình.
- **Bảng tổng quan (Dashboard):**
  - Chuyển đổi nhanh 1-chạm giữa chế độ Cá nhân và Gia đình.
  - Hiển thị Tổng thu, Tổng chi, Số dư còn lại trong tháng được chọn.
  - Biểu đồ tròn Recharts thể hiện cơ cấu chi tiêu theo danh mục.
  - Danh sách giao dịch gần nhất.
- **Báo cáo thống kê:**
  - Biểu đồ cột thu nhập vs chi tiêu 12 tháng trong năm.
  - Cơ cấu chi tiêu theo danh mục tỷ lệ %.
  - Top 5 khoản chi lớn nhất.
  - Bảng tổng hợp chi tiết theo từng tháng.
- **Quản lý danh mục:**
  - Danh mục chuẩn mặc định của hệ thống.
  - Tự do tạo thêm danh mục tùy chỉnh cho thu nhập hoặc chi tiêu.
  - Xóa an toàn (chỉ cho phép xóa khi danh mục chưa có giao dịch nào sử dụng).
- **Giao diện 100% tiếng Việt:** Thiết kế tối giản, sạch sẽ, chuẩn định dạng tiền tệ Việt Nam `1.000.000 VNĐ` và định dạng ngày `DD/MM/YYYY`.

---

## 2. Công nghệ sử dụng (MERN Stack)

- **Frontend:**
  - ReactJS & Vite
  - Tailwind CSS v4
  - React Router DOM
  - Axios (với interceptor tự động đính kèm token xác thực)
  - Recharts (biểu đồ thống kê)
  - Lucide React (bộ icon tối giản)
- **Backend:**
  - Node.js & Express.js
  - MongoDB & Mongoose ODM
  - Bộ lưu trữ bền vững tích hợp (Embedded DB JSON) tự động dự phòng khi chạy standalone
  - JSON Web Token (JWT) & bcryptjs mã hóa mật khẩu
  - CORS middleware

---

## 3. Cấu trúc thư mục dự án

```text
my-expense/
│
├── server/
│   ├── config/
│   │   ├── env.ts          # Quản lý và kiểm tra biến môi trường
│   │   ├── database.ts     # Kết nối MongoDB / Mongoose & Storage
│   │   └── cors.ts         # Cấu hình CORS
│   ├── models/
│   │   ├── User.ts         # Model người dùng
│   │   ├── Family.ts       # Model nhóm gia đình & mã mời
│   │   ├── Transaction.ts  # Model giao dịch thu/chi
│   │   └── Category.ts     # Model danh mục
│   ├── middleware/
│   │   └── auth.ts         # Middleware xác thực JWT
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── transactionController.ts
│   │   ├── familyController.ts
│   │   ├── categoryController.ts
│   │   └── reportController.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   ├── familyRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   └── reportRoutes.ts
│   ├── server.ts
│   └── .env.example
│
├── src/
│   ├── config/
│   │   └── api.ts          # Cấu hình Axios instance & baseURL
│   ├── context/
│   │   └── AuthContext.tsx # Context quản lý phiên đăng nhập và chế độ xem
│   ├── services/
│   │   └── api.ts          # Các hàm gọi REST API được typed
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── TransactionModal.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   └── Toast.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Categories.tsx
│   │   ├── Family.tsx
│   │   ├── Reports.tsx
│   │   └── Profile.tsx
│   ├── utils/
│   │   └── format.ts       # Định dạng VNĐ và ngày tháng DD/MM/YYYY
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts               # Điểm khởi chạy tích hợp server & Vite
├── .env.example
├── package.json
└── README.md
```

---

## 4. Hướng dẫn cài đặt và khởi chạy

### Bước 1: Cài đặt thư viện dependencies
```bash
npm install
```

### Bước 2: Thiết lập biến môi trường
Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Các biến môi trường:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=my_expense
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
VITE_API_URL=/api
```

### Bước 3: Khởi chạy ứng dụng
Chạy máy chủ ở chế độ phát triển (Development):
```bash
npm run dev
```

Truy cập website tại: `http://localhost:3000`

---

## 5. Tài khoản mẫu trải nghiệm nhanh

Hệ thống đã có sẵn tài khoản mẫu kèm các giao dịch thu chi thực tế:
- **Email:** `demo@myexpense.vn`
- **Mật khẩu:** `password123`
- **Nhóm gia đình:** Đã kết nối với nhóm *"Gia đình Minh & Mai"* (Mã mời: `HP8899`)

*Hoặc bạn có thể bấm **Đăng ký** để tạo một tài khoản mới hoàn toàn.*

---

## 6. Danh sách API Endpoints

### Xác thực (Auth)
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập tài khoản
- `GET /api/auth/me` - Lấy thông tin tài khoản đang đăng nhập
- `PUT /api/auth/profile` - Cập nhật họ tên hoặc đổi mật khẩu

### Giao dịch (Transactions)
- `GET /api/transactions` - Lấy danh sách giao dịch (hỗ trợ lọc theo scope, category, type, date, search, pagination)
- `POST /api/transactions` - Thêm giao dịch mới
- `PUT /api/transactions/:id` - Chỉnh sửa giao dịch
- `DELETE /api/transactions/:id` - Xóa giao dịch
- `GET /api/transactions/statistics` - Lấy thống kê tổng thu, tổng chi, số dư theo tháng

### Gia đình (Families)
- `POST /api/families` - Tạo nhóm gia đình mới
- `GET /api/families` - Lấy thông tin nhóm gia đình của tài khoản
- `POST /api/families/join` - Tham gia nhóm gia đình bằng mã mời
- `PUT /api/families/:id` - Đổi tên nhóm gia đình (Trưởng nhóm)
- `DELETE /api/families/:id/members/:userId` - Xóa thành viên hoặc rời nhóm

### Danh mục (Categories)
- `GET /api/categories` - Lấy danh sách danh mục (hệ thống & tùy chỉnh)
- `POST /api/categories` - Tạo danh mục tùy chỉnh
- `PUT /api/categories/:id` - Đổi tên danh mục tùy chỉnh
- `DELETE /api/categories/:id` - Xóa danh mục (chỉ khi chưa có giao dịch nào dùng)

### Báo cáo (Reports)
- `GET /api/reports/overview` - Tổng quan cả năm
- `GET /api/reports/monthly` - Thống kê thu chi 12 tháng
- `GET /api/reports/categories` - Cơ cấu chi tiêu theo danh mục & top chi tiêu lớn
