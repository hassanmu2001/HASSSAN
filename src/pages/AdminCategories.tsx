import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
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

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
};

const AdminCategories = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

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

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin === true,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, slug, description: description || null, icon: icon || null };
      if (editingCategory) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-category-count"] });
      toast.success(editingCategory ? "تم تحديث القسم" : "تم إضافة القسم");
      closeForm();
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-category-count"] });
      toast.success("تم حذف القسم");
    },
    onError: () => toast.error("لا يمكن حذف القسم (قد تكون هناك خدمات مرتبطة به)"),
  });

  const openForm = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setSlug(cat.slug);
      setDescription(cat.description || "");
      setIcon(cat.icon || "");
    } else {
      setEditingCategory(null);
      setName("");
      setSlug("");
      setDescription("");
      setIcon("");
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  if (authLoading || roleLoading || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-amiri text-3xl font-bold text-foreground">إدارة الأقسام</h1>
          <Button onClick={() => openForm()} className="bg-gold hover:bg-gold-dark text-purple-deep font-bold">
            <Plus className="w-4 h-4 ml-2" />
            إضافة قسم
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((cat) => (
              <Card key={cat.id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-light flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.slug} {cat.description ? `— ${cat.description}` : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openForm(cat)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف القسم</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف "{cat.name}"؟
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(cat.id)}
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
          <p className="text-center text-muted-foreground py-12">لا توجد أقسام</p>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-amiri text-xl">
              {editingCategory ? "تعديل القسم" : "إضافة قسم جديد"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !slug.trim()) {
                toast.error("الاسم والمعرّف مطلوبان");
                return;
              }
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>اسم القسم</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: صالات الأفراح" required />
            </div>
            <div className="space-y-2">
              <Label>المعرّف (slug)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="مثال: halls" dir="ltr" required />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر" />
            </div>
            <div className="space-y-2">
              <Label>اسم الأيقونة</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="مثال: Building2" dir="ltr" />
            </div>
            <Button type="submit" disabled={saveMutation.isPending} className="w-full bg-gold hover:bg-gold-dark text-purple-deep font-bold">
              {saveMutation.isPending ? "جاري الحفظ..." : editingCategory ? "حفظ التعديلات" : "إضافة القسم"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;
