const { fakerVI: faker } = require('@faker-js/faker');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const pool = require('./service/db'); // Đảm bảo đường dẫn này đúng
const axios = require('axios');
const SALT_ROUNDS = 10;

async function seedUserData() {
  const connection = await pool.getConnection();

  try {
    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');

    // Tắt kiểm tra khóa ngoại để xóa nhanh và sạch
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Xóa dữ liệu các bảng (Trật tự xóa không quan trọng khi đã tắt FK checks)
    const tables = [
      'HoaDon_SanPham',
      'Ve',
      'HoaDon',
      'SuatChieu',
      'Ghe',
      'PhongChieu',
      'Rap',
      'Phim',
      'NhanVien',
      'KhachHang',
      'NguoiDung',
      'GiaVe',
      'Voucher',
    ];

    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE ${table}`);
    }

    // Bật lại kiểm tra khóa ngoại
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Đã xóa sạch dữ liệu cũ.');

    // Bắt đầu giao dịch
    await connection.beginTransaction();

    // Chuẩn bị mật khẩu băm sẵn để tăng tốc độ loop
    const hashedCustomerPass = await bcrypt.hash('password123', SALT_ROUNDS);
    const hashedAdminPass = await bcrypt.hash('admin123', SALT_ROUNDS);

    // 1. TẠO 1000 KHÁCH HÀNG
    console.log('🚀 Đang nạp 1000 khách hàng...');
    for (let i = 0; i < 1000; i++) {
      const userId = uuidv4();
      const hoDem = faker.person.lastName() + ' ' + faker.person.middleName();
      const ten = faker.person.firstName();
      const ngaySinh = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
      const sdt = faker.phone.number('09########');
      const email =
        faker.internet
          .email({ firstName: ten, lastName: hoDem })
          .toLowerCase() + i;
      const diem = faker.number.int({ min: 0, max: 2000 });

      await connection.query(
        `INSERT INTO NguoiDung (ID, HovaTendem, Ten, NgaySinh, VaiTro, SoDienThoai, Email, MatKhau)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          hoDem,
          ten,
          ngaySinh,
          'KhachHang',
          sdt,
          email,
          hashedCustomerPass,
        ],
      );

      await connection.query(
        `INSERT INTO KhachHang (NguoiDung_ID, DiemTichLuy, HangThanhVien)
         VALUES (?, ?, ?)`,
        [userId, diem, 'Bronze'],
      );

      if ((i + 1) % 100 === 0)
        console.log(`✅ Đã xong ${i + 1}/1000 khách hàng...`);
    }

    // 2. TẠO 50 NHÂN VIÊN & QUẢN LÝ
    console.log('🚀 Đang tạo 50 nhân viên và quản lý...');
    for (let j = 0; j < 50; j++) {
      const staffId = uuidv4();
      const hoDem = faker.person.lastName() + ' ' + faker.person.middleName();
      const ten = faker.person.firstName();
      const sdt = faker.phone.number('03########');
      const email =
        faker.internet
          .email({ firstName: ten, lastName: hoDem })
          .toLowerCase() +
        '_staff' +
        j;
      const vaiTro = j < 10 ? 'QuanLy' : 'NhanVien';
      const luong = vaiTro === 'QuanLy' ? 20000000 : 8000000;

      await connection.query(
        `INSERT INTO NguoiDung (ID, HovaTendem, Ten, NgaySinh, VaiTro, SoDienThoai, Email, MatKhau)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          staffId,
          hoDem,
          ten,
          '1990-01-01',
          vaiTro,
          sdt,
          email,
          hashedAdminPass,
        ],
      );

      await connection.query(
        `INSERT INTO NhanVien (NguoiDung_ID, NgayVaoLam, LuongCoBan)
         VALUES (?, ?, ?)`,
        [staffId, faker.date.past({ years: 2 }), luong],
      );
    }

    await connection.commit();
    console.log(
      '✨ HOÀN THÀNH: Hệ thống đã sẵn sàng với dữ liệu mới và mật khẩu bảo mật.',
    );
  } catch (error) {
    await connection.rollback();
    console.error('❌ Lỗi nghiêm trọng:', error.message);
  } finally {
    connection.release();
    process.exit();
  }
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Add your TMDB API key to .env
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * 💺 Hàm nạp ghế cho một phòng chiếu cụ thể
 */
async function seedSeats(connection, rapId, soPhong) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // 8 hàng
  const seatsPerRow = 12; // 12 ghế/hàng => 96 ghế/phòng

  for (const row of rows) {
    for (let num = 1; num <= seatsPerRow; num++) {
      // Logic phân loại ghế
      let loaiGhe = 'Thuong';
      if (row === 'H') {
        loaiGhe = 'Doi'; // Hàng cuối là ghế đôi
      } else if (row === 'G' || row === 'F') {
        loaiGhe = 'VIP'; // Hàng gần cuối là VIP
      }

      await connection.query(
        `INSERT INTO Ghe (Rap_ID, SoPhong, HangGhe, SoGhe, LoaiGhe) VALUES (?, ?, ?, ?, ?)`,
        [rapId, soPhong, row, num, loaiGhe],
      );
    }
  }
}

/**
 * 🎬 Hàm nạp Rạp, Phòng, Ghế, Phim và Suất chiếu
 */
async function seedCinemaAndSeats() {
  const connection = await pool.getConnection();
  try {
    console.log('🧹 Đang dọn dẹp dữ liệu cũ...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = ['Ve', 'SuatChieu', 'Ghe', 'PhongChieu', 'Rap', 'Phim'];
    for (const table of tables)
      await connection.query(`TRUNCATE TABLE ${table}`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎬 Đang lấy dữ liệu từ TMDB...');
    const response = await axios.get(`${BASE_URL}/movie/now_playing`, {
      params: { api_key: TMDB_API_KEY, language: 'vi-VN', page: 1 },
    });
    const movies = response.data.results.slice(0, 10); // Lấy 10 phim cho nhẹ

    await connection.beginTransaction();

    // 1. Tạo Rạp & Phòng & Ghế
    const rapIds = [uuidv4(), uuidv4()];
    const rapNames = ['Cinema Landmark 81', 'Cinema Thủ Đức'];

    for (let i = 0; i < rapIds.length; i++) {
      await connection.query(
        `INSERT INTO Rap (ID, TenRap, DiaChi, Hotline, TrangThai) VALUES (?, ?, ?, ?, ?)`,
        [rapIds[i], rapNames[i], 'TP.HCM', `1900${i}888`, 'HoatDong'],
      );

      const rooms = [1, 2]; // Mỗi rạp 2 phòng
      for (const roomNum of rooms) {
        await connection.query(
          `INSERT INTO PhongChieu (Rap_ID, SoPhong, SucChua, LoaiPhong, TrangThai) VALUES (?, ?, ?, ?, ?)`,
          [rapIds[i], roomNum, 96, roomNum === 2 ? 'IMAX' : '2D', 'SanSang'],
        );

        // 🔥 GỌI SEED GHẾ NGAY TẠI ĐÂY
        await seedSeats(connection, rapIds[i], roomNum);
      }
    }

    // 2. Nạp Phim & Tạo suất chiếu
    for (const m of movies) {
      const movieId = uuidv4();
      const detail = await axios.get(`${BASE_URL}/movie/${m.id}`, {
        params: { api_key: TMDB_API_KEY, language: 'vi-VN' },
      });

      await connection.query(
        `INSERT INTO Phim (ID, TenPhim, MoTa, ThoiLuong, XuatXu, DangPhim, NgayPhatHanh, TrangThaiPhim, PosterURL) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movieId,
          m.title,
          m.overview?.substring(0, 500),
          detail.data.runtime || 120,
          'Quốc tế',
          detail.data.runtime > 140 ? 'IMAX' : '2D',
          m.release_date || '2024-01-01',
          'DangChieu',
          m.poster_path ? IMAGE_BASE_URL + m.poster_path : null,
        ],
      );

      // Tạo suất chiếu cho tối nay
      const tonight = new Date();
      tonight.setHours(20, 0, 0, 0);

      await connection.query(
        `INSERT INTO SuatChieu (ID, ThoiGianBatDau, Phim_ID, Rap_ID, SoPhong, TrangThai) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), tonight, movieId, rapIds[0], 1, 'DangMo'],
      );
    }

    await connection.commit();
    console.log('✅ Đã nạp xong Rạp, Phòng, Ghế, Phim và Suất chiếu!');
  } catch (err) {
    await connection.rollback();
    console.error('❌ Lỗi Seed:', err.message);
  } finally {
    connection.release();
    process.exit();
  }
}

async function seedProducts() {
  const connection = await pool.getConnection();
  try {
    console.log('🍿 Đang nạp sản phẩm mẫu vào bảng SanPham...');
    await connection.beginTransaction();

    const sampleProducts = [
      { name: 'Bắp rang bơ (M)', price: 45000, stock: 100, type: 'ThucAn' },
      {
        name: 'Bắp rang phô mai (L)',
        price: 65000,
        stock: 100,
        type: 'ThucAn',
      },
      { name: 'Coca Cola', price: 30000, stock: 200, type: 'NuocUong' },
      { name: 'Nước suối Dasani', price: 15000, stock: 150, type: 'NuocUong' },
      {
        name: 'Combo Solo (1 Bắp + 1 Nước)',
        price: 70000,
        stock: 50,
        type: 'Combo',
      },
    ];

    for (const p of sampleProducts) {
      const id = uuidv4();
      await connection.query(
        `INSERT INTO SanPham (ID, TenSP, DonGia, TonKho, PhanLoai) VALUES (?, ?, ?, ?, ?)`,
        [id, p.name, p.price, p.stock, p.type],
      );
      console.log(`- Đã thêm: ${p.name}`);
    }

    await connection.commit();
    console.log('✅ Hoàn tất nạp dữ liệu test!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Lỗi:', error.message);
  } finally {
    connection.release();
    process.exit();
  }
}
//seedProducts();
seedCinemaAndSeats();
//seedUserData();
