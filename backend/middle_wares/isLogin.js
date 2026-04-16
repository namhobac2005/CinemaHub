// middleware/isLogin.js
const jwt = require('jsonwebtoken');

const isLogin = (req, res, next) => {
  // --- THÊM ĐOẠN NÀY ---
  // Nếu là request OPTIONS (trình duyệt check đường), cho qua luôn
  if (req.method === 'OPTIONS') {
    return next();
  }
  // ---------------------

  try {
    console.log('Đang kiểm tra token cho:', req.originalUrl); // Debug xem đang chặn ai

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('Không tìm thấy Header Authorization');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new Error('Token trống');

    const decodedToken = jwt.verify(token, 'BI_MAT_CUA_BAN'); // Nhớ khớp bí mật

    req.userData = { userId: decodedToken.id, role: decodedToken.role };
    next();
  } catch (err) {
    console.log('Bị chặn tại isLogin:', err.message);
    return res.status(401).json({ message: 'Chưa đăng nhập: ' + err.message });
  }
};

module.exports = isLogin;
