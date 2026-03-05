import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FavoriteButton from "@/components/FavoriteButton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Heart } from "lucide-react";
import { motion } from "framer-motion";

type FavoriteService = {
  id: string;
  title: string;
  price_min: number | null;
  provider_id: string;
  categories: { name: string } | null;
  providerName: string;
};

const Favorites = () => {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();

  const { data: services, isLoading } = useQuery({
    queryKey: ["favorite-services", favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name)")
        .in("id", favorites);
      if (error) throw error;

      // Fetch provider profiles
      const providerIds = [...new Set(data.map((s) => s.provider_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", providerIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      return data.map((s) => ({
        ...s,
        categories: s.categories as { name: string } | null,
        providerName: profileMap.get(s.provider_id)?.full_name ?? "مزود",
      })) as FavoriteService[];
    },
    enabled: favorites.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-amiri text-2xl text-foreground mb-2">سجّل دخولك لعرض المفضلة</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep py-12">
        <div className="container text-center">
          <Heart className="w-10 h-10 mx-auto text-gold mb-3" />
          <h1 className="font-amiri text-3xl md:text-4xl font-bold text-primary-foreground mb-2">المفضلة</h1>
          <p className="text-gold-light">الخدمات التي أعجبتك</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : !services || services.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد خدمات في المفضلة بعد</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg hover:shadow-gold/10 transition-all border-border hover:border-gold/30"
                    onClick={() => navigate(`/service/${service.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gold mb-1">{service.categories?.name}</p>
                          <h3 className="font-bold text-foreground truncate">{service.title}</h3>
                          <p className="text-sm text-muted-foreground">{service.providerName}</p>
                        </div>
                        <FavoriteButton serviceId={service.id} />
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-gold font-bold">
                          {formatPrice(service.price_min ?? 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Favorites;
