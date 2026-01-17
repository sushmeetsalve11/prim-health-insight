import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { age, n_inpatient, n_emergency, A1Cresult, max_glu_serum, diag_1 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a healthcare risk prediction AI assistant. Analyze patient data to predict 30-day hospital readmission risk.

You must analyze the following clinical factors and their interactions:
- Age: Older patients (>65) have higher readmission risk
- Number of inpatient visits (n_inpatient): Higher count indicates chronic illness patterns
- Number of emergency visits (n_emergency): Indicates acute health instability
- A1C result: Poor glycemic control (>8%) is a strong predictor
- Maximum glucose serum: Abnormal glucose levels indicate metabolic issues
- Primary diagnosis: Certain conditions have higher readmission rates

Consider these clinical interactions:
1. Age + multiple inpatient visits = compounded risk
2. Poor A1C + high glucose = severe diabetic risk
3. Emergency visits + older age = acute-on-chronic pattern

Respond ONLY with valid JSON in this exact format:
{
  "risk": "High Risk" or "Low Risk",
  "score": number between 0 and 1,
  "confidence": "High", "Medium", or "Low",
  "factors": ["array of contributing factors"],
  "recommendation": "brief clinical recommendation"
}`;

    const userPrompt = `Analyze this patient for 30-day readmission risk:
- Age: ${age} years
- Inpatient visits (last year): ${n_inpatient}
- Emergency visits (last year): ${n_emergency}
- A1C Result: ${A1Cresult}
- Max Glucose Serum: ${max_glu_serum || "Not measured"}
- Primary Diagnosis: ${diag_1 || "Not specified"}

Provide your risk assessment as JSON.`;

    console.log("Calling AI gateway for risk prediction...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Parse the JSON from the AI response
    let prediction;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      prediction = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback to rule-based prediction
      let score = 0;
      if (n_inpatient > 1) score += 0.4;
      if (n_emergency > 0) score += 0.2;
      if (age > 65) score += 0.15;
      if (A1Cresult === '>8%') score += 0.25;
      
      prediction = {
        risk: score > 0.5 ? "High Risk" : "Low Risk",
        score: Math.min(score, 1),
        confidence: "Medium",
        factors: ["Fallback prediction - AI parsing failed"],
        recommendation: "Consider manual review of patient factors."
      };
    }

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in predict-risk function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
