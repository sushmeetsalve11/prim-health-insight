import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a medical report data extractor. Extract patient medical data from blood/lab reports. You MUST call the extract_report_data function with the extracted values.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the following fields from this blood/lab report: patient age, number of inpatient visits, number of emergency visits, A1C/HbA1c result, max glucose serum level, and primary diagnosis. If a field is not found, use a reasonable default or leave empty.",
              },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_report_data",
              description: "Extract structured medical data from a blood report",
              parameters: {
                type: "object",
                properties: {
                  age: { type: "number", description: "Patient age in years" },
                  n_inpatient: { type: "number", description: "Number of inpatient visits in last year. Default 0 if not found." },
                  n_emergency: { type: "number", description: "Number of emergency visits in last year. Default 0 if not found." },
                  A1Cresult: { type: "string", description: "HbA1c/A1C result. Use '>8%' if above 8, '>7%' if above 7, 'none' if not found or normal." },
                  max_glu_serum: { type: "string", description: "Max glucose serum level. Use '>300' if above 300, '>200' if above 200, 'normal' if normal range, 'none' if not found." },
                  diag_1: { type: "string", description: "Primary diagnosis category. One of: Diabetes, Circulatory, Respiratory, Digestive, Injury, Musculoskeletal, Genitourinary, Other." },
                  summary: { type: "string", description: "Brief summary of what was found in the report." },
                },
                required: ["age", "A1Cresult", "max_glu_serum", "diag_1", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_report_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured data");
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in parse-report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
