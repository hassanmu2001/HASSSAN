import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProviderStoriesProps {
  providerId: string;
  providerName: string;
  avatarUrl?: string | null;
}

const ProviderStories = ({ providerId, providerName, avatarUrl }: ProviderStoriesProps) => {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const { data: stories = [] } = useQuery({
    queryKey: ["provider-stories", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_stories")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (stories.length === 0) return null;

  const initials = providerName.split(" ").map(n => n[0]).join("").slice(0, 2);

  const handleView = (index: number) => {
    setViewingIndex(index);
    // Increment view count
    supabase
      .from("provider_stories")
      .update({ view_count: (stories[index].view_count || 0) + 1 })
      .eq("id", stories[index].id)
      .then();
  };

  const currentStory = viewingIndex !== null ? stories[viewingIndex] : null;

  return (
    <>
      {/* Story ring */}
      <button
        onClick={() => handleView(0)}
        className="flex flex-col items-center gap-1.5 group"
      >
        <div className="p-0.5 rounded-full bg-gradient-to-tr from-accent to-primary">
          <Avatar className="w-16 h-16 border-2 border-background">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
        </div>
        <span className="text-xs text-foreground font-medium group-hover:text-accent transition-colors">
          {stories.length} قصة
        </span>
      </button>

      {/* Fullscreen story viewer */}
      <AnimatePresence>
        {viewingIndex !== null && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            {/* Progress bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30">
                  <div
                    className={`h-full rounded-full transition-all ${i <= viewingIndex! ? "bg-white w-full" : "w-0"}`}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-bold text-sm">{providerName}</p>
                  <p className="text-white/60 text-xs flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {currentStory.view_count}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingIndex(null)} className="text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Media */}
            <motion.div
              key={viewingIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg w-full h-full flex items-center justify-center"
            >
              {currentStory.media_type === "video" ? (
                <video src={currentStory.media_url} autoPlay className="max-h-full max-w-full object-contain" />
              ) : (
                <img src={currentStory.media_url} alt="" className="max-h-full max-w-full object-contain" />
              )}
            </motion.div>

            {/* Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-8 left-4 right-4 z-10">
                <p className="text-white text-center text-sm bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2">
                  {currentStory.caption}
                </p>
              </div>
            )}

            {/* Navigation */}
            {viewingIndex! > 0 && (
              <button
                onClick={() => handleView(viewingIndex! - 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 rounded-full p-2"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            )}
            {viewingIndex! < stories.length - 1 && (
              <button
                onClick={() => handleView(viewingIndex! + 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 rounded-full p-2"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProviderStories;
