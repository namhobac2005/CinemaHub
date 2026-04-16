// db.js (MySQL version - Đã tối ưu)
const mysql = require('mysql2/promise');
require('dotenv').config();

const DEFAULT_ROLE = 'KhachHang';

// =======================
// TỰ ĐỘNG CONNECT DB
// =======================
// Khởi tạo pool ngay lập tức khi file này được gọi
const pool = mysql.createPool({
  host: process.env.DB_SERVER || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Thêm fallback rỗng cho XAMPP
  database: process.env.DB_DATABASE || 'Cinema',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test kết nối ngay lúc khởi động
pool
  .getConnection()
  .then((conn) => {
    console.log('✅ MySQL connected (Database: Cinema)');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối DB:', err.message);
  });

// =======================
// REGISTER USER
// =======================
const { v4: uuidv4 } = require('uuid');

const registerUser = async (
  hoTenDem,
  ten,
  ngaySinh,
  soDienThoai,
  email,
  password,
) => {
  const conn = await pool.getConnection();
  // 1. Sinh UUID mới cho người dùng
  const newUserId = uuidv4();

  try {
    await conn.beginTransaction();

    // 2. Insert NguoiDung với UUID đã sinh
    await conn.execute(
      `INSERT INTO NguoiDung (ID, HovaTendem, Ten, NgaySinh, VaiTro, SoDienThoai, Email, MatKhau)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newUserId,
        hoTenDem,
        ten,
        ngaySinh,
        'KhachHang',
        soDienThoai,
        email,
        password,
      ],
    );

    // 3. Sử dụng lại newUserId cho bảng KhachHang
    await conn.execute(
      `INSERT INTO KhachHang (NguoiDung_ID, DiemTichLuy) VALUES (?, ?)`,
      [newUserId, 0],
    );

    await conn.commit();
    return { success: true, userId: newUserId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// =======================
// ĐỒNG BỘ CŨ - MỚI
// =======================
// Gắn các hàm cũ vào thẳng object pool để tương thích ngược với các file chưa sửa
pool.connectDB = async () => {
  console.log('✅ DB đã được kết nối tự động!');
};
pool.getPool = () => pool;
pool.registerUser = registerUser;

// Export pool ra để các file Router mới xài thẳng
module.exports = pool;
