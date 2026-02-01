import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Diagnosis category encoding (must match training)
const diagnosisMap: Record<string, number> = {
  "Circulatory": 0,
  "Respiratory": 1,
  "Digestive": 2,
  "Diabetes": 3,
  "Injury": 4,
  "Musculoskeletal": 5,
  "Genitourinary": 6,
  "Other": 7,
};

// Max glucose serum encoding (must match training)
const glucoseMap: Record<string, number> = {
  "None": 0,
  "Norm": 1,
  ">200": 2,
  ">300": 3,
};

// XGBoost native JSON model structure
interface XGBoostTree {
  base_weights: number[];
  left_children: number[];
  right_children: number[];
  split_conditions: number[];
  split_indices: number[];
  default_left: number[];
}

interface XGBoostModel {
  learner: {
    learner_model_param: {
      base_score: string;
    };
    gradient_booster: {
      model: {
        trees: XGBoostTree[];
        gbtree_model_param: {
          num_trees: string;
        };
      };
    };
  };
}

// Cache for the loaded model
let cachedModel: XGBoostModel | null = null;

async function loadModel(): Promise<XGBoostModel | null> {
  if (cachedModel) return cachedModel;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.storage
      .from("ml-models")
      .download("xgboost_model.json");

    if (error) {
      console.error("Error loading model:", error);
      return null;
    }

    const modelText = await data.text();
    cachedModel = JSON.parse(modelText);
    console.log("XGBoost model loaded successfully");
    return cachedModel;
  } catch (err) {
    console.error("Failed to load XGBoost model:", err);
    return null;
  }
}

// Traverse a single XGBoost tree (native format)
function predictTree(tree: XGBoostTree, features: number[]): number {
  let nodeIndex = 0;
  
  while (tree.left_children[nodeIndex] !== -1) {
    const splitFeature = tree.split_indices[nodeIndex];
    const splitThreshold = tree.split_conditions[nodeIndex];
    const featureValue = features[splitFeature];
    
    if (featureValue < splitThreshold) {
      nodeIndex = tree.left_children[nodeIndex];
    } else {
      nodeIndex = tree.right_children[nodeIndex];
    }
  }
  
  return tree.base_weights[nodeIndex];
}

// XGBoost prediction (sum of tree predictions, then sigmoid)
function predictXGBoost(model: XGBoostModel, features: number[]): number {
  const trees = model.learner.gradient_booster.model.trees;
  const baseScore = parseFloat(model.learner.learner_model_param?.base_score || "0.5");
  
  let sum = 0;
  for (const tree of trees) {
    sum += predictTree(tree, features);
  }

  // Apply sigmoid for binary classification
  // XGBoost uses logistic loss, so we apply sigmoid to get probability
  const probability = 1 / (1 + Math.exp(-sum));
  return probability;
}

// Fallback rule-based prediction when model is not available
function fallbackPrediction(age: number, n_inpatient: number, n_emergency: number, a1c: number): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  if (age > 65) {
    score += 0.15;
    factors.push("Advanced age (>65 years)");
  } else if (age > 50) {
    score += 0.08;
    factors.push("Middle age (50-65 years)");
  }

  if (n_inpatient > 2) {
    score += 0.35;
    factors.push("High inpatient visit history (>2 visits)");
  } else if (n_inpatient > 0) {
    score += 0.15;
    factors.push("Previous inpatient visits");
  }

  if (n_emergency > 1) {
    score += 0.25;
    factors.push("Multiple emergency visits");
  } else if (n_emergency > 0) {
    score += 0.1;
    factors.push("Previous emergency visit");
  }

  if (a1c >= 8.0) {
    score += 0.25;
    factors.push("Poor glycemic control (A1C ≥ 8%)");
  } else if (a1c >= 7.0) {
    score += 0.1;
    factors.push("Suboptimal glycemic control (A1C 7-8%)");
  }

  return { score: Math.min(score, 1), factors };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { age, n_inpatient, n_emergency, A1Cresult, max_glu_serum, diag_1 } = await req.json();

    // Parse A1C - handle both string (">8%") and numeric formats
    let a1cValue = 0;
    if (typeof A1Cresult === "number") {
      a1cValue = A1Cresult;
    } else if (typeof A1Cresult === "string") {
      if (A1Cresult === ">8%" || A1Cresult === ">8") {
        a1cValue = 9.0;
      } else if (A1Cresult === ">7%" || A1Cresult === ">7") {
        a1cValue = 7.5;
      } else {
        a1cValue = parseFloat(A1Cresult) || 6.0;
      }
    }

    // Prepare features for XGBoost model (must match training order)
    // Order: age, n_inpatient, n_emergency, A1Cresult, diag_code, glucose_code
    const diagCode = diagnosisMap[diag_1] ?? diagnosisMap["Other"];
    const glucoseCode = glucoseMap[max_glu_serum] ?? glucoseMap["None"];
    
    const features = [
      age || 0,
      n_inpatient || 0,
      n_emergency || 0,
      a1cValue,
      diagCode,
      glucoseCode,
    ];

    console.log("Input features:", features);

    // Try to load and use XGBoost model
    const model = await loadModel();
    
    let score: number;
    let factors: string[] = [];
    let modelUsed = "xgboost";

    if (model) {
      try {
        score = predictXGBoost(model, features);
        console.log("XGBoost prediction score:", score);
        
        // Generate factors based on input values
        if (n_inpatient > 0) factors.push(`${n_inpatient} inpatient visit(s) in past year`);
        if (n_emergency > 0) factors.push(`${n_emergency} emergency visit(s) in past year`);
        if (a1cValue >= 7.0) factors.push(`Elevated A1C (${a1cValue.toFixed(1)}%)`);
        if (age > 60) factors.push(`Age factor (${age} years)`);
        if (diag_1) factors.push(`Primary diagnosis: ${diag_1}`);
        if (max_glu_serum && max_glu_serum !== "None" && max_glu_serum !== "Norm") {
          factors.push(`Elevated glucose serum (${max_glu_serum})`);
        }
      } catch (err) {
        console.error("XGBoost prediction failed, using fallback:", err);
        const fallback = fallbackPrediction(age, n_inpatient, n_emergency, a1cValue);
        score = fallback.score;
        factors = fallback.factors;
        modelUsed = "fallback";
      }
    } else {
      console.log("No XGBoost model found, using fallback prediction");
      const fallback = fallbackPrediction(age, n_inpatient, n_emergency, a1cValue);
      score = fallback.score;
      factors = fallback.factors;
      modelUsed = "fallback";
    }

    const isHighRisk = score > 0.5;
    
    const prediction = {
      risk: isHighRisk ? "High Risk" : "Low Risk",
      score: score,
      confidence: modelUsed === "xgboost" ? "High" : "Medium",
      factors: factors.length > 0 ? factors : ["No significant risk factors identified"],
      recommendation: isHighRisk
        ? "Consider close follow-up, medication reconciliation, and care coordination to reduce readmission risk."
        : "Standard discharge protocol recommended. Ensure patient education and follow-up scheduling.",
      model: modelUsed,
    };

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
