const express = require('express');
const pool = require('./db'); // Đã điều chỉnh cho mysql2
const router = express.Router();

// Kiểm tra đăng nhập
router.use(async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    next();
  } catch (err) {
    res.status(401).json({
      message: 'Chưa kết nối đến cơ sở dữ liệu.',
    });
  }
});

// Lấy tất cả suất chiếu
router.get('/all', async (req, res) => {
  try {
    const query = `
      SELECT 
        sc.ID AS id,
        sc.ThoiGianBatDau AS startTime,
        p.TenPhim AS movieName,
        pc.SoPhong AS roomName,
        r.TenRap AS cinemaName
      FROM SuatChieu AS sc
      JOIN Phim AS p ON sc.Phim_ID = p.ID
      JOIN PhongChieu AS pc ON sc.SoPhong = pc.SoPhong AND pc.Rap_ID = sc.Rap_ID
      JOIN Rap AS r ON pc.Rap_ID = r.ID
      ORDER BY sc.ThoiGianBatDau DESC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách suất chiếu:', err);
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách suất chiếu.' });
  }
});

// Xem rạp
router.get('/rap', async (req, res) => {
  try {
    const query = `SELECT ID as cinemaId, TenRap AS cinemaName FROM Rap`;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách rạp:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách rạp.' });
  }
});

// Xem phòng chiếu theo rạp
router.get('/rap/:id/phongchieu/', async (req, res) => {
  try {
    const query = `SELECT SoPhong AS roomNo FROM PhongChieu WHERE Rap_ID = ?`;
    const [rows] = await pool.query(query, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách phòng chiếu:', err);
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách phòng chiếu.' });
  }
});

// Xem suất chiếu theo phòng chiếu
router.get('/rap/:cinemaId/phongchieu/:roomNo', async (req, res) => {
  try {
    const query = `
      SELECT sc.ID AS showtimeId,
             sc.ThoiGianBatDau AS startTime,
             p.TenPhim AS movieName,
             sc.TrangThai AS status,
             p.ID AS MaPhim,
             sc.SoPhong AS SoPhong,
             sc.Rap_ID AS MaRap
      FROM SuatChieu AS sc
      JOIN Phim AS p ON sc.Phim_ID = p.ID
      WHERE sc.SoPhong = ? AND sc.Rap_ID = ?
    `;
    const [rows] = await pool.query(query, [
      req.params.roomNo,
      req.params.cinemaId,
    ]);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách suất chiếu:', err);
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách suất chiếu.' });
  }
});

// Thêm suất chiếu
const { v4: uuidv4 } = require('uuid'); // Đảm bảo đã cài: npm install uuid

router.post('/add', async (req, res) => {
  const { MaPhim, MaPhong, MaRap, ThoiGianBatDau, TrangThai } = req.body;

  if (!MaPhim || !MaPhong || !MaRap || !ThoiGianBatDau) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
  }

  try {
    // BƯỚC QUAN TRỌNG: Sinh UUID cho suất chiếu mới
    const newShowtimeId = uuidv4();

    const insertQuery = `
      INSERT INTO SuatChieu (ID, Phim_ID, SoPhong, Rap_ID, ThoiGianBatDau, TrangThai)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    // Truyền newShowtimeId vào vị trí dấu hỏi đầu tiên
    await pool.query(insertQuery, [
      newShowtimeId,
      MaPhim,
      MaPhong,
      MaRap,
      ThoiGianBatDau,
      TrangThai || 'DangMo',
    ]);

    res.status(201).json({
      message: 'Thêm suất chiếu thành công.',
      id: newShowtimeId,
    });
  } catch (err) {
    console.error('Lỗi khi thêm suất chiếu:', err.message);
    res.status(500).json({ message: 'Lỗi server khi thêm suất chiếu.' });
  }
});

// Xóa suất chiếu
router.delete('/delete/:id', async (req, res) => {
  try {
    const showtimeId = req.params.id;
    const query = 'DELETE FROM SuatChieu WHERE ID = ?';

    await pool.query(query, [showtimeId]);
    res.status(200).json({ message: 'Xóa suất chiếu thành công.' });
  } catch (err) {
    console.error('Lỗi khi xóa suất chiếu:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa suất chiếu.' });
  }
});

// Cập nhật suất chiếu
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ThoiGianBatDau, TrangThai, MaPhim } = req.body;

    const newStartTime = new Date(ThoiGianBatDau);

    const query = `
      UPDATE SuatChieu
      SET ThoiGianBatDau = ?,
          TrangThai = ?,
          Phim_ID = ?
      WHERE ID = ?
    `;

    await pool.query(query, [newStartTime, TrangThai, MaPhim, id]);
    res.status(200).json({ message: 'Cập nhật suất chiếu thành công.' });
  } catch (err) {
    console.error('Lỗi khi cập nhật suất chiếu:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật suất chiếu.' });
  }
});

module.exports = router;
