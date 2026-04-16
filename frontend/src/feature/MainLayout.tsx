import { ReactNode, useState } from "react";
import { Film, LayoutDashboard, Clapperboard, ShoppingBag, Receipt, Calendar, LogOut, Menu, X, Ticket, Users } from "lucide-react";
import { Button } from "../components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function MainLayout({ children, currentPage, onNavigate, onLogout }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "movies", label: "Quản lí phim", icon: Clapperboard },
    { id: "products", label: "Sản phẩm", icon: ShoppingBag },
    { id: "invoices", label: "Hóa đơn", icon: Receipt },
    { id: "vouchers", label: "Phát hành voucher", icon: Ticket },
    { id: "showtimes", label: "Suất chiếu", icon: Calendar },
    { id: "users", label: "Quản lý người dùng", icon: Users },
  ];

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: '#0F1629' }}>
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 border-r flex flex-col`}
        style={{ backgroundColor: '#1C253A', borderColor: 'rgba(139, 92, 246, 0.2)' }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Film className="w-8 h-8" style={{ color: '#8B5CF6' }} />
              <div className="absolute inset-0 blur-lg opacity-50" style={{ backgroundColor: '#8B5CF6' }} />
            </div>
            {isSidebarOpen && (
              <div>
                <h2 className="text-lg" style={{ color: '#FFC107' }}>CinemaHub</h2>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Quản lý rạp chiếu phim</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "shadow-lg"
                    : "hover:bg-[#0F1629]/50"
                }`}
                style={{
                  backgroundColor: isActive ? '#8B5CF6' : 'transparent',
                  color: isActive ? '#E5E7EB' : '#9CA3AF',
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? '#FFC107' : '#9CA3AF' }} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }} />

        {/* Logout */}
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-400"
            style={{ color: '#9CA3AF' }}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* Footer Spacer */}
        <div className="flex-1" />

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 p-1.5 rounded-full border shadow-lg transition-all hover:scale-110"
          style={{
            backgroundColor: '#1C253A',
            borderColor: 'rgba(139, 92, 246, 0.3)',
            color: '#8B5CF6',
          }}
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
