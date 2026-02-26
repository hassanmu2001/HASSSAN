import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Star, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminReviews = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

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

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, services(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const reviewerIds = [...new Set(data.map((r) => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", reviewerIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      return data.map((r) => ({
        ...r,
        reviewerName: profileMap.get(r.reviewer_id) ?? "مستخدم",
      }));
    },
    enabled: isAdmin === true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("تم حذف التقييم");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const filtered = (reviews ?? []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.reviewerName.toLowerCase().includes(q) ||
      (r.comment ?? "").toLowerCase().includes(q) ||
      (r.services?.title ?? "").toLowerCase().includes(q)
    );
  });

  if (authLoading || roleLoading || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <h1 className="font-amiri text-3xl font-bold text-foreground mb-8">إدارة التقييمات</h1>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو التعليق أو الخدمة..."
            className="pr-10"
          />
        </div>

        <p className="text-muted-foreground text-sm mb-4">{filtered.length} تقييم</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((review) => (
              <Card key={review.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground text-sm">{review.reviewerName}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-gold text-gold" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        الخدمة: {review.services?.title ?? "غير معروفة"} — {new Date(review.created_at).toLocaleDateString("ar-SA")}
                      </p>
                      {review.comment && (
                        <p className="text-sm text-foreground">{review.comment}</p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف التقييم</AlertDialogTitle>
                          <AlertDialogDescription>هل أنت متأكد من حذف هذا التقييم؟</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(review.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">لا توجد تقييمات</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
