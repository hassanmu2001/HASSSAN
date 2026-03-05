import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCountry } from "@/hooks/use-country";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarDays, Users, Tag, Percent, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type PriceTier = {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  price_per_unit: number;
};

type ServiceOptionWithTiers = {
  id: string;
  name: string;
  description: string | null;
  service_price_tiers: PriceTier[];
};

interface ServiceBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    title: string;
    price_min: number | null;
    price_max: number | null;
    weekend_price_increase?: number | null;
    discount_percent?: number | null;
    deposit_percent?: number | null;
    provider_id: string;
  };
  providerName: string;
  defaultOptionId?: string;
}

const ServiceBookingDialog = ({
  open,
  onOpenChange,
  service,
  providerName,
  defaultOptionId = "",
}: ServiceBookingDialogProps) => {
  const { user } = useAuth();
  const { formatPrice } = useCountry();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedOptionId, setSelectedOptionId] = useState<string>(defaultOptionId);
  const [guestCount, setGuestCount] = useState<string>("100");
  const [notes, setNotes] = useState("");

  // Fetch availability
  const { data: availability } = useQuery({
    queryKey: ["service-availability", service.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_availability")
        .select("*")
        .eq("service_id", service.id);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch options + price tiers
  const { data: options } = useQuery({
    queryKey: ["service-options", service.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_options")
        .select("*, service_price_tiers(*)")
        .eq("service_id", service.id)
        .order("sort_order");
      if (error) throw error;
      return data as ServiceOptionWithTiers[];
    },
    enabled: open,
  });

  const bookedDates = useMemo(
    () =>
      (availability ?? [])
        .filter((a) => !a.is_available)
        .map((a) => new Date(a.date + "T00:00:00")),
    [availability]
  );

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 4 || day === 5; // Thu + Fri in Saudi
  };

  const selectedOption = options?.find((o) => o.id === selectedOptionId);
  const qty = parseInt(guestCount) || 0;

  // Calculate price based on selected option + tier + quantity
  const priceCalc = useMemo(() => {
    if (!selectedOption) return null;
    const tiers = selectedOption.service_price_tiers ?? [];
    if (tiers.length === 0) return null;

    // Find the matching tier
    const tier = tiers
      .sort((a, b) => a.min_quantity - b.min_quantity)
      .find(
        (t) => qty >= t.min_quantity && (t.max_quantity === null || qty <= t.max_quantity)
      );

    if (!tier) {
      // Use the last tier if quantity exceeds all
      const lastTier = tiers[tiers.length - 1];
      if (lastTier) {
        return { unitPrice: lastTier.price_per_unit, subtotal: lastTier.price_per_unit * qty };
      }
      return null;
    }

    const subtotal = tier.price_per_unit * qty;
    return { unitPrice: tier.price_per_unit, subtotal };
  }, [selectedOption, qty]);

  const weekendExtra =
    selectedDate && isWeekend(selectedDate)
      ? (service.weekend_price_increase ?? 0)
      : 0;

  const discountPct = service.discount_percent ?? 0;

  const subtotal = priceCalc?.subtotal ?? (service.price_min ?? 0);
  const afterWeekend = subtotal + weekendExtra;
  const discountAmount = discountPct > 0 ? afterWeekend * (discountPct / 100) : 0;
  const total = afterWeekend - discountAmount;

  const hasQuantityTiers = options?.some(
    (o) => (o.service_price_tiers?.length ?? 0) > 0 && o.service_price_tiers?.some((t) => t.max_quantity !== t.min_quantity)
  );

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      if (!selectedDate) throw new Error("اختر تاريخ الحجز");

      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data: bookingData, error } = await supabase.from("bookings").insert({
        client_id: user.id,
        service_id: service.id,
        provider_id: service.provider_id,
        booking_date: dateStr,
        selected_options: selectedOption
          ? [{ option_id: selectedOption.id, name: selectedOption.name, quantity: qty }]
          : [],
        guest_count: qty || null,
        subtotal,
        discount_percent: discountPct,
        total,
        notes: notes.trim() || "",
      }).select("id").single();
      if (error) throw error;

      // Notify provider about new booking
      if (bookingData?.id) {
        supabase.functions.invoke("send-booking-notification", {
          body: { bookingId: bookingData.id, type: "new_booking" },
        }).catch(console.error);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["service-availability", service.id] });
      toast.success("تم إرسال طلب الحجز بنجاح! سيتم التأكيد من مزود الخدمة.");
      onOpenChange(false);
      resetForm();

      // Auto-create conversation and send booking message
      if (user) {
        try {
          // Check for existing conversation
          const { data: existing } = await supabase
            .from("conversations")
            .select("id")
            .eq("client_id", user.id)
            .eq("provider_id", service.provider_id)
            .maybeSingle();

          let convId = existing?.id;

          if (!convId) {
            const { data: newConv } = await supabase
              .from("conversations")
              .insert({ client_id: user.id, provider_id: service.provider_id, service_id: service.id })
              .select("id")
              .single();
            convId = newConv?.id;
          }

          if (convId) {
            const dateStr = selectedDate?.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) ?? "";
            const autoMsg = `📋 طلب حجز جديد\nالخدمة: ${service.title}\nالتاريخ: ${dateStr}\nالمبلغ: ${formatPrice(total)}\n\nمرحباً، قمت بحجز هذه الخدمة وأنتظر تأكيدكم. شكراً!`;
            
            await supabase.from("messages").insert({
              conversation_id: convId,
              sender_id: user.id,
              content: autoMsg,
            });

            await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);

            navigate(`/messages?conv=${convId}`);
          }
        } catch (err) {
          console.error("Auto-message error:", err);
        }
      }
    },
    onError: (err: Error) => toast.error(err.message || "حدث خطأ أثناء الحجز"),
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedOptionId("");
    setGuestCount("100");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-amiri text-xl">
            حجز: {service.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{providerName}</p>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* 1. Calendar */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-base font-bold">
              <CalendarDays className="w-4 h-4 text-primary" />
              اختر التاريخ
            </Label>
            <div className="flex justify-center border rounded-lg p-2 bg-card">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  if (date < new Date()) return true;
                  return bookedDates.some(
                    (b) => b.toDateString() === date.toDateString()
                  );
                }}
                modifiers={{ weekend: (d) => isWeekend(d), booked: bookedDates }}
                modifiersClassNames={{
                  weekend: "text-accent-foreground bg-accent/30 font-bold",
                  booked: "line-through opacity-40",
                }}
                className="p-3 pointer-events-auto"
              />
            </div>
            {selectedDate && isWeekend(selectedDate) && weekendExtra > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                ⚡ نهاية أسبوع: +{formatPrice(weekendExtra)} إضافية
              </p>
            )}
          </div>

          {/* 2. Service Options */}
          {options && options.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-bold">
                  <Tag className="w-4 h-4 text-primary" />
                  اختر نوع الخدمة
                </Label>
                <RadioGroup value={selectedOptionId} onValueChange={setSelectedOptionId}>
                  {options.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedOptionId === opt.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <RadioGroupItem value={opt.id} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground">{opt.name}</p>
                        {opt.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.description}
                          </p>
                        )}
                        {opt.service_price_tiers && opt.service_price_tiers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {opt.service_price_tiers
                              .sort((a, b) => a.min_quantity - b.min_quantity)
                              .map((tier) => (
                                <Badge
                                  key={tier.id}
                                  variant="outline"
                                  className="text-[10px] font-normal"
                                >
                                  {tier.max_quantity && tier.max_quantity !== tier.min_quantity
                                    ? `${tier.min_quantity}-${tier.max_quantity}`
                                    : tier.min_quantity === 1 && tier.max_quantity === 1
                                    ? "باقة"
                                    : `${tier.min_quantity}+`}
                                  : {formatPrice(tier.price_per_unit)}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* 3. Guest Count (only if tiers have quantity ranges) */}
          {hasQuantityTiers && selectedOption && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-bold">
                  <Users className="w-4 h-4 text-primary" />
                  عدد الضيوف / الكمية
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  dir="ltr"
                  className="text-center text-lg font-bold"
                />
                {priceCalc && (
                  <p className="text-xs text-muted-foreground text-center">
                    {formatPrice(priceCalc.unitPrice)} × {qty} = {formatPrice(priceCalc.subtotal)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* 4. Discount badge */}
          {discountPct > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30">
              <Percent className="w-5 h-5 text-accent" />
              <div>
                <p className="font-bold text-sm text-foreground">خصم {discountPct}%</p>
                <p className="text-xs text-muted-foreground">
                  يوفر لك {formatPrice(discountAmount)}
                </p>
              </div>
            </div>
          )}

          {/* 5. Notes */}
          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي طلبات خاصة أو ملاحظات..."
              rows={2}
            />
          </div>

          {/* 6. Price Summary */}
          <Separator />
          <div className="space-y-2 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المبلغ الأساسي</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {weekendExtra > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إضافة نهاية الأسبوع</span>
                <span>+{formatPrice(weekendExtra)}</span>
              </div>
            )}
            {discountPct > 0 && (
              <div className="flex justify-between text-sm text-accent">
                <span>خصم {discountPct}%</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>الإجمالي</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
            {(service.deposit_percent ?? 0) > 0 && (
              <div className="flex justify-between text-sm bg-primary/5 rounded-lg p-2 mt-1">
                <span className="text-muted-foreground">العربون المطلوب ({service.deposit_percent}%)</span>
                <span className="font-bold text-primary">
                  {formatPrice(total * (service.deposit_percent! / 100))}
                </span>
              </div>
            )}
          </div>

          {/* 7. Submit */}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-12"
            disabled={!selectedDate || !user || bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
          >
            <ShoppingCart className="w-5 h-5 ml-2" />
            {bookMutation.isPending
              ? "جاري إرسال الطلب..."
              : !user
              ? "سجّل دخولك أولاً"
              : "تأكيد الحجز"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingDialog;
