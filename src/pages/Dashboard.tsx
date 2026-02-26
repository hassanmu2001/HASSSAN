import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Star, MessageSquare, Clock, DollarSign, Eye, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReferralCard from "@/components/ReferralCard";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "معلّق", variant: "secondary" },
  confirmed: { label: "مؤكد", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
  completed: { label: "مكتمل", variant: "outline" },
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: services, isLoading } = useQuery({
    queryKey: ["my-services", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("provider_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const serviceIds = services?.map((s) => s.id) ?? [];

  const { data: reviews } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data, error } = await supabase.from("reviews").select("*").in("service_id", serviceIds);
      if (error) throw error;
      return data;
    },
    enabled: !!services && services.length > 0,
  });

  const { data: bookings } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(title)")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: allBookings } = useQuery({
    queryKey: ["my-bookings-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("total, status")
        .eq("provider_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: viewsCount } = useQuery({
    queryKey: ["my-views", user?.id],
    queryFn: async () => {
      if (serviceIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("service_views")
        .select("*", { count: "exact", head: true })
        .in("service_id", serviceIds);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!services && services.length > 0,
  });

  const { data: coupons } = useQuery({
    queryKey: ["my-coupons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("provider_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  const pendingCount = allBookings?.filter((b) => b.status === "pending").length ?? 0;
  const revenue = allBookings?.filter((b) => b.status === "confirmed" || b.status === "completed").reduce((s, b) => s + (b.total ?? 0), 0) ?? 0;

  const stats = [
    { title: "خدماتي", value: services?.length ?? 0, icon: Package, color: "text-gold" },
    { title: "متوسط التقييم", value: avgRating, icon: Star, color: "text-gold" },
    { title: "التقييمات", value: reviews?.length ?? 0, icon: MessageSquare, color: "text-gold" },
    { title: "حجوزات معلّقة", value: pendingCount, icon: Clock, color: "text-gold" },
    { title: "الإيرادات", value: formatPrice(revenue), icon: DollarSign, color: "text-gold" },
    { title: "المشاهدات", value: viewsCount ?? 0, icon: Eye, color: "text-gold" },
  ];

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-8">
        <h1 className="font-amiri text-3xl font-bold text-foreground">لوحة التحكم</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-light flex items-center justify-center shrink-0">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs truncate">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-lg font-bold text-foreground truncate">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Card */}
        {user && <ReferralCard />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Bookings */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-amiri text-xl">آخر الحجوزات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
                </div>
              ) : bookings && bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map((b) => {
                    const s = STATUS_MAP[b.status] ?? { label: b.status, variant: "outline" as const };
                    return (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-sm truncate">
                            {(b as any).services?.title ?? "خدمة"}
                          </p>
                          <p className="text-muted-foreground text-xs">{new Date(b.booking_date).toLocaleDateString("ar")}</p>
                        </div>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">لا توجد حجوزات بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Active Coupons */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-amiri text-xl flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold" />
                العروض النشطة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coupons && coupons.length > 0 ? (
                <div className="space-y-3">
                  {coupons.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-bold text-foreground text-sm font-mono">{c.code}</p>
                        <p className="text-muted-foreground text-xs">{c.season_label ?? c.description}</p>
                      </div>
                      <Badge variant="secondary">{c.discount_percent}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6">لا توجد عروض نشطة</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent services */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-amiri text-xl">آخر الخدمات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : services && services.length > 0 ? (
              <div className="space-y-3">
                {services.slice(0, 5).map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-bold text-foreground text-sm">{service.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {service.is_approved ? "✅ معتمد" : "⏳ قيد المراجعة"}
                      </p>
                    </div>
                    {service.price_min != null && (
                      <p className="text-gold-dark font-bold text-sm">{formatPrice(service.price_min)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">لا توجد خدمات بعد. أضف خدمتك الأولى!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
