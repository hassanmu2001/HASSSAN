import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

const TYPE_LABELS: Record<string, string> = {
  all: "الكل",
  booking: "الحجوزات",
  message: "الرسائل",
  review: "التقييمات",
  system: "النظام",
};

const Notifications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
    };
    fetch();

    const channel = supabase
      .channel("notifications-page")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const filtered = activeTab === "all" ? notifications : notifications.filter((n) => n.type === activeTab);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const types = ["all", ...Array.from(new Set(notifications.map((n) => n.type)))];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">الإشعارات</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} غير مقروء</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 ml-2" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            {types.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TYPE_LABELS[t] || t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            {filtered.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد إشعارات</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filtered.map((n) => (
                  <Card
                    key={n.id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-accent/5 ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                          <p className="font-semibold text-sm">{n.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{n.message}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {TYPE_LABELS[n.type] || n.type}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(n.created_at), "d MMM yyyy", { locale: ar })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(n.created_at), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
