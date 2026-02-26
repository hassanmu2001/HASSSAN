import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircleQuestion, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ServiceQAProps {
  serviceId: string;
  providerId: string;
}

const ServiceQA = ({ serviceId, providerId }: ServiceQAProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");

  const { data: questions = [] } = useQuery({
    queryKey: ["service-questions", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_questions")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch asker profiles
      const askerIds = [...new Set(data.map((q) => q.asker_id))];
      if (askerIds.length === 0) return data.map((q) => ({ ...q, askerName: "مستخدم" }));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", askerIds);
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
      return data.map((q) => ({ ...q, askerName: profileMap.get(q.asker_id) ?? "مستخدم" }));
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      const { error } = await supabase.from("service_questions").insert({
        service_id: serviceId,
        asker_id: user.id,
        question: question.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-questions", serviceId] });
      setQuestion("");
      toast.success("تم إرسال سؤالك");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      const { error } = await supabase
        .from("service_questions")
        .update({ answer, answered_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-questions", serviceId] });
      toast.success("تم الرد");
    },
  });

  const isProvider = user?.id === providerId;

  return (
    <div className="space-y-4">
      <h2 className="font-amiri text-xl font-bold text-foreground flex items-center gap-2">
        <MessageCircleQuestion className="w-5 h-5 text-gold" />
        الأسئلة والأجوبة ({questions.length})
      </h2>

      {/* Ask form */}
      {user && !isProvider && (
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اسأل سؤالاً عن هذه الخدمة..."
            onKeyDown={(e) => e.key === "Enter" && question.trim() && askMutation.mutate()}
          />
          <Button
            onClick={() => askMutation.mutate()}
            disabled={!question.trim() || askMutation.isPending}
            className="bg-gold hover:bg-gold-dark text-primary-foreground shrink-0"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {questions.length === 0 ? (
        <p className="text-muted-foreground text-center py-4 text-sm">لا توجد أسئلة بعد. كن أول من يسأل!</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q: any) => (
            <QAItem
              key={q.id}
              q={q}
              isProvider={isProvider}
              onAnswer={(answer) => answerMutation.mutate({ id: q.id, answer })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const QAItem = ({ q, isProvider, onAnswer }: { q: any; isProvider: boolean; onAnswer: (a: string) => void }) => {
  const [answerText, setAnswerText] = useState("");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Avatar className="w-7 h-7 shrink-0 mt-0.5">
          <AvatarFallback className="bg-muted text-xs">{q.askerName?.[0] ?? "م"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{q.askerName}</p>
          <p className="text-sm text-foreground mt-1">{q.question}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(q.created_at).toLocaleDateString("ar-SA")}
          </p>
        </div>
      </div>

      {q.answer ? (
        <div className="mr-9 bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gold mb-1">
            <CheckCircle className="w-3 h-3" />
            <span>رد المزود</span>
          </div>
          <p className="text-sm text-foreground">{q.answer}</p>
        </div>
      ) : isProvider ? (
        showForm ? (
          <div className="mr-9 flex gap-2">
            <Input
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="اكتب ردك..."
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={() => { onAnswer(answerText); setShowForm(false); }}
              disabled={!answerText.trim()}
              className="bg-gold hover:bg-gold-dark text-primary-foreground shrink-0"
            >
              رد
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="mr-9 text-gold text-xs"
          >
            الرد على السؤال
          </Button>
        )
      ) : (
        <p className="mr-9 text-xs text-muted-foreground">في انتظار رد المزود</p>
      )}
    </div>
  );
};

export default ServiceQA;
