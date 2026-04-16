import { useState, useEffect } from 'react'; // THÊM
import axios from 'axios'; // THÊM
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Ticket,
  TrendingUp,
  PercentCircle,
  DollarSign,
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
  DialogTrigger,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface Voucher {
  ID: number;
  MaGiam: string;
  Loai: 'PhanTram' | 'SoTien';
  MucGiam: number;
  SoLuong: number;
}
const formatID = (id: number, prefix: string) => {
  return `${prefix}${id.toString().padStart(4, '0')}`;
};
export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]); 
  const [loading, setLoading] = useState(false); // Thêm loading state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    MaGiam: '',
    Loai: 'PhanTram' as 'PhanTram' | 'SoTien',
    MucGiam: '',
    SoLuong: '',
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Voucher[]>(
        'http://localhost:5000/voucher/all'
      );
      setVouchers(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách voucher:', error);
      alert('Lỗi khi tải dữ liệu! Bạn đã đăng nhập ở trang Login chưa?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      MaGiam: formData.MaGiam,
      Loai: formData.Loai,
      MucGiam: Number(formData.MucGiam),
      SoLuong: Number(formData.SoLuong),
    };

    if (editingVoucher) {
      try {
        await axios.put(
          `http://localhost:5000/voucher/update/${editingVoucher.ID}`,
          payload
        );
        fetchVouchers(); 
        resetForm(); 
      } catch (error) {
        console.error('Lỗi khi cập nhật voucher:', error);
        alert('Lỗi khi cập nhật voucher! Vui lòng kiểm tra lại dữ liệu.');
      }
    } else {
      try {
        await axios.post('http://localhost:5000/voucher/add', payload);
        fetchVouchers(); 
        resetForm();
      } catch (error) {
        console.error('Lỗi khi thêm voucher:', error);
        alert('Lỗi khi thêm voucher! Mã giảm giá có thể đã tồn tại.');
      }
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      MaGiam: voucher.MaGiam,
      Loai: voucher.Loai,
      MucGiam: voucher.MucGiam.toString(),
      SoLuong: voucher.SoLuong.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      try {
        await axios.delete(`http://localhost:5000/voucher/delete/${id}`);
        fetchVouchers(); 
      } catch (error: any) {
        console.error('Lỗi khi xóa voucher:', error);
        if (error.response && error.response.status === 400) {
          alert(error.response.data.message); 
        } else {
          alert('Lỗi khi xóa voucher! Vui lòng thử lại.');
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      MaGiam: '',
      Loai: 'PhanTram',
      MucGiam: '',
      SoLuong: '',
    });
    setEditingVoucher(null);
    setIsDialogOpen(false);
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.Loai === 'PhanTram') {
      return `${voucher.MucGiam}%`;
    } else {
      return `${voucher.MucGiam.toLocaleString('vi-VN')}₫`;
    }
  };

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.MaGiam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ID.toString().includes(searchTerm)
  );

  const stats = [
    {
      title: 'Tổng voucher',
      value: vouchers.length.toString(),
      icon: Ticket,
      color: '#FFC107',
    },
    {
      title: 'Tổng số lượng',
      value: vouchers
        .reduce((sum, v) => sum + v.SoLuong, 0) 
        .toLocaleString('vi-VN'),
      icon: TrendingUp,
      color: '#10B981',
    },
    {
      title: 'Giảm theo %',
      value: vouchers.filter((v) => v.Loai === 'PhanTram').length.toString(),
      icon: PercentCircle,
      color: '#8B5CF6',
    },
    {
      title: 'Giảm cố định',
      value: vouchers.filter((v) => v.Loai === 'SoTien').length.toString(),
      icon: DollarSign,
      color: '#F59E0B',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#E5E7EB' }}>
            Phát hành voucher
          </h1>
          <p style={{ color: '#9CA3AF' }}>
            Quản lý mã giảm giá và voucher cho khách hàng
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629] shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm voucher mới
            </Button>
          </DialogTrigger>
          
          <DialogContent className="bg-[#1C253A] border-[#8B5CF6]/30">
            <DialogHeader>
              <DialogTitle style={{ color: '#E5E7EB' }}>
                {editingVoucher ? 'Chỉnh sửa voucher' : 'Thêm voucher mới'}
              </DialogTitle>
              <DialogDescription style={{ color: '#9CA3AF' }}>
                {editingVoucher
                  ? 'Cập nhật thông tin voucher'
                  : 'Tạo mã giảm giá mới cho khách hàng'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="MaGiam">Mã voucher</Label>
                <Input
                  id="MaGiam"
                  value={formData.MaGiam} 
                  onChange={(e) =>
                    setFormData({ ...formData, MaGiam: e.target.value.toUpperCase() }) 
                  }
                  placeholder="VD: HEVUI"
                  required
                  className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Loai">Loại giảm giá</Label>
                <Select
                  value={formData.Loai} 
                  onValueChange={(value: 'PhanTram' | 'SoTien') =>
                    setFormData({ ...formData, Loai: value, MucGiam: '' }) 
                  }
                >
                  <SelectTrigger className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C253A] border-[#8B5CF6]/30">
                    <SelectItem
                      value="PhanTram" 
                      className="text-[#E5E7EB] focus:bg-[#8B5CF6]/20"
                    >
                      Giảm theo phần trăm (%)
                    </SelectItem>
                    <SelectItem
                      value="SoTien" 
                      className="text-[#E5E7EB] focus:bg-[#8B5CF6]/20"
                    >
                      Giảm cố định (VNĐ)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="MucGiam">
                    {formData.Loai === 'PhanTram' 
                      ? 'Mức giảm (%)'
                      : 'Số tiền giảm (VNĐ)'}
                  </Label>
                  <Input
                    id="MucGiam" 
                    type="number"
                    min="1"
                    max={formData.Loai === 'PhanTram' ? '100' : undefined} 
                    value={formData.MucGiam} 
                    onChange={(e) =>
                      setFormData({ ...formData, MucGiam: e.target.value }) 
                    }
                    placeholder={formData.Loai === 'PhanTram' ? '20' : '50000'} 
                    required
                    className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="SoLuong">Số lượng</Label>
                  <Input
                    id="SoLuong" 
                    type="number"
                    min="0"
                    value={formData.SoLuong} 
                    onChange={(e) =>
                      setFormData({ ...formData, SoLuong: e.target.value }) 
                    }
                    placeholder="100"
                    required
                    className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629]"
                >
                  {editingVoucher ? 'Cập nhật' : 'Thêm voucher'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-[#8B5CF6]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm mb-1" style={{ color: '#9CA3AF' }}>
                    {stat.title}
                  </p>
                  <p className="text-2xl" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Vouchers Table */}
      <Card className="border-[#8B5CF6]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle style={{ color: '#E5E7EB' }}>
              Danh sách voucher
            </CardTitle>
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: '#9CA3AF' }}
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm voucher..."
                className="pl-10 bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                <TableHead style={{ color: '#9CA3AF' }}>ID</TableHead>
                <TableHead style={{ color: '#9CA3AF' }}>Mã voucher</TableHead>
                <TableHead style={{ color: '#9CA3AF' }}>Loại</TableHead>
                <TableHead style={{ color: '#9CA3AF' }}>Mức giảm</TableHead>
                <TableHead style={{ color: '#9CA3AF' }}>Số lượng còn lại</TableHead>
                <TableHead className="text-right" style={{ color: '#9CA3AF' }}>
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8" style={{ color: '#9CA3AF' }}>
                     Đang tải dữ liệu...
                   </TableCell>
                 </TableRow>
              )}
              {!loading && filteredVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8" style={{ color: '#9CA3AF' }}>
                    Không tìm thấy voucher nào
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredVouchers.map((voucher) => (
                <TableRow key={voucher.ID} className="border-[#8B5CF6]/20">
                  <TableCell style={{ color: '#8B5CF6' }}>
                    {formatID(voucher.ID,'VC')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ticket
                        className="w-4 h-4"
                        style={{ color: '#FFC107' }}
                      />
                      <span style={{ color: '#E5E7EB' }}>{voucher.MaGiam}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {voucher.Loai === 'PhanTram' ? (
                      <Badge className="bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30">
                        <PercentCircle className="w-3 h-3 mr-1" />
                        Phần trăm
                      </Badge>
                    ) : (
                      <Badge className="bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Cố định
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell style={{ color: '#FFC107' }}>
                    {formatDiscount(voucher)}
                  </TableCell>
                  <TableCell style={{ color: '#E5E7EB' }}>
                    {voucher.SoLuong}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(voucher)} 
                        className="p-2 rounded-lg transition-all hover:bg-[#8B5CF6]/20"
                        style={{ color: '#8B5CF6' }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(voucher.ID)} 
                        className="p-2 rounded-lg transition-all hover:bg-red-500/20"
                        style={{ color: '#EF4444' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}