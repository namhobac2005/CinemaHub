const express = require('express');
const { getPool, registerUser } = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'BI_MAT_CUA_BAN';

// =======================
// REGISTER
// =======================
router.post('/register', async (req, res) => {
  if (!hoTenDem || !ten || !soDienThoai || !email || !password) {
    return res.status(400).json({
      message: 'Vui lòng cung cấp đầy đủ thông tin.',
    });
  }

  try {
    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await registerUser(
      hoTenDem,
      ten,
      ngaySinh,
      soDienThoai,
      email,
      hashedPassword,
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      userId: result.userId,
    });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);

    if (err.message.includes('Email')) {
      return res.status(409).json({
        message: 'Email đã được sử dụng',
      });
    }

    res.status(500).json({
      message: 'Có lỗi xảy ra khi đăng ký',
    });
  }
});

// =======================
// LOGIN
// =======================
router.post('/login', async (req, res) => {
  const { email, password, tenDangNhap, matKhau } = req.body;

  // 🔥 mapping lại cho tương thích FE cũ
  const loginEmail = email || tenDangNhap;
  const loginPassword = password || matKhau;

  if (!loginEmail || !loginPassword) {
    return res.status(400).json({
      message: 'Vui lòng nhập email và mật khẩu',
    });
  }

  try {
    const pool = getPool();

    const [rows] = await pool.execute(
      `SELECT * FROM NguoiDung WHERE Email = ?`,
      [loginEmail],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Email không tồn tại',
      });
    }

    const user = rows[0];

    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(loginPassword, user.MatKhau);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Sai mật khẩu',
      });
    }

    const jwt = require('jsonwebtoken');

    const token = jwt.sign(
      { id: user.ID, role: user.VaiTro },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.ID,
        ten: user.Ten,
        email: user.Email,
        phoneNum: user.SoDienThoai,
        vaiTro: user.VaiTro,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
