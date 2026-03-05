import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/hooks/use-country";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Percent, Sun, Wallet } from "lucide-react";

interface ServicePricing {
  id: string;
  discount_percent?: number;
  weekend_price_increase?: number;
  deposit_percent?: number;
}

interface Props {
  service: ServicePricing;
}

const DiscountTab = ({ service }: Props) => {
  const { selectedCountry } = useCountry();
  const curr = selectedCountry?.currency_symbol ?? "ر.س";
  const queryClient = useQueryClient();
  const [discountPercent, setDiscountPercent] = useState(
    service.discount_percent?.toString() ?? "0"
  );
  const [weekendIncrease, setWeekendIncrease] = useState(
    service.weekend_price_increase?.toString() ?? "0"
  );
  const [depositPercent, setDepositPercent] = useState(
    service.deposit_percent?.toString() ?? "0"
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const discount = Number(discountPercent) || 0;
      if (discount < 0 || discount > 20) {
        throw new Error("نسبة الخصم يجب أن تكون بين 0 و 20%");
      }
      const deposit = Number(depositPercent) || 0;
      if (deposit < 0 || deposit > 50) {
        throw new Error("نسبة العربون يجب أن تكون بين 0 و 50%");
      }
      const { error } = await supabase
        .from("services")
        .update({
          discount_percent: discount,
          weekend_price_increase: Number(weekendIncrease) || 0,
          deposit_percent: deposit,
        })
        .eq("id", service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-service", service.id] });
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      toast.success("تم حفظ إعدادات التسعير");
    },
    onError: (err: Error) => toast.error(err.message || "حدث خطأ"),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
      {/* Discount */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">نسبة الخصم</CardTitle>
          </div>
          <CardDescription>
            خصم يُطبَّق تلقائياً على السعر الإجمالي (الحد الأقصى 20%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>نسبة الخصم (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                dir="ltr"
                className="max-w-32"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {Number(discountPercent) > 0 && (
              <p className="text-sm text-primary">
                سيحصل العميل على خصم {discountPercent}% من إجمالي الحجز
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekend increase */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-accent" />
            <CardTitle className="text-lg">زيادة نهاية الأسبوع</CardTitle>
          </div>
          <CardDescription>
            مبلغ إضافي يُضاف عند اختيار يوم خميس أو جمعة
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
            <Label>المبلغ الإضافي ({curr})</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={weekendIncrease}
                onChange={(e) => setWeekendIncrease(e.target.value)}
                dir="ltr"
                className="max-w-32"
              />
              <span className="text-muted-foreground">{curr}</span>
            </div>
            {Number(weekendIncrease) > 0 && (
              <p className="text-sm text-muted-foreground">
                سيُضاف {weekendIncrease} {curr} على حجوزات الخميس والجمعة
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">نسبة العربون</CardTitle>
          </div>
          <CardDescription>
            نسبة من الإجمالي يدفعها العميل مقدماً لتأكيد الحجز
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>نسبة العربون (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="50"
                value={depositPercent}
                onChange={(e) => setDepositPercent(e.target.value)}
                dir="ltr"
                className="max-w-32"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            {Number(depositPercent) > 0 && (
              <p className="text-sm text-muted-foreground">
                سيُطلب من العميل دفع {depositPercent}% كعربون لتأكيد الحجز
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="md:col-span-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground px-8"
        >
          {saveMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
};

export default DiscountTab;
