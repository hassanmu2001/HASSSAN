import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogIn, LayoutDashboard, LogOut, MessageSquare, Shield, ShoppingCart,
  User, Settings, ChevronDown, CalendarCheck, Heart, CalendarHeart, Menu,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import NotificationBell from "@/components/NotificationBell";
import CountrySwitcher from "@/components/CountrySwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => {
        setIsAdmin(!!data);
      });
    } else {
      setIsAdmin(false);
    }
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate("/");
  };

  const go = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <nav className="bg-purple-deep/95 backdrop-blur-sm border-b border-gold/10 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-amiri text-2xl font-bold text-gold">
          أفراحي
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Desktop only: Language & Country */}
          <div className="hidden md:flex items-center gap-1">
            <LanguageSwitcher />
            <CountrySwitcher />
          </div>

          {/* Always visible: Cart */}
          <CartButton />

          {/* Notifications: always visible when logged in */}
          {session && <NotificationBell userId={session.user.id} />}

          {session ? (
            <>
              {/* ===== Desktop nav items (hidden on mobile) ===== */}
              <div className="hidden md:flex items-center gap-1">
                {isAdmin && (
                  <Button variant="ghost" onClick={() => navigate("/admin")} className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                    <Shield className="w-4 h-4 ml-2" />
                    <span>{t("nav.admin")}</span>
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate("/messages")} className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  <span>{t("nav.messages")}</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate("/dashboard/bookings")} className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                  <CalendarCheck className="w-4 h-4 ml-2" />
                  <span>حجوزاتي</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate("/favorites")} className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                  <Heart className="w-4 h-4 ml-2" />
                  <span>المفضلة</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate("/wedding-list")} className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                  <CalendarHeart className="w-4 h-4 ml-2" />
                  <span>قائمة عرسي</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                  <span>{t("nav.dashboard")}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-primary-foreground hover:text-gold hover:bg-purple-rich">
                      <User className="w-4 h-4 ml-1" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="w-4 h-4 ml-2" />
                      الإعدادات
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 ml-2" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            /* Desktop only: Login button */
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden md:inline-flex text-primary-foreground hover:text-gold hover:bg-purple-rich">
              <LogIn className="w-4 h-4 ml-2" />
              {t("nav.login")}
            </Button>
          )}

          {/* ===== Mobile hamburger (always visible on mobile) ===== */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:text-gold hover:bg-purple-rich"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* ===== Mobile Sheet (works for both logged-in and guest) ===== */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="right" className="w-72 bg-purple-deep border-gold/10 p-0">
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="font-amiri text-xl text-gold">القائمة</SheetTitle>
              </SheetHeader>
              <Separator className="bg-gold/10" />
              <div className="flex flex-col py-2">
                {session ? (
                  <>
                    <MobileNavItem icon={LayoutDashboard} label={t("nav.dashboard")} onClick={() => go("/dashboard")} />
                    <MobileNavItem icon={MessageSquare} label={t("nav.messages")} onClick={() => go("/messages")} />
                    <MobileNavItem icon={CalendarCheck} label="حجوزاتي" onClick={() => go("/dashboard/bookings")} />
                    <MobileNavItem icon={Heart} label="المفضلة" onClick={() => go("/favorites")} />
                    <MobileNavItem icon={CalendarHeart} label="قائمة عرسي" onClick={() => go("/wedding-list")} />
                    {isAdmin && (
                      <MobileNavItem icon={Shield} label={t("nav.admin")} onClick={() => go("/admin")} />
                    )}
                    <Separator className="my-2 bg-gold/10" />
                    <div className="flex items-center gap-2 px-4 py-2">
                      <LanguageSwitcher />
                      <CountrySwitcher />
                    </div>
                    <Separator className="my-2 bg-gold/10" />
                    <MobileNavItem icon={Settings} label="الإعدادات" onClick={() => go("/dashboard/settings")} />
                    <MobileNavItem icon={LogOut} label={t("nav.logout")} onClick={() => { setMobileOpen(false); handleSignOut(); }} className="text-destructive" />
                  </>
                ) : (
                  <>
                    <MobileNavItem icon={LogIn} label={t("nav.login")} onClick={() => go("/auth")} />
                    <Separator className="my-2 bg-gold/10" />
                    <div className="flex items-center gap-2 px-4 py-2">
                      <LanguageSwitcher />
                      <CountrySwitcher />
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

const MobileNavItem = ({
  icon: Icon,
  label,
  onClick,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 text-primary-foreground hover:bg-purple-rich/60 transition-colors text-sm ${className}`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </button>
);

const CartButton = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const { t } = useTranslation();
  return (
    <Button
      variant="ghost"
      onClick={() => navigate("/cart")}
      className="text-primary-foreground hover:text-gold hover:bg-purple-rich relative"
    >
      <ShoppingCart className="w-4 h-4 ml-2" />
      <span className="hidden md:inline">{t("nav.cart")}</span>
      {items.length > 0 && (
        <span className="absolute -top-1 -left-1 bg-gold text-purple-deep text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {items.length}
        </span>
      )}
    </Button>
  );
};

export default Navbar;
