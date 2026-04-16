const express = require('express');
const pool = require('./db'); // Đã điều chỉnh cho mysql2
const router = express.Router();

// Kiểm tra đăng nhập / Kết nối DB
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

// Lấy tất cả phim
router.get('/all', async (req, res) => {
  try {
    const query = `
      SELECT 
        ID AS id,        
        TenPhim AS name,        
        MoTa AS description,   
        ThoiLuong AS duration,  
        XuatXu AS origin,       
        DangPhim AS type, 
        PhuDe AS subtitles, 
        LongTieng AS dubbing, 
        NgayPhatHanh AS releaseDate, 
        TrangThaiPhim AS status, 
        TrailerURL AS TrailerURl, 
        PosterURL AS PosterURL, 
        GioiHanTuoi AS AgeLimit
      FROM Phim
    `;
    const [rows] = await pool.query(query); // Lấy data từ kết quả trả về
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách phim:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phim.' });
  }
});

// Thêm phim mới
const { v4: uuidv4 } = require('uuid');

router.post('/add', async (req, res) => {
  try {
    const {
      name,
      description,
      duration,
      origin,
      type,
      status,
      TrailerURl,
      PosterURL,
      AgeLimit,
    } = req.body;

    // Sinh ID cho phim mới
    const movieId = uuidv4();

    const query = `
      INSERT INTO Phim (ID, TenPhim, MoTa, ThoiLuong, XuatXu, DangPhim, TrangThaiPhim, TrailerURL, PosterURL, GioiHanTuoi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      movieId,
      name,
      description,
      duration,
      origin,
      type,
      status,
      TrailerURl,
      PosterURL,
      AgeLimit,
    ]);

    res.status(201).json({ message: 'Thêm phim thành công.', id: movieId });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

// Xóa phim
router.delete('/delete/:id', async (req, res) => {
  try {
    const movieId = req.params.id;
    const query = 'DELETE FROM Phim WHERE ID = ?';

    await pool.query(query, [movieId]);

    res.status(200).json({ message: 'Xóa phim thành công.' });
  } catch (err) {
    console.error('Lỗi khi xóa phim:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa phim.' });
  }
});

// Cập nhật thông tin phim
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      duration,
      origin,
      type,
      subtitles,
      dubbing,
      releaseDate,
      status,
      TrailerURl,
      PosterURL,
      AgeLimit,
    } = req.body;

    const query = ` 
      UPDATE Phim
      SET TenPhim = ?,
          MoTa = ?,
          ThoiLuong = ?,
          XuatXu = ?,
          DangPhim = ?,
          PhuDe = ?,
          LongTieng = ?,
          NgayPhatHanh = ?,
          TrangThaiPhim = ?,
          TrailerURL = ?,
          PosterURL = ?,
          GioiHanTuoi = ?
      WHERE ID = ? 
    `;

    // Đừng quên tham số id ở cuối mảng nhé
    await pool.query(query, [
      name,
      description,
      duration,
      origin,
      type,
      subtitles,
      dubbing,
      releaseDate,
      status,
      TrailerURl,
      PosterURL,
      AgeLimit,
      id,
    ]);

    res.status(200).json({ message: 'Cập nhật phim thành công.' });
  } catch (err) {
    console.error('Lỗi khi cập nhật phim:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật phim.' });
  }
});

// Lấy danh sách phim cho suất chiếu
router.get('/list', async (req, res) => {
  try {
    const query = `
      SELECT 
        ID AS id, 
        TenPhim AS name 
      FROM Phim
      WHERE TrangThaiPhim IN ('DangChieu', 'SapChieu')
      ORDER BY TenPhim
    `;

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách phim (list):', err.message);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phim' });
  }
});

module.exports = router;
