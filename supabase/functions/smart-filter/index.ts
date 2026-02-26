import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, services } = await req.json();

    if (!query || !services || services.length === 0) {
      return new Response(
        JSON.stringify({ sortedIds: services?.map((s: any) => s.id) ?? [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const servicesSummary = services
      .map(
        (s: any) =>
          `ID:${s.id}|${s.title}|${s.description?.slice(0, 80)}|سعر:${s.price_min ?? "?"}-${s.price_max ?? "?"}|تقييم_مستخدمين:${s.avgRating?.toFixed(1) ?? "0"}|تقييم_مشرف:${s.adminRating ?? "لا يوجد"}|مدينة:${s.city ?? "غير محدد"}`
      )
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي لمنصة خدمات أفراح وحفلات. عندما يبحث المستخدم عن خدمة، قم بترتيب الخدمات المتاحة حسب مدى تطابقها مع طلبه.
              
أعد فقط قائمة IDs مرتبة من الأنسب للأقل أنسبية بصيغة JSON: {"sortedIds": ["id1", "id2", ...], "reason": "سبب مختصر"}

ضع في الاعتبار:
- مطابقة العنوان والوصف لطلب المستخدم
- تقييم المستخدمين (من 5)
- تقييم المشرف (من 5) - هذا التقييم أكثر موثوقية
- السعر المناسب
- المدينة إن ذكرها المستخدم`,
          },
          {
            role: "user",
            content: `طلب المستخدم: "${query}"\n\nالخدمات المتاحة:\n${servicesSummary}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_services",
              description: "Return ranked service IDs with reason",
              parameters: {
                type: "object",
                properties: {
                  sortedIds: { type: "array", items: { type: "string" } },
                  reason: { type: "string" },
                },
                required: ["sortedIds", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_services" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إعادة شحن الرصيد" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(
        JSON.stringify({ sortedIds: services.map((s: any) => s.id) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ sortedIds: services.map((s: any) => s.id) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("smart-filter error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
