import { useState } from 'react';
import { Film, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { login, register } from '../api/auth';

interface AuthPageProps {
  onLogin: () => void;
  isRegistering: boolean; // Prop xác định trạng thái đăng ký
  onToggleRegister: () => void; // Prop chuyển đổi trạng thái
  onGuestContinue?: () => void;
}

export default function AuthPage({
  onLogin,
  isRegistering,
  onToggleRegister,
  onGuestContinue,
}: AuthPageProps) {
  // --- LOGIN STATE ---
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- REGISTER STATE ---
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regHoTenDem, setRegHoTenDem] = useState('');
  const [regTen, setRegTen] = useState('');
  const [regNgaySinh, setRegNgaySinh] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regIdentifier, setRegIdentifier] = useState(''); // Email/Tên đăng nhập
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // --- GLOBAL STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- HÀM CHUYỂN ĐỔI FORM VÀ RESET STATE LỖI ---
  const handleToggleForm = () => {
    setError(null); // Reset lỗi khi chuyển form
    // Reset các trường nhập liệu khi chuyển form
    setLoginIdentifier('');
    setLoginPassword('');
    setRegHoTenDem('');
    setRegTen('');
    setRegNgaySinh('');
    setRegPhone('');
    setRegIdentifier('');
    setRegPassword('');
    setRegConfirmPassword('');
    onToggleRegister();
  };

  // ----------------------------------------------------
  // HÀM XỬ LÝ ĐĂNG NHẬP
  // ----------------------------------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!loginIdentifier || !loginPassword) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login({
        tenDangNhap: loginIdentifier,
        matKhau: loginPassword,
      });
      try {
        onLogin();
      } catch {}
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 1. Thu thập dữ liệu và trim() ngay lập tức
    const data = {
      hoTenDem: regHoTenDem?.trim(),
      ten: regTen?.trim(),
      ngaySinh: regNgaySinh,
      soDienThoai: regPhone?.trim(),
      email: regIdentifier?.trim(),
      password: regPassword,
      confirm: regConfirmPassword,
    };

    // 2. Kiểm tra chi tiết từng trường (Debug Mode)
    if (!data.hoTenDem) return setError('Thiếu Họ và tên đệm');
    if (!data.ten) return setError('Thiếu Tên');
    if (!data.ngaySinh) return setError('Thiếu Ngày sinh');
    if (!data.soDienThoai) return setError('Thiếu Số điện thoại');
    if (!data.email) return setError('Thiếu Email');
    if (!data.password) return setError('Thiếu Mật khẩu');

    // 3. Logic Validation mật khẩu
    if (data.password !== data.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (data.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      // 4. Gọi API
      await register({
        hoTenDem: data.hoTenDem,
        ten: data.ten,
        ngaySinh: data.ngaySinh,
        soDienThoai: data.soDienThoai,
        email: data.email,
        password: data.password,
      });

      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      handleToggleForm();
    } catch (err: any) {
      setError(
        err?.message || 'Đăng ký thất bại. Email hoặc SĐT có thể đã tồn tại.',
      );
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------------------
  // HÀM RENDER FORM CHUNG (Định nghĩa trong component để truy cập state/props)
  // ----------------------------------------------------
  const renderAuthForm = () => {
    if (isRegistering) {
      // RENDER FORM ĐĂNG KÝ
      return (
        <form onSubmit={handleRegister} className="space-y-4">
          {/* HỌ VÀ TÊN ĐỆM */}
          <div className="space-y-2">
            <Label htmlFor="reg-ho-ten-dem">Họ và tên đệm</Label>
            <Input
              id="reg-ho-ten-dem"
              type="text"
              required
              value={regHoTenDem}
              onChange={(e) => setRegHoTenDem(e.target.value)}
              placeholder="Nguyễn Văn"
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
            />
          </div>

          {/* TÊN */}
          <div className="space-y-2">
            <Label htmlFor="reg-ten">Tên</Label>
            <Input
              id="reg-ten"
              type="text"
              required
              value={regTen}
              onChange={(e) => setRegTen(e.target.value)}
              placeholder="An"
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
            />
          </div>

          {/* NGÀY SINH */}
          <div className="space-y-2">
            <Label htmlFor="reg-ngay-sinh">Ngày sinh</Label>
            <Input
              id="reg-ngay-sinh"
              type="date"
              required
              value={regNgaySinh}
              onChange={(e) => setRegNgaySinh(e.target.value)}
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
            />
          </div>

          {/* SỐ ĐIỆN THOẠI */}
          <div className="space-y-2">
            <Label htmlFor="reg-phone">Số điện thoại</Label>
            <Input
              id="reg-phone"
              type="tel"
              required
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              placeholder="09xx xxx xxx"
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
            />
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="reg-identifier">Email</Label>
            <Input
              id="reg-identifier"
              type="email"
              required
              value={regIdentifier}
              onChange={(e) => setRegIdentifier(e.target.value)}
              placeholder="Địa chỉ Email"
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
            />
          </div>

          {/* Mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="reg-password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showRegPassword ? 'text' : 'password'}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#FFC107] transition-colors"
              >
                {showRegPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          {/* Xác nhận mật khẩu */}
          <div className="space-y-2">
            <Label htmlFor="reg-confirm-password">Xác nhận mật khẩu</Label>
            <Input
              id="reg-confirm-password"
              type="password"
              required
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
            />
          </div>

          {/* Nút Đăng ký */}
          <Button
            type="submit"
            className="w-full bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white shadow-lg shadow-[#8B5CF6]/20 mt-4"
            disabled={loading}
          >
            {loading ? 'Đang xử lý…' : 'Đăng ký'}
          </Button>
          {error && (
            <p className="text-sm mt-2" style={{ color: '#F87171' }}>
              {error}
            </p>
          )}
        </form>
      );
    }

    // RENDER FORM ĐĂNG NHẬP
    return (
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Tên đăng nhập */}
        <div className="space-y-2">
          <Label htmlFor="login-email">Tên đăng nhập</Label>
          <Input
            id="login-email"
            type="text"
            placeholder="Nhập Email hoặc SĐT"
            required
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors"
          />
        </div>
        {/* Mật khẩu */}
        <div className="space-y-2">
          <Label htmlFor="login-password">Mật khẩu</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showLoginPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu của bạn"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#FFC107] transition-colors"
            >
              {showLoginPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        {/* Ghi nhớ & Quên mật khẩu */}
        <div className="flex items-center justify-between">
          <label
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{ color: '#9CA3AF' }}
          >
            <input type="checkbox" className="rounded border-[#8B5CF6]/30" />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            className="text-sm hover:underline transition-colors"
            style={{ color: '#8B5CF6' }}
          >
            Quên mật khẩu?
          </button>
        </div>
        {/* Nút Đăng nhập */}
        <Button
          type="submit"
          className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629] shadow-lg shadow-[#FFC107]/20"
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
        {error && (
          <p className="text-sm mt-2" style={{ color: '#F87171' }}>
            {error}
          </p>
        )}
      </form>
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1666698907755-672d406ea71d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjB0aGVhdGVyJTIwZGFya3xlbnwxfHx8fDE3NjIzMjk2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Cinema background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1629] via-[#0F1629]/95 to-[#1C253A]/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <Film className="w-12 h-12" style={{ color: '#8B5CF6' }} />
            <div
              className="absolute inset-0 blur-xl opacity-50"
              style={{ backgroundColor: '#8B5CF6' }}
            />
          </div>
          <div>
            <h1 className="text-[28px] font-bold" style={{ color: '#FFC107' }}>
              CinemaHub
            </h1>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Hệ thống quản lý rạp chiếu phim
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-[#8B5CF6]/30 shadow-2xl shadow-[#8B5CF6]/10">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center" style={{ color: '#E5E7EB' }}>
              {isRegistering ? 'Tạo Tài khoản mới' : 'Chào mừng trở lại'}
            </CardTitle>
            <CardDescription
              className="text-center"
              style={{ color: '#9CA3AF' }}
            >
              {isRegistering
                ? 'Điền thông tin để tạo tài khoản quản trị'
                : 'Đăng nhập hoặc tạo tài khoản mới'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Render Form: Login hoặc Register */}
            <div className="w-full">{renderAuthForm()}</div>

            {/* Nút Chuyển đổi */}
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={handleToggleForm} // Sửa thành handleToggleForm
                className="text-sm p-0 h-auto hover:text-[#FFC107] transition-colors"
                style={{ color: '#8B5CF6' }}
              >
                {isRegistering
                  ? 'Bạn đã có tài khoản? Đăng nhập ngay'
                  : 'Bạn chưa có tài khoản? Đăng ký tại đây'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guest Continue Button */}
        {
          <div className="mt-4">
            <Button
              onClick={() => onGuestContinue && onGuestContinue()}
              variant="outline"
              className="w-full border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]"
              style={{ color: '#E5E7EB' }}
            >
              Tiếp tục mà không đăng nhập
            </Button>
          </div>
        }
        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: '#9CA3AF' }}>
          © 2025 CinemaHub. Bản quyền thuộc về công ty.
        </p>
      </div>
    </div>
  );
}
