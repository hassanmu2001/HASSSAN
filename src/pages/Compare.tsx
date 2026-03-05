import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/hooks/use-country";
import { useCompare } from "@/hooks/use-compare";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, Star, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ComparedService {
  id: string;
  title: string;
  provider_id: string;
  price_min?: number | null;
  price_max?: number | null;
  deposit_percent?: number | null;
  discount_percent?: number | null;
  categories?: { name?: string } | null;
  providerName: string;
  providerCity: string;
  avgRating: number;
  reviewCount: number;
}

const Compare = () => {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const { formatPrice } = useCountry();
  const { clearCompare } = useCompare();
  const navigate = useNavigate();

  const { data: services, isLoading } = useQuery({
    queryKey: ["compare-services", ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name)")
        .in("id", ids);
      if (error) throw error;

      const providerIds = [...new Set(data.map((s) => s.provider_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, city")
        .in("user_id", providerIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

      // Get ratings
      const { data: reviews } = await supabase
        .from("reviews")
        .select("service_id, rating")
        .in("service_id", ids);
      const ratingMap = new Map<string, { sum: number; count: number }>();
      (reviews ?? []).forEach((r) => {
        const e = ratingMap.get(r.service_id) ?? { sum: 0, count: 0 };
        e.sum += r.rating;
        e.count++;
        ratingMap.set(r.service_id, e);
      });

      return data.map((s) => {
        const profile = profileMap.get(s.provider_id);
        const rating = ratingMap.get(s.id);
        return {
          ...s,
          providerName: profile?.full_name ?? "مزود",
          providerCity: profile?.city ?? s.city ?? "",
          avgRating: rating ? rating.sum / rating.count : 0,
          reviewCount: rating?.count ?? 0,
        };
      });
    },
    enabled: ids.length >= 2,
  });

  const rows = [
    { label: "المزود", render: (s: ComparedService) => s.providerName },
    { label: "المدينة", render: (s: ComparedService) => s.providerCity || "—" },
    { label: "التقييم", render: (s: ComparedService) => s.avgRating > 0 ? `${s.avgRating.toFixed(1)} ⭐ (${s.reviewCount})` : "لا تقييمات" },
    { label: "السعر من", render: (s: ComparedService) => formatPrice(s.price_min ?? 0) },
    { label: "السعر إلى", render: (s: ComparedService) => s.price_max ? formatPrice(s.price_max) : "—" },
    { label: "العربون", render: (s: ComparedService) => s.deposit_percent ? `${s.deposit_percent}%` : "—" },
    { label: "الخصم", render: (s: ComparedService) => s.discount_percent ? `${s.discount_percent}%` : "—" },
    { label: "الفئة", render: (s: ComparedService) => s.categories?.name ?? "—" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="bg-gradient-to-bl from-purple-deep via-purple-rich to-purple-deep py-12">
        <div className="container text-center">
          <Scale className="w-10 h-10 mx-auto text-gold mb-3" />
          <h1 className="font-amiri text-3xl md:text-4xl font-bold text-primary-foreground mb-2">مقارنة الخدمات</h1>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          {isLoading ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : !services || services.length < 2 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">اختر خدمتين على الأقل للمقارنة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-right text-sm font-medium text-muted-foreground border-b border-border w-32"></th>
                    {services.map((s) => (
                      <th key={s.id} className="p-3 text-center border-b border-border min-w-[200px]">
                        <Card
                          className="p-4 cursor-pointer hover:border-gold/30 transition-all"
                          onClick={() => navigate(`/service/${s.id}`)}
                        >
                          <h3 className="font-bold text-foreground text-sm">{s.title}</h3>
                        </Card>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-3 text-sm font-medium text-foreground border-b border-border">{row.label}</td>
                      {services.map((s) => (
                        <td key={s.id} className="p-3 text-center text-sm text-foreground border-b border-border">
                          {row.render(s)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => { clearCompare(); navigate(-1); }}>
                  <X className="w-4 h-4 ml-1" /> مسح المقارنة
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Compare;
