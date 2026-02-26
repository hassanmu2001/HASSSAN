import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Zap, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface QuickRepliesProps {
  userId: string;
  onSelect: (content: string) => void;
}

const defaultTemplates = [
  { label: "ترحيب", content: "أهلاً وسهلاً! شكراً لتواصلك معنا. كيف يمكنني مساعدتك؟" },
  { label: "تأكيد", content: "تم تأكيد حجزك بنجاح! سنتواصل معك قريباً بالتفاصيل." },
  { label: "اعتذار", content: "نعتذر، هذا الموعد غير متاح حالياً. هل تود اختيار موعد آخر؟" },
  { label: "شكر", content: "شكراً لاختيارك خدماتنا! نتطلع لخدمتك في مناسبتك السعيدة." },
];

const QuickReplies = ({ userId, onSelect }: QuickRepliesProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: replies = [] } = useQuery({
    queryKey: ["quick-replies", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_replies")
        .select("*")
        .eq("provider_id", userId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("quick_replies").insert({
        provider_id: userId,
        label: newLabel.trim(),
        content: newContent.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-replies"] });
      setAdding(false);
      setNewLabel("");
      setNewContent("");
      toast.success("تمت الإضافة");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quick_replies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quick-replies"] }),
  });

  const handleSelectDefault = (content: string) => {
    onSelect(content);
    setOpen(false);
  };

  const handleSelectSaved = (content: string) => {
    onSelect(content);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-accent hover:text-accent" title="ردود سريعة">
          <Zap className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0" side="top">
        <div className="p-3 border-b border-border">
          <h4 className="font-bold text-foreground text-sm flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-accent" /> ردود سريعة
          </h4>
        </div>

        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {/* Default templates */}
          {defaultTemplates.map((t) => (
            <button
              key={t.label}
              onClick={() => handleSelectDefault(t.content)}
              className="w-full text-right p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-xs text-accent font-bold">{t.label}</span>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.content}</p>
            </button>
          ))}

          {/* Saved replies */}
          {replies.map((r) => (
            <div key={r.id} className="flex items-center gap-1">
              <button
                onClick={() => handleSelectSaved(r.content)}
                className="flex-1 text-right p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-xs text-primary font-bold">{r.label}</span>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.content}</p>
              </button>
              <button
                onClick={() => deleteMutation.mutate(r.id)}
                className="p-1 text-destructive/50 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="p-2 border-t border-border">
          {adding ? (
            <div className="space-y-2">
              <Input
                placeholder="العنوان (مثال: ترحيب)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-8 text-xs"
              />
              <Input
                placeholder="نص الرد..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  disabled={!newLabel.trim() || !newContent.trim()}
                  onClick={() => addMutation.mutate()}
                >
                  حفظ
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs gap-1"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-3 h-3" /> إضافة رد مخصص
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default QuickReplies;
