import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, DollarSign, CalendarCheck, Eye, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useMemo } from "react";

const DashboardAnalytics = () => {
  const { user } = useAuth();
  const { formatPrice } = useCountry();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["provider-analytics-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: serviceIds = [] } = useQuery({
    queryKey: ["provider-service-ids", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, title")
        .eq("provider_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: views = [] } = useQuery({
    queryKey: ["provider-service-views", user?.id],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const ids = serviceIds.map((s) => s.id);
      const { data, error } = await supabase
        .from("service_views")
        .select("*")
        .in("service_id", ids)
        .order("viewed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: serviceIds.length > 0,
  });

  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const revenue = bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + (b.total || 0), 0);
    const acceptanceRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    const totalViews = views.length;
    const conversionRate = totalViews > 0 ? Math.round((total / totalViews) * 100) : 0;

    return { total, confirmed, cancelled, pending, revenue, acceptanceRate, totalViews, conversionRate };
  }, [bookings, views]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; count: number }> = {};
    bookings
      .filter((b) => b.status === "confirmed")
      .forEach((b) => {
        const m = b.booking_date.substring(0, 7);
        if (!months[m]) months[m] = { month: m, revenue: 0, count: 0 };
        months[m].revenue += b.total || 0;
        months[m].count += 1;
      });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [bookings]);

  const viewsOverTime = useMemo(() => {
    const days: Record<string, number> = {};
    views.forEach((v) => {
      const day = v.viewed_at.substring(0, 10);
      days[day] = (days[day] || 0) + 1;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date: date.substring(5), views: count }));
  }, [views]);

  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    views.forEach((v) => {
      counts[v.service_id] = (counts[v.service_id] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({
        name: serviceIds.find((s) => s.id === id)?.title ?? "خدمة",
        views: count,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [views, serviceIds]);

  const statusData = useMemo(() => [
    { name: "مؤكد", value: stats.confirmed, color: "hsl(var(--accent))" },
    { name: "معلق", value: stats.pending, color: "hsl(var(--muted-foreground))" },
    { name: "ملغي", value: stats.cancelled, color: "hsl(var(--destructive))" },
  ].filter((d) => d.value > 0), [stats]);

  const statCards = [
    { title: "إجمالي الحجوزات", value: stats.total, icon: CalendarCheck, color: "text-accent" },
    { title: "الإيرادات", value: formatPrice(stats.revenue), icon: DollarSign, color: "text-accent" },
    { title: "معدل القبول", value: `${stats.acceptanceRate}%`, icon: TrendingUp, color: "text-accent" },
    { title: "المشاهدات", value: stats.totalViews, icon: Eye, color: "text-primary" },
    { title: "معدل التحويل", value: `${stats.conversionRate}%`, icon: Users, color: "text-primary" },
    { title: "مؤكدة", value: stats.confirmed, icon: CheckCircle, color: "text-green-500" },
    { title: "معلقة", value: stats.pending, icon: Clock, color: "text-accent" },
    { title: "ملغية", value: stats.cancelled, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-8">
        <h1 className="font-amiri text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-accent" /> التحليلات المتقدمة
        </h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Card key={s.title} className="border-border">
              <CardContent className="p-4 text-center">
                <s.icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto" />
                ) : (
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Revenue chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-amiri text-lg">الإيرادات الشهرية</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">لا توجد بيانات بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Views over time */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-amiri text-lg">المشاهدات (آخر 14 يوم)</CardTitle>
            </CardHeader>
            <CardContent>
              {viewsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={viewsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">لا توجد مشاهدات بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Status pie */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-amiri text-lg">توزيع الحجوزات</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2">
                    {statusData.map((d) => (
                      <span key={d.name} className="flex items-center gap-1 text-xs text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                        {d.name} ({d.value})
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">لا توجد بيانات بعد</p>
              )}
            </CardContent>
          </Card>

          {/* Top services by views */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-amiri text-lg">أكثر الخدمات مشاهدة</CardTitle>
            </CardHeader>
            <CardContent>
              {topServices.length > 0 ? (
                <div className="space-y-3">
                  {topServices.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-accent w-6">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{ width: `${(s.views / topServices[0].views) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{s.views} مشاهدة</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">لا توجد بيانات بعد</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAnalytics;
