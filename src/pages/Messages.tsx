import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/Navbar";
import ConversationList from "@/components/messaging/ConversationList";
import ChatPanel from "@/components/messaging/ChatPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conv")
  );

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`client_id.eq.${user!.id},provider_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Fetch partner profiles
      const partnerIds = data.map((c) =>
        c.client_id === user!.id ? c.provider_id : c.client_id
      );
      const uniqueIds = [...new Set(partnerIds)];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", uniqueIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      // Get last message and unread count per conversation
      const enriched = await Promise.all(
        data.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user!.id);

          const partnerId = conv.client_id === user!.id ? conv.provider_id : conv.client_id;

          return {
            ...conv,
            partner: profileMap.get(partnerId) ?? { full_name: "مستخدم", avatar_url: null, user_id: partnerId },
            lastMessage: lastMsg,
            unreadCount: count ?? 0,
          };
        })
      );

      return enriched;
    },
    enabled: !!user,
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        {/* Conversations sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-l border-border bg-card flex flex-col shrink-0 ${selectedConversationId ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <h1 className="font-amiri text-xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              الرسائل
            </h1>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <ConversationList
              conversations={conversations ?? []}
              selectedId={selectedConversationId}
              onSelect={setSelectedConversationId}
              currentUserId={user!.id}
            />
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${selectedConversationId ? "flex" : "hidden md:flex"}`}>
          {selectedConversationId && user ? (
            <ChatPanel
              conversationId={selectedConversationId}
              currentUserId={user.id}
              onBack={() => setSelectedConversationId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">اختر محادثة للبدء</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
