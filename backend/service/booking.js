const express = require('express');
const pool = require('./db'); // [SỬA]: Giả định file db.js export trực tiếp mysql2 pool
const router = express.Router();

// Middleware kiểm tra kết nối database
router.use(async (req, res, next) => {
  try {
    // Thử lấy 1 connection từ pool để check
    const connection = await pool.getConnection();
    connection.release();
    next();
  } catch (err) {
    res.status(401).json({
      message: 'Chưa kết nối đến cơ sở dữ liệu.',
    });
  }
});

// GET /booking/theaters - Lấy danh sách rạp
router.get('/theaters', async (req, res) => {
  try {
    const query = `
      SELECT 
        ID as id,
        TenRap as name,
        DiaChi as address,
        DiaChi as city,
        TrangThai as status
      FROM Rap
      WHERE TrangThai = 'HoatDong'
      ORDER BY TenRap
    `;

    const [rows] = await pool.query(query); // [SỬA]: Lấy rows từ mảng trả về
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách rạp:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách rạp.' });
  }
});

// GET /booking/theaters/:theaterId/movies - Lấy danh sách phim theo rạp
router.get('/theaters/:theaterId/movies', async (req, res) => {
  try {
    const { theaterId } = req.params;

    const query = `
      SELECT DISTINCT
        p.ID as id,
        p.TenPhim as tenPhim,
        p.MoTa as moTa,
        p.ThoiLuong as thoiLuong,
        p.XuatXu as xuatXu,
        p.DangPhim as dangPhim,
        p.NgayPhatHanh as ngayPhatHanh,
        p.TrailerURL as trailerURL,
        p.PosterURL as posterURL,
        p.GioiHanTuoi as gioiHanTuoi,
        p.LongTieng as longTieng,
        p.PhuDe as phuDe
      FROM Phim p
      INNER JOIN SuatChieu sc ON p.ID = sc.Phim_ID
      WHERE sc.Rap_ID = ? 
        AND p.TrangThaiPhim IN ('DangChieu', 'SapChieu')
        AND sc.TrangThai = 'DangMo'
      ORDER BY p.TenPhim
    `;

    // [SỬA]: Dùng ? và truyền array giá trị
    const [rows] = await pool.query(query, [theaterId]);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách phim theo rạp:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách phim.' });
  }
});

// GET /booking/showtimes - Lấy danh sách suất chiếu
router.get('/showtimes', async (req, res) => {
  try {
    const { theaterId, movieId, date } = req.query;

    // [SỬA]: IFNULL thay cho ISNULL, LIMIT 1 thay cho TOP 1, DAYOFWEEK thay cho DATEPART
    let query = `
      SELECT 
        sc.ID as id,
        sc.ThoiGianBatDau as startTime,
        sc.SoPhong as phongChieu,
        sc.Rap_ID as rapId,
        r.TenRap as rapName,
        pc.LoaiPhong as dinhDang,
        p.LongTieng as longTieng,
        p.PhuDe as phuDe,
        p.GioiHanTuoi as gioiHanTuoi,
        IFNULL(
          (SELECT gv.DonGia 
           FROM GiaVe gv 
           WHERE gv.DinhDangPhim = pc.LoaiPhong 
             AND gv.LoaiGhe = 'Thuong'
             AND gv.LoaiSuatChieu = CASE 
               WHEN DAYOFWEEK(sc.ThoiGianBatDau) IN (1, 7) THEN 'CuoiTuan'
               ELSE 'NgayThuong'
             END
             AND gv.TrangThai = 'ConHieuLuc'
             AND (gv.NgayBatDauApDung IS NULL OR gv.NgayBatDauApDung <= DATE(sc.ThoiGianBatDau))
             AND (gv.NgayKetThucApDung IS NULL OR gv.NgayKetThucApDung >= DATE(sc.ThoiGianBatDau))
           ORDER BY gv.ID DESC
           LIMIT 1
          ), 
          CASE 
            WHEN pc.LoaiPhong = 'IMAX' THEN 180000
            WHEN pc.LoaiPhong = '4DX' THEN 200000
            WHEN pc.LoaiPhong = '3D' THEN 120000
            ELSE 80000
          END
        ) as giaVe
      FROM SuatChieu sc
      INNER JOIN Rap r ON sc.Rap_ID = r.ID
      INNER JOIN Phim p ON sc.Phim_ID = p.ID
      INNER JOIN PhongChieu pc ON sc.Rap_ID = pc.Rap_ID AND sc.SoPhong = pc.SoPhong
      WHERE sc.TrangThai = 'DangMo'
    `;

    const params = [];

    if (theaterId) {
      query += ` AND sc.Rap_ID = ?`;
      params.push(theaterId);
    }

    if (movieId) {
      query += ` AND sc.Phim_ID = ?`;
      params.push(movieId);
    }

    if (date) {
      query += ` AND DATE(sc.ThoiGianBatDau) = ?`;
      params.push(date);
    }

    query += ` ORDER BY sc.ThoiGianBatDau`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách suất chiếu:', err);
    res
      .status(500)
      .json({ message: 'Lỗi server khi lấy danh sách suất chiếu.' });
  }
});

// GET /booking/showtimes/:showtimeId/seats
router.get('/showtimes/:showtimeId/seats', async (req, res) => {
  try {
    const { showtimeId } = req.params;

    const [scRows] = await pool.query(
      `
        SELECT sc.ID, sc.ThoiGianBatDau, pc.LoaiPhong, p.TenPhim
        FROM SuatChieu sc
        JOIN PhongChieu pc ON sc.Rap_ID = pc.Rap_ID AND sc.SoPhong = pc.SoPhong
        JOIN Phim p ON sc.Phim_ID = p.ID
        WHERE sc.ID = ?
      `,
      [showtimeId],
    );

    if (scRows.length === 0)
      return res.status(404).json({ message: 'Suất chiếu không tồn tại' });
    const showtime = scRows[0];

    // [SỬA]: Gọi Stored Procedure bằng CALL
    const [spResult] = await pool.query('CALL sp_LayTrangThaiGhe(?)', [
      showtimeId,
    ]);

    // Kết quả của SP trong MySQL nằm ở index 0 của mảng trả về
    const seatsData = spResult[0];

    const seats = seatsData.map((seat) => {
      let status = 'available';
      if (seat.TrangThai === 'DaBan') status = 'booked';
      else if (seat.TrangThai === 'DangGiu') status = 'processing';

      let basePrice = 80000;
      if (showtime.LoaiPhong === 'IMAX') basePrice = 180000;
      else if (showtime.LoaiPhong === '4DX') basePrice = 200000;
      else if (showtime.LoaiPhong === '3D') basePrice = 120000;

      let finalPrice = basePrice;
      if (seat.LoaiGhe === 'VIP') finalPrice += 20000;
      else if (seat.LoaiGhe === 'Doi') finalPrice = basePrice * 2;

      return {
        id: `${seat.HangGhe}${seat.SoGhe}`,
        row: seat.HangGhe,
        col: parseInt(seat.SoGhe),
        type: seat.LoaiGhe,
        status: status,
        price: finalPrice,
      };
    });

    res.json({
      showtime: {
        id: showtime.ID,
        movieName: showtime.TenPhim,
        format: showtime.LoaiPhong,
        startTime: showtime.ThoiGianBatDau,
      },
      seats: seats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// GET /booking/products
router.get('/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ID as id, TenSP as name, DonGia as price, PhanLoai as category, TonKho as stock 
      FROM SanPham WHERE TonKho > 0
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /booking/create - Tạo đơn đặt vé và giữ chỗ
const { v4: uuidv4 } = require('uuid');

router.post('/create', async (req, res) => {
  // 1. Lấy thêm DanhSachSanPham từ req.body
  const { KhachHang_ID, SuatChieu_ID, DanhSachGhe, DanhSachSanPham } = req.body;
  const newHoaDonId = uuidv4();

  const connection = await pool.getConnection(); // Dùng connection để chạy Transaction
  try {
    await connection.beginTransaction();

    const seatsJson = JSON.stringify(DanhSachGhe);

    // 2. Gọi Procedure đặt vé (Đã có logic chốt giá vé GiaVeBan)
    await connection.query('CALL sp_DatVe_TaoHoaDon(?, ?, ?, ?)', [
      KhachHang_ID,
      SuatChieu_ID,
      seatsJson,
      newHoaDonId,
    ]);

    // 3. QUAN TRỌNG: Chèn danh sách bắp nước vào bảng chi tiết
    if (DanhSachSanPham && DanhSachSanPham.length > 0) {
      for (const sp of DanhSachSanPham) {
        // Lấy giá hiện tại của sản phẩm để chốt "DonGiaLucBan"
        const [productInfo] = await connection.query(
          'SELECT DonGia FROM SanPham WHERE ID = ?',
          [sp.SanPham_id],
        );

        if (productInfo.length > 0) {
          const donGia = productInfo[0].DonGia;

          // Chèn vào bảng HoaDon_SanPham (Chưa trừ kho, để confirm mới trừ)
          await connection.query(
            `INSERT INTO HoaDon_SanPham (HoaDon_ID, SanPham_ID, SoLuong, DonGiaLucBan) 
             VALUES (?, ?, ?, ?)`,
            [newHoaDonId, sp.SanPham_id, sp.SoLuong, donGia],
          );
        }
      }
    }

    await connection.commit();
    res.json({
      message: 'Giữ chỗ và thêm bắp nước thành công',
      hoaDonId: newHoaDonId,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Lỗi tại /create:', err.message);
    res.status(400).json({ message: err.message });
  } finally {
    connection.release();
  }
});

// POST /booking/confirm
router.post('/confirm', async (req, res) => {
  const { hoaDonId, paymentMethod, voucherCode, guestInfo } = req.body;
  try {
    const [result] = await pool.query('CALL sp_XacNhanThanhToan(?, ?, ?)', [
      hoaDonId,
      paymentMethod || 'TienMat',
      voucherCode || null,
    ]);

    res.json({
      message: 'Thanh toán thành công!',
      data: result[0][0], // Lấy row đầu tiên của result set
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /booking/cancel
router.post('/cancel', async (req, res) => {
  const { hoaDonId } = req.body;
  if (!hoaDonId) return res.status(400).json({ message: 'Thiếu ID' });

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Hoàn kho sản phẩm trước
    const [prods] = await connection.query(
      'SELECT SanPham_ID, SoLuong FROM HoaDon_SanPham WHERE HoaDon_ID = ?',
      [hoaDonId],
    );
    for (const p of prods) {
      await connection.query(
        'UPDATE SanPham SET TonKho = TonKho + ? WHERE ID = ?',
        [p.SoLuong, p.SanPham_ID],
      );
    }

    // Cập nhật trạng thái hủy
    await connection.query(
      `UPDATE HoaDon SET TrangThaiThanhToan = 'DaHuy' WHERE ID = ?`,
      [hoaDonId],
    );
    await connection.query(
      `UPDATE Ve SET TrangThai = 'DaHuy' WHERE HoaDon_ID = ?`,
      [hoaDonId],
    );

    await connection.commit();
    res.json({ message: 'Đã hủy đơn hàng' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

// POST /booking/voucher/check - Kiểm tra voucher
router.post('/voucher/check', async (req, res) => {
  try {
    const { code } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM Voucher WHERE MaGiam = ? AND SoLuong > 0',
      [code],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: 'Voucher không hợp lệ' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
