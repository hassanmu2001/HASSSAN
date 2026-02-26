import { motion } from "framer-motion";
import { Search, Building2, UtensilsCrossed, Flower2, Music, PartyPopper, Camera, Car, Sparkles, Mail, Cake, Sparkle, ClipboardList, Gamepad2, Gift, Printer, Shirt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import CouponBanner from "@/components/CouponBanner";

const categoryKeys = [
  { id: "halls", icon: Building2 },
  { id: "catering", icon: UtensilsCrossed },
  { id: "flowers", icon: Flower2 },
  { id: "sound", icon: Music },
  { id: "zaffa", icon: PartyPopper },
  { id: "photography", icon: Camera },
  { id: "transport", icon: Car },
  { id: "stage-decor", icon: Sparkles },
  { id: "invitations", icon: Mail },
  { id: "cakes", icon: Cake },
  { id: "makeup", icon: Sparkle },
  { id: "event-planning", icon: ClipboardList },
  { id: "entertainment", icon: Gamepad2 },
  { id: "gifts", icon: Gift },
  { id: "printing", icon: Printer },
  { id: "wedding-attire", icon: Shirt },
];

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep py-24 md:py-36">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-gold-light blur-3xl" />
        </div>

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-amiri text-5xl md:text-7xl font-bold text-primary-foreground mb-4">
              {t("home.hero_title")}
            </h1>
            <div className="w-24 h-1 bg-gold mx-auto mb-6 rounded-full" />
            <p className="text-xl md:text-2xl text-gold-light font-light max-w-2xl mx-auto mb-10">
              {t("home.hero_subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="flex gap-2 bg-card/10 backdrop-blur-md p-2 rounded-xl border border-gold/20">
              <Input
                placeholder={t("home.search_placeholder")}
                className="bg-card/90 border-0 text-foreground placeholder:text-muted-foreground h-12 text-base"
              />
              <Button size="lg" className="bg-gold hover:bg-gold-dark text-purple-deep font-bold px-6 h-12">
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Coupons / Seasonal Offers */}
      <CouponBanner />

      {/* Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-amiri text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("home.categories_title")}
            </h2>
            <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categoryKeys.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onClick={() => navigate(`/category/${cat.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative bg-card rounded-xl p-6 text-center border border-border hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-1">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-light flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <cat.icon className="w-8 h-8 text-primary group-hover:text-gold-dark transition-colors" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1 text-sm md:text-base">{t(`categories.${cat.id}`)}</h3>
                  <p className="text-xs text-muted-foreground hidden md:block">{t(`categories.${cat.id}_desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-bl from-purple-deep to-purple-rich">
        <div className="container text-center">
          <h2 className="font-amiri text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t("home.cta_title")}
          </h2>
          <p className="text-gold-light text-lg mb-8 max-w-lg mx-auto">
            {t("home.cta_subtitle")}
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-gold hover:bg-gold-dark text-purple-deep font-bold text-lg px-10 h-14"
          >
            {t("home.cta_button")}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-deep py-8 text-center">
        <p className="text-gold-light/60 text-sm">
          {t("home.footer")}
        </p>
      </footer>
    </div>
  );
};

export default Index;
