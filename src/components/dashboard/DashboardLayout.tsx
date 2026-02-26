import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, Package, Settings, LogOut, ChevronRight, ChevronLeft, MessageSquare, CalendarCheck, Menu, X, Home, Images, BarChart3, Tag, BookImage } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { title: "نظرة عامة", url: "/dashboard", icon: LayoutDashboard },
  { title: "خدماتي", url: "/dashboard/services", icon: Package },
  { title: "الحجوزات", url: "/dashboard/bookings", icon: CalendarCheck },
  { title: "معرض أعمالي", url: "/dashboard/portfolio", icon: Images },
  { title: "التحليلات", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "الكوبونات", url: "/dashboard/coupons", icon: Tag },
  { title: "القصص", url: "/dashboard/stories", icon: BookImage },
  { title: "الرسائل", url: "/messages", icon: MessageSquare },
  { title: "الإعدادات", url: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (isMobile) {
    const bottomItems = menuItems.slice(0, 4);
    const moreItems = menuItems.slice(4);

    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-50 bg-purple-deep border-b border-gold/10 flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-amiri text-lg font-bold text-gold">أفراحي</Link>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" className="p-2 text-primary-foreground/70 hover:text-gold transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-primary-foreground/70 hover:text-gold transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Slide-down more menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-14 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="bg-purple-deep border-b border-gold/10 p-3 space-y-1 animate-in slide-in-from-top-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {moreItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-gold/15 text-gold font-bold"
                        : "text-primary-foreground/70 hover:bg-gold/10 hover:text-gold"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary-foreground/70 hover:bg-destructive/20 hover:text-destructive w-full transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 pb-16">{children}</main>

        {/* Bottom navigation bar */}
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-purple-deep border-t border-gold/10 flex items-center justify-around h-16 safe-bottom">
          {bottomItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[60px]",
                  active ? "text-gold" : "text-primary-foreground/50 hover:text-gold"
                )}
              >
                <item.icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]")} />
                <span className="text-[10px] font-medium leading-tight">{item.title}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[60px]",
              mobileMenuOpen ? "text-gold" : "text-primary-foreground/50 hover:text-gold"
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">المزيد</span>
          </button>
        </nav>
      </div>
    );
  }

  // Desktop: original sidebar layout
  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside
        className={cn(
          "sticky top-0 h-screen bg-purple-deep border-l border-gold/10 flex flex-col transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-gold/10">
          <Link to="/" className="font-amiri text-xl font-bold text-gold">
            {collapsed ? "أ" : "أفراحي"}
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-gold/15 text-gold font-bold"
                    : "text-primary-foreground/70 hover:bg-gold/10 hover:text-gold"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gold/10 space-y-1">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-foreground/70 hover:bg-destructive/20 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 text-primary-foreground/50 hover:text-gold transition-colors"
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
};

export default DashboardLayout;
