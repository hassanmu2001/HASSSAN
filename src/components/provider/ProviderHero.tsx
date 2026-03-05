import { motion } from "framer-motion";
import { MapPin, Phone, Star, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

interface ProviderHeroProps {
  profile: Tables<"profiles">;
  avgRating: number;
  reviewCount: number;
}

const ProviderHero = ({ profile, avgRating, reviewCount }: ProviderHeroProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleContact = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        navigate("/auth");
        return;
      }

      if (user.id === profile.user_id) {
        toast.error("لا يمكنك مراسلة نفسك");
        return;
      }

      // Check existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", user.id)
        .eq("provider_id", profile.user_id)
        .maybeSingle();

      if (existing) {
        navigate(`/messages?conv=${existing.id}`);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          client_id: user.id,
          provider_id: profile.user_id,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/messages?conv=${newConv.id}`);
    } catch (_err: unknown) {
      toast.error("حدث خطأ أثناء بدء المحادثة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep py-16 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center gap-6"
        >
          <Avatar className="w-28 h-28 border-4 border-gold/40 shadow-xl">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-purple-rich text-gold text-3xl font-amiri">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="text-center md:text-start flex-1">
            <h1 className="font-amiri text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              {profile.full_name}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gold-light text-sm">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </span>
              )}
              {reviewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  {avgRating.toFixed(1)} ({reviewCount} تقييم)
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleContact}
            disabled={loading}
            className="bg-gold hover:bg-gold-dark text-purple-deep font-bold px-8 h-12"
          >
            <MessageSquare className="w-4 h-4 ml-2" />
            {loading ? "جاري..." : "تواصل مع مزود الخدمة"}
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ProviderHero;
