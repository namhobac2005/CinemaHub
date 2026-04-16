import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser } from '../api/auth';
import {
  Film,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  QrCode,
  CreditCard,
  ChevronLeft,
  MapPin,
  Clock,
  Globe,
  Calendar,
  Users,
  Play,
  Info,
  Armchair,
  Check,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  fetchTheaters,
  fetchMovies,
  fetchShowtimes,
  fetchSeatMap,
  TheaterResponse,
  MovieResponse,
  ShowtimeResponse,
  SeatResponse,
  SeatMapResponse,
} from '../api/booking';
import { getProducts } from '../api/products';
import {
  searchTMDBMovies,
  getTMDBMovieDetails,
  TMDBMovieDetails,
} from '../api/tmdb';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import './GuestCart.css';

interface Theater {
  id: string;
  name: string;
  address: string;
  city: string;
  status: string;
}

interface Movie {
  id: string;
  tenPhim: string;
  moTa: string;
  thoiLuong: number;
  xuatXu: string;
  dangPhim: string;
  ngayPhatHanh: string;
  trailerURL: string | null;
  posterURL: string | null;
  gioiHanTuoi: number;
}

interface Showtime {
  id: string;
  startTime: string;
  phongChieu: string;
  rapid: string;
  rapName: string;
  dinhDang: string;
  longTieng: boolean;
  phuDe: string | null;
  gioiHanTuoi: number;
  giaVe: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  type: 'ticket' | 'product';
  details?: string;
}

interface SeatStatus {
  row: string;
  col: number;
  status: 'available' | 'booked' | 'processing' | 'selected';
  type: 'Thuong' | 'VIP' | 'Doi';
  price: number;
}

type ViewMode = 'theaters' | 'movies' | 'showtimes' | 'seats' | 'products';

interface CustomerBookingProps {
  onLogout?: () => void;
}

export default function CustomerBooking({ onLogout }: CustomerBookingProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('theaters');
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null,
  );
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seats, setSeats] = useState<SeatStatus[][]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [pendingHoaDonId, setPendingHoaDonId] = useState<number | null>(null);

  // Data từ API
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // TMDB data
  const [tmdbDetails, setTmdbDetails] = useState<Map<number, TMDBMovieDetails>>(
    new Map(),
  );
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const isGuest = !currentUser;

  // Khởi tạo dữ liệu form
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    phone: string;
  }>({
    name: currentUser?.ten || '',
    email: currentUser?.email || '',
    phone: (currentUser as any)?.phoneNum || '',
  });

  // Fetch theaters khi component mount
  useEffect(() => {
    const loadTheaters = async () => {
      try {
        setLoading(true);
        const data = await fetchTheaters();
        setTheaters(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách rạp:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTheaters();
  }, []);

  // Fetch movies khi chọn rạp
  useEffect(() => {
    const loadMovies = async () => {
      if (!selectedTheater) return;
      try {
        setLoading(true);
        const data = await fetchMovies(selectedTheater.id);
        setMovies(data);

        // Fetch TMDB details for each movie
        const tmdbPromises = data.map(async (movie) => {
          try {
            // Search TMDB by movie name
            const searchResults = await searchTMDBMovies(
              movie.tenPhim,
              'vi-VN',
            );
            if (searchResults && searchResults.length > 0) {
              // Get detailed info for the first match
              const details = await getTMDBMovieDetails(
                searchResults[0].id,
                'vi-VN',
              );
              return { movieId: movie.id, details };
            }
          } catch (error) {
            console.error(`Error fetching TMDB for ${movie.tenPhim}:`, error);
          }
          return null;
        });

        const tmdbResults = await Promise.all(tmdbPromises);
        const newTmdbMap = new Map<number, TMDBMovieDetails>();
        tmdbResults.forEach((result) => {
          if (result) {
            newTmdbMap.set(result.movieId, result.details);
          }
        });
        setTmdbDetails(newTmdbMap);
      } catch (error) {
        console.error('Lỗi khi tải danh sách phim:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, [selectedTheater]);

  // Fetch showtimes khi chọn phim
  useEffect(() => {
    const loadShowtimes = async () => {
      if (!selectedTheater || !selectedMovie) return;
      try {
        setLoading(true);
        const data = await fetchShowtimes({
          theaterId: selectedTheater.id,
          movieId: selectedMovie.id,
        });
        setShowtimes(data);
      } catch (error) {
        console.error('Lỗi khi tải suất chiếu:', error);
      } finally {
        setLoading(false);
      }
    };
    loadShowtimes();
  }, [selectedTheater, selectedMovie]);

  // Fetch products khi vào trang products
  useEffect(() => {
    const loadProducts = async () => {
      if (viewMode !== 'products') return;
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [viewMode]);

  // Convert API seat data to UI format
  const convertSeatsToGrid = (apiSeats: SeatResponse[]): SeatStatus[][] => {
    const seatMap = new Map<string, SeatStatus[]>();

    apiSeats.forEach((seat) => {
      if (!seatMap.has(seat.row)) {
        seatMap.set(seat.row, []);
      }
      seatMap.get(seat.row)!.push({
        row: seat.row,
        col: seat.col,
        status: seat.status,
        type: seat.type as 'Thuong' | 'VIP' | 'Doi',
        price: seat.price,
      });
    });

    return Array.from(seatMap.values()).map((row) =>
      row.sort((a, b) => a.col - b.col),
    );
  };

  const handleSelectTheater = (theater: Theater) => {
    setSelectedTheater(theater);
    setViewMode('movies');
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setViewMode('showtimes');
  };

  const handleSelectShowtime = async (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    try {
      setLoading(true);

      // Đảm bảo showtime.id tồn tại và là chuỗi UUID
      console.log('Đang tải ghế cho suất chiếu ID:', showtime.id);

      const seatMapData = await fetchSeatMap(showtime.id); // Gọi hàm service
      const seatsGrid = convertSeatsToGrid(seatMapData.seats);
      setSeats(seatsGrid);
      setViewMode('seats');
    } catch (error) {
      console.error('Lỗi khi tải sơ đồ ghế:', error);
      alert('Không thể tải sơ đồ ghế. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seatId: string, seat: SeatStatus) => {
    if (seat.status === 'booked' || seat.status === 'processing') {
      return;
    }

    // For couple seats (Doi type), only store the first seat ID (e.g., E1 for pair E1-E2)
    // The UI already renders only odd columns for row E, so seatId is always the first of the pair
    const isSelected = selectedSeats.includes(seatId);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatColor = (
    status: string,
    seatId: string,
    seatType: string,
    row: string,
  ): string => {
    if (selectedSeats.includes(seatId)) {
      return '#FFC107'; // Yellow for selected
    }
    if (status === 'booked') {
      return '#EF4444'; // Red for booked
    }
    if (status === 'processing') {
      return '#F59E0B'; // Orange for processing
    }
    // Different colors based on row
    if (row === 'E') {
      return '#EC4899'; // Pink for Row E (Couple seats)
    } else if (row === 'D') {
      return '#8B5CF6'; // Purple for Row D (VIP seats)
    } else {
      return '#6B7280'; // Gray for Rows A, B, C (Regular seats)
    }
  };

  const handleConfirmSeats = () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế!');
      return;
    }

    if (!selectedMovie || !selectedShowtime) return;

    // DEBUG: Log selected seats
    console.log('Selected seats:', selectedSeats);

    // Format start time
    const startTime = new Date(selectedShowtime.startTime);
    const formattedTime = startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedDate = startTime.toLocaleDateString('vi-VN');

    // Find seat details from seats grid
    const getSeatDetails = (seatId: string) => {
      for (const row of seats) {
        const seat = row.find((s) => `${s.row}${s.col}` === seatId);
        if (seat) return seat;
      }
      return null;
    };

    // Track processed couple seats to avoid duplicates
    const processedCoupleSeats = new Set<string>();
    const ticketItems: CartItem[] = [];

    // Add tickets to cart with actual seat prices
    selectedSeats.forEach((seatId) => {
      const seatDetails = getSeatDetails(seatId);

      // DEBUG: Log each seat processing
      console.log(`Processing seat ${seatId}:`, seatDetails);

      // For couple seats, only add ticket once per pair
      if (seatDetails?.type === 'Doi') {
        const col = Number(seatDetails.col); // Convert to number!
        const pairKey =
          col % 2 === 1
            ? `${seatDetails.row}${col}`
            : `${seatDetails.row}${col - 1}`;

        if (processedCoupleSeats.has(pairKey)) {
          return; // Skip if already processed
        }
        processedCoupleSeats.add(pairKey);

        // Create one ticket for the couple seat pair
        const col1 = col % 2 === 1 ? col : col - 1;
        const col2 = col1 + 1; // Now this will be numeric addition: 1 + 1 = 2
        const seatPrice = seatDetails.price;

        const seat1Code = `${seatDetails.row}${col1}`;
        const seat2Code = `${seatDetails.row}${col2}`;

        const ticketName = `${selectedMovie.tenPhim} - ${formattedTime} ${formattedDate}`;
        const ticketDetails = `Ghế ${seat1Code}-${seat2Code} (Đôi) | ${
          selectedShowtime.phongChieu
        } | ${selectedShowtime.dinhDang} | ${
          selectedShowtime.longTieng
            ? 'Lồng tiếng'
            : 'Phụ đề ' + (selectedShowtime.phuDe || 'Tiếng Việt')
        }`;

        ticketItems.push({
          id: `${selectedShowtime.id}-${seatDetails.row}${col1}`,
          name: ticketName,
          price: seatPrice,
          quantity: 1,
          type: 'ticket' as const,
          details: ticketDetails,
        });
      } else {
        // Regular seat - add normally
        const seatPrice = seatDetails?.price || selectedShowtime.giaVe;
        const seatType = seatDetails?.type === 'VIP' ? 'VIP' : 'Thường';

        const ticketName = `${selectedMovie.tenPhim} - ${formattedTime} ${formattedDate}`;
        const ticketDetails = `Ghế ${seatId} (${seatType}) | ${
          selectedShowtime.phongChieu
        } | ${selectedShowtime.dinhDang} | ${
          selectedShowtime.longTieng
            ? 'Lồng tiếng'
            : 'Phụ đề ' + (selectedShowtime.phuDe || 'Tiếng Việt')
        }`;

        ticketItems.push({
          id: `${selectedShowtime.id}-${seatId}`,
          name: ticketName,
          price: seatPrice,
          quantity: 1,
          type: 'ticket' as const,
          details: ticketDetails,
        });
      }
    });

    // DEBUG: Log final ticket items before adding to cart
    console.log('Final ticket items to add to cart:', ticketItems);
    console.log('Number of ticket items:', ticketItems.length);

    setCart([...cart, ...ticketItems]);
    setViewMode('products');
  };

  const addProductToCart = (product: Product) => {
    const productId = product.id;
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          id: productId,
          name: product.name,
          price: product.price,
          quantity: 1,
          type: 'product',
        },
      ]);
    }
  };

  const updateQuantity = (id: string | number, change: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (id: string | number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) {
      alert('Vui lòng nhập mã voucher!');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/booking/voucher/check',
        {
          code: voucherCode,
        },
      );

      const voucher = response.data; // Dữ liệu trả về: { MaGiam, Loai, MucGiam, ... }

      if (voucher.Loai === 'PhanTram') {
        setDiscount(voucher.MucGiam);
        alert(`Áp dụng thành công! Giảm ${voucher.MucGiam}%`);
      } else {
        setDiscount(voucher.MucGiam);
        alert(`Áp dụng thành công! Giảm ${voucher.MucGiam.toLocaleString()}đ`);
      }
    } catch (error: any) {
      console.error(error);
      setDiscount(0);
      alert(
        error.response?.data?.message ||
          'Mã voucher không hợp lệ hoặc đã hết lượt!',
      );
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discountAmount =
    discount < 100 ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGuest && (!userData.name || !userData.email || !userData.phone)) {
      alert('Vui lòng điền đầy đủ Họ tên, Email và SĐT để nhận vé!');
      return;
    }

    console.log('--- DEBUG TẠO ĐƠN ---');
    console.log('Selected Showtime:', selectedShowtime);
    console.log('Selected Seats (Raw):', selectedSeats);

    const formattedSeats = selectedSeats.map((seatId) => {
      const row = seatId.charAt(0);
      const col = seatId.substring(1);
      return { HangGhe: row, SoGhe: col };
    });

    const formattedProducts = cart
      .filter((item) => item.type === 'product')
      .map((item) => ({
        SanPham_id: item.id,
        SoLuong: item.quantity,
      }));

    // Lấy ID khách hàng (nếu đã đăng nhập)
    const user = getCurrentUser();
    const customerId = user ? (user as any).id : null;

    // --- DEBUG PAYLOAD ---
    const payload = {
      KhachHang_ID: customerId,
      SuatChieu_ID: selectedShowtime?.id,
      DanhSachGhe: formattedSeats,
      DanhSachSanPham: formattedProducts,
    };
    console.log('PAYLOAD GỬI ĐI:', JSON.stringify(payload, null, 2));
    // -------------------------------------

    try {
      const response = await axios.post(
        'http://localhost:5000/booking/create',
        {
          KhachHang_ID: customerId,
          SuatChieu_ID: selectedShowtime?.id,
          DanhSachGhe: formattedSeats,
          DanhSachSanPham: formattedProducts,
        },
      );

      setPendingHoaDonId(response.data.hoaDonId);
      setIsCheckoutOpen(false);
      setIsPaymentOpen(true);
    } catch (error: any) {
      console.error('Lỗi đặt vé:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng.');
    }
  };

  const handlePayment = async (method: string = 'QR_Code') => {
    try {
      // Đảm bảo voucherCode được gửi đi đúng tên biến Backend mong đợi
      // Nếu discount = 0 thì gửi null
      const currentVoucher = discount > 0 ? voucherCode : null;

      const response = await axios.post(
        'http://localhost:5000/booking/confirm',
        {
          hoaDonId: pendingHoaDonId,
          phuongThuc: method,
          voucherCode: currentVoucher, // <-- Tên biến này phải khớp với router.post('/confirm')
        },
      );

      // Nếu thành công, Backend sẽ trả về thông tin hóa đơn đã có tiền (không còn 0đ)
      console.log('Hóa đơn sau thanh toán:', response.data.data);

      setIsPaymentOpen(false);
      setShowQRCode(true);
    } catch (error: any) {
      console.error('Lỗi thanh toán:', error);
      alert(error.response?.data?.message || 'Lỗi xác nhận thanh toán!');
    }
  };

  const handleCancelPayment = async () => {
    if (pendingHoaDonId) {
      try {
        await axios.post('http://localhost:5000/booking/cancel', {
          hoaDonId: pendingHoaDonId,
        });
        setPendingHoaDonId(null);
        console.log('Đã hủy đơn hàng tạm.');
      } catch (error) {
        console.error('Lỗi hủy đơn:', error);
      }
    }
    setIsPaymentOpen(false);
  };

  const handleFinish = () => {
    setCart([]);
    setVoucherCode('');
    setDiscount(0);
    setPendingHoaDonId(null);
    setShowQRCode(false);
    setViewMode('theaters');
    setSelectedTheater(null);
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setSeats([]);
  };

  const handleBack = () => {
    if (viewMode === 'products') {
      setViewMode('seats');
    } else if (viewMode === 'seats') {
      setViewMode('showtimes');
      setSelectedSeats([]);
    } else if (viewMode === 'showtimes') {
      setSelectedMovie(null);
      setSelectedShowtime(null);
      setViewMode('movies');
    } else if (viewMode === 'movies') {
      setSelectedTheater(null);
      setViewMode('theaters');
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#0F1629' }}>
      {/* Header */}
      <div
        className="border-b"
        style={{
          backgroundColor: '#1C253A',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          height: '100px',
        }}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode !== 'theaters' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hover:bg-[#8B5CF6]/20"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Film className="w-8 h-8" style={{ color: '#8B5CF6' }} />
                <div
                  className="absolute inset-0 blur-lg opacity-50"
                  style={{ backgroundColor: '#8B5CF6' }}
                />
              </div>
              <div>
                <h1 className="text-xl" style={{ color: '#FFC107' }}>
                  CinemaHub
                </h1>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {selectedTheater?.name || 'Đặt vé trực tuyến'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {isGuest ? (
                <p className="text-sm italic" style={{ color: '#9CA3AF' }}>
                  Guest
                </p>
              ) : (
                <>
                  <p className="text-sm" style={{ color: '#E5E7EB' }}>
                    {userData.name}
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {userData.email}
                  </p>
                </>
              )}
            </div>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="hover:bg-red-500/20"
                style={{ color: '#EF4444' }}
              >
                {isGuest ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Đăng nhập
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </>
                )}
              </Button>
            )}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#8B5CF620' }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              <span style={{ color: '#E5E7EB' }}>{cart.length}</span>
            </div>
            <Button
              onClick={handleCheckout}
              className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
            >
              Thanh toán
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-6 py-8">
        <div className="dashboard-layout">
          {/* Main Content */}
          <div className="w-full">
            {/* Theater Selection */}
            {viewMode === 'theaters' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6" style={{ color: '#8B5CF6' }} />
                  <h2 className="text-2xl" style={{ color: '#E5E7EB' }}>
                    Chọn rạp chiếu phim
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {theaters.map((theater) => (
                    <Card
                      key={theater.id}
                      className="border-[#8B5CF6]/20 hover:border-[#8B5CF6] transition-all relative"
                    >
                      <CardContent className="p-6">
                        {/* Nút dùng class giống GuestDashboard */}
                        <button
                          onClick={() => handleSelectTheater(theater)}
                          className="select-theater-btn"
                        >
                          Chọn rạp
                        </button>

                        <h3
                          className="text-xl mb-2"
                          style={{ color: '#E5E7EB' }}
                        >
                          {theater.name}
                        </h3>
                        <p
                          className="text-sm mb-1"
                          style={{ color: '#9CA3AF' }}
                        >
                          📍 {theater.address}
                        </p>
                        <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30">
                          {theater.city}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Movie Selection */}
            {viewMode === 'movies' && selectedTheater && (
              <div className="mt-10 w-full">
                <div className="flex items-center gap-3 mb-6">
                  <Film className="w-6 h-6" style={{ color: '#8B5CF6' }} />
                  <h2
                    className="text-2xl font-semibold"
                    style={{ color: '#E5E7EB' }}
                  >
                    Chọn phim
                  </h2>
                </div>

                <div
                  className="w-full grid gap-6 xl:gap-8"
                  style={{
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(240px, 1fr))',
                  }}
                >
                  {loading ? (
                    <p style={{ color: '#9CA3AF' }}>Đang tải...</p>
                  ) : movies.length === 0 ? (
                    <p style={{ color: '#9CA3AF' }}>
                      Không có phim nào đang chiếu
                    </p>
                  ) : (
                    movies.map((movie) => {
                      const tmdbData = tmdbDetails.get(movie.id);
                      const posterUrl =
                        tmdbData?.posterPath || movie.posterURL || '';
                      const hasTrailer = tmdbData?.trailerKey;

                      return (
                        <Card
                          key={movie.id}
                          className="movie-card flex flex-col h-full border-[#8B5CF6]/20 hover:border-[#8B5CF6]"
                        >
                          {/* Poster */}
                          <div className="movie-thumb relative group">
                            <ImageWithFallback
                              src={posterUrl}
                              alt={movie.tenPhim}
                              className="movie-thumb-img"
                            />
                            {hasTrailer && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTrailerKey(tmdbData.trailerKey);
                                    setShowTrailer(true);
                                  }}
                                  className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
                                  size="sm"
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Trailer
                                </Button>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-3 flex flex-col flex-1">
                            <h3
                              className="mb-2 text-lg font-medium"
                              style={{ color: '#E5E7EB' }}
                            >
                              {movie.tenPhim}
                            </h3>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge className="bg-[#FFC107]/20 text-[#FFC107] border-[#FFC107]/30">
                                {movie.gioiHanTuoi}+
                              </Badge>
                              <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30">
                                {movie.thoiLuong} phút
                              </Badge>
                            </div>

                            {/* Mô tả – clamp 3 dòng cho đều */}
                            <p
                              className="text-sm mb-3 overflow-hidden"
                              style={{
                                color: '#9CA3AF',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {tmdbData?.overview || movie.moTa}
                            </p>

                            {/* Đẩy nút xuống đáy card */}
                            <button
                              onClick={() => handleSelectMovie(movie)}
                              className="movie-showtime-btn mt-auto"
                            >
                              Xem suất chiếu
                            </button>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Movie Details & Showtimes */}
            {viewMode === 'showtimes' && selectedMovie && (
              <div className="space-y-6">
                {/* Movie Info */}
                <Card className="border-[#8B5CF6]/20 overflow-hidden">
                  <div className="movie-detail-grid p-6">
                    {/* Poster */}
                    <div className="movie-detail-poster">
                      <ImageWithFallback
                        src={
                          tmdbDetails.get(selectedMovie.id)?.posterPath ||
                          selectedMovie.posterURL ||
                          ''
                        }
                        alt={selectedMovie.tenPhim}
                        className="movie-detail-poster-img"
                      />
                    </div>

                    {/* Thông tin phim */}
                    <div className="movie-detail-content space-y-4">
                      <div>
                        <h2
                          className="text-3xl mb-2"
                          style={{ color: '#E5E7EB' }}
                        >
                          {selectedMovie.tenPhim}
                        </h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className="bg-[#FFC107]/20 text-[#FFC107] border-[#FFC107]/30">
                            {selectedMovie.gioiHanTuoi}+
                          </Badge>
                          <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30">
                            {selectedMovie.dangPhim}
                          </Badge>
                          {tmdbDetails.get(selectedMovie.id)?.voteAverage && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                              ⭐{' '}
                              {tmdbDetails
                                .get(selectedMovie.id)
                                ?.voteAverage.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Clock
                            className="w-5 h-5"
                            style={{ color: '#8B5CF6' }}
                          />
                          <span style={{ color: '#9CA3AF' }}>Thời lượng:</span>
                          <span style={{ color: '#E5E7EB' }}>
                            {selectedMovie.thoiLuong} phút
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Globe
                            className="w-5 h-5"
                            style={{ color: '#8B5CF6' }}
                          />
                          <span style={{ color: '#9CA3AF' }}>Xuất xứ:</span>
                          <span style={{ color: '#E5E7EB' }}>
                            {selectedMovie.xuatXu}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar
                            className="w-5 h-5"
                            style={{ color: '#8B5CF6' }}
                          />
                          <span style={{ color: '#9CA3AF' }}>
                            Ngày phát hành:
                          </span>
                          <span style={{ color: '#E5E7EB' }}>
                            {new Date(
                              selectedMovie.ngayPhatHanh,
                            ).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users
                            className="w-5 h-5"
                            style={{ color: '#8B5CF6' }}
                          />
                          <span style={{ color: '#9CA3AF' }}>
                            Giới hạn tuổi:
                          </span>
                          <span style={{ color: '#E5E7EB' }}>
                            {selectedMovie.gioiHanTuoi}+ tuổi
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Info
                            className="w-5 h-5"
                            style={{ color: '#8B5CF6' }}
                          />
                          <span style={{ color: '#9CA3AF' }}>Mô tả:</span>
                        </div>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: '#E5E7EB' }}
                        >
                          {tmdbDetails.get(selectedMovie.id)?.overview ||
                            selectedMovie.moTa}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {tmdbDetails.get(selectedMovie.id)?.trailerKey && (
                          <Button
                            className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
                            onClick={() => {
                              setTrailerKey(
                                tmdbDetails.get(selectedMovie.id)?.trailerKey ||
                                  null,
                              );
                              setShowTrailer(true);
                            }}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Xem Trailer
                          </Button>
                        )}
                        {selectedMovie.trailerURL &&
                          !tmdbDetails.get(selectedMovie.id)?.trailerKey && (
                            <Button
                              variant="outline"
                              className="border-[#FFC107]/30 hover:bg-[#FFC107]/20"
                              onClick={() => {
                                if (selectedMovie.trailerURL) {
                                  window.open(
                                    selectedMovie.trailerURL,
                                    '_blank',
                                  );
                                }
                              }}
                            >
                              <Play
                                className="w-4 h-4 mr-2"
                                style={{ color: '#FFC107' }}
                              />
                              Xem Trailer
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Showtimes */}
                <div>
                  <h3 className="text-xl mb-4" style={{ color: '#E5E7EB' }}>
                    Suất chiếu
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {loading ? (
                      <p style={{ color: '#9CA3AF' }}>Đang tải...</p>
                    ) : showtimes.length === 0 ? (
                      <p style={{ color: '#9CA3AF' }}>
                        Không có suất chiếu nào
                      </p>
                    ) : (
                      showtimes.map((showtime) => {
                        const startTime = new Date(showtime.startTime);
                        const formattedTime = startTime.toLocaleTimeString(
                          'vi-VN',
                          { hour: '2-digit', minute: '2-digit' },
                        );
                        const formattedDate =
                          startTime.toLocaleDateString('vi-VN');

                        return (
                          <Card
                            key={showtime.id}
                            className="border-[#8B5CF6]/20 hover:border-[#8B5CF6] cursor-pointer transition-all"
                            onClick={() => handleSelectShowtime(showtime)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div>
                                    <p
                                      className="text-xs mb-1"
                                      style={{ color: '#9CA3AF' }}
                                    >
                                      Giờ chiếu
                                    </p>
                                    <p style={{ color: '#FFC107' }}>
                                      {formattedTime}
                                    </p>
                                  </div>
                                  <div>
                                    <p
                                      className="text-xs mb-1"
                                      style={{ color: '#9CA3AF' }}
                                    >
                                      Ngày chiếu
                                    </p>
                                    <p style={{ color: '#E5E7EB' }}>
                                      {formattedDate}
                                    </p>
                                  </div>
                                  <div>
                                    <p
                                      className="text-xs mb-1"
                                      style={{ color: '#9CA3AF' }}
                                    >
                                      Phòng
                                    </p>
                                    <p style={{ color: '#E5E7EB' }}>
                                      {showtime.phongChieu}
                                    </p>
                                  </div>
                                  <div>
                                    <p
                                      className="text-xs mb-1"
                                      style={{ color: '#9CA3AF' }}
                                    >
                                      Định dạng
                                    </p>
                                    <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30">
                                      {showtime.dinhDang}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p
                                      className="text-xs mb-1"
                                      style={{ color: '#9CA3AF' }}
                                    >
                                      {showtime.longTieng ? 'Lồng tiếng' : ''}
                                    </p>
                                    <p style={{ color: '#E5E7EB' }}>
                                      {showtime.longTieng
                                        ? showtime.longTieng
                                        : ''}
                                    </p>
                                    <p
                                      className="text-xs mb-1"
                                      style={{ color: '#9CA3AF' }}
                                    >
                                      {showtime.phuDe ? 'Phụ đề' : ''}
                                    </p>
                                    <p style={{ color: '#E5E7EB' }}>
                                      {showtime.phuDe ? showtime.phuDe : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right ml-6">
                                  <p
                                    className="text-xs mb-1"
                                    style={{ color: '#9CA3AF' }}
                                  >
                                    Giá vé
                                  </p>
                                  <p
                                    className="text-xl mb-2"
                                    style={{ color: '#FFC107' }}
                                  >
                                    {showtime.giaVe.toLocaleString('vi-VN')}₫
                                  </p>
                                  <Button
                                    size="sm"
                                    className="select-showtime-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectShowtime(showtime);
                                    }}
                                  >
                                    Chọn ghế
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Seat Selection */}
            {viewMode === 'seats' && selectedShowtime && (
              <div>
                <Card className="border-[#8B5CF6]/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle style={{ color: '#E5E7EB' }}>
                        Chọn ghế - {selectedShowtime.phongChieu}
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: '#6B7280' }}
                          />
                          <span
                            className="text-sm"
                            style={{ color: '#9CA3AF' }}
                          >
                            Còn trống
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: '#EF4444' }}
                          />
                          <span
                            className="text-sm"
                            style={{ color: '#9CA3AF' }}
                          >
                            Đã đặt
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: '#FFC107' }}
                          />
                          <span
                            className="text-sm"
                            style={{ color: '#9CA3AF' }}
                          >
                            Đang chọn
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Screen */}
                    <div className="mb-8">
                      <div
                        className="h-2 rounded-t-full mx-auto"
                        style={{
                          width: '80%',
                          background:
                            'linear-gradient(to bottom, #8B5CF6, transparent)',
                        }}
                      />
                      <div className="text-center mt-2">
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                          MÀN HÌNH
                        </span>
                      </div>
                    </div>

                    {/* Seat Grid */}
                    <div className="flex justify-center">
                      <div className="inline-block">
                        {/* Column Numbers */}
                        <div className="flex items-center mb-2">
                          <div className="w-8" />
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <div
                              key={num}
                              className="w-10 h-8 flex items-center justify-center text-sm"
                              style={{ color: '#9CA3AF' }}
                            >
                              {num}
                            </div>
                          ))}
                        </div>

                        {/* Seats with Row Letters */}
                        {seats.map((row, rowIndex) => {
                          const isRowE = row[0]?.row === 'E';

                          return (
                            <div
                              key={rowIndex}
                              className="flex items-center mb-2"
                            >
                              {/* Row Letter */}
                              <div
                                className="w-8 h-8 flex items-center justify-center text-sm"
                                style={{ color: '#9CA3AF' }}
                              >
                                {row[0].row}
                              </div>

                              {/* Seats */}
                              {isRowE
                                ? // Row E: Render couple seats (each takes 2 columns)
                                  row
                                    .filter((seat) => seat.col % 2 === 1)
                                    .map((seat) => {
                                      const seatId = `${seat.row}${seat.col}`;
                                      const nextSeatId = `${seat.row}${
                                        seat.col + 1
                                      }`;
                                      const isDisabled =
                                        seat.status === 'booked' ||
                                        seat.status === 'processing';

                                      return (
                                        <button
                                          key={seatId}
                                          className={`h-8 m-0.5 rounded transition-all flex items-center justify-center gap-1 ${
                                            isDisabled
                                              ? 'cursor-not-allowed opacity-50'
                                              : 'hover:opacity-80 cursor-pointer'
                                          }`}
                                          style={{
                                            width: 'calc(2 * 2.5rem + 0.25rem)',
                                            backgroundColor: getSeatColor(
                                              seat.status,
                                              seatId,
                                              seat.type,
                                              seat.row,
                                            ),
                                          }}
                                          onClick={() =>
                                            handleSeatClick(seatId, seat)
                                          }
                                          disabled={isDisabled}
                                          title={`${seatId}-${nextSeatId} - Ghế đôi - ${
                                            seat.status === 'available'
                                              ? 'Còn trống'
                                              : seat.status === 'booked'
                                                ? 'Đã đặt'
                                                : 'Đang xử lý'
                                          }`}
                                        >
                                          <Armchair
                                            className="w-4 h-4"
                                            style={{ color: '#0F1629' }}
                                          />
                                          <Armchair
                                            className="w-4 h-4"
                                            style={{ color: '#0F1629' }}
                                          />
                                        </button>
                                      );
                                    })
                                : // Other rows: Render normal single seats
                                  row.map((seat) => {
                                    const seatId = `${seat.row}${seat.col}`;
                                    const isDisabled =
                                      seat.status === 'booked' ||
                                      seat.status === 'processing';

                                    return (
                                      <button
                                        key={seatId}
                                        className={`w-10 h-8 m-0.5 rounded transition-all flex items-center justify-center ${
                                          isDisabled
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'hover:opacity-80 cursor-pointer'
                                        }`}
                                        style={{
                                          backgroundColor: getSeatColor(
                                            seat.status,
                                            seatId,
                                            seat.type,
                                            seat.row,
                                          ),
                                        }}
                                        onClick={() =>
                                          handleSeatClick(seatId, seat)
                                        }
                                        disabled={isDisabled}
                                        title={`${seatId} - ${
                                          seat.status === 'available'
                                            ? 'Còn trống'
                                            : seat.status === 'booked'
                                              ? 'Đã đặt'
                                              : 'Đang xử lý'
                                        }`}
                                      >
                                        <Armchair
                                          className="w-4 h-4"
                                          style={{ color: '#0F1629' }}
                                        />
                                      </button>
                                    );
                                  })}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seat Legend */}
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: '#6B7280' }}
                        >
                          <Armchair
                            className="w-3 h-3"
                            style={{ color: '#0F1629' }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                          Ghế Thường{' '}
                          {seats.length > 0 && seats[0][0] && (
                            <span style={{ color: '#FFC107' }}>
                              (
                              {seats
                                .find((row) =>
                                  row.some((s) => s.type === 'Thuong'),
                                )
                                ?.find((s) => s.type === 'Thuong')
                                ?.price.toLocaleString('vi-VN')}
                              ₫)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: '#8B5CF6' }}
                        >
                          <Armchair
                            className="w-3 h-3"
                            style={{ color: '#0F1629' }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                          Ghế VIP{' '}
                          {seats.length > 0 && (
                            <span style={{ color: '#FFC107' }}>
                              (
                              {seats
                                .find((row) =>
                                  row.some((s) => s.type === 'VIP'),
                                )
                                ?.find((s) => s.type === 'VIP')
                                ?.price.toLocaleString('vi-VN')}
                              ₫)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: '#EC4899' }}
                        >
                          <Armchair
                            className="w-3 h-3"
                            style={{ color: '#0F1629' }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                          Ghế Đôi{' '}
                          {seats.length > 0 && (
                            <span style={{ color: '#FFC107' }}>
                              (
                              {seats
                                .find((row) =>
                                  row.some((s) => s.type === 'Doi'),
                                )
                                ?.find((s) => s.type === 'Doi')
                                ?.price.toLocaleString('vi-VN')}
                              ₫)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: '#FFC107' }}
                        >
                          <Armchair
                            className="w-3 h-3"
                            style={{ color: '#0F1629' }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                          Đang chọn
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center opacity-50"
                          style={{ backgroundColor: '#EF4444' }}
                        >
                          <Armchair
                            className="w-3 h-3"
                            style={{ color: '#0F1629' }}
                          />
                        </div>
                        <span className="text-sm" style={{ color: '#9CA3AF' }}>
                          Đã đặt
                        </span>
                      </div>
                    </div>

                    {/* Selected Seats Info */}
                    {selectedSeats.length > 0 && (
                      <div
                        className="mt-6 p-4 rounded-lg"
                        style={{ backgroundColor: '#1C253A' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p style={{ color: '#E5E7EB' }}>Ghế đã chọn:</p>
                            <p className="text-xl" style={{ color: '#FFC107' }}>
                              {selectedSeats.join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p style={{ color: '#9CA3AF' }}>Tổng cộng:</p>
                            <p
                              className="text-2xl"
                              style={{ color: '#FFC107' }}
                            >
                              {(() => {
                                let totalPrice = 0;
                                selectedSeats.forEach((seatId) => {
                                  for (const row of seats) {
                                    const seat = row.find(
                                      (s) => `${s.row}${s.col}` === seatId,
                                    );
                                    if (seat) {
                                      totalPrice += seat.price;
                                      break;
                                    }
                                  }
                                });
                                return totalPrice.toLocaleString('vi-VN');
                              })()}
                              ₫
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleConfirmSeats}
                          className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
                        >
                          Xác nhận chọn ghế ({selectedSeats.length} ghế)
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Products */}
            {viewMode === 'products' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag
                    className="w-6 h-6"
                    style={{ color: '#FFC107' }}
                  />
                  <h2 className="text-2xl" style={{ color: '#E5E7EB' }}>
                    Thêm thức ăn & đồ uống
                  </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="border-[#8B5CF6]/20 w-full"
                    >
                      <CardContent className="p-4">
                        <Badge className="mb-2 bg-[#FFC107]/20 text-[#FFC107] border-[#FFC107]/30">
                          {product.category}
                        </Badge>
                        <h4 className="mb-2" style={{ color: '#E5E7EB' }}>
                          {product.name}
                        </h4>
                        <p className="mb-4" style={{ color: '#FFC107' }}>
                          {product.price.toLocaleString('vi-VN')}₫
                        </p>
                        <Button
                          onClick={() => addProductToCart(product)}
                          size="sm"
                          className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Thêm
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart Sidebar - áp dụng đúng class cart-sidebar từ GuestCart.css */}
          <div
            className="hidden lg:block cart-sidebar"
            style={{ maxWidth: '380px', width: '100%' }}
          >
            <Card className="border-[#8B5CF6]/20 sticky top-6">
              <CardHeader>
                <CardTitle
                  className="flex items-center gap-2"
                  style={{ color: '#E5E7EB' }}
                >
                  <ShoppingBag
                    className="w-5 h-5"
                    style={{ color: '#8B5CF6' }}
                  />
                  Giỏ hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center py-8" style={{ color: '#9CA3AF' }}>
                    Giỏ hàng trống
                  </p>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: '#0F1629' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <Badge
                                className={
                                  item.type === 'ticket'
                                    ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30 mb-1'
                                    : 'bg-[#FFC107]/20 text-[#FFC107] border-[#FFC107]/30 mb-1'
                                }
                              >
                                {item.type === 'ticket' ? 'Vé' : 'Sản phẩm'}
                              </Badge>
                              <p
                                className="text-sm mb-1"
                                style={{ color: '#E5E7EB' }}
                              >
                                {item.name}
                              </p>
                              {item.details && (
                                <p
                                  className="text-xs"
                                  style={{ color: '#9CA3AF' }}
                                >
                                  {item.details}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2
                                className="w-4 h-4"
                                style={{ color: '#EF4444' }}
                              />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.type === 'product' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="h-6 w-6 p-0 hover:bg-[#8B5CF6]/20"
                                  >
                                    <Minus
                                      className="w-3 h-3"
                                      style={{ color: '#8B5CF6' }}
                                    />
                                  </Button>
                                  <span style={{ color: '#E5E7EB' }}>
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="h-6 w-6 p-0 hover:bg-[#8B5CF6]/20"
                                  >
                                    <Plus
                                      className="w-3 h-3"
                                      style={{ color: '#8B5CF6' }}
                                    />
                                  </Button>
                                </>
                              )}
                            </div>
                            <p style={{ color: '#FFC107' }}>
                              {(item.price * item.quantity).toLocaleString(
                                'vi-VN',
                              )}
                              ₫
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator
                      style={{
                        backgroundColor: '#8B5CF6',
                        opacity: 0.2,
                      }}
                    />

                    {/* Voucher */}
                    <div>
                      <Label style={{ color: '#E5E7EB' }} className="mb-2">
                        Mã voucher
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập mã voucher"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107] text-[#E5E7EB]"
                        />
                        <Button
                          onClick={applyVoucher}
                          variant="outline"
                          className="border-[#FFC107]/30 hover:bg-[#FFC107]/20 text-[#FFC107]"
                        >
                          Áp dụng
                        </Button>
                      </div>
                    </div>

                    <Separator
                      style={{
                        backgroundColor: '#8B5CF6',
                        opacity: 0.2,
                      }}
                    />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div
                        className="flex justify-between"
                        style={{ color: '#9CA3AF' }}
                      >
                        <span>Tạm tính:</span>
                        <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {discount > 0 && (
                        <div
                          className="flex justify-between"
                          style={{ color: '#10B981' }}
                        >
                          <span>Giảm giá:</span>
                          <span>
                            -{discountAmount.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      )}
                      <Separator
                        style={{
                          backgroundColor: '#8B5CF6',
                          opacity: 0.2,
                        }}
                      />
                      <div
                        className="flex justify-between text-xl"
                        style={{ color: '#FFC107' }}
                      >
                        <span>Tổng cộng:</span>
                        <span>{total.toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Thanh toán
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent
          className="border-[#8B5CF6]/30"
          style={{ backgroundColor: '#1C253A' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#E5E7EB' }}>
              Xác nhận thông tin
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmCheckout} className="space-y-4">
            <div>
              <Label style={{ color: '#E5E7EB' }}>Họ và tên</Label>
              <Input
                value={userData.name}
                disabled={!isGuest}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className="bg-[#0F1629] border-[#8B5CF6]/30 text-[#E5E7EB]"
                placeholder="Nhập họ tên người nhận vé"
              />
            </div>
            <div>
              <Label style={{ color: '#E5E7EB' }}>Email</Label>
              <Input
                value={userData.email}
                disabled={!isGuest}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className="bg-[#0F1629] border-[#8B5CF6]/30 text-[#E5E7EB]"
                placeholder="Nhập email để nhận mã vé"
              />
            </div>
            <div>
              <Label style={{ color: '#E5E7EB' }}>Số điện thoại</Label>
              <Input
                value={userData.phone}
                disabled={!isGuest}
                onChange={(e) =>
                  setUserData({ ...userData, phone: e.target.value })
                }
                className="bg-[#0F1629] border-[#8B5CF6]/30 text-[#E5E7EB]"
                placeholder="Nhập số điện thoại liên hệ"
              />
            </div>

            <Separator
              style={{
                backgroundColor: '#8B5CF6',
                opacity: 0.2,
              }}
            />

            <div>
              <p style={{ color: '#9CA3AF' }} className="mb-2">
                Tóm tắt đơn hàng:
              </p>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm"
                    style={{ color: '#E5E7EB' }}
                  >
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span style={{ color: '#FFC107' }}>
                      {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator
              style={{
                backgroundColor: '#8B5CF6',
                opacity: 0.2,
              }}
            />

            <div className="flex justify-between text-xl">
              <span style={{ color: '#E5E7EB' }}>Tổng cộng:</span>
              <span style={{ color: '#FFC107' }}>
                {total.toLocaleString('vi-VN')}₫
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
                className="border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/20"
                style={{ color: '#E5E7EB' }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
              >
                Xác nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent
          className="border-[#8B5CF6]/30"
          style={{ backgroundColor: '#1C253A' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#E5E7EB' }}>
              Phương thức thanh toán
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p style={{ color: '#9CA3AF' }}>
              Chọn phương thức thanh toán cho đơn hàng của bạn:
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => handlePayment('Credit_Card')}
                className="w-full justify-start h-auto p-4 bg-[#1C253A] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30"
              >
                <CreditCard
                  className="w-5 h-5 mr-3"
                  style={{ color: '#8B5CF6' }}
                />
                <div className="text-left">
                  <p style={{ color: '#E5E7EB' }}>Thẻ tín dụng / Ghi nợ</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Visa, Mastercard, JCB
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => handlePayment('E-Wallet')}
                className="w-full justify-start h-auto p-4 bg-[#1C253A] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30"
              >
                <QrCode className="w-5 h-5 mr-3" style={{ color: '#FFC107' }} />
                <div className="text-left">
                  <p style={{ color: '#E5E7EB' }}>Ví điện tử</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    MoMo, ZaloPay, VNPay
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => handlePayment('Bank_Transfer')}
                className="w-full justify-start h-auto p-4 bg-[#1C253A] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30"
              >
                <div className="w-5 h-5 mr-3 flex items-center justify-center">
                  <span style={{ color: '#10B981' }}>💳</span>
                </div>
                <div className="text-left">
                  <p style={{ color: '#E5E7EB' }}>Chuyển khoản ngân hàng</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    Vietcombank, Techcombank, ACB
                  </p>
                </div>
              </Button>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: '#0F1629' }}
            >
              <p className="text-xl mb-1" style={{ color: '#E5E7EB' }}>
                Tổng thanh toán:
              </p>
              <p className="text-3xl" style={{ color: '#FFC107' }}>
                {total.toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelPayment}
              className="border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/20"
              style={{ color: '#E5E7EB' }}
            >
              Quay lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Success Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent
          className="border-[#8B5CF6]/30 max-w-md"
          style={{ backgroundColor: '#1C253A' }}
        >
          <DialogHeader>
            <DialogTitle className="text-center" style={{ color: '#E5E7EB' }}>
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
              Thanh toán thành công!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <p style={{ color: '#9CA3AF' }} className="mb-4">
                Vé của bạn đã được gửi đến email
              </p>
              <p style={{ color: '#FFC107' }} className="mb-4">
                {userData.email}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div
                className="p-6 rounded-lg"
                style={{ backgroundColor: '#0F1629' }}
              >
                <div
                  className="w-48 h-48 flex items-center justify-center"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="text-center p-4">
                    <QrCode
                      className="w-32 h-32 mx-auto mb-2"
                      style={{ color: '#0F1629' }}
                    />
                    <p className="text-xs" style={{ color: '#0F1629' }}>
                      Mã vé:{' '}
                      {Math.random()
                        .toString(36)
                        .substring(2, 10)
                        .toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: '#0F1629' }}
            >
              <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>
                Vui lòng xuất trình mã QR này tại quầy để nhận vé
              </p>
              <Separator
                className="my-3"
                style={{ backgroundColor: '#8B5CF6', opacity: 0.2 }}
              />
              <div className="space-y-2 text-sm">
                {cart
                  .filter((item) => item.type === 'ticket')
                  .map((item) => (
                    <div key={item.id}>
                      <p style={{ color: '#E5E7EB' }}>{item.name}</p>
                      <p style={{ color: '#9CA3AF' }}>{item.details}</p>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              onClick={handleFinish}
              className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
            >
              Hoàn tất
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trailer Dialog */}
      <Dialog open={showTrailer} onOpenChange={setShowTrailer}>
        <DialogContent
          className="border-[#8B5CF6]/30 max-w-4xl"
          style={{ backgroundColor: '#1C253A' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: '#E5E7EB' }}>Trailer</DialogTitle>
          </DialogHeader>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {trailerKey && (
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
