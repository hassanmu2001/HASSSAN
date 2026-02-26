import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Send, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import QuickReplies from "@/components/QuickReplies";

interface ChatPanelProps {
  conversationId: string;
  currentUserId: string;
  onBack: () => void;
}

const ChatPanel = ({ conversationId, currentUserId, onBack }: ChatPanelProps) => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation partner info
  const { data: conversation } = useQuery({
    queryKey: ["conversation-detail", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();
      if (error) throw error;

      const partnerId = data.client_id === currentUserId ? data.provider_id : data.client_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", partnerId)
        .single();

      return { ...data, partner: profile };
    },
  });

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Mark unread messages as read
  useEffect(() => {
    if (messages && messages.length > 0) {
      const unread = messages.filter(
        (m) => !m.is_read && m.sender_id !== currentUserId
      );
      if (unread.length > 0) {
        supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", currentUserId)
          .eq("is_read", false)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          });
      }
    }
  }, [messages, conversationId, currentUserId, queryClient]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
      });
      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;
    setNewMessage("");
    sendMutation.mutate(content);
  };

  const partnerName = conversation?.partner?.full_name ?? "...";
  const partnerInitials = partnerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Avatar className="w-9 h-9">
          <AvatarImage src={conversation?.partner?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-purple-light text-primary text-xs font-bold">
            {partnerInitials}
          </AvatarFallback>
        </Avatar>
        <p className="font-bold text-foreground">{partnerName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className={cn("h-10 rounded-xl", i % 2 === 0 ? "w-2/3 mr-auto" : "w-2/3 ml-auto")} />
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  <p>{msg.content}</p>
                  <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-start" : "justify-end")}>
                    <span className={cn("text-[10px]", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {new Date(msg.created_at).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMine && (
                      msg.is_read 
                        ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        : <Check className="w-3.5 h-3.5 text-primary-foreground/50" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">
            ابدأ المحادثة بإرسال رسالة
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <QuickReplies
            userId={currentUserId}
            onSelect={(content) => setNewMessage(content)}
          />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
