import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Send, ImagePlus, X, Video } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ReviewFormProps {
  services: { id: string; title: string }[];
  providerId: string;
}

const ReviewForm = ({ services, providerId }: ReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: string }[]>([]);

  const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (mediaFiles.length + files.length > 5) {
      toast.error("الحد الأقصى 5 ملفات");
      return;
    }
    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);
    const previews = newFiles.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    }));
    setMediaPreviews(previews);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newFiles.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
    })));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");
      if (!serviceId) throw new Error("اختر الخدمة أولاً");
      if (rating === 0) throw new Error("اختر التقييم أولاً");

      // Create review
      const { data: review, error } = await supabase.from("reviews").insert({
        service_id: serviceId,
        reviewer_id: user.id,
        rating,
        comment: comment.trim() || null,
      }).select().single();
      if (error) throw error;

      // Upload media if any
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${review.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("review-media")
            .upload(path, file);
          if (uploadError) continue;

          const { data: { publicUrl } } = supabase.storage
            .from("review-media")
            .getPublicUrl(path);

          await supabase.from("review_media").insert({
            review_id: review.id,
            media_url: publicUrl,
            media_type: file.type.startsWith("video/") ? "video" : "image",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["service-reviews"] });
      toast.success("شكراً لتقييمك! تم إرسال التقييم بنجاح");
      setRating(0);
      setComment("");
      setServiceId("");
      setMediaFiles([]);
      setMediaPreviews([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ أثناء إرسال التقييم");
    },
  });

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground">
          يجب <a href="/auth" className="text-accent font-bold hover:underline">تسجيل الدخول</a> لتقييم هذا المزود
        </p>
      </div>
    );
  }

  if (user.id === providerId) return null;

  const ratingLabels = ["", "سيء", "مقبول", "جيد", "جيد جداً", "ممتاز"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <h3 className="font-bold text-foreground text-lg mb-4">أضف تقييمك</h3>

      <div className="space-y-4">
        {/* Service selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">الخدمة التي تلقيتها</label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الخدمة..." />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Star rating */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">التقييم</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-transform hover:scale-125 p-0.5"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= (hoveredStar || rating)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
            {(hoveredStar || rating) > 0 && (
              <span className="text-sm text-accent font-medium mr-2">
                {ratingLabels[hoveredStar || rating]}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">تعليقك (اختياري)</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا تجربتك مع هذه الخدمة..."
            rows={3}
          />
        </div>

        {/* Media upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">صور أو فيديو (اختياري)</label>
          <div className="flex flex-wrap gap-2">
            {mediaPreviews.map((preview, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted group">
                {preview.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Video className="w-6 h-6 text-muted-foreground" />
                  </div>
                ) : (
                  <img src={preview.url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {mediaFiles.length < 5 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">إضافة</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleAddMedia}
          />
        </div>

        {/* Submit */}
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || rating === 0 || !serviceId}
          className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold w-full"
        >
          <Send className="w-4 h-4 ml-2" />
          {submitMutation.isPending ? "جاري الإرسال..." : "إرسال التقييم"}
        </Button>
      </div>
    </motion.div>
  );
};

export default ReviewForm;
