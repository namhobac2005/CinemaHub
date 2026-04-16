import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Film,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Mail,
  QrCode,
  CreditCard,
  X,
  ChevronLeft,
  MapPin,
  Clock,
  Globe,
  Calendar,
  Users,
  Play,
  Info,
  LogIn,
} from 'lucide-react';
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
  DialogDescription,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import './GuestCart.css';

// --- Interfaces (Chuẩn UUID string) ---
interface Theater {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface Movie {
  id: string;
  tenPhim: string;
  moTa: string;
  thoiLuong: number;
  xuatXu: string;
  dangPhim: string;
  ngayPhatHanh: string;
  trailerURL: string;
  posterURL: string;
  gioiHanTuoi: number;
}

interface Showtime {
  id: string;
  gioChieu: string;
  ngayChieu: string;
  phongChieu: string;
  dinhDangChieu: string;
  longTieng: boolean;
  phuDe: string;
  giaVe: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'ticket' | 'product';
  details?: string;
}

type ViewMode = 'theaters' | 'movies' | 'showtimes' | 'products';

interface GuestDashboardProps {
  onBackToLogin?: () => void;
}

export default function GuestDashboard({ onBackToLogin }: GuestDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('theaters');
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // --- States lưu dữ liệu từ API ---
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Logic Fetch Data (Bạn hãy thay URL API của bạn vào đây) ---
  useEffect(() => {
    const loadTheaters = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/booking/theaters');
        setTheaters(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTheaters();
  }, []);

  useEffect(() => {
    if (!selectedTheater) return;
    const loadMovies = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/booking/movies?theaterId=${selectedTheater.id}`,
        );
        setMovies(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadMovies();
  }, [selectedTheater]);

  useEffect(() => {
    if (!selectedMovie || !selectedTheater) return;
    const loadShowtimes = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/booking/showtimes?movieId=${selectedMovie.id}&theaterId=${selectedTheater.id}`,
        );
        setShowtimes(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadShowtimes();
  }, [selectedMovie, selectedTheater]);

  useEffect(() => {
    if (viewMode === 'products') {
      const loadProducts = async () => {
        try {
          const res = await axios.get('http://localhost:5000/booking/products');
          setProducts(res.data);
        } catch (err) {
          console.error(err);
        }
      };
      loadProducts();
    }
  }, [viewMode]);

  // --- Handlers ---
  const handleSelectTheater = (theater: Theater) => {
    setSelectedTheater(theater);
    setViewMode('movies');
  };
  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setViewMode('showtimes');
  };

  const handleSelectShowtime = (showtime: Showtime) => {
    if (!selectedMovie) return;
    const ticketId = `TICK-${showtime.id}`;
    const existing = cart.find((item) => item.id === ticketId);
    if (existing) {
      updateQuantity(ticketId, 1);
    } else {
      setCart([
        ...cart,
        {
          id: ticketId,
          name: `${selectedMovie.tenPhim}`,
          price: showtime.giaVe,
          quantity: 1,
          type: 'ticket',
          details: `${showtime.gioChieu} | ${showtime.phongChieu} | ${showtime.dinhDangChieu}`,
        },
      ]);
    }
    setViewMode('products');
  };

  const addProductToCart = (p: Product) => {
    const existing = cart.find((item) => item.id === p.id);
    if (existing) updateQuantity(p.id, 1);
    else
      setCart([
        ...cart,
        {
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: 1,
          type: 'product',
        },
      ]);
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (id: string) =>
    setCart(cart.filter((item) => item.id !== id));

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (cart.length === 0) return alert('Giỏ hàng trống!');
    setIsCheckoutOpen(true);
  };

  const handleBack = () => {
    if (viewMode === 'products') setViewMode('showtimes');
    else if (viewMode === 'showtimes') setViewMode('movies');
    else if (viewMode === 'movies') setViewMode('theaters');
  };

  return (
    <div
      className="min-h-screen w-full text-white"
      style={{ backgroundColor: '#0F1629' }}
    >
      <header
        className="border-b"
        style={{
          backgroundColor: '#1C253A',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          height: '80px',
        }}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode !== 'theaters' && (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="text-[#8B5CF6]" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Film className="text-[#8B5CF6]" />
              <h1 className="text-xl font-bold text-[#FFC107]">CinemaHub</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#8B5CF620] px-3 py-1 rounded">
              <ShoppingBag size={18} className="text-[#8B5CF6]" />
              <span>{cart.length}</span>
            </div>
            <Button
              onClick={handleCheckout}
              className="bg-[#FFC107] text-[#0F1629]"
            >
              Thanh toán
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {viewMode === 'theaters' && (
            <div className="grid gap-4">
              <h2 className="text-2xl flex items-center gap-2">
                <MapPin /> Chọn rạp
              </h2>
              {loading ? (
                <p>Đang tải rạp...</p>
              ) : (
                theaters.map((t) => (
                  <Card
                    key={t.id}
                    className="bg-[#1C253A] border-[#8B5CF6]/20 hover:border-[#FFC107] cursor-pointer"
                    onClick={() => handleSelectTheater(t)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{t.name}</p>
                        <p className="text-sm text-[#9CA3AF]">{t.address}</p>
                      </div>
                      <Badge>{t.city}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {viewMode === 'movies' && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((m) => (
                <Card
                  key={m.id}
                  className="bg-transparent border-[#8B5CF6]/20 overflow-hidden flex flex-col"
                >
                  <ImageWithFallback
                    src={m.posterURL}
                    alt={m.tenPhim}
                    className="h-64 object-cover"
                  />
                  <CardContent className="p-3 flex-1 flex flex-col">
                    <h3 className="font-bold line-clamp-1">{m.tenPhim}</h3>
                    <div className="flex gap-2 my-2">
                      <Badge variant="secondary">{m.gioiHanTuoi}+</Badge>
                    </div>
                    <Button
                      onClick={() => handleSelectMovie(m)}
                      className="mt-auto bg-[#8B5CF6]"
                    >
                      Suất chiếu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'showtimes' && (
            <div className="grid gap-3">
              <h3 className="text-xl">
                Suất chiếu tại {selectedTheater?.name}
              </h3>
              {showtimes.map((s) => (
                <Card
                  key={s.id}
                  className="bg-[#1C253A] border-[#8B5CF6]/20 p-4 hover:border-[#FFC107] cursor-pointer"
                  onClick={() => handleSelectShowtime(s)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Giờ</p>
                        <p className="text-[#FFC107] font-bold">{s.gioChieu}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Phòng</p>
                        <p>{s.phongChieu}</p>
                      </div>
                    </div>
                    <p className="font-bold text-[#FFC107]">
                      {s.giaVe.toLocaleString()}₫
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'products' && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Card
                  key={p.id}
                  className="bg-[#1C253A] border-[#8B5CF6]/20 p-4 text-center"
                >
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-[#FFC107] my-2">
                    {p.price.toLocaleString()}₫
                  </p>
                  <Button
                    size="sm"
                    onClick={() => addProductToCart(p)}
                    className="w-full bg-[#FFC107] text-black"
                  >
                    Thêm
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside className="w-full lg:w-80">
          <Card className="bg-[#1C253A] border-[#8B5CF6]/20 sticky top-4">
            <CardHeader>
              <CardTitle>Giỏ hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm border-b border-white/5 pb-2"
                >
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{item.details}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-[#8B5CF6]/30">
                <div className="flex justify-between text-lg font-bold text-[#FFC107]">
                  <span>Tổng:</span>
                  <span>{total.toLocaleString()}₫</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full mt-4 bg-[#FFC107] text-black"
                >
                  Thanh toán
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="bg-[#1C253A] text-white border-[#8B5CF6]/30">
          <DialogHeader>
            <DialogTitle>Xác nhận email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Email nhận vé</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0F1629] border-[#8B5CF6]/30"
              placeholder="example@gmail.com"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCheckoutOpen(false)} variant="outline">
              Hủy
            </Button>
            <Button
              onClick={() => {
                setIsCheckoutOpen(false);
                setIsPaymentOpen(true);
              }}
              className="bg-[#FFC107] text-black"
            >
              Tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="bg-[#1C253A] text-white border-[#8B5CF6]/30 text-center">
          <DialogHeader>
            <DialogTitle>Thanh toán QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="bg-white p-4 rounded mb-4">
              <QrCode size={150} color="black" />
            </div>
            <p className="text-[#FFC107] font-bold text-xl">
              {total.toLocaleString()}₫
            </p>
          </div>
          <Button
            onClick={() => {
              alert('Đặt vé thành công!');
              setCart([]);
              setViewMode('theaters');
              setIsPaymentOpen(false);
            }}
            className="w-full bg-[#10B981]"
          >
            Hoàn tất chuyển khoản
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
