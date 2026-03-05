import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Images, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DashboardPortfolio = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-portfolio", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("portfolio-photos")
        .upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("portfolio-photos")
        .getPublicUrl(path);

      const { error: insertErr } = await supabase
        .from("portfolio_items")
        .insert({
          provider_id: user.id,
          title: title || "عمل سابق",
          image_url: urlData.publicUrl,
        });
      if (insertErr) throw insertErr;

      toast.success("تم إضافة العمل بنجاح");
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      setOpen(false);
      setTitle("");
      setFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      toast.success("تم الحذف");
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-amiri text-2xl font-bold text-foreground flex items-center gap-2">
            <Images className="w-6 h-6 text-gold" /> معرض أعمالي
          </h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold-dark text-primary-foreground">
                <Plus className="w-4 h-4 ml-2" /> إضافة عمل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة عمل جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="عنوان العمل (اختياري)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  {file ? (
                    <div>
                      <p className="text-sm text-foreground">{file.name}</p>
                      <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="mt-2">
                        تغيير
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">اضغط لاختيار صورة</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-gold hover:bg-gold-dark text-primary-foreground"
                >
                  {uploading ? "جاري الرفع..." : "رفع"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Images className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لم تضف أي أعمال بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden border border-border">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm truncate">{item.title}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="absolute top-2 left-2 w-8 h-8 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPortfolio;
