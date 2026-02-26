import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Copy, Check, Users, Gift } from "lucide-react";
import { toast } from "sonner";

const ReferralCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading } = useQuery({
    queryKey: ["my-referral-code", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = `AFRAHI_${user!.id.substring(0, 6).toUpperCase()}`;
      const { data, error } = await supabase
        .from("referral_codes")
        .insert({ user_id: user!.id, code })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-referral-code"] });
      toast.success("تم إنشاء رابط الإحالة الخاص بك!");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const handleCopy = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("تم نسخ الرابط!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}?ref=${referralCode.code}`;
    if (navigator.share) {
      await navigator.share({
        title: "أفراحي - دعوة خاصة",
        text: `استخدم رابطي للحصول على خصم ${referralCode.discount_percent}% على أول حجز!`,
        url: link,
      });
    } else {
      handleCopy();
    }
  };

  if (!user) return null;

  return (
    <Card className="border-accent/30 bg-gradient-to-bl from-card to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="font-amiri text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" />
          برنامج الإحالة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          شارك رابطك الخاص مع أصدقائك. عند حجزهم، يحصل كل منكما على خصم!
        </p>

        {referralCode ? (
          <>
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">كود الإحالة</p>
                <p className="font-bold text-foreground">{referralCode.code}</p>
              </div>
              <Badge className="bg-accent/20 text-accent-foreground">
                خصم {referralCode.discount_percent}%
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{referralCode.referral_count} إحالة ناجحة</span>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleShare}
              >
                <Share2 className="w-3.5 h-3.5" />
                مشاركة
              </Button>
            </div>
          </>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
          >
            <Gift className="w-4 h-4 ml-2" />
            {createMutation.isPending ? "جاري الإنشاء..." : "أنشئ رابط الإحالة الخاص بك"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
