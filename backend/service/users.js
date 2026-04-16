const express = require('express');
const pool = require('./db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Helper: Map dữ liệu khách hàng
function mapCustomerRow(row) {
  return {
    id: row.ID,
    name: `${row.HovaTendem || ''} ${row.Ten || ''}`.trim(),
    email: row.Email || '',
    phone: row.SoDienThoai || '',
    dateOfBirth: row.NgaySinh ? row.NgaySinh.toISOString().split('T')[0] : '',
    membershipTier: row.HangThanhVien || 'Moi',
    points: Number(row.DiemTichLuy) || 0,
  };
}

/** ==================== 📌 CUSTOMERS ROUTES ==================== */

router.get('/customers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ND.*, KH.HangThanhVien, KH.DiemTichLuy
      FROM KhachHang KH
      INNER JOIN NguoiDung ND ON ND.ID = KH.NguoiDung_ID
      ORDER BY KH.DiemTichLuy DESC`);
    res.json(rows.map(mapCustomerRow));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/customers', async (req, res) => {
  const { name, phone, email, dateOfBirth, points = 0 } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newId = uuidv4();
    const parts = name.trim().split(/\s+/);
    const ten = parts.pop();
    const hoDem = parts.join(' ');

    await connection.query(
      `INSERT INTO NguoiDung (ID, HovaTendem, Ten, VaiTro, SoDienThoai, Email, NgaySinh) VALUES (?, ?, ?, 'KhachHang', ?, ?, ?)`,
      [newId, hoDem, ten, phone, email, dateOfBirth || null],
    );

    await connection.query(
      `INSERT INTO KhachHang (NguoiDung_ID, DiemTichLuy) VALUES (?, ?)`,
      [newId, points],
    );

    await connection.commit();
    res.status(201).json({ id: newId, message: 'Tạo khách hàng thành công' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    // ID là string UUID, không dùng parseInt
    await pool.query(
      `DELETE FROM NguoiDung WHERE ID = ? AND VaiTro = 'KhachHang'`,
      [req.params.id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** ==================== 📌 EMPLOYEES ROUTES ==================== */

router.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ND.ID, ND.HovaTendem, ND.Ten, ND.Email, ND.SoDienThoai, NV.NgayVaoLam, NV.LuongCoBan, ND.VaiTro
      FROM NhanVien NV
      INNER JOIN NguoiDung ND ON ND.ID = NV.NguoiDung_ID`);

    res.json(
      rows.map((row) => ({
        id: row.ID,
        name: `${row.HovaTendem} ${row.Ten}`.trim(),
        email: row.Email,
        phone: row.SoDienThoai,
        joinDate: row.NgayVaoLam
          ? row.NgayVaoLam.toISOString().split('T')[0]
          : '',
        salary: Number(row.LuongCoBan),
        role: row.VaiTro,
      })),
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/employees', async (req, res) => {
  const { name, phone, email, salary, role } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newId = uuidv4();
    const parts = name.trim().split(/\s+/);
    const ten = parts.pop();
    const hoDem = parts.join(' ');

    await connection.query(
      `INSERT INTO NguoiDung (ID, HovaTendem, Ten, VaiTro, SoDienThoai, Email) VALUES (?, ?, ?, ?, ?, ?)`,
      [newId, hoDem, ten, role || 'NhanVien', phone, email],
    );

    await connection.query(
      `INSERT INTO NhanVien (NguoiDung_ID, NgayVaoLam, LuongCoBan) VALUES (?, CURDATE(), ?)`,
      [newId, salary],
    );

    await connection.commit();
    res.status(201).json({ id: newId, message: 'Tạo nhân viên thành công' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM NguoiDung WHERE ID = ? AND VaiTro IN ('NhanVien', 'QuanLy')`,
      [req.params.id],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
