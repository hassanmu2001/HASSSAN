import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const DashboardCoupons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_percent: 10,
    max_uses: "",
    season_label: "",
    expires_at: "",
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["my-coupons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(),
        description: form.description.trim(),
        discount_percent: form.discount_percent,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        season_label: form.season_label.trim() || null,
        expires_at: form.expires_at || null,
        provider_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
      setShowForm(false);
      setForm({ code: "", description: "", discount_percent: 10, max_uses: "", season_label: "", expires_at: "" });
      toast.success("تم إنشاء الكوبون بنجاح!");
    },
    onError: (err: any) => toast.error(err.message || "حدث خطأ"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-coupons"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
      toast.success("تم حذف الكوبون");
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-amiri text-3xl font-bold text-foreground flex items-center gap-3">
            <Tag className="w-7 h-7 text-accent" /> الكوبونات والعروض
          </h1>
          <Button onClick={() => setShowForm(!showForm)} className="bg-accent text-accent-foreground font-bold gap-1">
            <Plus className="w-4 h-4" /> كوبون جديد
          </Button>
        </div>

        {showForm && (
          <Card className="border-accent/30">
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>كود الخصم</Label>
                  <Input
                    placeholder="مثال: SUMMER2026"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>نسبة الخصم %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>الوصف</Label>
                  <Input
                    placeholder="خصم خاص لموسم الصيف"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>المناسبة (اختياري)</Label>
                  <Input
                    placeholder="رمضان، الصيف، العيد..."
                    value={form.season_label}
                    onChange={(e) => setForm({ ...form, season_label: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>تاريخ الانتهاء (اختياري)</Label>
                  <Input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>الحد الأقصى للاستخدام (اختياري)</Label>
                  <Input
                    type="number"
                    placeholder="بدون حد"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  />
                </div>
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.code.trim() || createMutation.isPending}
                className="bg-accent text-accent-foreground font-bold"
              >
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الكوبون"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">لم تنشئ أي كوبونات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => {
              const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
              return (
                <Card key={coupon.id} className="border-border">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-foreground text-lg">{coupon.code}</span>
                        <Badge className="bg-accent/20 text-accent-foreground text-xs">
                          {coupon.discount_percent}%
                        </Badge>
                        {coupon.season_label && (
                          <Badge variant="outline" className="text-xs">{coupon.season_label}</Badge>
                        )}
                        {isExpired && <Badge variant="destructive" className="text-xs">منتهي</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{coupon.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        استُخدم {coupon.used_count} مرة
                        {coupon.max_uses && ` من ${coupon.max_uses}`}
                        {coupon.expires_at && (
                          <> · ينتهي {new Date(coupon.expires_at).toLocaleDateString("ar-SA")}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: coupon.id, is_active: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardCoupons;
