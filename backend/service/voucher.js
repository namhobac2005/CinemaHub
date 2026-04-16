const express = require('express');
const pool = require('./db'); // Đã điều chỉnh cho mysql2
const router = express.Router();

router.use(async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    next();
  } catch (err) {
    res.status(401).json({
      message: 'Chưa kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.',
    });
  }
});

// API: GET /voucher/all
router.get('/all', async (req, res) => {
  try {
    const query = 'SELECT ID, MaGiam, Loai, MucGiam, SoLuong FROM Voucher';
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách voucher:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách voucher.' });
  }
});

/**
 * API: POST /voucher/add
 * {
 * "MaGiam": "HEVUI",
 * "Loai": "PhanTram",
 * "MucGiam": 15,
 * "SoLuong": 100
 * }
 */
const { v4: uuidv4 } = require('uuid');

router.post('/add', async (req, res) => {
  try {
    const { MaGiam, Loai, MucGiam, SoLuong } = req.body;

    // 1. Validation
    if (!MaGiam || !Loai || !MucGiam || SoLuong == null) {
      return res.status(400).json({
        message: 'Vui lòng nhập đủ thông tin MaGiam, Loai, MucGiam, SoLuong.',
      });
    }

    // 2. SINH UUID CHO VOUCHER
    const voucherId = uuidv4();

    // 3. CẬP NHẬT QUERY (Thêm cột ID)
    const query = `
      INSERT INTO Voucher (ID, MaGiam, Loai, MucGiam, SoLuong)
      VALUES (?, ?, ?, ?, ?)
    `;

    await pool.query(query, [voucherId, MaGiam, Loai, MucGiam, SoLuong]);

    res.status(201).json({
      message: 'Tạo voucher thành công.',
      id: voucherId,
    });
  } catch (err) {
    console.error('Lỗi khi tạo voucher:', err);

    // Xử lý lỗi trùng mã giảm giá (MaGiam UNIQUE)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Mã giảm giá này đã tồn tại.' });
    }

    res.status(500).json({ message: 'Lỗi server khi tạo voucher.' });
  }
});

//API: PUT /voucher/update/:id
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { MaGiam, Loai, MucGiam, SoLuong } = req.body;

    if (!MaGiam || !Loai || !MucGiam || SoLuong == null) {
      return res.status(400).json({
        message: 'Vui lòng nhập đủ thông tin MaGiam, Loai, MucGiam, SoLuong.',
      });
    }

    const query = `
      UPDATE Voucher
      SET MaGiam = ?,
          Loai = ?,
          MucGiam = ?,
          SoLuong = ?
      WHERE ID = ?
    `;

    await pool.query(query, [MaGiam, Loai, MucGiam, SoLuong, id]);
    res.status(200).json({ message: 'Cập nhật voucher thành công.' });
  } catch (err) {
    console.error('Lỗi khi cập nhật voucher:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật voucher.' });
  }
});

// API: DELETE /voucher/delete/:id
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM Voucher WHERE ID = ?';

    await pool.query(query, [id]);
    res.status(200).json({ message: 'Xóa voucher thành công.' });
  } catch (err) {
    // Mã lỗi 1451 là FK constraint trong MySQL (tương đương 547 của SQL Server)
    if (err.errno === 1451) {
      return res.status(400).json({
        message:
          'Lỗi: Không thể xóa voucher này vì nó đã được sử dụng trong một hóa đơn.',
      });
    }
    console.error('Lỗi khi xóa voucher:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa voucher.' });
  }
});

module.exports = router;
