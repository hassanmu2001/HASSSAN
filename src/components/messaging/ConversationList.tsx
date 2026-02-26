import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  partner: { full_name: string; avatar_url: string | null; user_id: string };
  lastMessage: { content: string; created_at: string; sender_id: string } | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}

const ConversationList = ({ conversations, selectedId, onSelect, currentUserId }: ConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground text-sm text-center">لا توجد محادثات بعد</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const initials = conv.partner.full_name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2);

        const timeStr = conv.lastMessage
          ? new Date(conv.lastMessage.created_at).toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full p-4 flex items-center gap-3 border-b border-border transition-colors text-start",
              selectedId === conv.id
                ? "bg-purple-light"
                : "hover:bg-muted/50"
            )}
          >
            <Avatar className="w-11 h-11 shrink-0">
              <AvatarImage src={conv.partner.avatar_url ?? undefined} />
              <AvatarFallback className="bg-purple-light text-primary text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-foreground text-sm truncate">{conv.partner.full_name}</p>
                <span className="text-xs text-muted-foreground shrink-0">{timeStr}</span>
              </div>
              {conv.lastMessage && (
                <p className="text-xs text-muted-foreground truncate">
                  {conv.lastMessage.sender_id === currentUserId ? "أنت: " : ""}
                  {conv.lastMessage.content}
                </p>
              )}
            </div>

            {conv.unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-gold text-purple-deep text-xs font-bold flex items-center justify-center shrink-0">
                {conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
