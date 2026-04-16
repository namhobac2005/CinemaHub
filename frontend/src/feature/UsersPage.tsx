import { FormEvent, useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Check,
  UserCog,
  Wallet,
  Briefcase,
  Mail,
  Phone,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';

// Import các hàm API
import {
  fetchCustomers,
  fetchEmployees,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api/users';

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('KhachHang');
  const [currentPage, setCurrentPage] = useState(1);
  const [showIdColumn, setShowIdColumn] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    points: 0,
    salary: 0,
    role: 'NhanVien',
  });

  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, eData] = await Promise.all([
        fetchCustomers(),
        fetchEmployees(),
      ]);
      setCustomers(cData);
      setEmployees(eData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      points: 0,
      salary: 0,
      role: activeTab === 'NhanVien' ? 'NhanVien' : 'KhachHang',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormData({
      name: item.name,
      email: item.email || '',
      phone: item.phone || '',
      dateOfBirth: item.dateOfBirth || '',
      points: item.points || 0,
      salary: item.salary || 0,
      role: activeTab === 'KhachHang' ? 'KhachHang' : item.role || 'NhanVien',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Xác nhận xóa ${item.name}?`)) return;
    try {
      if (activeTab === 'KhachHang') await deleteCustomer(item.id);
      else await deleteEmployee(item.id);
      await loadData();
    } catch (err) {
      alert('Xóa thất bại!');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === 'KhachHang') {
        if (modalMode === 'create') await createCustomer(formData);
        else if (editingId) await updateCustomer(editingId, formData);
      } else {
        if (modalMode === 'create') await createEmployee(formData);
        else if (editingId) await updateEmployee(editingId, formData);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const dataList = activeTab === 'KhachHang' ? customers : employees;
  const filteredItems = dataList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm),
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  return (
    <div className="p-6 space-y-6 bg-[#0B1020] min-h-screen text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <UserCog className="text-[#8B5CF6]" /> QUẢN TRỊ USER
          </h1>
          <p className="text-slate-400">
            Danh sách Khách hàng & Nhân sự rạp phim
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setCurrentPage(1);
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#161F37] p-3 rounded-2xl border border-white/5 shadow-xl">
          <TabsList className="bg-[#0F1629] p-1.5 h-14 w-fit">
            <TabsTrigger
              value="KhachHang"
              className="px-10 h-11 rounded-xl font-bold transition-all data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white data-[state=active]:shadow-lg shadow-purple-500/50"
            >
              <Users className="w-4 h-4 mr-2" /> KHÁCH HÀNG
            </TabsTrigger>
            <TabsTrigger
              value="NhanVien"
              className="px-10 h-11 rounded-xl font-bold transition-all data-[state=active]:bg-[#10B981] data-[state=active]:text-white data-[state=active]:shadow-lg shadow-emerald-500/50"
            >
              <Briefcase className="w-4 h-4 mr-2" /> NHÂN VIÊN
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Tìm tên, ID..."
                className="pl-10 bg-[#0F1629] border-slate-700 w-full sm:w-80 rounded-xl focus:ring-2 focus:ring-[#8B5CF6]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowIdColumn(!showIdColumn)}
              className="border-slate-700 w-12 h-12 rounded-xl"
            >
              {showIdColumn ? <EyeOff size={20} /> : <Eye size={20} />}
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="bg-[#161F37] border-none shadow-2xl rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-[#0F1629]">
                <TableRow className="border-slate-800 hover:bg-transparent text-slate-400 uppercase text-xs">
                  <TableHead className="w-20 text-center">STT</TableHead>
                  {showIdColumn && <TableHead>Mã ID (UUID)</TableHead>}
                  <TableHead>Thông tin cơ bản</TableHead>
                  <TableHead>
                    {activeTab === 'KhachHang'
                      ? 'Hạng thành viên'
                      : 'Vị trí / Liên hệ'}
                  </TableHead>
                  <TableHead>
                    {activeTab === 'KhachHang'
                      ? 'Điểm tích lũy'
                      : 'Lương (VNĐ)'}
                  </TableHead>
                  <TableHead className="text-right pr-10">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-24 text-slate-500 italic"
                    >
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="border-slate-800 hover:bg-white/5 transition-all"
                    >
                      <TableCell className="text-center text-slate-500 font-mono">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      {showIdColumn && (
                        <TableCell>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.id);
                              setCopiedId(item.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="font-mono text-[10px] text-[#8B5CF6] flex items-center gap-1 hover:text-white bg-[#8B5CF6]/5 px-2 py-1 rounded"
                          >
                            {item.id.slice(0, 13)}...{' '}
                            {copiedId === item.id ? (
                              <Check size={12} className="text-green-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="font-bold text-slate-100 text-base">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.email || 'No email'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeTab === 'KhachHang' ? (
                          <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20">
                            {item.membershipTier || 'MOI'}
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge
                              className={
                                item.role === 'QuanLy'
                                  ? 'bg-orange-500/10 text-orange-500'
                                  : 'bg-blue-500/10 text-blue-500'
                              }
                            >
                              {item.role === 'QuanLy' ? 'Quản lý' : 'Nhân viên'}
                            </Badge>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone size={10} /> {item.phone || 'N/A'}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-lg font-black ${activeTab === 'KhachHang' ? 'text-yellow-500' : 'text-emerald-500'}`}
                        >
                          {activeTab === 'KhachHang'
                            ? item.points.toLocaleString()
                            : `${item.salary.toLocaleString()}₫`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="text-blue-400 hover:bg-blue-400/10"
                          >
                            <Pencil size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            className="text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <p className="text-slate-500 text-sm">
                Trang {currentPage} / {totalPages}
              </p>
              <div className="flex gap-3">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  variant="outline"
                  className="border-slate-700 w-12 h-12 rounded-xl text-slate-300"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  variant="outline"
                  className="border-slate-700 w-12 h-12 rounded-xl text-slate-300"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FORM MODAL - "ĐỤC" & RÕ RÀNG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1C253A] border-slate-700 text-white max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#FFC107] uppercase">
              {modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}{' '}
              {activeTab === 'KhachHang' ? 'Khách' : 'Nhân sự'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Điền thông tin vào các ô bên dưới. Các ô có dấu * là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Họ và tên *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-[#0F1629] border-slate-700 h-12 rounded-xl text-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-300">Số điện thoại *</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-[#0F1629] border-slate-700 h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-[#0F1629] border-slate-700 h-12 rounded-xl"
                />
              </div>
            </div>

            {activeTab === 'KhachHang' ? (
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-slate-300">Ngày sinh</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="bg-[#0F1629] border-slate-700 h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Điểm hiện có</Label>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        points: Number(e.target.value),
                      })
                    }
                    className="bg-[#0F1629] border-slate-700 h-12 rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-slate-300">Lương cơ bản (₫)</Label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: Number(e.target.value),
                      })
                    }
                    className="bg-[#0F1629] border-slate-700 h-12 rounded-xl font-bold text-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Vị trí công tác</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger className="bg-[#0F1629] border-slate-700 h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C253A] border-slate-700 text-white">
                      <SelectItem value="NhanVien">👷 Nhân viên</SelectItem>
                      <SelectItem value="QuanLy">👨‍💼 Quản lý</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 h-12"
              >
                HỦY
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={`font-black px-12 h-12 rounded-xl shadow-lg transition-transform active:scale-95 ${activeTab === 'KhachHang' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]' : 'bg-[#10B981] hover:bg-[#059669]'}`}
              >
                {saving ? 'ĐANG LƯU...' : 'XÁC NHẬN LƯU'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
