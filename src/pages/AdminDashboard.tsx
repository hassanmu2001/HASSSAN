import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Package, CheckCircle, Clock, Star, MessageSquare, ShieldCheck, FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user!.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!roleLoading && isAdmin === false) navigate("/");
  }, [authLoading, user, roleLoading, isAdmin, navigate]);

  const { data: profileCount } = useQuery({
    queryKey: ["admin-profile-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin === true,
  });

  const { data: serviceCounts } = useQuery({
    queryKey: ["admin-service-counts"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true });
      const { count: pending } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);
      const { count: approved } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", true);
      return { total: total ?? 0, pending: pending ?? 0, approved: approved ?? 0 };
    },
    enabled: isAdmin === true,
  });

  const { data: reviewCount } = useQuery({
    queryKey: ["admin-review-count"],
    queryFn: async () => {
      const { count } = await supabase.from("reviews").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: isAdmin === true,
  });

  const { data: conversationCount } = useQuery({
    queryKey: ["admin-conversation-count"],
    queryFn: async () => {
      const { count } = await supabase.from("conversations").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: isAdmin === true,
  });

  const { data: categoryCount } = useQuery({
    queryKey: ["admin-category-count"],
    queryFn: async () => {
      const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: isAdmin === true,
  });

  const { data: verificationCounts } = useQuery({
    queryKey: ["admin-verification-counts"],
    queryFn: async () => {
      const { count: pendingVerif } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "provider")
        .eq("is_verified", false);
      const { count: verifiedCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "provider")
        .eq("is_verified", true);
      return { pending: pendingVerif ?? 0, verified: verifiedCount ?? 0 };
    },
    enabled: isAdmin === true,
  });

  if (authLoading || roleLoading) return null;
  if (!isAdmin) return null;

  const loading = !profileCount && !serviceCounts;

  const stats = [
    { title: "المستخدمون", value: profileCount ?? 0, icon: Users, color: "text-gold", link: "/admin/users" },
    { title: "إجمالي الخدمات", value: serviceCounts?.total ?? 0, icon: Package, color: "text-gold", link: "/admin/services" },
    { title: "خدمات معتمدة", value: serviceCounts?.approved ?? 0, icon: CheckCircle, color: "text-green-500", link: "/admin/services" },
    { title: "بانتظار الموافقة", value: serviceCounts?.pending ?? 0, icon: Clock, color: "text-orange-500", link: "/admin/services" },
    { title: "التقييمات", value: reviewCount ?? 0, icon: Star, color: "text-yellow-500", link: "/admin/reviews" },
    { title: "المحادثات", value: conversationCount ?? 0, icon: MessageSquare, color: "text-blue-500", link: "/admin/messages" },
    { title: "الأقسام", value: categoryCount ?? 0, icon: FolderOpen, color: "text-purple-400", link: "/admin/categories" },
    { title: "توثيق معلّق", value: verificationCounts?.pending ?? 0, icon: ShieldCheck, color: "text-red-500", link: "/admin/verification" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <h1 className="font-amiri text-3xl font-bold text-foreground mb-8">لوحة تحكم المشرف</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="border-border hover:border-gold/30 transition-colors cursor-pointer hover:-translate-y-0.5">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-light flex items-center justify-center">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
