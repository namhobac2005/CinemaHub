// src/api/auth.ts

export interface User {
  id: string;
  ten: string;
  email: string | null;
  phoneNum: string | null;
  vaiTro: 'QuanLy' | 'NhanVien' | 'KhachHang';
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

interface LoginCredentials {
  tenDangNhap: string;
  matKhau: string;
}

export interface RegisterCredentials {
  // Thay thế 'name' cũ bằng các trường chi tiết:
  hoTenDem: string;
  ten: string;
  ngaySinh: string; // Dùng string, format YYYY-MM-DD
  soDienThoai: string;

  // Tên đăng nhập và mật khẩu
  email: string;
  password: string;
}

const API_URL = 'http://localhost:5000/auth';

export const login = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data: AuthResponse | { message: string } = await response.json();

  if (!response.ok) {
    // Ném lỗi với message từ backend
    throw new Error(
      (data as { message: string }).message || 'Đăng nhập thất bại',
    );
  }

  const authData = data as AuthResponse;

  if (authData.token) {
    localStorage.setItem('authToken', authData.token);
  }
  if (authData.user) {
    localStorage.setItem('currentUser', JSON.stringify(authData.user));
  }

  return authData;
};

export const register = async (
  credentials: RegisterCredentials,
): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  // Backend cho đăng ký thường trả về message và không token/user
  const data: { message: string } = await response.json();

  if (!response.ok) {
    // Xử lý các lỗi 400, 409 (Email đã tồn tại), 500 từ backend
    throw new Error(data.message || 'Đăng ký thất bại');
  }

  return data;
};

export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) {
    return null;
  }

  try {
    const user: User = JSON.parse(userJson);
    return user;
  } catch (error) {
    // Xóa item hỏng nếu parse lỗi
    localStorage.removeItem('currentUser');
    return null;
  }
};
