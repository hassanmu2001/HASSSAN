import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Images } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProviderPortfolioProps {
  providerId: string;
}

const ProviderPortfolio = ({ providerId }: ProviderPortfolioProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["portfolio", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-amiri text-2xl font-bold text-foreground flex items-center gap-2">
          <Images className="w-6 h-6 text-gold" /> معرض الأعمال
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-amiri text-2xl font-bold text-foreground flex items-center gap-2">
        <Images className="w-6 h-6 text-gold" /> معرض الأعمال
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedImage(item.image_url)}
            className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-gold/50 transition-all"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {item.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">{item.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selectedImage && (
            <img src={selectedImage} alt="" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderPortfolio;
