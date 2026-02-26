import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityTab from "@/components/dashboard/service-manage/AvailabilityTab";
import OptionsTab from "@/components/dashboard/service-manage/OptionsTab";
import DiscountTab from "@/components/dashboard/service-manage/DiscountTab";

const DashboardServiceManage = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: service, isLoading } = useQuery({
    queryKey: ["manage-service", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name)")
        .eq("id", serviceId!)
        .eq("provider_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!serviceId,
  });

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/services")}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          {isLoading ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            <div>
              <h1 className="font-amiri text-2xl font-bold text-foreground">
                إدارة: {service?.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {service?.categories?.name} · {service?.city}
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : service ? (
          <Tabs defaultValue="availability" dir="rtl" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-muted/50">
              <TabsTrigger value="availability">تقويم التوفر</TabsTrigger>
              <TabsTrigger value="options">الأصناف والأسعار</TabsTrigger>
              <TabsTrigger value="discount">الخصومات</TabsTrigger>
            </TabsList>

            <TabsContent value="availability">
              <AvailabilityTab serviceId={service.id} />
            </TabsContent>

            <TabsContent value="options">
              <OptionsTab serviceId={service.id} />
            </TabsContent>

            <TabsContent value="discount">
              <DiscountTab service={service} />
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center text-muted-foreground py-16">لم يتم العثور على الخدمة</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardServiceManage;
