import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("service_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((f) => f.service_id);
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (serviceId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      const isFav = favorites.includes(serviceId);
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("service_id", serviceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, service_id: serviceId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ");
    },
  });

  const isFavorite = (serviceId: string) => favorites.includes(serviceId);

  return { favorites, toggleFavorite: toggleFavorite.mutate, isFavorite };
}
