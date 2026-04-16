// backend/service/invoice.js
const express = require('express');
const router = express.Router();
const pool = require('./db'); // Đã điều chỉnh cho mysql2

// 📌 GET: Danh sách hóa đơn (Có tính toán trừ Voucher)
router.get('/', async (req, res) => {
  try {
    const query = `
      /* Bước 1: Dùng CTE (RawTotals) để tính trước Tổng Tiền Tạm */
      WITH RawTotals AS (
        SELECT 
            hd.ID,
            (
                IFNULL((SELECT SUM(SoLuong * DonGiaLucBan) FROM HoaDon_SanPham WHERE HoaDon_ID = hd.ID), 0) 
                + 
                IFNULL((SELECT SUM(GiaVeBan) FROM Ve WHERE HoaDon_ID = hd.ID AND TrangThai <> 'DaHuy'), 0)
            ) AS TongTienTam
        FROM HoaDon hd
      )

      /* Bước 2: Select thông tin hiển thị và áp dụng công thức trừ Voucher */
      SELECT 
        hd.ID AS HoaDonID,
        hd.ThoiGianTao,
        hd.TrangThaiThanhToan,
        hd.PhuongThucThanhToan,
        CONCAT(nd_kh.HovaTendem, ' ', nd_kh.Ten) AS KhachHang,
        CONCAT(nd_nv.HovaTendem, ' ', nd_nv.Ten) AS NhanVien,
        
        -- Tính Tổng Tiền Thực Tế (Final Amount)
        CAST(CASE 
            WHEN v.ID IS NULL THEN rt.TongTienTam 
            WHEN v.Loai = 'SoTien' THEN 
                 CASE WHEN (rt.TongTienTam - v.MucGiam) < 0 THEN 0 ELSE (rt.TongTienTam - v.MucGiam) END
            WHEN v.Loai = 'PhanTram' THEN 
                 (rt.TongTienTam * (1 - v.MucGiam / 100.0))
            ELSE rt.TongTienTam
        END AS DECIMAL(18,0)) AS TongTienThucTe

      FROM HoaDon hd
      JOIN RawTotals rt ON hd.ID = rt.ID
      LEFT JOIN Voucher v ON hd.Voucher_ID = v.ID
      LEFT JOIN KhachHang kh ON hd.KhachHang_ID = kh.NguoiDung_ID
      LEFT JOIN NguoiDung nd_kh ON kh.NguoiDung_ID = nd_kh.ID
      LEFT JOIN NhanVien nv ON hd.NhanVien_ID = nv.NguoiDung_ID
      LEFT JOIN NguoiDung nd_nv ON nv.NguoiDung_ID = nd_nv.ID
      ORDER BY hd.ID DESC;
    `;

    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('❌ LỖI GET /invoice:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 📌 GET: Chi tiết hóa đơn theo ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin Hóa đơn, Voucher & Tự động tính tiền cuối cùng
    const invoiceQuerySQL = `
        WITH TongTienGoc AS (
            SELECT 
                hd.ID,
                (
                    IFNULL((SELECT SUM(SoLuong * DonGiaLucBan) FROM HoaDon_SanPham WHERE HoaDon_ID = hd.ID), 0) + 
                    IFNULL((SELECT SUM(GiaVeBan) FROM Ve WHERE HoaDon_ID = hd.ID AND TrangThai <> 'DaHuy'), 0)
                ) AS TongTienTam
            FROM HoaDon hd
            WHERE hd.ID = ?
        )

        SELECT 
          hd.ID AS HoaDonID,
          hd.ThoiGianTao,
          hd.TrangThaiThanhToan,
          hd.PhuongThucThanhToan,
          CONCAT(nd_kh.HovaTendem, ' ', nd_kh.Ten) AS KhachHang,
          CONCAT(nd_nv.HovaTendem, ' ', nd_nv.Ten) AS NhanVien,
          
          v.MaGiam AS VoucherCode,
          v.Loai AS VoucherType,
          v.MucGiam AS VoucherValue,

          -- TÍNH TOÁN TỔNG TIỀN CUỐI CÙNG
          CAST(CASE 
            WHEN v.ID IS NULL THEN t.TongTienTam
            WHEN v.Loai = 'SoTien' THEN 
                 CASE WHEN (t.TongTienTam - v.MucGiam) < 0 THEN 0 ELSE (t.TongTienTam - v.MucGiam) END
            WHEN v.Loai = 'PhanTram' THEN 
                 (t.TongTienTam * (1 - v.MucGiam / 100.0))
            ELSE t.TongTienTam
          END AS DECIMAL(18,0)) AS TongTien

        FROM HoaDon hd
        JOIN TongTienGoc t ON hd.ID = t.ID
        LEFT JOIN Voucher v ON hd.Voucher_ID = v.ID
        LEFT JOIN KhachHang kh ON hd.KhachHang_ID = kh.NguoiDung_ID
        LEFT JOIN NguoiDung nd_kh ON kh.NguoiDung_ID = nd_kh.ID
        LEFT JOIN NhanVien nv ON hd.NhanVien_ID = nv.NguoiDung_ID
        LEFT JOIN NguoiDung nd_nv ON nv.NguoiDung_ID = nd_nv.ID
        WHERE hd.ID = ?;
    `;

    // Truyền tham số ID 2 lần vì nó được dùng 2 chỗ (trong CTE và trong WHERE chính)
    const [invoiceRows] = await pool.query(invoiceQuerySQL, [id, id]);

    if (invoiceRows.length === 0)
      return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });

    // 2. Lấy chi tiết Items (Sản phẩm và Vé - Tách thành 2 truy vấn song song cho tối ưu)
    const productsSQL = `
        SELECT 
          sp.ID AS ItemID,
          sp.TenSP AS TenHienThi,
          hdsp.SoLuong,
          hdsp.DonGiaLucBan AS DonGia,
          (hdsp.SoLuong * hdsp.DonGiaLucBan) AS ThanhTien,
          'product' AS LoaiItem,
          NULL AS ChiTietGhe
        FROM HoaDon_SanPham hdsp
        JOIN SanPham sp ON hdsp.SanPham_ID = sp.ID
        WHERE hdsp.HoaDon_ID = ?;
    `;

    const ticketsSQL = `
        SELECT 
          v.ID AS ItemID,
          p.TenPhim AS TenHienThi,
          1 AS SoLuong,
          v.GiaVeBan AS DonGia,
          v.GiaVeBan AS ThanhTien,
          'ticket' AS LoaiItem,
          CONCAT(v.SoPhong, ' - ', v.HangGhe, v.SoGhe) AS ChiTietGhe
        FROM Ve v
        JOIN SuatChieu sc ON v.SuatChieu_ID = sc.ID
        JOIN Phim p ON sc.Phim_ID = p.ID
        WHERE v.HoaDon_ID = ? AND v.TrangThai <> 'DaHuy';
    `;

    const [productsResult, ticketsResult] = await Promise.all([
      pool.query(productsSQL, [id]),
      pool.query(ticketsSQL, [id]),
    ]);

    const products = productsResult[0];
    const tickets = ticketsResult[0];

    // 3. Gộp dữ liệu trả về (Format giữ nguyên 100%)
    const combinedItems = [...products, ...tickets].map((item) => ({
      id: item.ItemID,
      name: item.TenHienThi,
      quantity: item.SoLuong,
      price: Number(item.DonGia), // Đảm bảo parse sang number để tránh lỗi hiển thị frontend
      total: Number(item.ThanhTien),
      type: item.LoaiItem,
      details: item.ChiTietGhe,
    }));

    res.json({
      ...invoiceRows[0],
      ChiTiet: combinedItems,
    });
  } catch (err) {
    console.error('❌ LỖI GET /invoice/:id:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
