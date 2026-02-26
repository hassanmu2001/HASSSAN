import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, CalendarDays, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { useCountry } from "@/hooks/use-country";
import { toast } from "sonner";
import ServiceBookingDialog from "./ServiceBookingDialog";

interface Service {
  id: string;
  title: string;
  description: string;
  price_min: number | null;
  price_max: number | null;
  city: string | null;
  photos: string[];
  categories: { name: string; icon: string | null } | null;
  provider_id: string;
  weekend_price_increase?: number | null;
  discount_percent?: number | null;
}

interface ProviderServicesProps {
  services: Service[];
  isLoading: boolean;
  providerName?: string;
  providerId?: string;
}

const ProviderServices = ({ services, isLoading, providerName, providerId }: ProviderServicesProps) => {
  const { addItem, isInCart } = useCart();
  const { formatPrice } = useCountry();
  const [bookingService, setBookingService] = useState<Service | null>(null);

  if (isLoading) {
    return (
      <section>
        <h2 className="font-amiri text-2xl font-bold text-foreground mb-6">الخدمات المقدمة</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section>
        <h2 className="font-amiri text-2xl font-bold text-foreground mb-6">الخدمات المقدمة</h2>
        <p className="text-muted-foreground text-center py-8">لا توجد خدمات حالياً</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-amiri text-2xl font-bold text-foreground mb-6">الخدمات المقدمة</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {services.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden border-border hover:border-primary/40 transition-colors">
              {service.photos?.length > 0 && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={service.photos[0]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-foreground text-lg">{service.title}</h3>
                  {service.categories && (
                    <Badge variant="secondary" className="shrink-0">
                      {service.categories.name}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{service.description}</p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {(service.price_min || service.price_max) && (
                    <p className="text-primary font-bold text-sm">
                      {service.price_min && service.price_max
                        ? `${formatPrice(service.price_min)} - ${formatPrice(service.price_max)}`
                        : service.price_min
                        ? `من ${formatPrice(service.price_min)}`
                        : `حتى ${formatPrice(service.price_max!)}`}
                    </p>
                  )}
                  {(service.discount_percent ?? 0) > 0 && (
                    <Badge className="bg-accent/20 text-accent-foreground text-[10px]">
                      خصم {service.discount_percent}%
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Detail link */}
                  <Link to={`/service/${service.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      التفاصيل
                    </Button>
                  </Link>

                  {/* Book button */}
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex-1"
                    onClick={() => setBookingService(service)}
                  >
                    <CalendarDays className="w-3.5 h-3.5 ml-1" />
                    احجز الآن
                  </Button>

                  {/* Cart button */}
                  {providerId && (
                    <Button
                      size="sm"
                      variant={isInCart(service.id) ? "secondary" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isInCart(service.id)) return;
                        addItem({
                          serviceId: service.id,
                          title: service.title,
                          providerName: providerName ?? "مزود خدمة",
                          providerId,
                          priceMin: service.price_min,
                          priceMax: service.price_max,
                          photo: service.photos?.[0] ?? null,
                          city: service.city,
                        });
                        toast.success(`تم إضافة "${service.title}" إلى السلة`);
                      }}
                    >
                      {isInCart(service.id) ? (
                        <><Check className="w-3.5 h-3.5 ml-1" /> في السلة</>
                      ) : (
                        <><ShoppingCart className="w-3.5 h-3.5 ml-1" /> السلة</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Booking Dialog */}
      {bookingService && (
        <ServiceBookingDialog
          open={!!bookingService}
          onOpenChange={(open) => !open && setBookingService(null)}
          service={bookingService}
          providerName={providerName ?? "مزود خدمة"}
        />
      )}
    </section>
  );
};

export default ProviderServices;
