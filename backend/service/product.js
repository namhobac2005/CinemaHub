const express = require('express');
const router = express.Router();
const pool = require('./db');
const { v4: uuidv4 } = require('uuid');

/**
 * TẠO BẢNG SanPham_Status (SỬA LỖI INCOMPATIBLE)
 * -> Đã sửa SanPham_ID sang VARCHAR(36) để khớp với UUID
 */
async function ensureStatusTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS SanPham_Status (
        SanPham_ID VARCHAR(36) PRIMARY KEY, 
        IsDeleted TINYINT(1) NOT NULL DEFAULT 0,
        CONSTRAINT FK_SanPham_Status FOREIGN KEY (SanPham_ID)
            REFERENCES SanPham(ID) ON DELETE CASCADE
      );
    `);
  } catch (err) {
    console.error('❌ Lỗi tạo bảng SanPham_Status:', err.message);
  }
}

// 🌎 Mapping UI ↔ DB
const UI_TO_DB = {
  'Thức Ăn': 'ThucAn',
  'Nước uống': 'NuocUong',
  Combo: 'Combo',
};

const DB_TO_UI = {
  ThucAn: 'Thức Ăn',
  NuocUong: 'Nước uống',
  Combo: 'Combo',
};

/** ==================== 📌 GET ALL PRODUCTS ==================== */
router.get('/', async (req, res) => {
  try {
    await ensureStatusTable();
    const includeDeleted = req.query.all === 'true';

    const query = `
      SELECT 
        SP.*, 
        TA.TrongLuong, TA.Vi,
        NU.TheTich, NU.CoGas,
        CB.MoTa,
        IFNULL(ST.IsDeleted, 0) AS IsDeleted
      FROM SanPham SP
      LEFT JOIN SanPham_Status ST ON SP.ID = ST.SanPham_ID
      LEFT JOIN ThucAn TA      ON SP.ID = TA.SanPham_ID
      LEFT JOIN NuocUong NU    ON SP.ID = NU.SanPham_ID
      LEFT JOIN Combo CB        ON SP.ID = CB.SanPham_ID
      ORDER BY SP.ID DESC;
    `;

    const [rows] = await pool.query(query);

    let data = rows.map((p) => ({
      id: p.ID, // UUID string
      name: p.TenSP,
      price: Number(p.DonGia),
      stock: Number(p.TonKho),
      supplier: p.NhaPhanPhoi,
      category: DB_TO_UI[p.PhanLoai],
      weight: p.TrongLuong,
      flavor: p.Vi,
      volume: p.TheTich,
      hasGas: Boolean(p.CoGas),
      description: p.MoTa,
      deleted: Boolean(p.IsDeleted),
    }));

    if (!includeDeleted) {
      data = data.filter((p) => !p.deleted);
    }

    res.json(data);
  } catch (err) {
    console.error('GET /products ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

/** ==================== 📌 ADD PRODUCT ==================== */
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const data = req.body;
    const type = UI_TO_DB[data.category];
    if (!type)
      return res.status(400).json({ message: 'Loại sản phẩm không hợp lệ' });

    const newID = uuidv4();

    // 1. Chèn vào bảng chính SanPham
    await connection.query(
      `INSERT INTO SanPham (ID, TenSP, DonGia, TonKho, NhaPhanPhoi, PhanLoai) VALUES (?, ?, ?, ?, ?, ?)`,
      [newID, data.name, data.price, data.stock, data.supplier, type],
    );

    // 2. Chèn vào bảng con tương ứng
    if (type === 'ThucAn') {
      await connection.query(
        `INSERT INTO ThucAn (SanPham_ID, TrongLuong, Vi) VALUES (?, ?, ?)`,
        [newID, data.weight, data.flavor],
      );
    } else if (type === 'NuocUong') {
      await connection.query(
        `INSERT INTO NuocUong (SanPham_ID, TheTich, CoGas) VALUES (?, ?, ?)`,
        [newID, data.volume, data.hasGas ? 1 : 0],
      );
    } else if (type === 'Combo') {
      await connection.query(
        `INSERT INTO Combo (SanPham_ID, MoTa) VALUES (?, ?)`,
        [newID, data.description],
      );
    }

    await connection.commit();
    res.json({ message: 'Thêm sản phẩm thành công', id: newID });
  } catch (err) {
    await connection.rollback();
    console.error('POST /products ERROR:', err);
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

/** ==================== 📌 DELETE (XOÁ MỀM) ==================== */
router.delete('/:id', async (req, res) => {
  try {
    await ensureStatusTable();

    // ❌ SAI: const id = Number(req.params.id);
    // ✅ ĐÚNG: UUID là chuỗi, để nguyên là string
    const id = req.params.id;

    // Sử dụng dấu ? để truyền tham số an toàn (tránh NaN và SQL Injection)
    const [result] = await pool.query(
      `
      INSERT INTO SanPham_Status (SanPham_ID, IsDeleted) 
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE IsDeleted = 1;
      `,
      [id], // Truyền id trực tiếp vào mảng params
    );

    console.log('DELETE /products success:', { id });
    res.json({ message: 'Ẩn sản phẩm thành công' });
  } catch (err) {
    console.error('DELETE /products ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

/** ==================== 📌 UPDATE PRODUCT ==================== */
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const id = req.params.id;
    const data = req.body;
    const type = UI_TO_DB[data.category];

    // 🛑 Kiểm tra tồn tại và phân loại
    const [old] = await connection.query(
      `SELECT PhanLoai FROM SanPham WHERE ID=?`,
      [id],
    );
    if (old.length === 0)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    // Cập nhật bảng chính
    await connection.query(
      `UPDATE SanPham SET TenSP=?, DonGia=?, TonKho=?, NhaPhanPhoi=?, PhanLoai=? WHERE ID=?`,
      [data.name, data.price, data.stock, data.supplier, type, id],
    );

    // Cập nhật hoặc Chèn mới vào bảng con (Dùng REPLACE INTO hoặc xoá đi nạp lại để an toàn khi đổi loại)
    // Ở đây mình giữ logic update theo loại hiện tại
    if (type === 'ThucAn') {
      await connection.query(
        `UPDATE ThucAn SET TrongLuong=?, Vi=? WHERE SanPham_ID=?`,
        [data.weight, data.flavor, id],
      );
    } else if (type === 'NuocUong') {
      await connection.query(
        `UPDATE NuocUong SET TheTich=?, CoGas=? WHERE SanPham_ID=?`,
        [data.volume, data.hasGas ? 1 : 0, id],
      );
    } else if (type === 'Combo') {
      await connection.query(`UPDATE Combo SET MoTa=? WHERE SanPham_ID=?`, [
        data.description,
        id,
      ]);
    }

    await connection.commit();
    res.json({ message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    await connection.rollback();
    console.error('UPDATE ERROR:', err);
    res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
