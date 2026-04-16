# CinemaHub - Hệ Thống Quản Lý Rạp Chiếu Phim

**CinemaHub** là một giải pháp phần mềm toàn diện dành cho việc quản lý và vận hành rạp chiếu phim. Hệ thống phục vụ ba đối tượng chính: Khách hàng (đặt vé online), Nhân viên (bán vé tại quầy/POS) và Quản lý (thống kê, quản trị).

Dự án được thực hiện trong khuôn khổ môn học **Hệ Cơ Sở Dữ Liệu (CO2014) - HK251**.

## 👥 Thành viên nhóm thực hiện (Nhóm 1 - L04)

| STT |      Họ và Tên     |   MSSV  |
|:---:|:------------------:|:-------:|
|  1  | Nguyễn Lâm Huy     | 2311188 |
|  2  | Hồ Bắc Nam         | 2312157 |
|  3  | Ngô Quang Tân      | 2313052 |
|  4  | Trương Thái Nguyên | 2312391 |
|  5  | Nguyễn Huy Phúc    | 2312696 |
|:---:|:------------------:|:-------:|
---

## 🚀 Tính năng nổi bật

### 1. Phân hệ Khách hàng (Customer)
* **Đặt vé trực tuyến:** Chọn phim, rạp, suất chiếu và chọn ghế theo sơ đồ thời gian thực.
* **Tích hợp TMDB:** Hiển thị trailer, poster chất lượng cao và thông tin phim chi tiết từ The Movie Database.
* **Quản lý tài khoản:** Xem lịch sử giao dịch, tích điểm thành viên.

### 2. Phân hệ Nhân viên (Staff)
* **POS (Point of Sale):** Giao diện bán vé và combo bắp nước nhanh tại quầy.
* **Soát vé:** Kiểm tra trạng thái vé.

### 3. Phân hệ Quản lý (Manager)
* **Dashboard:** Báo cáo thống kê doanh thu theo ngày/tháng/phim.
* **Quản lý tài nguyên:** CRUD (Thêm/Xóa/Sửa) Phim, Suất chiếu, Phòng chiếu.
* **Quản lý nhân sự:** Phân quyền và quản lý tài khoản nhân viên/khách hàng.

### 4. Cơ sở dữ liệu (Database)
* **Ràng buộc toàn vẹn:** Đảm bảo dữ liệu nhất quán (Regex email/SĐT, logic giá vé).
* **Tự động hóa (Triggers):**
    * Tự động kiểm tra trùng lịch chiếu (`TRG_SuatChieu_NoOverlap`).
    * Tự động tích điểm khi thanh toán (`TRG_HoaDon_CongDiem`).
* **Xử lý nghiệp vụ (Stored Procedures):** Xử lý giao dịch đặt vé an toàn với Transaction (`sp_DatVe_TaoHoaDon`).

---

## 🛠 Cài đặt và Cấu hình

### Yêu cầu hệ thống
* **Database:** SQL Server (2019 trở lên).
* **Runtime:** Node.js & npm/yarn.

### Bước 1: Khởi tạo Cơ sở dữ liệu
1.  Mở SQL Server Management Studio (SSMS).
2.  Chạy file script `Database_Script.sql` (nằm trong thư mục `database/` hoặc `sql/`).
3.  **Lưu ý quan trọng:** Script sẽ tạo một User SQL tên là `sManager` với quyền `db_owner`. Đảm bảo ứng dụng kết nối bằng user này để đảm bảo bảo mật.
    * User: `sManager`
    * Pass: `pass123` (hoặc mật khẩu trong script).

### Bước 2: Tích hợp TMDB API (Bắt buộc để hiện ảnh phim)
Hệ thống sử dụng API của The Movie Database để lấy metadata phim.

**1. Lấy TMDB API Key:**
1.  Truy cập [The Movie Database (TMDB)](https://www.themoviedb.org/).
2.  Đăng nhập và vào **Settings** → **API**.
3.  Chọn **Create** hoặc **Request an API Key**.
4.  Chọn loại **Developer** (miễn phí) và điền thông tin.
5.  Copy **API Key (v3 auth)**.

**2. Cấu hình biến môi trường:**
1.  Mở file `.env` trong thư mục `backend` (hoặc tạo mới nếu chưa có).
2.  Thêm các dòng sau vào file:
    ```env
    DB_SERVER = [Your_Server]
    DB_DATABASE = Cinema
    DB_USER = sManager
    DB_PASSWORD = pass123
    DB_PORT = 1433
    TMDB_API_KEY=your_actual_api_key_here
    ```

### Bước 3: Chạy ứng dụng
**Backend:**
```bash
cd backend
npm install
npm run start
```**Frontend:**
```bash
cd frontend
npm install
npm run dev
```