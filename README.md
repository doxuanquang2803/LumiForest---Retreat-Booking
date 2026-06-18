# LumiForest Retreat & Booking

Dự án LumiForest là một nền tảng đặt phòng khách sạn, căn hộ, tour du lịch và mua voucher tích hợp. Hệ thống bao gồm 2 phần chính: **Frontend** (giao diện web dành cho khách hàng và nhân sự) và **Backend** (API server quản lý dữ liệu và logic nghiệp vụ).

---

## 1. Các Luồng Hoạt Động Chính (Web Flows)

### Luồng Khách Hàng (Customer Flow)
- **Xác thực (Authentication):**
  - **Đăng ký (Register):** Đăng ký tài khoản qua Email có xác thực OTP.
  - **Đăng nhập (Login):** Bằng tài khoản thường hoặc bằng tài khoản Google (Google Identity Services).
  - **Quên mật khẩu:** Cấp lại mật khẩu qua OTP.
- **Tìm kiếm & Khám phá:** Tìm kiếm khách sạn, căn hộ, phòng, tour, voucher với bộ lọc linh hoạt (giá, số người, hạng sao).
- **Đặt dịch vụ (Booking Flow):**
  - Xem chi tiết phòng/tour/căn hộ.
  - Nếu đã đăng nhập, hệ thống tự động điền thông tin khách hàng vào form.
  - Sau khi chốt đơn, người dùng được chuyển đến luồng thanh toán.
- **Thanh toán (Payment Flow):**
  - Thanh toán thông qua việc quét mã QR ngân hàng.
  - Sau khi thanh toán thành công, người dùng tải lên ảnh chụp màn hình (biên lai chuyển khoản).
  - Backend sử dụng API của ngân hàng (ví dụ SeABank) để lắng nghe biến động số dư. Sau khi giao dịch khớp, hệ thống tự động:
    1. Cập nhật trạng thái `payment_status` thành `PAID` và `booking_status` thành `CONFIRMED`.
    2. Gửi Email đính kèm hóa đơn (Invoice PDF + QR Code) cho khách hàng.
    3. Hủy bỏ các booking trùng lịch tự động để tránh overbooking.

### Luồng Nhân Viên (Staff Flow) / Quản trị viên (Admin Flow)
- Truy cập vào `/staff/index.html` hoặc `/admin-dashboard/index.html`.
- Quản lý danh sách đặt phòng, tour, trạng thái thanh toán, duyệt thanh toán bằng tay (trong trường hợp tự xử lý), theo dõi doanh thu và phản hồi từ khách hàng.

---

## 2. Công Nghệ Sử Dụng

- **Frontend:** HTML5, CSS3, Vanilla JS, Bootstrap 4, i18n (hỗ trợ đa ngôn ngữ Anh/Việt), Axios/Fetch.
- **Backend:** Node.js, Express.js.
- **Cơ Sở Dữ Liệu:** PostgreSQL (qua dịch vụ Supabase).
- **ORM:** Prisma.
- **Xác thực:** JWT (JSON Web Token), Google OAuth 2.0.
- **Tiện ích:** Nodemailer (gửi email hóa đơn, OTP), QRCode (tạo ảnh QR), Multer (upload ảnh).

---

## 3. Cấu Trúc Thư Mục

```
.
├── travel-backend-main/      # Source code API (Node.js/Express)
│   ├── prisma/               # Schema cho cơ sở dữ liệu Postgres
│   ├── src/                  # Controllers, Routes, Services, Middleware
│   ├── server.js             # Entry point
│   └── .env                  # File cấu hình biến môi trường (cần tạo)
│
└── travel-frontend/          # Source code giao diện (HTML, CSS, JS)
    ├── assets/               # CSS, JS (api.js, auth.js, i18n.js, ...), Fonts, Images
    ├── admin-dashboard/      # Giao diện cho Admin
    ├── staff/                # Giao diện cho Nhân viên
    └── *.html                # Giao diện khách hàng (index, login, booking...)
```

---

## 4. Hướng Dẫn Cài Đặt và Chạy (Setup & Run)

### A. Thiết lập Backend (`travel-backend-main`)

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd travel-backend-main
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Tạo hoặc chỉnh sửa file `.env` ngang hàng với thư mục `src`. Dưới đây là nội dung mẫu bắt buộc phải có:

   ```env
   PORT=3000
   ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500

   # Cấu hình Supabase / PostgreSQL
   # SUPABASE_URL: Lấy tại mục Project Settings -> API của Supabase (dạng https://<id>.supabase.co)
   SUPABASE_URL=YOUR_SUPABASE_URL
   # SUPABASE_SERVICE_KEY: Lấy tại Project Settings -> API (phần service_role secret)
   SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_KEY
   # DATABASE_URL: Dùng để ứng dụng đọc/ghi dữ liệu hàng ngày. Lấy tại Project Settings -> Database (Connection string dạng Transaction Pooler, port 6543, thêm ?pgbouncer=true ở cuối)
   DATABASE_URL=YOUR_DATABASE_URL
   # DIRECT_URL: Dành riêng cho Prisma dùng để đồng bộ/cập nhật cấu trúc bảng (Migrations). Lấy tại Project Settings -> Database (Connection string dạng Session/Direct, port 5432)
   DIRECT_URL=YOUR_DIRECT_URL

   # JWT configuration
   # JWT_SECRET: Một chuỗi ký tự ngẫu nhiên do bạn tự đặt để mã hóa token
   JWT_SECRET=YOUR_JWT_SECRET_KEY
   JWT_EXPIRES_IN=15m

   # Send Email (Nodemailer config)
   EMAIL_USER=YOUR_EMAIL@GMAIL.COM
   # EMAIL_PASS: Mật khẩu ứng dụng (App Password) sinh từ tài khoản Google (không phải mật khẩu đăng nhập gmail)
   EMAIL_PASS=YOUR_APP_PASSWORD

   # Google Auth (Dành cho chức năng đăng nhập Google)
   # GOOGLE_CLIENT_ID: Lấy từ Google Cloud Console -> APIs & Services -> Credentials (dạng Web application)
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   ```
   *(Lưu ý: Bạn phải bật chế độ Mật khẩu Ứng dụng - App Password trên Google Account của email để sử dụng nodemailer).*

4. **Đồng bộ cơ sở dữ liệu (Prisma):**
   Đẩy schema lên database (chỉ cần chạy lần đầu hoặc khi đổi schema):
   ```bash
   npx prisma db push
   ```
   Tạo Prisma Client:
   ```bash
   npx prisma generate
   ```

5. **Chạy Server:**
   ```bash
   npm run dev
   ```
   Backend sẽ chạy tại: `http://localhost:3000`

### B. Thiết lập Frontend (`travel-frontend`)

1. Mở thư mục `travel-frontend` bằng một IDE (khuyên dùng Visual Studio Code).
2. Cài đặt tiện ích **Live Server** (hoặc dùng bất kỳ HTTP server tĩnh nào).
3. **Cấu hình API kết nối với backend:**
   Mở file `/travel-frontend/assets/js/api.js`. Kiểm tra và đảm bảo biến `BASE_URL` trỏ về đúng địa chỉ Backend:
   ```javascript
   const BASE_URL = 'http://localhost:3000/api';
   ```
4. **Cấu hình Google Sign-in (Nếu dùng tính năng đăng nhập Google):**
   - Mở `/travel-frontend/login.html` và `/travel-frontend/register.html`.
   - Tìm kiếm `YOUR_GOOGLE_CLIENT_ID` trong thẻ javascript (`google.accounts.id.initialize({ client_id: 'YOUR_GOOGLE_CLIENT_ID' ... })`) và thay bằng Client ID thực tế của bạn.
5. Click chuột phải vào file `index.html` và chọn **"Open with Live Server"**. Mặc định dự án sẽ mở tại cổng `5500`.

---

## 5. Lưu ý cho người mới (Onboarding Notes)

- **Ngôn ngữ:** Website sử dụng cơ chế nội địa hóa tự viết tay (file `assets/js/i18n.js`). Các thẻ có thuộc tính `data-i18n="..."` sẽ tự động được dịch bằng JS. Nút đổi ngôn ngữ nằm trên Navbar. Nút Đăng nhập Google cũng tự động đổi ngôn ngữ theo web.
- **Luồng xử lý bất đồng bộ:** Việc gửi mail hóa đơn và tạo QR code ở Backend đã được đưa vào `(async () => {})()` để không chặn thời gian phản hồi (response time) từ callback của ngân hàng.
- **Token:** Đăng nhập dùng cả `accessToken` (để gọi API) và `refreshToken` (để xin cấp mới khi hết hạn 15 phút).

