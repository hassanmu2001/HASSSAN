import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProviderHero from "@/components/provider/ProviderHero";
import ProviderServices from "@/components/provider/ProviderServices";
import ProviderReviews from "@/components/provider/ProviderReviews";
import ReviewForm from "@/components/provider/ReviewForm";
import ProviderPortfolio from "@/components/provider/ProviderPortfolio";
import ProviderStories from "@/components/provider/ProviderStories";
import { Skeleton } from "@/components/ui/skeleton";

const ProviderProfile = () => {
  const { providerId } = useParams<{ providerId: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["provider-profile", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", providerId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["provider-services", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name, icon)")
        .eq("provider_id", providerId!)
        .eq("is_active", true);
      // Ensure provider_id is included for booking
      return (data ?? []).map((s) => ({ ...s, provider_id: s.provider_id }));
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  const serviceIds = services?.map((s) => s.id) ?? [];

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["provider-reviews", serviceIds],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .in("service_id", serviceIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch reviewer profiles
      const reviewerIds = [...new Set(reviewsData.map((r) => r.reviewer_id))];
      const { data: reviewerProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", reviewerIds);

      const profileMap = new Map(
        (reviewerProfiles ?? []).map((p) => [p.user_id, p])
      );

      return reviewsData.map((r) => ({
        ...r,
        profiles: profileMap.get(r.reviewer_id) ?? null,
      }));
    },
    enabled: serviceIds.length > 0,
  });

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <h2 className="font-amiri text-3xl text-foreground">لم يتم العثور على مزود الخدمة</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ProviderHero profile={profile} avgRating={avgRating} reviewCount={reviews?.length ?? 0} />
      <div className="container py-10 space-y-12">
        {/* Stories */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <ProviderStories
            providerId={providerId!}
            providerName={profile.full_name}
            avatarUrl={profile.avatar_url}
          />
        </div>
        <ProviderPortfolio providerId={providerId!} />
        <ProviderServices services={services ?? []} isLoading={servicesLoading} providerName={profile.full_name} providerId={providerId} />
        <ReviewForm
          services={(services ?? []).map((s) => ({ id: s.id, title: s.title }))}
          providerId={providerId!}
        />
        <ProviderReviews reviews={reviews ?? []} isLoading={reviewsLoading} />
      </div>
    </div>
  );
};

export default ProviderProfile;
