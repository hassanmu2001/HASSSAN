import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { useMemo } from "react";

interface AvailabilityCalendarProps {
  serviceId: string;
}

const AvailabilityCalendar = ({ serviceId }: AvailabilityCalendarProps) => {
  const { data: availability = [] } = useQuery({
    queryKey: ["service-availability-calendar", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_availability")
        .select("date, is_available, note, price_override")
        .eq("service_id", serviceId);
      if (error) throw error;
      return data;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["service-booked-dates", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, status")
        .eq("service_id", serviceId)
        .in("status", ["confirmed", "pending"]);
      if (error) throw error;
      return data;
    },
  });

  const { unavailableDates, bookedDates, pendingDates } = useMemo(() => {
    const unavailable = new Set<string>();
    const booked = new Set<string>();
    const pending = new Set<string>();

    availability.forEach((a) => {
      if (!a.is_available) unavailable.add(a.date);
    });

    bookings.forEach((b) => {
      if (b.status === "confirmed") booked.add(b.booking_date);
      if (b.status === "pending") pending.add(b.booking_date);
    });

    return {
      unavailableDates: unavailable,
      bookedDates: booked,
      pendingDates: pending,
    };
  }, [availability, bookings]);

  const modifiers = {
    booked: (date: Date) => bookedDates.has(date.toISOString().split("T")[0]),
    pending: (date: Date) => pendingDates.has(date.toISOString().split("T")[0]),
    unavailable: (date: Date) => unavailableDates.has(date.toISOString().split("T")[0]),
  };

  const modifiersStyles = {
    booked: { backgroundColor: "hsl(var(--destructive))", color: "white", borderRadius: "50%" },
    pending: { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))", borderRadius: "50%" },
    unavailable: { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", opacity: 0.5, borderRadius: "50%" },
  };

  return (
    <div className="space-y-3">
      <h3 className="font-amiri text-lg font-bold text-foreground flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-gold" />
        التوفر
      </h3>
      <Calendar
        mode="single"
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        disabled={(date) => date < new Date()}
        className="rounded-xl border border-border"
      />
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-destructive inline-block" /> محجوز
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-accent inline-block" /> قيد الانتظار
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-muted inline-block" /> غير متاح
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border border-border inline-block" /> متاح
        </span>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
