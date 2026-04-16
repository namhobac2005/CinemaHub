import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  TrendingDown,
  Film,
  Receipt,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface IStatWithTrend {
  value: number;
  change: number;
}

interface IGeneralStats {
  moviesShowing: number;
  showtimesToday: number;
}

interface IChartData {
  month: string;
  revenue: number;
  tickets: number;
}

interface IMovieData {
  ID: number;
  title: string;
  genre: string;
  status: string;
  revenue: number;
}

interface IInvoiceData {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: string;
}

interface ITopProduct {
  name: string;
  sold: number;
  revenue: number;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} triệu VNĐ`;
  }
  return `${value.toLocaleString('vi-VN')} VNĐ`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};
const formatID = (id: string, prefix: string) => {
  return `${prefix}${id.padStart(4, '0')}`;
};
export default function Dashboard() {
  const [revMonth, setRevMonth] = useState<IStatWithTrend | null>(null);
  const [tickMonth, setTickMonth] = useState<IStatWithTrend | null>(null);

  const [revDay, setRevDay] = useState<IStatWithTrend | null>(null);
  const [tickDay, setTickDay] = useState<IStatWithTrend | null>(null);
  const [generalStats, setGeneralStats] = useState<IGeneralStats | null>(null);

  const [chartData, setChartData] = useState<IChartData[]>([]);
  const [recentMovies, setRecentMovies] = useState<IMovieData[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<IInvoiceData[]>([]);
  const [topProducts, setTopProducts] = useState<ITopProduct[]>([]);

  const [allMovies, setAllMovies] = useState<IMovieData[]>([]);
  const [allInvoices, setAllInvoices] = useState<IInvoiceData[]>([]);

  const [isMoviesDialogOpen, setIsMoviesDialogOpen] = useState(false);
  const [isInvoicesDialogOpen, setIsInvoicesDialogOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const baseUrl = 'http://localhost:5000/reports';
      const endpoints = [
        { url: 'stats/revenue-month', setter: setRevMonth },
        { url: 'stats/tickets-month', setter: setTickMonth },
        { url: 'stats/revenue-day', setter: setRevDay },
        { url: 'stats/tickets-day', setter: setTickDay },
        { url: 'stats/general', setter: setGeneralStats },
        { url: 'charts/6months', setter: setChartData },
        { url: 'tables/recent-movies', setter: setRecentMovies },
        { url: 'tables/recent-invoices', setter: setRecentInvoices },
        { url: 'tables/top-products', setter: setTopProducts },
      ];

      // Thay vì Promise.all, ta dùng map và bắt lỗi riêng từng cái
      endpoints.forEach(async (item) => {
        try {
          const res = await axios.get(`${baseUrl}/${item.url}`);
          item.setter(res.data);
        } catch (err) {
          console.error(`Lỗi tại ${item.url}:`, err);
          // Giữ nguyên giá trị mặc định hoặc null nếu lỗi
        }
      });
    };
    fetchDashboardData();
  }, []);

  const handleLoadAllMovies = async () => {
    setIsMoviesDialogOpen(true);
    if (allMovies.length === 0) {
      try {
        const res = await axios.get(
          'http://localhost:5000/reports/tables/all-movies',
        );
        setAllMovies(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleLoadAllInvoices = async () => {
    setIsInvoicesDialogOpen(true);
    if (allInvoices.length === 0) {
      try {
        const res = await axios.get(
          'http://localhost:5000/reports/tables/all-invoices',
        );
        setAllInvoices(res.data);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const stats = [
    {
      title: 'Doanh thu tháng này',
      value: revMonth ? formatCurrency(revMonth.value) : '...',
      change: revMonth?.change,
      icon: DollarSign,
      color: '#FFC107',
      showTrend: true,
    },
    {
      title: 'Vé bán tháng này',
      value: tickMonth ? tickMonth.value.toLocaleString() : '...',
      change: tickMonth?.change,
      icon: Receipt,
      color: '#10B981',
      showTrend: true,
    },
    {
      title: 'Doanh thu hôm nay',
      value: revDay ? formatCurrency(revDay.value) : '...',
      change: revDay?.change,
      icon: DollarSign,
      color: '#FFC107',
      showTrend: true,
    },
    {
      title: 'Vé bán hôm nay',
      value: tickDay ? tickDay.value.toLocaleString() : '...',
      change: tickDay?.change,
      icon: Receipt,
      color: '#10B981',
      showTrend: true,
    },
    {
      title: 'Phim đang chiếu',
      value: generalStats ? generalStats.moviesShowing : '...',
      icon: Film,
      color: '#8B5CF6',
      showTrend: false,
    },
    {
      title: 'Suất chiếu hôm nay',
      value: generalStats ? generalStats.showtimesToday : '...',
      icon: Calendar,
      color: '#06B6D4',
      showTrend: false,
    },
  ];

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DangChieu':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            Đang chiếu
          </Badge>
        );
      case 'SapChieu':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            Sắp chiếu
          </Badge>
        );
      case 'NgungChieu':
        return (
          <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">
            Ngừng chiếu
          </Badge>
        );
      case 'DaThanhToan':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            Đã thanh toán
          </Badge>
        );
      case 'ChuaThanhToan':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            Chờ xử lý
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/20 text-gray-500">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2" style={{ color: '#E5E7EB' }}>
          Tổng quan
        </h1>
        <p style={{ color: '#9CA3AF' }}>
          Chào mừng trở lại! Đây là tổng quan hoạt động của rạp chiếu phim.
        </p>
      </div>

      {/* Stats Cards */}
      <div
        className="grid gap-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        }}
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isUp = (stat.change || 0) >= 0;

          return (
            <Card
              key={index}
              className="border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-all min-w-0"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  {stat.showTrend && stat.change !== undefined && (
                    <div
                      className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                        isUp ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={isUp ? 'text-green-500' : 'text-red-500'}
                      >
                        {Math.abs(stat.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p
                    className="text-xs mb-1 truncate"
                    style={{ color: '#9CA3AF' }}
                  >
                    {stat.title}
                  </p>
                  <p
                    className="text-xl font-bold truncate"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-[#8B5CF6]/20">
          <CardHeader>
            <CardTitle style={{ color: '#E5E7EB' }}>
              Doanh thu 6 tháng gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC107" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFC107" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#8B5CF6"
                  opacity={0.1}
                />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis
                  stroke="#9CA3AF"
                  tickFormatter={(val) => `${val / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C253A',
                    borderColor: '#8B5CF6',
                    color: '#E5E7EB',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FFC107"
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tickets Chart */}
        <Card className="border-[#8B5CF6]/20">
          <CardHeader>
            <CardTitle style={{ color: '#E5E7EB' }}>Số vé bán ra</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#8B5CF6"
                  opacity={0.1}
                />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C253A',
                    borderColor: '#8B5CF6',
                    color: '#E5E7EB',
                  }}
                />
                <Bar dataKey="tickets" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movies */}
        <Card className="border-[#8B5CF6]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle style={{ color: '#E5E7EB' }}>Phim gần đây</CardTitle>
              <button
                className="text-sm hover:underline transition-colors"
                style={{ color: '#8B5CF6' }}
                onClick={handleLoadAllMovies}
              >
                Xem tất cả
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                  <TableHead style={{ color: '#9CA3AF' }}>Tên phim</TableHead>
                  <TableHead style={{ color: '#9CA3AF' }}>Trạng thái</TableHead>
                  <TableHead
                    className="text-right"
                    style={{ color: '#9CA3AF' }}
                  >
                    Doanh thu
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovies.map((movie) => (
                  <TableRow key={movie.ID} className="border-[#8B5CF6]/20">
                    <TableCell>
                      <div>
                        <p style={{ color: '#E5E7EB', fontWeight: 500 }}>
                          {movie.title}
                        </p>
                        <p className="text-sm" style={{ color: '#9CA3AF' }}>
                          {movie.genre}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(movie.status)}</TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: '#FFC107' }}
                    >
                      {formatCurrency(movie.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-[#8B5CF6]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle style={{ color: '#E5E7EB' }}>
                Hóa đơn gần đây
              </CardTitle>
              <button
                className="text-sm hover:underline transition-colors"
                style={{ color: '#8B5CF6' }}
                onClick={handleLoadAllInvoices}
              >
                Xem tất cả
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                  <TableHead style={{ color: '#9CA3AF' }}>Mã HĐ</TableHead>
                  <TableHead style={{ color: '#9CA3AF' }}>Khách hàng</TableHead>
                  <TableHead
                    className="text-right"
                    style={{ color: '#9CA3AF' }}
                  >
                    Số tiền
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-[#8B5CF6]/20">
                    <TableCell style={{ color: '#8B5CF6' }}>
                      {formatID(invoice.id, 'HD')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p style={{ color: '#E5E7EB' }}>{invoice.customer}</p>
                        <p className="text-sm" style={{ color: '#9CA3AF' }}>
                          {formatDate(invoice.date)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: '#FFC107' }}
                    >
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-[#8B5CF6]/20">
        <CardHeader>
          <CardTitle style={{ color: '#E5E7EB' }}>Sản phẩm bán chạy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: '#0F1629' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: '#8B5CF6', color: '#E5E7EB' }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p style={{ color: '#E5E7EB' }}>{product.name}</p>
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>
                      Đã bán: {product.sold} sản phẩm
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ color: '#FFC107' }}>
                    {formatCurrency(product.revenue)}
                  </p>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>
                    Doanh thu
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* POPUPS (DIALOGS) */}

      {/* 1. Movies Dialog */}
      <Dialog open={isMoviesDialogOpen} onOpenChange={setIsMoviesDialogOpen}>
        <DialogContent className="bg-[#1C253A] border-[#8B5CF6]/30 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#E5E7EB' }}>Tất cả phim</DialogTitle>
            <DialogDescription style={{ color: '#9CA3AF' }}>
              Danh sách đầy đủ các phim và doanh thu tương ứng.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                  <TableHead style={{ color: '#9CA3AF' }}>Tên phim</TableHead>
                  <TableHead style={{ color: '#9CA3AF' }}>Trạng thái</TableHead>
                  <TableHead
                    className="text-right"
                    style={{ color: '#9CA3AF' }}
                  >
                    Doanh thu
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMovies.map((movie) => (
                  <TableRow key={movie.ID} className="border-[#8B5CF6]/20">
                    <TableCell>
                      <div>
                        <p style={{ color: '#E5E7EB', fontWeight: 500 }}>
                          {movie.title}
                        </p>
                        <p className="text-sm" style={{ color: '#9CA3AF' }}>
                          {movie.genre}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(movie.status)}</TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: '#FFC107' }}
                    >
                      {formatCurrency(movie.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Invoices Dialog */}
      <Dialog
        open={isInvoicesDialogOpen}
        onOpenChange={setIsInvoicesDialogOpen}
      >
        <DialogContent className="bg-[#1C253A] border-[#8B5CF6]/30 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: '#E5E7EB' }}>
              Tất cả hóa đơn
            </DialogTitle>
            <DialogDescription style={{ color: '#9CA3AF' }}>
              Lịch sử giao dịch toàn hệ thống.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                  <TableHead style={{ color: '#9CA3AF' }}>Mã HĐ</TableHead>
                  <TableHead style={{ color: '#9CA3AF' }}>Khách hàng</TableHead>
                  <TableHead style={{ color: '#9CA3AF' }}>Trạng thái</TableHead>
                  <TableHead
                    className="text-right"
                    style={{ color: '#9CA3AF' }}
                  >
                    Số tiền
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-[#8B5CF6]/20">
                    <TableCell style={{ color: '#8B5CF6' }}>
                      {invoice.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p style={{ color: '#E5E7EB' }}>{invoice.customer}</p>
                        <p className="text-sm" style={{ color: '#9CA3AF' }}>
                          {formatDate(invoice.date)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(invoice.status)}</TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: '#FFC107' }}
                    >
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
