import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Film,
  Clapperboard,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Check,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import { Textarea } from '../components/ui/textarea';

interface Movie {
  id: number | string;
  name: string;
  description: string;
  duration: number;
  origin: string;
  type: string;
  subtitles: string;
  dubbing: string;
  releaseDate: Date;
  status: string;
  TrailerURl: string;
  PosterURL: string;
  AgeLimit: number;
}

const ITEMS_PER_PAGE = 8; // Số lượng phim mỗi trang

const formatID = (id: number | string, prefix: string) => {
  return `${prefix}${id.toString().slice(-4).padStart(4, '0')}`;
};

export default function MoviesList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Các state mới bổ sung
  const [currentPage, setCurrentPage] = useState(1);
  const [showIdColumn, setShowIdColumn] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    origin: '',
    type: '',
    subtitles: '',
    dubbing: '',
    releaseDate: '',
    status: '',
    TrailerURl: '',
    PosterURL: '',
    AgeLimit: '',
  });

  const stats = [
    {
      title: 'Tổng số phim',
      value: movies.length.toString(),
      icon: Film,
      color: '#FFC107',
    },
    {
      title: 'Đang chiếu',
      value: movies.filter((m) => m.status === 'DangChieu').length.toString(),
      icon: Clapperboard,
      color: '#10B981',
    },
    {
      title: 'Sắp chiếu',
      value: movies.filter((m) => m.status === 'SapChieu').length.toString(),
      icon: Clapperboard,
      color: '#159cd5ff',
    },
    {
      title: 'Ngừng chiếu',
      value: movies.filter((m) => m.status === 'NgungChieu').length.toString(),
      icon: Clapperboard,
      color: '#495954ff',
    },
  ];

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Movie[]>(
        'http://localhost:5000/phim/all',
      );
      setMovies(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách phim:', error);
      alert('Lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMovie) {
      try {
        await axios.put(
          `http://localhost:5000/phim/update/${editingMovie.id}`,
          formData,
        );
        fetchMovies();
        resetForm();
      } catch (error) {
        console.error('Lỗi khi cập nhật phim:', error);
        alert('Lỗi khi cập nhật phim!');
      }
    } else {
      try {
        await axios.post('http://localhost:5000/phim/add', formData);
        fetchMovies();
        resetForm();
      } catch (error) {
        console.error('Lỗi khi thêm phim:', error);
        alert('Lỗi khi thêm phim!');
      }
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      name: movie.name,
      description: movie.description,
      duration: movie.duration.toString(),
      origin: movie.origin,
      type: movie.type,
      subtitles: movie.subtitles,
      dubbing: movie.dubbing,
      releaseDate: movie.releaseDate
        ? new Date(movie.releaseDate).toISOString().split('T')[0]
        : '',
      status: movie.status,
      TrailerURl: movie.TrailerURl,
      PosterURL: movie.PosterURL,
      AgeLimit: movie.AgeLimit.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phim này?')) {
      try {
        await axios.delete(`http://localhost:5000/phim/delete/${id}`);
        fetchMovies();
      } catch (error) {
        console.error('Lỗi khi xóa phim:', error);
        alert('Lỗi khi xóa phim!');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      origin: '',
      type: '',
      subtitles: '',
      dubbing: '',
      releaseDate: '',
      status: '',
      TrailerURl: '',
      PosterURL: '',
      AgeLimit: '',
    });
    setEditingMovie(null);
    setIsDialogOpen(false);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Logic lọc và phân trang
  const filteredMovies = movies.filter(
    (m) =>
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.type || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const paginatedMovies = filteredMovies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getSTT = (index: number) =>
    (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

  const getStatusBadge = (status: string) => {
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
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-[#E5E7EB]">Quản lý Phim</h1>
          <p className="text-[#9CA3AF]">
            Quản lý danh sách phim và thông tin chi tiết
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629] shadow-lg font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm phim mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-[#8B5CF6]/20 bg-[#1C253A]/50">
              <CardContent className="p-6 flex items-center gap-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-sm text-[#9CA3AF]">{stat.title}</p>
                  <p
                    className="text-2xl font-bold"
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

      <Card className="border-[#8B5CF6]/20 bg-[#0F1629]/50 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[#E5E7EB]">Danh sách phim</CardTitle>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIdColumn(!showIdColumn)}
              className="border-[#8B5CF6]/30 text-[#E5E7EB]"
            >
              {showIdColumn ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {showIdColumn ? 'Ẩn ID' : 'Hiện ID'}
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm phim..."
                className="pl-10 bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107] text-[#E5E7EB]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#1C253A]/50">
              <TableRow className="border-[#8B5CF6]/20">
                <TableHead className="w-[60px] text-[#9CA3AF]">STT</TableHead>
                {showIdColumn && (
                  <TableHead className="text-[#9CA3AF] w-[150px]">
                    Mã ID
                  </TableHead>
                )}
                <TableHead className="text-[#9CA3AF]">Tên phim</TableHead>
                <TableHead className="text-[#9CA3AF]">Định dạng</TableHead>
                <TableHead className="text-[#9CA3AF]">Thời lượng</TableHead>
                <TableHead className="text-[#9CA3AF]">Phát hành</TableHead>
                <TableHead className="text-[#9CA3AF]">Trạng thái</TableHead>
                <TableHead className="text-right text-[#9CA3AF]">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-[#9CA3AF]"
                  >
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovies.map((movie, index) => (
                  <TableRow
                    key={movie.id}
                    className="border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/5 transition-colors"
                  >
                    <TableCell className="text-[#9CA3AF]">
                      {getSTT(index)}
                    </TableCell>
                    {showIdColumn && (
                      <TableCell>
                        <button
                          onClick={() => handleCopyId(movie.id.toString())}
                          className="flex items-center gap-2 text-xs font-mono text-[#8B5CF6] hover:text-[#FFC107]"
                        >
                          {movie.id.toString().slice(0, 8)}...
                          {copiedId === movie.id.toString() ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-[#E5E7EB]">
                      {movie.name}
                    </TableCell>
                    <TableCell className="text-[#E5E7EB]">
                      {movie.type}
                    </TableCell>
                    <TableCell className="text-[#E5E7EB]">
                      {movie.duration}p
                    </TableCell>
                    <TableCell className="text-[#9CA3AF]">
                      {movie.releaseDate
                        ? new Date(movie.releaseDate).toLocaleDateString(
                            'vi-VN',
                          )
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusBadge(movie.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(movie)}
                          className="text-blue-400 hover:bg-blue-400/10"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(movie.id)}
                          className="text-red-400 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <span className="text-sm text-[#9CA3AF]">
                Trang {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-[#8B5CF6]/30 text-[#E5E7EB]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="border-[#8B5CF6]/30 text-[#E5E7EB]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1C253A] border-[#8B5CF6]/30 max-h-[90vh] overflow-y-auto text-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle>
              {editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
            </DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Điền thông tin chi tiết cho bộ phim bên dưới.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tên phim</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-[#0F1629] border-[#8B5CF6]/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-[#0F1629] border-[#8B5CF6]/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link Poster</Label>
                <Input
                  value={formData.PosterURL}
                  onChange={(e) =>
                    setFormData({ ...formData, PosterURL: e.target.value })
                  }
                  className="bg-[#0F1629] border-[#8B5CF6]/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Link Trailer</Label>
                <Input
                  value={formData.TrailerURl}
                  onChange={(e) =>
                    setFormData({ ...formData, TrailerURl: e.target.value })
                  }
                  className="bg-[#0F1629] border-[#8B5CF6]/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thời lượng (phút)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="bg-[#0F1629] border-[#8B5CF6]/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Giới hạn tuổi</Label>
                <Input
                  type="number"
                  value={formData.AgeLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, AgeLimit: e.target.value })
                  }
                  className="bg-[#0F1629] border-[#8B5CF6]/30"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày phát hành</Label>
                <Input
                  type="date"
                  value={formData.releaseDate}
                  onChange={(e) =>
                    setFormData({ ...formData, releaseDate: e.target.value })
                  }
                  className="bg-[#0F1629] border-[#8B5CF6]/30"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-[#0F1629] border-[#8B5CF6]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C253A] border-[#8B5CF6]/30 text-white">
                    <SelectItem value="DangChieu">Đang chiếu</SelectItem>
                    <SelectItem value="SapChieu">Sắp chiếu</SelectItem>
                    <SelectItem value="NgungChieu">Ngừng chiếu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                className="flex-1 text-[#9CA3AF]"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#FFC107] text-[#0F1629] font-bold"
              >
                {editingMovie ? 'Cập nhật' : 'Thêm phim'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
