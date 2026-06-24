# LumiForest Retreat & Booking

Dự án LumiForest là một nền tảng đặt phòng khách sạn, căn hộ, tour du lịch và mua voucher tích hợp. Hệ thống bao gồm 2 phần chính: **Frontend** (giao diện web dành cho khách hàng và nhân sự) và **Backend** (API server quản lý dữ liệu và logic nghiệp vụ).

---

## 1. Các Luồng Hoạt Động Chính (Web Flows)

### Luồng Khách Hàng (Customer Flow)
- **Xác thực & Bảo mật:** Đăng ký (yêu cầu xác thực mã OTP gửi qua Email), Đăng nhập, Quên mật khẩu. Hệ thống có bảo vệ chống brute-force (rate limiting) và sử dụng JWT.
- **Khám phá & Tương tác:** Xem và tìm kiếm Khách sạn, Phòng, Căn hộ, Tour du lịch, Voucher, và đọc Blog.
- **Wishlist & Thông báo:** Lưu dịch vụ yêu thích vào Wishlist, nhận và quản lý thông báo cá nhân.
- **Đánh giá (Review System):** Viết, chỉnh sửa, và xóa đánh giá cá nhân (dữ liệu được tự động sanitize chống XSS).
- **Liên hệ hỗ trợ:** Gửi form liên hệ/yêu cầu hỗ trợ (Contact Inquiries).
- **Đặt dịch vụ (Booking & Voucher Flow):**
  - Nhận (claim), mua lẻ Voucher và áp dụng vào đơn đặt hàng.
  - **Mua sỉ Voucher Doanh nghiệp:** Khi mua voucher, khách hàng có thể chọn mua số lượng lớn cho doanh nghiệp và upload danh sách nhân viên bằng file Excel để hệ thống tự động phân bổ.
    - *Định dạng file Excel:* Bắt buộc phải có các cột: `Full Name`, `Email`, `Phone Number`, `Address`.
    - *Tự động hóa:* Ngay sau khi xử lý file, hệ thống sẽ tự động gửi Email chứa mã QR Code độc quyền và đường link sử dụng đến từng nhân viên có trong danh sách. Nhân viên sau đó có thể redeem để sử dụng.
  - Tiến hành đặt dịch vụ (Khách sạn, Căn hộ, Tour). Sau khi đặt thành công, hệ thống luôn tự động gửi Email xác nhận chi tiết đơn hàng cho khách.
  - Quản lý lịch sử và trạng thái các đơn đặt chỗ của cá nhân.
- **Thanh toán (Payment Flow):**
  - *Lưu ý: Tính năng thanh toán hiện tại đang được giả lập (Mockup).*
  - Người dùng thực hiện thao tác xác nhận thanh toán trên giao diện hệ thống (chưa tích hợp cổng thanh toán thực tế hay mã QR).
  - *Định hướng phát triển tương lai:*
    1. Tích hợp thanh toán thông qua việc quét mã QR ngân hàng.
    2. Upload ảnh biên lai chuyển khoản.
    3. Backend sử dụng API của ngân hàng để tự động đối soát giao dịch, cập nhật trạng thái `PAID`/`CONFIRMED`, gửi Email hóa đơn (PDF + QR) và xử lý chống overbooking.


### Luồng Nhân Viên (Staff Flow)
- **Quản lý Dữ liệu:** Thêm/Sửa (không có quyền xóa) nội dung Khách sạn, Căn hộ, Phòng, Tour, Voucher, Bài viết Blog.
- **Quản lý Đơn hàng:** Xem và xử lý tất cả các booking hệ thống (như Check-in, Check-out, Cập nhật trạng thái).
- **Chăm sóc Khách hàng:** Xem (không được sửa) các giao dịch thanh toán để hỗ trợ khách, xem danh sách Contact Inquiries, và kiểm duyệt (xóa) các đánh giá vi phạm.

### Luồng Quản Trị Viên (Admin Flow)
- **Quản lý Toàn diện Dữ liệu:** Có toàn quyền Thêm/Sửa và Độc quyền Xóa (Soft Delete) đối với mọi tài nguyên hệ thống.
- **Quản lý Người dùng & Phân quyền:** Xem danh sách, khóa/mở khóa (ban/unban) tài khoản, cấp lại quyền (Role) với cơ chế an toàn chống tự hạ cấp.
- **Tài chính & Thống kê:** Quản trị doanh thu hệ thống, có đặc quyền xử lý Hoàn tiền (Refund) và bắt buộc cập nhật các trạng thái thanh toán.
- **Cấu hình Website:** Cho phép cập nhật các thông tin chung và thay đổi hình ảnh hiển thị trên toàn hệ thống web.
- **Kiểm toán An ninh:** Theo dõi Nhật ký hệ thống (Audit Logs) tự động ghi lại mọi thao tác nhạy cảm của Admin.

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
- **Luồng xử lý bất đồng bộ:** (Định hướng) Việc gửi mail hóa đơn và các tác vụ liên quan đến thanh toán sau này sẽ được xử lý bất đồng bộ để không chặn thời gian phản hồi (response time) từ callback của ngân hàng.
- **Token:** Đăng nhập dùng cả `accessToken` (để gọi API) và `refreshToken` (để xin cấp mới khi hết hạn 15 phút).

