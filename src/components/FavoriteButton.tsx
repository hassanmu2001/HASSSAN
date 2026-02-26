import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  serviceId: string;
  size?: "sm" | "default";
  className?: string;
}

const FavoriteButton = ({ serviceId, size = "sm", className }: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(serviceId);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(serviceId);
      }}
      className={cn(
        "rounded-full transition-all",
        size === "sm" ? "w-8 h-8" : "w-10 h-10",
        fav ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-400",
        className
      )}
    >
      <Heart className={cn("w-4 h-4", fav && "fill-current")} />
    </Button>
  );
};

export default FavoriteButton;
