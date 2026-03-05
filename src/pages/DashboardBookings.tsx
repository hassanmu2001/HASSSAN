import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, MessageSquare, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "معلّق", variant: "outline" },
  confirmed: { label: "مؤكد", variant: "default" },
  cancelled: { label: "ملغي", variant: "destructive" },
  completed: { label: "مكتمل", variant: "secondary" },
};

const DashboardBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCountry();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isProvider = profile?.user_type === "provider";

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id, isProvider],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select("*, services(title, photos, deposit_percent)")
        .order("created_at", { ascending: false });

      if (isProvider) {
        query = query.eq("provider_id", user!.id);
      } else {
        query = query.eq("client_id", user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch client/provider profiles
      const userIds = data.map((b) => (isProvider ? b.client_id : b.provider_id));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, business_name, avatar_url")
        .in("user_id", userIds);

      return data.map((b) => ({
        ...b,
        otherProfile: profiles?.find((p) => p.user_id === (isProvider ? b.client_id : b.provider_id)),
      }));
    },
    enabled: !!user && profile !== undefined,
  });

  // Realtime subscription for new bookings
  useEffect(() => {
    if (!user || !isProvider) return;

    const channel = supabase
      .channel("provider-bookings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `provider_id=eq.${user.id}`,
        },
        (payload) => {
          toast.info("📩 حجز جديد!", { description: "لديك طلب حجز جديد في انتظار موافقتك" });
          queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isProvider, queryClient]);

  // Realtime subscription for client: toast on booking status change
  useEffect(() => {
    if (!user || isProvider === undefined || isProvider) return;

    const channel = supabase
      .channel("client-booking-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `client_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as Record<string, unknown>).status;
          if (newStatus === "confirmed") {
            toast.success("✅ تم تأكيد حجزك!");
          } else if (newStatus === "cancelled") {
            toast.error("❌ تم رفض حجزك");
          }
          queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isProvider, queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);
      if (error) throw error;

      // Send notification
      supabase.functions.invoke("send-booking-notification", {
        body: { bookingId, newStatus: status },
      }).catch(console.error);
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      const msg = status === "confirmed" ? "تم تأكيد الحجز" : status === "cancelled" ? "تم إلغاء الحجز" : "تم تحديث الحالة";
      toast.success(msg);
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const filteredBookings = bookings.filter((b) => {
    if (tab === "all") return true;
    return b.status === tab;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  if (authLoading) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="font-amiri text-3xl font-bold text-foreground">
              {isProvider ? "الحجوزات الواردة" : "حجوزاتي"}
            </h1>
            {pendingCount > 0 && (
              <Badge className="bg-accent text-accent-foreground">
                <Bell className="w-3 h-3 ml-1" />
                {pendingCount} جديد
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} dir="rtl">
          <TabsList className="mb-6 bg-muted/50">
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="w-3.5 h-3.5" />
              معلّق
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              مؤكد
            </TabsTrigger>
            <TabsTrigger value="cancelled">ملغي</TabsTrigger>
            <TabsTrigger value="all">الكل</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : filteredBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">لا توجد حجوزات</p>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => {
                  const sConfig = statusConfig[booking.status] ?? statusConfig.pending;
                  const depositPercent = booking.services?.deposit_percent ?? 0;
                  const depositAmount = depositPercent > 0 ? (booking.total * depositPercent / 100) : 0;
                  const selectedOpts = (booking.selected_options as { name: string; option_id: string; quantity: number }[]) ?? [];

                  return (
                    <Card key={booking.id} className="border-border">
                      <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Photo */}
                          {booking.services?.photos?.[0] && (
                            <div className="w-full md:w-28 h-20 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={booking.services.photos[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-bold text-foreground">
                                  {booking.services?.title ?? "خدمة"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {isProvider ? "العميل" : "المزود"}:{" "}
                                  {booking.otherProfile?.business_name || booking.otherProfile?.full_name || "—"}
                                </p>
                              </div>
                              <Badge variant={sConfig.variant}>{sConfig.label}</Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                              <span>
                                📅 {format(new Date(booking.booking_date + "T00:00:00"), "d MMMM yyyy", { locale: ar })}
                              </span>
                              {booking.guest_count && <span>👥 {booking.guest_count} ضيف</span>}
                              {selectedOpts.length > 0 && (
                                <span>🏷️ {selectedOpts.map((o) => o.name).join(", ")}</span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-bold text-primary">
                                الإجمالي: {formatPrice(booking.total ?? 0)}
                              </span>
                              {depositPercent > 0 && (
                                <span className="text-muted-foreground">
                                  العربون ({depositPercent}%): {formatPrice(depositAmount)}
                                </span>
                              )}
                              {booking.discount_percent > 0 && (
                                <Badge variant="outline" className="text-xs">خصم {booking.discount_percent}%</Badge>
                              )}
                            </div>

                            {booking.notes && (
                              <p className="text-xs text-muted-foreground mt-1">📝 {booking.notes}</p>
                            )}

                            {/* Actions */}
                            {booking.status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                {isProvider && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          bookingId: booking.id,
                                          status: "confirmed",
                                        })
                                      }
                                      disabled={updateStatusMutation.isPending}
                                      className="bg-primary text-primary-foreground gap-1"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      قبول
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          bookingId: booking.id,
                                          status: "cancelled",
                                        })
                                      }
                                      disabled={updateStatusMutation.isPending}
                                      className="gap-1"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      رفض
                                    </Button>
                                  </>
                                )}
                                {!isProvider && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        bookingId: booking.id,
                                        status: "cancelled",
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    إلغاء الحجز
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate("/messages")}
                                  className="gap-1"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  مراسلة
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBookings;
