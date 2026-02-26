import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  serviceId: string;
}

const AvailabilityTab = ({ serviceId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isAvailable, setIsAvailable] = useState(true);
  const [priceOverride, setPriceOverride] = useState("");
  const [note, setNote] = useState("");

  const { data: availability = [] } = useQuery({
    queryKey: ["service-availability-manage", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_availability")
        .select("*")
        .eq("service_id", serviceId)
        .order("date");
      if (error) throw error;
      return data;
    },
  });

  const blockedDates = useMemo(
    () => availability.filter((a) => !a.is_available).map((a) => new Date(a.date + "T00:00:00")),
    [availability]
  );

  const specialDates = useMemo(
    () => availability.filter((a) => a.price_override != null).map((a) => new Date(a.date + "T00:00:00")),
    [availability]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) return;
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const { error } = await supabase
        .from("service_availability")
        .upsert(
          {
            service_id: serviceId,
            date: dateStr,
            is_available: isAvailable,
            price_override: priceOverride ? Number(priceOverride) : null,
            note: note || null,
          },
          { onConflict: "service_id,date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-availability-manage", serviceId] });
      toast.success("تم حفظ إعدادات اليوم");
      setSelectedDate(undefined);
      setPriceOverride("");
      setNote("");
      setIsAvailable(true);
    },
    onError: () => toast.error("حدث خطأ أثناء الحفظ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-availability-manage", serviceId] });
      toast.success("تم حذف إعداد اليوم");
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      const existing = availability.find((a) => a.date === dateStr);
      if (existing) {
        setIsAvailable(existing.is_available);
        setPriceOverride(existing.price_override?.toString() ?? "");
        setNote(existing.note ?? "");
      } else {
        setIsAvailable(true);
        setPriceOverride("");
        setNote("");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">اختر تاريخاً</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ar}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            modifiers={{ blocked: blockedDates, special: specialDates }}
            modifiersClassNames={{
              blocked: "bg-destructive/20 text-destructive line-through",
              special: "bg-accent/30 text-accent-foreground font-bold",
            }}
            className={cn("p-3 pointer-events-auto")}
          />
        </CardContent>
      </Card>

      {/* Day settings */}
      <div className="space-y-6">
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                إعدادات يوم {format(selectedDate, "d MMMM yyyy", { locale: ar })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>متاح للحجز</Label>
                <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
              </div>

              <div className="space-y-2">
                <Label>سعر خاص لهذا اليوم (اختياري)</Label>
                <Input
                  type="number"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                  placeholder="اتركه فارغاً لاستخدام السعر الافتراضي"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label>ملاحظة (اختياري)</Label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: عرض خاص، حجز مبكر..."
                />
              </div>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full bg-primary text-primary-foreground"
              >
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Existing entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الإعدادات المحفوظة</CardTitle>
          </CardHeader>
          <CardContent>
            {availability.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                لا توجد إعدادات مخصصة بعد
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availability.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {format(new Date(entry.date + "T00:00:00"), "d MMM yyyy", { locale: ar })}
                      </span>
                      {!entry.is_available && (
                        <Badge variant="destructive" className="text-xs">محجوز</Badge>
                      )}
                      {entry.price_override && (
                        <Badge variant="secondary" className="text-xs">
                          {entry.price_override} ر.س
                        </Badge>
                      )}
                      {entry.note && (
                        <span className="text-muted-foreground">{entry.note}</span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMutation.mutate(entry.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AvailabilityTab;
