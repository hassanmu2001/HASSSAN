import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, ArrowRight, CalendarDays, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import ServiceBookingDialog from "@/components/provider/ServiceBookingDialog";
import ReviewForm from "@/components/provider/ReviewForm";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import ServiceQA from "@/components/ServiceQA";

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user } = useAuth();
  const { formatPrice, selectedCountry } = useCountry();
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const [preSelectedOptionId, setPreSelectedOptionId] = useState<string>("");
  const [activePhoto, setActivePhoto] = useState(0);

  // Track service view
  useEffect(() => {
    if (!serviceId) return;
    supabase.from("service_views").insert({
      service_id: serviceId,
      viewer_id: user?.id ?? null,
    }).then();
  }, [serviceId, user?.id]);

  const { data: service, isLoading } = useQuery({
    queryKey: ["service-detail", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name, icon)")
        .eq("id", serviceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  const { data: provider } = useQuery({
    queryKey: ["service-provider", service?.provider_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", service!.provider_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!service?.provider_id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["service-reviews", serviceId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("service_id", serviceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!reviewsData?.length) return [];
      // Fetch reviewer profiles
      const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", reviewerIds);
      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));
      return reviewsData.map(r => ({
        ...r,
        profiles: profileMap.get(r.reviewer_id) ?? null,
      }));
    },
    enabled: !!serviceId,
  });

  const { data: options = [] } = useQuery({
    queryKey: ["service-options-detail", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_options")
        .select("*, service_price_tiers(*)")
        .eq("service_id", serviceId!)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">لم يتم العثور على الخدمة</p>
          <Button variant="link" onClick={() => navigate(-1)}>العودة</Button>
        </div>
      </div>
    );
  }

  const photos = service.photos ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1">
          <ArrowRight className="w-4 h-4" />
          العودة
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo gallery */}
            {photos.length > 0 ? (
              <div className="space-y-3">
                <motion.div
                  key={activePhoto}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-video rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={photos[activePhoto]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((photo: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                          i === activePhoto ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Title + info */}
            <div>
              <div className="flex items-start gap-3 flex-wrap mb-2">
                <h1 className="font-amiri text-3xl font-bold text-foreground">{service.title}</h1>
                {service.categories && (
                  <Badge variant="secondary">{service.categories.name}</Badge>
                )}
                {(service.discount_percent ?? 0) > 0 && (
                  <Badge className="bg-accent/20 text-accent-foreground">خصم {service.discount_percent}%</Badge>
                )}
              </div>
              {service.city && (
                <p className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {service.city}
                </p>
              )}
              <p className="text-foreground leading-relaxed whitespace-pre-line">{service.description}</p>
            </div>

            {/* Options & pricing */}
            {options.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="font-amiri text-xl font-bold text-foreground mb-4">الأصناف والأسعار</h2>
                  <div className="space-y-3">
                    {options.map((opt: any) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setPreSelectedOptionId(opt.id);
                          setShowBooking(true);
                        }}
                        className="border border-border rounded-lg p-4 text-right w-full hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="secondary" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            اختر واحجز
                          </Badge>
                          <h3 className="font-bold text-foreground">{opt.name}</h3>
                        </div>
                        {opt.description && (
                          <p className="text-sm text-muted-foreground mb-2">{opt.description}</p>
                        )}
                        {opt.service_price_tiers?.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {opt.service_price_tiers
                              .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
                              .map((tier: any) => (
                                <Badge key={tier.id} variant="outline" className="text-xs">
                                  {tier.max_quantity
                                    ? `${tier.min_quantity}-${tier.max_quantity}`
                                    : `${tier.min_quantity}+`}
                                  : {formatPrice(tier.price_per_unit)}/وحدة
                                </Badge>
                              ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reviews */}
            <Separator />
            <div>
              <h2 className="font-amiri text-xl font-bold text-foreground mb-4">
                التقييمات ({reviews.length})
              </h2>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">لا توجد تقييمات بعد</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => {
                    const name = review.profiles?.full_name ?? "مستخدم";
                    const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                    return (
                      <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-bold text-foreground text-sm">{name}</p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(review.created_at).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground text-sm">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {user && service && (
                <div className="mt-6">
                  <ReviewForm
                    services={[{ id: service.id, title: service.title }]}
                    providerId={service.provider_id}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-card border border-border rounded-xl p-6 sticky top-4 space-y-4">
              <div>
                {(service.price_min || service.price_max) && (
                  <p className="text-2xl font-bold text-primary">
                    {service.price_min && service.price_max
                      ? `${formatPrice(service.price_min)} - ${formatPrice(service.price_max)}`
                      : service.price_min
                      ? `من ${formatPrice(service.price_min)}`
                      : `حتى ${formatPrice(service.price_max!)}`}
                  </p>
                )}
                {avgRating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-bold text-sm">{avgRating}</span>
                    <span className="text-muted-foreground text-xs">({reviews.length} تقييم)</span>
                  </div>
                )}
              </div>

              {service.deposit_percent > 0 && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 text-center">
                  عربون {service.deposit_percent}% مطلوب لتأكيد الحجز
                </p>
              )}

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-base"
                onClick={() => setShowBooking(true)}
              >
                <CalendarDays className="w-5 h-5 ml-2" />
                احجز الآن
              </Button>

              {/* Provider card */}
              {provider && (
                <>
                  <Separator />
                  <Link
                    to={`/provider/${service.provider_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={provider.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-muted text-sm">
                        {provider.full_name?.[0] ?? "م"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        {provider.business_name || provider.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">عرض الملف الشخصي</p>
                    </div>
                  </Link>
                </>
              )}

              {/* Availability Calendar */}
              <AvailabilityCalendar serviceId={service.id} />
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <Separator className="mb-6" />
          <ServiceQA serviceId={service.id} providerId={service.provider_id} />
        </div>
      </div>

      {/* Booking dialog */}
      {showBooking && (
        <ServiceBookingDialog
          open={showBooking}
          onOpenChange={(open) => {
            setShowBooking(open);
            if (!open) setPreSelectedOptionId("");
          }}
          service={service}
          providerName={provider?.business_name || provider?.full_name || "مزود خدمة"}
          defaultOptionId={preSelectedOptionId}
        />
      )}
    </div>
  );
};

export default ServiceDetail;
