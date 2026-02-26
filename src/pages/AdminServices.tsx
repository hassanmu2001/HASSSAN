import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Check, X, Star, Shield } from "lucide-react";

const AdminServices = () => {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!roleLoading && isAdmin === false) navigate("/");
  }, [authLoading, user, roleLoading, isAdmin, navigate]);

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const providerIds = [...new Set((services ?? []).map((s) => s.provider_id))];
  const { data: profiles } = useQuery({
    queryKey: ["admin-service-profiles", providerIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", providerIds);
      return data;
    },
    enabled: providerIds.length > 0,
  });

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-counts"] });
      toast.success(approved ? "تم اعتماد الخدمة" : "تم رفض الخدمة");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const ratingMutation = useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const { error } = await supabase
        .from("services")
        .update({ admin_rating: rating } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success("تم تحديث تقييم المشرف");
    },
    onError: () => toast.error("حدث خطأ في تحديث التقييم"),
  });

  const filtered = (services ?? []).filter((s) => {
    if (statusFilter === "pending" && s.is_approved) return false;
    if (statusFilter === "approved" && !s.is_approved) return false;
    if (search) {
      const q = search.toLowerCase();
      const providerName = profileMap.get(s.provider_id) ?? "";
      return (
        s.title.toLowerCase().includes(q) ||
        providerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (authLoading || roleLoading || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <h1 className="font-amiri text-3xl font-bold text-foreground mb-8">إدارة الخدمات</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بعنوان الخدمة أو اسم المزود..."
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">بانتظار الموافقة</SelectItem>
              <SelectItem value="approved">معتمدة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-muted-foreground text-sm mb-4">{filtered.length} خدمة</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((service) => (
              <Card key={service.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Thumbnail */}
                    {service.photos && service.photos.length > 0 && (
                      <div className="w-full md:w-28 h-20 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={service.photos[0]}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-bold text-foreground">{service.title}</h3>
                          <p className="text-muted-foreground text-xs">
                            مزود الخدمة: {profileMap.get(service.provider_id) ?? "غير معروف"}
                          </p>
                        </div>
                        <Badge variant={service.is_approved ? "default" : "secondary"}>
                          {service.is_approved ? "معتمد" : "قيد المراجعة"}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground text-sm line-clamp-1 mb-2">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {service.categories && (
                            <Badge variant="outline" className="text-xs">
                              {(service.categories as any).name}
                            </Badge>
                          )}
                          {service.city && <span>{service.city}</span>}
                          {service.price_min != null && (
                            <span className="text-gold-dark font-bold">
                              {formatPrice(service.price_min)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Admin Rating Stars */}
                          <div className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-gold" />
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => ratingMutation.mutate({ id: service.id, rating: star })}
                                disabled={ratingMutation.isPending}
                                className="transition-transform hover:scale-125"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= ((service as any).admin_rating ?? 0)
                                      ? "fill-gold text-gold"
                                      : "text-muted-foreground/30 hover:text-gold/50"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>

                          {!service.is_approved && (
                            <Button
                              size="sm"
                              onClick={() =>
                                approveMutation.mutate({ id: service.id, approved: true })
                              }
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              disabled={approveMutation.isPending}
                            >
                              <Check className="w-4 h-4 ml-1" />
                              اعتماد
                            </Button>
                          )}
                          {service.is_approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                approveMutation.mutate({ id: service.id, approved: false })
                              }
                              disabled={approveMutation.isPending}
                            >
                              <X className="w-4 h-4 ml-1" />
                              إلغاء الاعتماد
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">لا توجد خدمات</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminServices;
