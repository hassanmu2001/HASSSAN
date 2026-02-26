import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Star, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

interface ProviderReviewsProps {
  reviews: Review[];
  isLoading: boolean;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${star <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const ReviewMedia = ({ reviewId }: { reviewId: string }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: media = [] } = useQuery({
    queryKey: ["review-media", reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_media")
        .select("*")
        .eq("review_id", reviewId);
      if (error) throw error;
      return data;
    },
  });

  if (media.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 mt-2 overflow-x-auto">
        {media.map((m) => (
          <button
            key={m.id}
            onClick={() => setLightboxUrl(m.media_url)}
            className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted relative group"
          >
            {m.media_type === "video" ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Play className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            ) : (
              <img src={m.media_url} alt="" className="w-full h-full object-cover" />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          {lightboxUrl.includes("video") || lightboxUrl.endsWith(".mp4") ? (
            <video src={lightboxUrl} controls autoPlay className="max-h-[80vh] max-w-full rounded-lg" />
          ) : (
            <img src={lightboxUrl} alt="" className="max-h-[80vh] max-w-full rounded-lg object-contain" />
          )}
        </div>
      )}
    </>
  );
};

const ProviderReviews = ({ reviews, isLoading }: ProviderReviewsProps) => {
  if (isLoading) {
    return (
      <section>
        <h2 className="font-amiri text-2xl font-bold text-foreground mb-6">التقييمات والمراجعات</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className="font-amiri text-2xl font-bold text-foreground mb-6">التقييمات والمراجعات</h2>
        <p className="text-muted-foreground text-center py-8">لا توجد تقييمات بعد</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-amiri text-2xl font-bold text-foreground mb-6">
        التقييمات والمراجعات ({reviews.length})
      </h2>
      <div className="space-y-4">
        {reviews.map((review, i) => {
          const name = review.profiles?.full_name ?? "مستخدم";
          const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);

          return (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-muted text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-sm">{name}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(review.created_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.comment && (
                <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
              )}
              <ReviewMedia reviewId={review.id} />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ProviderReviews;
