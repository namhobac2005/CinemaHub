import { useState, useEffect } from "react";
import { Package, Plus, Edit, Trash2, ShoppingBag, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2 } from "lucide-react";
import { Textarea } from "../components/ui/textarea";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../api/products";



type ProductCategory = "Thức Ăn" | "Nước uống" | "Combo";

interface BaseProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  supplier: string;
  category: ProductCategory;
}

interface FoodProduct extends BaseProduct {
  category: "Thức Ăn";
  weight: string;
  flavor: string;
}

interface DrinkProduct extends BaseProduct {
  category: "Nước uống";
  volume: string;
  hasGas: boolean;
}

interface ComboProduct extends BaseProduct {
  category: "Combo";
  description: string;
}

type Product = FoodProduct | DrinkProduct | ComboProduct;
const formatID = (id: string, prefix: string) => {
  return `${prefix}${id.padStart(4, '0')}`;
};
export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState<ProductCategory | "all">("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    supplier: "",
    category: "Thức Ăn" as ProductCategory,
    weight: "",
    flavor: "",
    volume: "",
    hasGas: false,
    description: "",
  });

  // 📦 Danh sách sản phẩm
  const [products, setProducts] = useState<Product[]>([]);

  // 🗂 Map từ DB sang UI
  const DB_TO_UI: Record<string, ProductCategory> = {
    ThucAn: "Thức Ăn",
    NuocUong: "Nước uống",
    Combo: "Combo",
  };

  // 🔄 Lấy sản phẩm từ server + chuyển đổi đúng kiểu Product
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      if (!Array.isArray(data)) {
        console.error("❌ API không trả về dạng array:", data);
        return;
      }

      const mapped: Product[] = data.map((p: any) => {
        const category = p.category as ProductCategory;

        const base = {
          id: p.id,
          name: p.name || "Không tên",
          price: Number(p.price),
          stock: Number(p.stock),
          supplier: p.supplier || "",
          category,
        };

        if (category === "Thức Ăn") {
          return {
            ...base,
            weight: p.weight ?? "",
            flavor: p.flavor ?? "",
          } as FoodProduct;
        }

        if (category === "Nước uống") {
          return {
            ...base,
            volume: p.volume ?? "",
            hasGas: !!p.hasGas,
          } as DrinkProduct;
        }

        return {
          ...base,
          description: p.description ?? "",
        } as ComboProduct;
      });

      // 🔥 Sắp xếp ID tăng dần
      mapped.sort((a, b) => a.id - b.id);

      console.log("📌 Products loaded:", mapped);
      setProducts(mapped);

    } catch (error) {
      console.error("❌ Failed to load products", error);
    }
  };



  // 🚀 Tự fetch dữ liệu khi mở trang
  useEffect(() => {
    fetchProducts();
  }, []);


  const getCategoryBadge = (category: ProductCategory) => {
    const base = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap border";

    switch (category) {
      case "Thức Ăn":
        return (
          <span className={`${base} bg-[#FFC107]/20 text-[#FFC107] border-[#FFC107]/30`}>
            🍿 Thức Ăn
          </span>
        );
      case "Nước uống":
        return (
          <span className={`${base} bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30`}>
            🥤 Nước uống
          </span>
        );
      case "Combo":
        return (
          <span className={`${base} bg-[#8B5CF6]/20 text-[#8B5CF6] border-[#8B5CF6]/30`}>
            🎁 Combo
          </span>
        );
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        supplier: product.supplier || "",
        category: product.category,
        weight: product.category === "Thức Ăn" ? String(product.weight || "") : "",
        flavor: product.category === "Thức Ăn" ? product.flavor || "" : "",
        volume: product.category === "Nước uống" ? String(product.volume || "") : "",
        hasGas: product.category === "Nước uống" ? product.hasGas : false,
        description: product.category === "Combo" ? product.description || "" : "",
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: "",
        stock: "",
        supplier: "",
        category: "Thức Ăn",
        weight: "",
        flavor: "",
        volume: "",
        hasGas: false,
        description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim()) return alert("Vui lòng nhập tên sản phẩm!");
    if (!formData.price) return alert("Vui lòng nhập giá!");

    setIsLoading(true);

    try {
      const dataToSend: any = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock) || 0,
        supplier: formData.supplier,
        category: formData.category,
      };

      if (formData.category === "Thức Ăn") {
        dataToSend.weight = formData.weight;
        dataToSend.flavor = formData.flavor;
      } else if (formData.category === "Nước uống") {
        dataToSend.volume = formData.volume;
        dataToSend.hasGas = formData.hasGas;
      } else {
        dataToSend.description = formData.description;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, dataToSend);
      } else {
        await addProduct(dataToSend);
      }

      await fetchProducts();
      handleCloseDialog();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Có lỗi xảy ra khi lưu sản phẩm!";
      alert(msg);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await deleteProduct(id);
        await fetchProducts();
        alert("Xóa sản phẩm thành công!");
      } catch (error) {
        alert("Không thể xóa sản phẩm!");
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    lowStock: products.filter((p) => p.stock < 50).length,
    categories: {
      food: products.filter((p) => p.category === "Thức Ăn").length,
      drink: products.filter((p) => p.category === "Nước uống").length,
      combo: products.filter((p) => p.category === "Combo").length,
    },
  };

  const renderCategorySpecificInfo = (product: Product) => {
    if (product.category === "Thức Ăn") {
      return (
        <div className="text-sm space-y-1">
          <div className="text-slate-400">
            Trọng lượng: <span className="text-slate-200">{product.weight}</span>
          </div>
          <div className="text-slate-400">
            Hương vị: <span className="text-slate-200">{product.flavor}</span>
          </div>
        </div>
      );
    } else if (product.category === "Nước uống") {
      return (
        <div className="text-sm space-y-1">
          <div className="text-slate-400">
            Thể tích: <span className="text-slate-200">{product.volume}</span>
          </div>
          <div className="text-slate-400">
            Có gas: <span className={product.hasGas ? "text-emerald-500" : "text-red-500"}>
              {product.hasGas ? "Có" : "Không"}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-sm text-slate-400">
          {product.description}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1629] text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: "#E5E7EB" }}>
            Quản lý sản phẩm
          </h1>
          <p style={{ color: "#9CA3AF" }}>
            Quản lý và theo dõi các sản phẩm khác
          </p>
        </div>
      </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629] shadow-lg font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="border-[#8B5CF6]/20 bg-[#1C253A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#8B5CF6]/20">
                <Package className="w-6 h-6 text-[#8B5CF6]" />
              </div>
            </div>
            <div>
              <p className="text-sm mb-1 text-slate-400">
                Tổng sản phẩm
              </p>
              <p className="text-2xl text-[#8B5CF6]">
                {stats.total}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#8B5CF6]/20 bg-[#1C253A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#FFC107]/20">
                <ShoppingBag className="w-6 h-6 text-[#FFC107]" />
              </div>
            </div>
            <div>
              <p className="text-sm mb-1 text-slate-400">
                Giá trị kho
              </p>
              <p className="text-2xl text-[#FFC107] font">
                {(stats.totalValue / 1000000).toFixed(1)}tr
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#8B5CF6]/20 bg-[#1C253A]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#EF4444]/20">
                <Package className="w-6 h-6 text-[#EF4444]" />
              </div>
            </div>
            <div>
              <p className="text-sm mb-1 text-slate-400">
                Sắp hết hàng
              </p>
              <p className="text-2xl text-[#EF4444] font">
                {stats.lowStock}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#8B5CF6]/20 bg-[#1C253A]">
          <CardContent className="p-6">
            <div>
              <p className="text-sm mb-4 text-slate-400 whitespace-nowrap">
                Phân loại:
              </p>

              <div className="space-y-2 text-sm">
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-200 inline-flex items-center gap-1 whitespace-nowrap">
                    🍿 Thức ăn
                  </span>
                  <span className="text-[#FFC107] font-bold">{stats.categories.food}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-200 inline-flex items-center gap-1 whitespace-nowrap">
                    🥤 Nước uống
                  </span>
                  <span className="text-[#3B82F6] font-bold">{stats.categories.drink}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-200 inline-flex items-center gap-1 whitespace-nowrap">
                    🎁 Combo
                  </span>
                  <span className="text-[#8B5CF6] font-bold">{stats.categories.combo}</span>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-[#8B5CF6]/20 bg-[#1C253A]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <Input
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10 bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]"
              />
            </div>
            <div className="w-48">
              <Select
                value={filterCategory}
                onValueChange={(value: ProductCategory | "all") => setFilterCategory(value)}
              >
                <SelectTrigger className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]">
                  <SelectValue placeholder="Lọc theo phân loại" />
                </SelectTrigger>
                <SelectContent className="bg-[#1C253A] border-[#8B5CF6]/30">
                  <SelectItem value="all" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                    Tất cả
                  </SelectItem>
                  <SelectItem value="Thức Ăn" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                    🍿 Thức Ăn
                  </SelectItem>
                  <SelectItem value="Nước uống" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                    🥤 Nước uống
                  </SelectItem>
                  <SelectItem value="Combo" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                    🎁 Combo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-[#8B5CF6]/20 bg-[#1C253A]">
        <CardHeader>
          <CardTitle className="text-slate-200">Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-[#8B5CF6]/20 hover:bg-transparent">
                <TableHead className="text-slate-400">ID</TableHead>
                <TableHead className="text-slate-400">Tên sản phẩm</TableHead>
                <TableHead className="text-slate-400">Phân loại</TableHead>
                <TableHead className="text-slate-400">Đơn giá</TableHead>
                <TableHead className="text-slate-400">Tồn kho</TableHead>
                <TableHead className="text-slate-400">Nhà phân phối</TableHead>
                <TableHead className="text-slate-400">Thông tin bổ sung</TableHead>
                <TableHead className="text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-[#8B5CF6]/20">
                  <TableCell className="text-[#8B5CF6] font-medium">{formatID(product.id,'SP')}</TableCell>
                  <TableCell className="text-slate-200 font-medium">{product.name}</TableCell>
                  <TableCell>{getCategoryBadge(product.category)}</TableCell>
                  <TableCell className="text-[#FFC107]">
                    {product.price.toLocaleString("vi-VN")}₫
                  </TableCell>
                  <TableCell
                    className={product.stock < 50 ? "text-[#EF4444] font-bold" : "text-[#10B981] font-bold"}
                  >
                    {product.stock}
                  </TableCell>
                  <TableCell className="text-slate-400">{product.supplier}</TableCell>
                  <TableCell>{renderCategorySpecificInfo(product)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(product)}
                        className="hover:bg-[#8B5CF6]/20 text-[#8B5CF6]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="hover:bg-[#EF4444]/20 text-[#EF4444]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1C253A] border-[#8B5CF6]/30 w-[520px] max-h-[90vh] overflow-y-auto text-slate-200 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-slate-200">
                  Tên sản phẩm
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107] mt-2"
                  placeholder="Nhập tên sản phẩm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-slate-200">
                    Đơn giá (₫)
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
                    className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107] mt-2"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="stock" className="text-slate-200">
                    Tồn kho
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e: any) => setFormData({ ...formData, stock: e.target.value })}
                    className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107] mt-2"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier" className="text-slate-200">
                  Nhà phân phối
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e: any) => setFormData({ ...formData, supplier: e.target.value })}
                  className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107] mt-2"
                  placeholder="Nhập tên nhà phân phối"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-slate-200">
                  Phân loại
                </Label>
                <div className="mt-2">
                  <Select
                    value={formData.category}
                    onValueChange={(value: ProductCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger className="bg-[#0F1629] border-[#8B5CF6]/30 focus:border-[#FFC107]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C253A] border-[#8B5CF6]/30">
                      <SelectItem value="Thức Ăn" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                        🍿 Thức Ăn
                      </SelectItem>
                      <SelectItem value="Nước uống" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                        🥤 Nước uống
                      </SelectItem>
                      <SelectItem value="Combo" className="text-slate-200 focus:bg-[#8B5CF6]/20">
                        🎁 Combo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Category Specific Fields */}
            <div className="p-3 rounded-lg border border-[#8B5CF6] bg-[#0F1629]">
              <h4 className="mb-3 text-[#FFC107] font-semibold text-sm">
                Chi tiết ({formData.category})
              </h4>

              {formData.category === "Thức Ăn" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-200 text-sm">Trọng lượng</Label>
                    <Input
                      value={formData.weight}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          weight: e.target.value,
                        }))
                      }
                      className="mt-1 bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107]"
                      placeholder="200g"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-200 text-sm">Hương vị</Label>
                    <Input
                      value={formData.flavor}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          flavor: e.target.value,
                        }))
                      }
                      className="mt-1 bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107]"
                      placeholder="Phô mai"
                    />
                  </div>
                </div>
              )}

              {formData.category === "Nước uống" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-200 text-sm">Thể tích</Label>
                    <Input
                      value={formData.volume}
                      onChange={(
                        e: React.ChangeEvent<HTMLInputElement>
                      ) =>
                        setFormData((prev) => ({
                          ...prev,
                          volume: e.target.value,
                        }))
                      }
                      className="mt-1 bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107]"
                      placeholder="500ml"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-200 text-sm">Có gas?</Label>
                    <div className="mt-1">
                      <Select
                        value={formData.hasGas ? "true" : "false"}
                        onValueChange={(value: string) =>
                          setFormData((prev) => ({
                            ...prev,
                            hasGas: value === "true",
                          }))
                        }
                      >
                        <SelectTrigger className="bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Có</SelectItem>
                          <SelectItem value="false">Không</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {formData.category === "Combo" && (
                <div>
                  <Label className="text-slate-200 text-sm">Mô tả</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 bg-[#1C253A] border-[#8B5CF6]/30 focus:border-[#FFC107] min-h-[80px]"
                    placeholder="2 Bắp + 2 Nước + 2 Vé"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isLoading}
              className="border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/20 text-slate-200"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={isLoading}
              className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#0F1629] shadow-lg font-bold"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProduct ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}