import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, X, ArrowLeft, MessageCircle, Tag, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Cart = () => {
  const {
    items, removeItem, clearCart, totalMin, totalMax,
    appliedCoupon, applyCoupon, removeCoupon,
    discountedTotalMin, discountedTotalMax,
  } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.providerId]) acc[item.providerId] = [];
    acc[item.providerId].push(item);
    return acc;
  }, {});

  const handleApplyCoupon = async () => {
    setCouponLoading(true);
    const err = await applyCoupon(couponCode);
    setCouponLoading(false);
    if (err) {
      toast.error(err);
    } else {
      toast.success("تم تطبيق كود الخصم بنجاح!");
      setCouponCode("");
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/auth");
      return;
    }
    toast.success("تم إرسال طلبات الحجز بنجاح! سيتم التواصل معك قريباً");
    clearCart();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-7 h-7 text-gold" />
          <h1 className="font-amiri text-3xl font-bold text-foreground">سلة الخدمات</h1>
          <span className="bg-gold text-purple-deep text-sm font-bold px-2.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">سلتك فارغة</p>
            <p className="text-muted-foreground text-sm mb-6">
              تصفح الأقسام وأضف الخدمات التي تحتاجها لمناسبتك
            </p>
            <Button onClick={() => navigate("/")} className="bg-gold hover:bg-gold-dark text-purple-deep font-bold">
              تصفح الخدمات
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([providerId, providerItems]) => (
              <motion.div
                key={providerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-border overflow-hidden">
                  <div className="bg-purple-light px-5 py-3 flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">
                      {providerItems[0].providerName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/provider/${providerId}`)}
                      className="text-xs text-muted-foreground"
                    >
                      <MessageCircle className="w-3.5 h-3.5 ml-1" />
                      زيارة الصفحة
                    </Button>
                  </div>
                  <CardContent className="p-0 divide-y divide-border">
                    {providerItems.map((item) => (
                      <div key={item.serviceId} className="flex items-center gap-3 p-4">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-purple-light shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-sm truncate">{item.title}</p>
                          {item.city && (
                            <p className="text-muted-foreground text-xs">{item.city}</p>
                          )}
                          {(item.priceMin ?? 0) > 0 && (
                            <p className="text-gold-dark font-bold text-sm mt-0.5">
                              {formatPrice(item.priceMin!)}
                              {item.priceMax && item.priceMax > (item.priceMin ?? 0)
                                ? ` - ${formatPrice(item.priceMax)}`
                                : ""}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.serviceId)}
                          className="text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Coupon Code Section */}
            <Card className="border-accent/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-foreground text-sm">كود خصم من التطبيق</h3>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-accent/10 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <div>
                        <span className="font-bold text-foreground text-sm">{appliedCoupon.code}</span>
                        <span className="text-accent font-bold text-sm mr-2">
                          — خصم {appliedCoupon.discountPercent}%
                        </span>
                        {appliedCoupon.description && (
                          <p className="text-muted-foreground text-xs">{appliedCoupon.description}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-destructive text-xs">
                      <X className="w-3.5 h-3.5 ml-1" /> إزالة
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="أدخل كود الخصم هنا..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="flex-1 text-sm"
                      dir="ltr"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-accent text-accent-foreground font-bold"
                      size="sm"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تطبيق"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-gold/30">
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-3">ملخص الطلب</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الخدمات</span>
                    <span className="font-bold text-foreground">{items.length} خدمة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد مزودي الخدمات</span>
                    <span className="font-bold text-foreground">{Object.keys(grouped).length} مزود</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع قبل الخصم</span>
                    <span className="text-foreground">
                      {totalMin > 0
                        ? totalMax > totalMin
                          ? `${formatPrice(totalMin)} - ${formatPrice(totalMax)}`
                          : formatPrice(totalMin)
                        : "غير محدد"}
                    </span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>خصم ({appliedCoupon.discountPercent}%)</span>
                      <span className="font-bold">
                        - {totalMin > 0 ? formatPrice(totalMin * appliedCoupon.discountPercent / 100) : "0"}
                      </span>
                    </div>
                  )}

                  <Separator className="my-2" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-foreground">التكلفة التقديرية</span>
                    <span className="font-bold text-gold-dark">
                      {discountedTotalMin > 0
                        ? discountedTotalMax > discountedTotalMin
                          ? `${formatPrice(discountedTotalMin)} - ${formatPrice(discountedTotalMax)}`
                          : formatPrice(discountedTotalMin)
                        : "غير محدد"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <Button
                    onClick={handleCheckout}
                    className="bg-gold hover:bg-gold-dark text-purple-deep font-bold flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    إرسال طلبات الحجز
                  </Button>
                  <Button variant="outline" onClick={clearCart}>
                    <X className="w-4 h-4 ml-1" />
                    إفراغ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
