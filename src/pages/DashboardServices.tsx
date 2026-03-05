import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ServiceForm from "@/components/dashboard/ServiceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ServiceRow = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  city: string | null;
  price_min: number | null;
  price_max: number | null;
  photos: string[] | null;
  is_approved: boolean | null;
  is_active: boolean | null;
  categories: { name: string } | null;
};

const DashboardServices = () => {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: services, isLoading } = useQuery({
    queryKey: ["my-services", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*, categories(name)")
        .eq("provider_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ServiceRow[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase.from("services").delete().eq("id", serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      toast.success("تم حذف الخدمة بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });

  const handleEdit = (service: ServiceRow) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingService(null);
  };

  if (authLoading) return null;

  if (showForm) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-10">
          <ServiceForm
            service={editingService}
            onClose={handleFormClose}
            userId={user!.id}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-amiri text-3xl font-bold text-foreground">خدماتي</h1>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gold hover:bg-gold-dark text-purple-deep font-bold"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة خدمة
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : services && services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Photo thumbnail */}
                    {service.photos && service.photos.length > 0 && (
                      <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={service.photos[0]}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{service.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-1">
                            {service.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={service.is_approved ? "default" : "secondary"}>
                            {service.is_approved ? "معتمد" : "قيد المراجعة"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {service.categories && (
                            <Badge variant="outline">{service.categories.name}</Badge>
                          )}
                          {service.price_min != null && (
                            <span className="text-gold-dark font-bold">
                              {formatPrice(service.price_min ?? 0)}
                              {service.price_max ? ` - ${formatPrice(service.price_max)}` : ""}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/services/${service.id}`)}
                            className="gap-1 text-xs"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            إدارة
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(service)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الخدمة</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف "{service.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(service.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">لا توجد خدمات بعد</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gold hover:bg-gold-dark text-purple-deep font-bold"
            >
              <Plus className="w-4 h-4 ml-2" />
              أضف خدمتك الأولى
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardServices;
