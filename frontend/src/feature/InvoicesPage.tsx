import { useEffect, useState } from 'react';
import {
  Receipt,
  Eye,
  Search,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'; // Thêm icon điều hướng

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

import { getInvoices, getInvoiceDetails } from '../api/invoices';

// 💳 Mã trạng thái giống DB
type PaymentStatusCode = 'DaThanhToan' | 'ChuaThanhToan' | 'DaHuy';

interface InvoiceItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'ticket' | 'product';
  details?: string | null;
}

// 2. Interface cho Invoice đang xem chi tiết
interface ViewingInvoice {
  id: number | string;
  createdAt: string;
  customerName: string | null;
  employeeName: string | null;
  paymentMethod: string | null;
  paymentStatus: PaymentStatusCode;

  // Các trường về tiền & Voucher
  totalAmount: number; // Tổng tiền cuối cùng (Backend trả về)
  subTotal: number; // Tổng tiền tạm (Frontend tự tính từ list items)
  voucherCode?: string | null;
  voucherType?: string | null;
  voucherValue?: number;

  items: InvoiceItem[];
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewingInvoice, setViewingInvoice] = useState<ViewingInvoice | null>(
    null,
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // --- PHẦN PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mỗi trang 10 dòng

  // 🔹 Load danh sách hóa đơn từ backend
  useEffect(() => {
    getInvoices()
      .then((data: any[]) => {
        const mapped = data.map((row) => {
          return {
            id: row.HoaDonID,
            createdAt: row.ThoiGianTao,
            customerName: row.KhachHang ?? null,
            employeeName: row.NhanVien ?? null,
            paymentMethod: row.PhuongThucThanhToan ?? null,
            paymentStatus: row.TrangThaiThanhToan as PaymentStatusCode,
            totalAmount: Number(row.TongTienThucTe || 0),
            items: [],
          };
        });
        setInvoices(mapped);
      })
      .catch(() => setError('⚠ Không tải được danh sách hóa đơn.'))
      .finally(() => setIsLoading(false));
  }, []);

  // 🔥 Badge trạng thái theo màu
  const renderStatusBadge = (status: PaymentStatusCode) => {
    switch (status) {
      case 'DaThanhToan':
        return (
          <Badge className="bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30">
            Đã thanh toán
          </Badge>
        );
      case 'ChuaThanhToan':
        return (
          <Badge className="bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30">
            Chưa thanh toán
          </Badge>
        );
      case 'DaHuy':
        return (
          <Badge className="bg-[#9CA3AF]/20 text-[#9CA3AF] border-[#9CA3AF]/30">
            Đã hủy
          </Badge>
        );
    }
  };

  // 💰 Tổng doanh thu (chỉ hóa đơn đã thanh toán)
  const totalRevenue = invoices
    .filter((inv) => inv.paymentStatus === 'DaThanhToan')
    .reduce((s, inv) => s + inv.totalAmount, 0);

  // 🔎 Tìm kiếm và Phân trang kết hợp
  const filteredInvoices = invoices.filter((invoice) => {
    const keyword = searchTerm.toLowerCase();
    return (
      invoice.id.toString().toLowerCase().includes(keyword) ||
      (invoice.customerName ?? '').toLowerCase().includes(keyword)
    );
  });

  // Tính toán dữ liệu hiển thị theo trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const handleViewDetails = (invoice: any) => {
    setIsViewDialogOpen(true);
    setViewingInvoice(null);

    getInvoiceDetails(invoice.id)
      .then((data: any) => {
        const items: InvoiceItem[] = (data.ChiTiet ?? []).map((item: any) => ({
          id: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          totalPrice: Number(item.total),
          type: item.type,
          details: item.details,
        }));

        const calculatedSubTotal = items.reduce(
          (sum, item) => sum + item.totalPrice,
          0,
        );

        setViewingInvoice({
          id: data.HoaDonID,
          createdAt: data.ThoiGianTao,
          customerName: data.KhachHang ?? null,
          employeeName: data.NhanVien ?? null,
          paymentMethod: data.PhuongThucThanhToan ?? null,
          paymentStatus: data.TrangThaiThanhToan as PaymentStatusCode,
          totalAmount: Number(data.TongTien ?? 0),
          subTotal: calculatedSubTotal,
          voucherCode: data.VoucherCode ?? null,
          voucherType: data.VoucherType ?? null,
          voucherValue: Number(data.VoucherValue ?? 0),
          items,
        });
      })
      .catch((err) => {
        console.error(err);
        setError('⚠ Không tải được chi tiết hóa đơn.');
        setIsViewDialogOpen(false);
      });
  };

  const closeDialog = () => {
    setIsViewDialogOpen(false);
    setViewingInvoice(null);
  };

  if (isLoading)
    return (
      <div className="p-6 text-gray-200">⏳ Đang tải danh sách hóa đơn...</div>
    );
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#E5E7EB' }}>
            Quản lý hóa đơn
          </h1>
          <p style={{ color: '#9CA3AF' }}>
            Quản lý và theo dõi hóa đơn bán hàng
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-[#8B5CF6]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#8B5CF620' }}
              >
                <Receipt className="w-6 h-6" style={{ color: '#8B5CF6' }} />
              </div>
            </div>
            <p className="text-sm text-gray-400">Tổng hóa đơn</p>
            <p className="text-2xl text-[#8B5CF6]">{invoices.length}</p>
          </CardContent>
        </Card>

        <Card className="border-[#8B5CF6]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#FFC10720' }}
              >
                <DollarSign className="w-6 h-6" style={{ color: '#FFC107' }} />
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Tổng doanh thu (đã thanh toán)
            </p>
            <p className="text-2xl text-[#FFC107]">
              {(totalRevenue / 1_000_000).toFixed(1)}tr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-[#8B5CF6]/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
              }}
              placeholder="Tìm theo mã HĐ hoặc tên khách hàng..."
              className="pl-10 bg-[#0F1629] border-[#8B5CF6]/30 text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[#8B5CF6]/20">
        <CardHeader>
          <CardTitle className="text-gray-200">Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow className="border-[#8B5CF6]/20">
                <TableHead className="text-gray-400">Mã HĐ</TableHead>
                <TableHead className="text-gray-400">Thời gian</TableHead>
                <TableHead className="text-gray-400">Khách hàng</TableHead>
                <TableHead className="text-gray-400">Nhân viên</TableHead>
                <TableHead className="text-gray-400">Trạng thái</TableHead>
                <TableHead className="text-gray-400">Tổng tiền</TableHead>
                <TableHead className="text-gray-400 text-center">Xem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-[#8B5CF6]/20">
                  <TableCell className="text-[#8B5CF6] font-mono">
                    {/* --- ẨN ID: Chỉ hiện 8 ký tự đầu --- */}#
                    {invoice.id.toString().substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {invoice.createdAt}
                  </TableCell>
                  <TableCell className="text-gray-200">
                    {invoice.customerName ?? '—'}
                  </TableCell>
                  <TableCell className="text-gray-200">
                    {invoice.employeeName ?? '—'}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(invoice.paymentStatus)}
                  </TableCell>
                  <TableCell className="text-[#FFC107]">
                    {invoice.totalAmount.toLocaleString('vi-VN')}₫
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hover:bg-[#3B82F6]/20"
                      onClick={() => handleViewDetails(invoice)}
                    >
                      <Eye className="w-4 h-4 text-[#3B82F6]" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* --- THANH PHÂN TRANG (PAGINATION) --- */}
          <div className="flex items-center justify-between px-2 py-4 border-t border-[#8B5CF6]/10">
            <p className="text-sm text-gray-400">
              Hiển thị {indexOfFirstItem + 1} -{' '}
              {Math.min(indexOfLastItem, filteredInvoices.length)} trong số{' '}
              {filteredInvoices.length} hóa đơn
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[#8B5CF6]/30 text-gray-300 hover:bg-[#8B5CF6]/10"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Trước
              </Button>
              <div className="flex items-center px-4 text-sm text-gray-200">
                Trang {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-[#8B5CF6]/30 text-gray-300 hover:bg-[#8B5CF6]/10"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Tiếp <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog chi tiết */}
      <Dialog open={isViewDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="bg-[#1C253A] border-[#8B5CF6]/30 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-gray-200">
              {/* --- HIỆN ID ĐẦY ĐỦ KHI MỞ DIALOG --- */}
              {viewingInvoice
                ? `Chi tiết hóa đơn: ${viewingInvoice.id}`
                : 'Đang tải chi tiết hóa đơn...'}
            </DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#0F1629]">
                  <p className="text-sm text-gray-400 mb-1">Thời gian</p>
                  <p className="text-gray-200">{viewingInvoice.createdAt}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0F1629]">
                  <p className="text-sm text-gray-400 mb-1">Trạng thái</p>
                  {renderStatusBadge(viewingInvoice.paymentStatus)}
                </div>
                <div className="p-4 rounded-lg bg-[#0F1629]">
                  <p className="text-sm text-gray-400 mb-1">Khách hàng</p>
                  <p className="text-gray-200">
                    {viewingInvoice.customerName ?? '—'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0F1629]">
                  <p className="text-sm text-gray-400 mb-1">Nhân viên</p>
                  <p className="text-gray-200">
                    {viewingInvoice.employeeName ?? '—'}
                  </p>
                </div>
              </div>
              <h4 className="text-[#FFC107] mb-3">Chi tiết sản phẩm</h4>
              <div className="rounded-lg border border-[#8B5CF6]/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#8B5CF6]/20">
                      <TableHead className="text-gray-400">Tên SP</TableHead>
                      <TableHead className="text-gray-400">SL</TableHead>
                      <TableHead className="text-gray-400">Giá</TableHead>
                      <TableHead className="text-gray-400">
                        Thành tiền
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingInvoice.items.map((item, index) => (
                      <TableRow key={index} className="border-[#8B5CF6]/20">
                        <TableCell className="text-gray-200">
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-gray-200">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {item.unitPrice.toLocaleString('vi-VN')}₫
                        </TableCell>
                        <TableCell className="text-[#FFC107]">
                          {item.totalPrice.toLocaleString('vi-VN')}₫
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-20">
                <div className="w-full max-w-md p-5 rounded-xl border-2 shadow-xl shadow-[#8B5CF6]/10 space-y-3">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-sm">Tạm tính:</span>
                    <span className="font-medium text-gray-300">
                      {viewingInvoice.subTotal?.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  {viewingInvoice.subTotal - viewingInvoice.totalAmount > 0 && (
                    <div className="flex justify-between items-center text-green-400">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Giảm giá:</span>
                          {viewingInvoice.voucherCode && (
                            <span className="text-[10px] font-bold border border-green-500/40 bg-green-500/10 px-1.5 py-0.5 rounded text-green-300 uppercase">
                              {viewingInvoice.voucherCode}
                            </span>
                          )}
                        </div>
                        {viewingInvoice.voucherType === 'PhanTram' && (
                          <span className="text-[10px] opacity-70">
                            (Giảm {viewingInvoice.voucherValue}%)
                          </span>
                        )}
                      </div>
                      <span className="font-bold">
                        -
                        {(
                          viewingInvoice.subTotal - viewingInvoice.totalAmount
                        ).toLocaleString('vi-VN')}
                        ₫
                      </span>
                    </div>
                  )}
                  <div className="h-[1px] bg-[#8B5CF6]/40 my-1"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-base font-bold text-gray-200">
                      Tổng thanh toán:
                    </span>
                    <span className="text-xl font-bold text-[#FFC107]">
                      {viewingInvoice.totalAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={closeDialog}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
