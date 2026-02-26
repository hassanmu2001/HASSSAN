import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, MessageSquare } from "lucide-react";

const AdminMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (!roleLoading && isAdmin === false) navigate("/");
  }, [authLoading, user, roleLoading, isAdmin, navigate]);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.flatMap((c) => [c.client_id, c.provider_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      const enriched = await Promise.all(
        data.map(async (conv) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id);

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            clientName: profileMap.get(conv.client_id) ?? "عميل",
            providerName: profileMap.get(conv.provider_id) ?? "مزود خدمة",
            messageCount: count ?? 0,
            lastMessage: lastMsg,
          };
        })
      );

      return enriched;
    },
    enabled: isAdmin === true,
  });

  const filtered = (conversations ?? []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.clientName.toLowerCase().includes(q) || c.providerName.toLowerCase().includes(q);
  });

  if (authLoading || roleLoading || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 md:p-10">
        <h1 className="font-amiri text-3xl font-bold text-foreground mb-8">مراقبة المحادثات</h1>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العميل أو المزود..."
            className="pr-10"
          />
        </div>

        <p className="text-muted-foreground text-sm mb-4">{filtered.length} محادثة</p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((conv) => (
              <Card key={conv.id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-light flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-foreground text-sm">{conv.clientName}</p>
                      <span className="text-muted-foreground text-xs">↔</span>
                      <p className="font-bold text-foreground text-sm">{conv.providerName}</p>
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {conv.messageCount} رسالة
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.updated_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">لا توجد محادثات</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
