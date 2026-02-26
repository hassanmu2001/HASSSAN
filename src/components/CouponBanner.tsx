import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/hooks/use-country";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Clock, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const CountdownTimer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const units = [
    { label: "يوم", value: timeLeft.days },
    { label: "ساعة", value: timeLeft.hours },
    { label: "دقيقة", value: timeLeft.minutes },
    { label: "ثانية", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-2">
      {units.map((u) => (
        <div key={u.label} className="text-center">
          <div className="bg-background/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[40px]">
            <span className="text-lg font-bold text-primary-foreground">{String(u.value).padStart(2, "0")}</span>
          </div>
          <span className="text-[10px] text-primary-foreground/70 mt-0.5">{u.label}</span>
        </div>
      ))}
    </div>
  );
};

const CouponBanner = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: coupons = [] } = useQuery({
    queryKey: ["active-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .not("season_label", "is", null)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`تم نسخ الكود: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (coupons.length === 0) return null;

  return (
    <section className="py-4">
      <div className="container">
        <div className="space-y-3">
          <AnimatePresence>
            {coupons.map((coupon, i) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-l from-primary via-primary to-primary/90 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center gap-4 border border-accent/20"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="bg-accent/20 rounded-full p-2.5">
                    <Tag className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    {coupon.season_label && (
                      <Badge className="bg-accent/20 text-accent text-[10px] mb-1">{coupon.season_label}</Badge>
                    )}
                    <h3 className="font-bold text-primary-foreground text-lg">
                      خصم {coupon.discount_percent}%
                    </h3>
                    <p className="text-primary-foreground/70 text-sm">{coupon.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {coupon.expires_at && (
                    <div className="text-center">
                      <p className="text-primary-foreground/60 text-xs flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" /> ينتهي خلال
                      </p>
                      <CountdownTimer expiresAt={coupon.expires_at} />
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-accent text-accent-foreground font-bold gap-1"
                    onClick={() => handleCopy(coupon.code)}
                  >
                    {copiedCode === coupon.code ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> {coupon.code}</>
                    )}
                  </Button>
                </div>
                {copiedCode === coupon.code && (
                  <p className="text-primary-foreground/70 text-xs mt-2 text-center md:text-end animate-in fade-in">
                    💡 الصق الكود في السلة عند إتمام الحجز للحصول على الخصم
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default CouponBanner;
