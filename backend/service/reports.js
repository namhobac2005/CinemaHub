const express = require('express');
const router = express.Router();
const pool = require('./db');

// --- HELPER: Tính % tăng trưởng ---
const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// 1. Doanh thu tháng này & % tăng trưởng
router.get('/stats/revenue-month', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN MONTH(ThoiGianTao) = MONTH(CURRENT_DATE) AND YEAR(ThoiGianTao) = YEAR(CURRENT_DATE) THEN TongTien ELSE 0 END) as currentMonth,
        SUM(CASE WHEN MONTH(ThoiGianTao) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH) AND YEAR(ThoiGianTao) = YEAR(CURRENT_DATE - INTERVAL 1 MONTH) THEN TongTien ELSE 0 END) as lastMonth
      FROM HoaDon
      WHERE TrangThaiThanhToan = 'DaThanhToan'
    `);
    const { currentMonth, lastMonth } = rows[0];
    res.json({
      value: Number(currentMonth) || 0,
      change: calculateChange(Number(currentMonth), Number(lastMonth)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Vé bán tháng này & % tăng trưởng
router.get('/stats/tickets-month', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN MONTH(ThoiGianDat) = MONTH(CURRENT_DATE) THEN 1 END) as currentMonth,
        COUNT(CASE WHEN MONTH(ThoiGianDat) = MONTH(CURRENT_DATE - INTERVAL 1 MONTH) THEN 1 END) as lastMonth
      FROM Ve
      WHERE TrangThai != 'DaHuy'
    `);
    const { currentMonth, lastMonth } = rows[0];
    res.json({
      value: currentMonth || 0,
      change: calculateChange(currentMonth, lastMonth),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Doanh thu hôm nay
router.get('/stats/revenue-day', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN DATE(ThoiGianTao) = CURRENT_DATE THEN TongTien ELSE 0 END) as today,
        SUM(CASE WHEN DATE(ThoiGianTao) = CURRENT_DATE - INTERVAL 1 DAY THEN TongTien ELSE 0 END) as yesterday
      FROM HoaDon
      WHERE TrangThaiThanhToan = 'DaThanhToan'
    `);
    res.json({
      value: Number(rows[0].today) || 0,
      change: calculateChange(Number(rows[0].today), Number(rows[0].yesterday)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Vé bán hôm nay
router.get('/stats/tickets-day', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN DATE(ThoiGianDat) = CURRENT_DATE THEN 1 END) as today,
        COUNT(CASE WHEN DATE(ThoiGianDat) = CURRENT_DATE - INTERVAL 1 DAY THEN 1 END) as yesterday
      FROM Ve
      WHERE TrangThai != 'DaHuy'
    `);
    res.json({
      value: rows[0].today || 0,
      change: calculateChange(rows[0].today, rows[0].yesterday),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. General Stats (Phim đang chiếu & Suất chiếu hôm nay)
router.get('/stats/general', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM Phim WHERE TrangThaiPhim = 'DangChieu') as moviesShowing,
        (SELECT COUNT(*) FROM SuatChieu WHERE DATE(ThoiGianBatDau) = CURRENT_DATE) as showtimesToday
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Biểu đồ 6 tháng (Doanh thu & Vé)
router.get('/charts/6months', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        RevenueTable.month,
        IFNULL(RevenueTable.total_revenue, 0) as revenue,
        IFNULL(TicketTable.total_tickets, 0) as tickets
      FROM (
        -- Bảng tạm 1: Tính doanh thu theo tháng
        SELECT 
          DATE_FORMAT(ThoiGianTao, '%m/%Y') as month,
          SUM(TongTien) as total_revenue,
          MAX(ThoiGianTao) as sort_key
        FROM HoaDon
        WHERE ThoiGianTao >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
          AND TrangThaiThanhToan = 'DaThanhToan'
        GROUP BY month
      ) AS RevenueTable
      LEFT JOIN (
        -- Bảng tạm 2: Tính số vé theo tháng
        SELECT 
          DATE_FORMAT(ThoiGianDat, '%m/%Y') as month,
          COUNT(*) as total_tickets
        FROM Ve
        WHERE TrangThai != 'DaHuy'
        GROUP BY month
      ) AS TicketTable ON RevenueTable.month = TicketTable.month
      -- Sắp xếp theo sort_key (là ngày thực tế) để đúng thứ tự thời gian
      ORDER BY RevenueTable.sort_key ASC
    `);

    res.json(rows || []);
  } catch (err) {
    console.error('Lỗi tại charts/6months:', err.message);
    res.status(500).json({ message: 'Lỗi SQL: ' + err.message });
  }
});

// 7. Phim gần đây (Top doanh thu)
router.get('/tables/recent-movies', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        P.ID, 
        P.TenPhim as title, 
        P.DangPhim as genre, -- Dùng DangPhim thay vì join bảng LoaiPhim
        P.TrangThaiPhim as status,
        IFNULL(SUM(V.GiaVeBan), 0) as revenue
      FROM Phim P
      LEFT JOIN SuatChieu SC ON P.ID = SC.Phim_ID
      LEFT JOIN Ve V ON SC.ID = V.SuatChieu_ID
      GROUP BY P.ID
      ORDER BY revenue DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
// 8. Hóa đơn gần đây
router.get('/tables/recent-invoices', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        H.ID as id, ND.Ten as customer, H.TongTien as amount, 
        H.ThoiGianTao as date, H.TrangThaiThanhToan as status
      FROM HoaDon H
      LEFT JOIN KhachHang KH ON H.KhachHang_ID = KH.NguoiDung_ID
      LEFT JOIN NguoiDung ND ON KH.NguoiDung_ID = ND.ID
      ORDER BY H.ThoiGianTao DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 9. Sản phẩm bán chạy (Bắp nước)
router.get('/tables/top-products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        SP.TenSP as name, SUM(HSP.SoLuong) as sold, 
        SUM(HSP.SoLuong * HSP.DonGiaLucBan) as revenue
      FROM SanPham SP
      JOIN HoaDon_SanPham HSP ON SP.ID = HSP.SanPham_ID
      GROUP BY SP.ID
      ORDER BY sold DESC
      LIMIT 4
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. Load all Phim (Popup)
router.get('/tables/all-movies', async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT P.ID, P.TenPhim as title, P.DangPhim as genre, P.TrangThaiPhim as status,
               IFNULL(SUM(V.GiaVeBan), 0) as revenue
        FROM Phim P
        LEFT JOIN SuatChieu SC ON P.ID = SC.Phim_ID
        LEFT JOIN Ve V ON SC.ID = V.SuatChieu_ID
        GROUP BY P.ID
        ORDER BY status ASC, title ASC
      `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 11. Load all Hóa đơn (Popup)
router.get('/tables/all-invoices', async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT H.ID as id, IFNULL(ND.Ten, 'Khách vãng lai') as customer, 
               H.TongTien as amount, H.ThoiGianTao as date, H.TrangThaiThanhToan as status
        FROM HoaDon H
        LEFT JOIN KhachHang KH ON H.KhachHang_ID = KH.NguoiDung_ID
        LEFT JOIN NguoiDung ND ON KH.NguoiDung_ID = ND.ID
        ORDER BY H.ThoiGianTao DESC
      `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
