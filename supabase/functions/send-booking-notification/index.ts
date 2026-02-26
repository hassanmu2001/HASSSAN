import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { bookingId, newStatus, type } = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing bookingId" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("*, services(title)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    const serviceName = booking.services?.title ?? "الخدمة";
    const notifications = [];

    if (type === "new_booking") {
      // Notify the provider about new booking
      notifications.push({
        user_id: booking.provider_id,
        title: "📩 حجز جديد",
        message: `لديك طلب حجز جديد لخدمة "${serviceName}" بتاريخ ${booking.booking_date} - المبلغ: ${booking.total?.toLocaleString()} ر.س`,
        type: "booking",
        metadata: { booking_id: bookingId, status: "pending" },
      });
    } else if (newStatus === "confirmed") {
      // Notify client that booking is confirmed
      notifications.push({
        user_id: booking.client_id,
        title: "✅ تم تأكيد حجزك",
        message: `تم تأكيد حجزك لخدمة "${serviceName}" بتاريخ ${booking.booking_date}. سيتواصل معك مزود الخدمة لتنسيق التفاصيل.`,
        type: "booking",
        metadata: { booking_id: bookingId, status: "confirmed" },
      });
    } else if (newStatus === "cancelled") {
      // Notify client that booking is rejected
      notifications.push({
        user_id: booking.client_id,
        title: "❌ تم رفض حجزك",
        message: `نأسف، تم رفض حجزك لخدمة "${serviceName}" بتاريخ ${booking.booking_date}. يمكنك تجربة خدمات أخرى.`,
        type: "booking",
        metadata: { booking_id: bookingId, status: "cancelled" },
      });
    }

    if (notifications.length > 0) {
      const { error: insertError } = await adminClient
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
