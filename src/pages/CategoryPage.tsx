import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useCountry } from "@/hooks/use-country";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import CityPickerGrid from "@/components/CityPickerGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Star, SlidersHorizontal, Sparkles, Shield, X, ShoppingCart, Check, Scale } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { useCompare } from "@/hooks/use-compare";
import { Building2, UtensilsCrossed, Flower2, Music, PartyPopper, Camera, Car, Sparkles as SparklesIcon2, Mail, Cake, Sparkle, ClipboardList, Gamepad2, Gift, Printer } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";

const iconMap: Record<string, React.ElementType> = {
  Building2, UtensilsCrossed, Flower2, Music, PartyPopper, Camera, Car, Sparkles: SparklesIcon2, Mail, Cake, Sparkle, ClipboardList, Gamepad2, Gift, Printer,
};

type SortBy = "rating" | "admin_rating" | "price_low" | "price_high" | "ai";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, isInCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();
  const { selectedCountry, cities: countryCities, formatPrice } = useCountry();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("rating");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiSortedIds, setAiSortedIds] = useState<string[] | null>(null);
  const [aiReason, setAiReason] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch category
  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["category-services", category?.id, selectedCountry?.code],
    queryFn: async () => {
      let query = supabase
        .from("services")
        .select("*")
        .eq("category_id", category!.id)
        .eq("is_active", true)
        .eq("is_approved", true);
      
      if (selectedCountry) {
        query = query.eq("country_code", selectedCountry.code);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!category,
  });

  // Fetch provider profiles
  const providerIds = useMemo(
    () => [...new Set(services?.map((s) => s.provider_id) ?? [])],
    [services]
  );

  const { data: profiles } = useQuery({
    queryKey: ["provider-profiles", providerIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, city")
        .in("user_id", providerIds);
      if (error) throw error;
      return data;
    },
    enabled: providerIds.length > 0,
  });

  // Fetch reviews
  const serviceIds = useMemo(() => services?.map((s) => s.id) ?? [], [services]);

  const { data: reviews } = useQuery({
    queryKey: ["category-reviews", serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("service_id, rating")
        .in("service_id", serviceIds);
      if (error) throw error;
      return data;
    },
    enabled: serviceIds.length > 0,
  });

  // Build enriched list
  const profileMap = useMemo(
    () => new Map((profiles ?? []).map((p) => [p.user_id, p])),
    [profiles]
  );

  const ratingMap = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    (reviews ?? []).forEach((r) => {
      const entry = map.get(r.service_id) ?? { sum: 0, count: 0 };
      entry.sum += r.rating;
      entry.count += 1;
      map.set(r.service_id, entry);
    });
    return map;
  }, [reviews]);

  const enrichedServices = useMemo(() => {
    return (services ?? []).map((s) => {
      const profile = profileMap.get(s.provider_id);
      const rating = ratingMap.get(s.id);
      return {
        ...s,
        providerName: profile?.full_name ?? t("category_page.provider"),
        providerAvatar: profile?.avatar_url ?? null,
        providerCity: profile?.city ?? s.city ?? "",
        avgRating: rating ? rating.sum / rating.count : 0,
        reviewCount: rating?.count ?? 0,
        adminRating: (s as { admin_rating?: number }).admin_rating ?? null,
      };
    });
  }, [services, profileMap, ratingMap, t]);

  // Use country cities for filter
  const cities = useMemo(() => {
    return countryCities.map(c => c.name);
  }, [countryCities]);

  // Max price for slider
  const maxPrice = useMemo(() => {
    const max = Math.max(...enrichedServices.map((s) => s.price_max ?? s.price_min ?? 0), 1000);
    return Math.ceil(max / 1000) * 1000;
  }, [enrichedServices]);

  // AI smart filter
  const handleAiFilter = useCallback(async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setSortBy("ai");
    try {
      const payload = enrichedServices.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        price_min: s.price_min,
        price_max: s.price_max,
        avgRating: s.avgRating,
        adminRating: s.adminRating,
        city: s.providerCity || s.city,
      }));

      const { data, error } = await supabase.functions.invoke("smart-filter", {
        body: { query: aiQuery, services: payload },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.sortedIds) {
        setAiSortedIds(data.sortedIds);
        setAiReason(data.reason ?? "");
        toast.success(t("category_page.ai_button"));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
      setSortBy("rating");
    } finally {
      setAiLoading(false);
    }
  }, [aiQuery, enrichedServices, t]);

  // Apply filters
  const filteredServices = useMemo(() => {
    let result = enrichedServices;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.providerName.toLowerCase().includes(q)
      );
    }

    if (cityFilter && cityFilter !== "all") {
      result = result.filter(
        (s) => s.providerCity === cityFilter || s.city === cityFilter
      );
    }

    if (minRating > 0) {
      result = result.filter((s) => s.avgRating >= minRating);
    }

    if (priceRange[0] > 0 || priceRange[1] < maxPrice) {
      result = result.filter((s) => {
        const price = s.price_min ?? 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Sort
    if (sortBy === "ai" && aiSortedIds) {
      const idxMap = new Map(aiSortedIds.map((id, i) => [id, i]));
      result = [...result].sort(
        (a, b) => (idxMap.get(a.id) ?? 999) - (idxMap.get(b.id) ?? 999)
      );
    } else {
      result = [...result].sort((a, b) => {
        if (sortBy === "rating") return b.avgRating - a.avgRating;
        if (sortBy === "admin_rating") return (b.adminRating ?? 0) - (a.adminRating ?? 0);
        if (sortBy === "price_low") return (a.price_min ?? 0) - (b.price_min ?? 0);
        if (sortBy === "price_high") return (b.price_min ?? 0) - (a.price_min ?? 0);
        return 0;
      });
    }

    return result;
  }, [enrichedServices, searchQuery, cityFilter, sortBy, minRating, priceRange, maxPrice, aiSortedIds]);

  const isLoading = catLoading || servicesLoading;
  const IconComp = category?.icon ? iconMap[category.icon] : null;

  const clearFilters = () => {
    setSearchQuery("");
    setCityFilter("all");
    setSortBy("rating");
    setMinRating(0);
    setPriceRange([0, maxPrice]);
    setAiSortedIds(null);
    setAiReason("");
    setAiQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
        </div>
        <div className="container relative z-10 text-center">
          {catLoading ? (
            <Skeleton className="h-10 w-48 mx-auto" />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {IconComp && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                  <IconComp className="w-8 h-8 text-gold" />
                </div>
              )}
              <h1 className="font-amiri text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                {category?.name}
              </h1>
              <p className="text-gold-light">{category?.description}</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* AI Smart Search */}
      <section className="py-4 bg-gradient-to-l from-gold/5 to-transparent border-b border-border">
        <div className="container">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold shrink-0" />
            <Input
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder={t("category_page.ai_placeholder")}
              className="flex-1 border-gold/20 focus-visible:ring-gold/30"
              onKeyDown={(e) => e.key === "Enter" && handleAiFilter()}
            />
            <Button
              onClick={handleAiFilter}
              disabled={aiLoading || !aiQuery.trim()}
              className="bg-gold hover:bg-gold-dark text-purple-deep font-bold shrink-0"
              size="sm"
            >
              {aiLoading ? t("category_page.ai_loading") : t("category_page.ai_button")}
            </Button>
          </div>
          {aiReason && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-gold-dark mt-2 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiReason}
            </motion.p>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 border-b border-border bg-card">
        <div className="container">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("category_page.search_placeholder")}
                className="pr-10"
              />
            </div>

            {/* City filter moved below as grid */}

            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortBy); setAiSortedIds(null); }}>
              <SelectTrigger className="w-full md:w-48">
                <SlidersHorizontal className="w-4 h-4 ml-2 text-muted-foreground" />
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t("category_page.sort_rating")}</SelectItem>
                <SelectItem value="admin_rating">{t("category_page.sort_admin")}</SelectItem>
                <SelectItem value="price_low">{t("category_page.sort_price_low")}</SelectItem>
                <SelectItem value="price_high">{t("category_page.sort_price_high")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "border-gold text-gold" : ""}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Min user rating */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-gold" />
                    {t("category_page.min_rating")}
                  </label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[minRating]}
                      onValueChange={(v) => setMinRating(v[0])}
                      min={0}
                      max={5}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold text-foreground w-8 text-center">
                      {minRating > 0 ? minRating : t("category_page.all")}
                    </span>
                  </div>
                </div>

                {/* Price range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("category_page.price_range")} ({selectedCountry?.currency_symbol ?? "ر.س"})
                  </label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={priceRange}
                      onValueChange={(v) => setPriceRange(v as [number, number])}
                      min={0}
                      max={maxPrice}
                      step={100}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-28 text-center" dir="ltr">
                      {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="w-3.5 h-3.5 ml-1" />
                  {t("category_page.clear_filters")}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* City Grid Picker */}
      {cities.length > 0 && (
        <section className="py-4 border-b border-border bg-card/50">
          <div className="container">
            <CityPickerGrid cities={cities} selected={cityFilter} onSelect={setCityFilter} />
          </div>
        </section>
      )}

      {/* Results */}
      <section className="py-8">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredServices.length > 0 ? (
            <>
              <p className="text-muted-foreground text-sm mb-6">
                {t("category_page.results_count", { count: filteredServices.length })}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service, i) => {
                  const initials = service.providerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="overflow-hidden border-border hover:border-gold/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-gold/5 hover:-translate-y-1"
                        onClick={() => navigate(`/provider/${service.provider_id}`)}
                      >
                        {/* Photo */}
                        {service.photos && service.photos.length > 0 ? (
                          <div className="h-44 overflow-hidden relative">
                            <img
                              src={service.photos[0]}
                              alt={service.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {/* Admin rating badge */}
                            {service.adminRating != null && service.adminRating > 0 && (
                              <div className="absolute top-2 left-2 bg-purple-deep/90 text-gold px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold backdrop-blur-sm">
                                <Shield className="w-3 h-3" />
                                {service.adminRating.toFixed(1)}
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                              <FavoriteButton serviceId={service.id} className="bg-black/30 backdrop-blur-sm hover:bg-black/50" />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); addToCompare(service.id); }}
                                className={`w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 ${isInCompare(service.id) ? "text-gold" : "text-primary-foreground"}`}
                              >
                                <Scale className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-44 bg-purple-light flex items-center justify-center relative">
                            {IconComp && <IconComp className="w-12 h-12 text-primary/30" />}
                            {service.adminRating != null && service.adminRating > 0 && (
                              <div className="absolute top-2 left-2 bg-purple-deep/90 text-gold px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold">
                                <Shield className="w-3 h-3" />
                                {service.adminRating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        )}

                        <CardContent className="p-5">
                          {/* Provider info */}
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={service.providerAvatar ?? undefined} />
                              <AvatarFallback className="bg-purple-light text-primary text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{service.providerName}</span>
                          </div>

                          <h3 className="font-bold text-foreground mb-1">{service.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {service.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {service.reviewCount > 0 && (
                                <span className="flex items-center gap-1 text-sm">
                                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                                  <span className="text-foreground font-bold">
                                    {service.avgRating.toFixed(1)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ({service.reviewCount})
                                  </span>
                                </span>
                              )}
                              {(service.providerCity || service.city) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {service.providerCity || service.city}
                                </span>
                              )}
                            </div>

                            {service.price_min != null && service.price_min > 0 && (
                              <span className="text-gold-dark font-bold text-sm">
                                {formatPrice(service.price_min)}
                                {service.price_max && service.price_max > service.price_min
                                  ? ` - ${formatPrice(service.price_max)}`
                                  : ""}
                              </span>
                            )}
                          </div>

                          {/* Add to cart */}
                          <Button
                            size="sm"
                            variant={isInCart(service.id) ? "secondary" : "default"}
                            className={`w-full mt-3 ${isInCart(service.id) ? "" : "bg-gold hover:bg-gold-dark text-purple-deep font-bold"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInCart(service.id)) return;
                              addItem({
                                serviceId: service.id,
                                title: service.title,
                                providerName: service.providerName,
                                providerId: service.provider_id,
                                priceMin: service.price_min,
                                priceMax: service.price_max,
                                photo: service.photos?.[0] ?? null,
                                city: service.providerCity || service.city,
                              });
                              toast.success(t("category_page.added_to_cart", { title: service.title }));
                            }}
                          >
                            {isInCart(service.id) ? (
                              <><Check className="w-3.5 h-3.5 ml-1" /> {t("category_page.in_cart")}</>
                            ) : (
                              <><ShoppingCart className="w-3.5 h-3.5 ml-1" /> {t("category_page.add_to_cart")}</>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">{t("category_page.no_results")}</p>
              {(searchQuery || cityFilter !== "all" || minRating > 0) && (
                <Button variant="link" onClick={clearFilters} className="text-gold mt-2">
                  {t("category_page.clear_all")}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-deep py-8 text-center">
        <p className="text-gold-light/60 text-sm">{t("home.footer")}</p>
      </footer>
    </div>
  );
};

export default CategoryPage;
