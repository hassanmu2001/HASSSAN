import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookImage, Plus, Trash2, Eye, Clock, Upload } from "lucide-react";
import { toast } from "sonner";

const DashboardStories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["my-stories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_stories")
        .select("*")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("provider-stories")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("provider-stories")
        .getPublicUrl(path);

      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      const { error } = await supabase.from("provider_stories").insert({
        provider_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        caption: caption.trim(),
      });
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      setCaption("");
      toast.success("تم نشر القصة!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("provider_stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      toast.success("تم حذف القصة");
    },
  });

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "منتهية";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}س ${mins}د`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 space-y-6">
        <h1 className="font-amiri text-3xl font-bold text-foreground flex items-center gap-3">
          <BookImage className="w-7 h-7 text-accent" /> القصص
        </h1>

        {/* Upload */}
        <Card className="border-accent/30">
          <CardContent className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">انشر صورة أو فيديو يظهر لمدة 24 ساعة</p>
            <Input
              placeholder="تعليق على القصة (اختياري)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-accent text-accent-foreground font-bold gap-1"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "جاري الرفع..." : "اختر ملفاً ونشر"}
            </Button>
          </CardContent>
        </Card>

        {/* Stories list */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[9/16] rounded-xl" />)}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16">
            <BookImage className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">لم تنشر أي قصص بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stories.map((story) => (
              <Card key={story.id} className="overflow-hidden border-border group relative">
                <div className="aspect-[9/16] bg-muted">
                  {story.media_type === "video" ? (
                    <video src={story.media_url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  {story.caption && (
                    <p className="text-white text-xs mb-1 line-clamp-2">{story.caption}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/70 text-[10px]">
                      <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{story.view_count}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{timeLeft(story.expires_at)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/60 hover:text-destructive"
                      onClick={() => deleteMutation.mutate(story.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardStories;
