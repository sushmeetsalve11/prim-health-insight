import { useState } from "react";
import { Calculator, AlertCircle, CheckCircle, Loader2, Brain, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIResult {
  risk: string;
  score: number;
  confidence?: string;
  factors?: string[];
  recommendation?: string;
}

export const RiskCalculator = () => {
  const [age, setAge] = useState("");
  const [nInpatient, setNInpatient] = useState("");
  const [nEmergency, setNEmergency] = useState("");
  const [a1cResult, setA1cResult] = useState("");
  const [maxGluSerum, setMaxGluSerum] = useState("");
  const [diag1, setDiag1] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async () => {
    if (!age) {
      toast.error("Please enter patient age");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("predict-risk", {
        body: {
          age: parseInt(age) || 0,
          n_inpatient: parseInt(nInpatient) || 0,
          n_emergency: parseInt(nEmergency) || 0,
          A1Cresult: a1cResult,
          max_glu_serum: maxGluSerum,
          diag_1: diag1,
        },
      });

      if (error) {
        console.error("Prediction error:", error);
        toast.error("Failed to calculate risk. Please try again.");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
      toast.success("Risk prediction complete!");
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAge("");
    setNInpatient("");
    setNEmergency("");
    setA1cResult("");
    setMaxGluSerum("");
    setDiag1("");
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="stat-card animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                AI Risk Calculator
              </h3>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter patient age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_inpatient">Inpatient Visits (last year)</Label>
            <Input
              id="n_inpatient"
              type="number"
              placeholder="Number of inpatient visits"
              value={nInpatient}
              onChange={(e) => setNInpatient(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_emergency">Emergency Visits (last year)</Label>
            <Input
              id="n_emergency"
              type="number"
              placeholder="Number of emergency visits"
              value={nEmergency}
              onChange={(e) => setNEmergency(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="a1c">A1C Result</Label>
            <Select value={a1cResult} onValueChange={setA1cResult}>
              <SelectTrigger>
                <SelectValue placeholder="Select A1C result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None/Normal</SelectItem>
                <SelectItem value=">7%">&gt;7%</SelectItem>
                <SelectItem value=">8%">&gt;8% (High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_glu">Max Glucose Serum</Label>
            <Select value={maxGluSerum} onValueChange={setMaxGluSerum}>
              <SelectTrigger>
                <SelectValue placeholder="Select glucose level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None/Not measured</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value=">200">&gt;200 (Elevated)</SelectItem>
                <SelectItem value=">300">&gt;300 (High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diag_1">Primary Diagnosis</Label>
            <Input
              id="diag_1"
              type="text"
              placeholder="e.g., Diabetes, Heart Failure"
              value={diag1}
              onChange={(e) => setDiag1(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleCalculate} className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Calculate Risk with AI
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
        </div>

        {result && (
          <div
            className={`mt-6 p-6 rounded-xl border-2 animate-fade-in ${
              result.risk === "High Risk"
                ? "bg-destructive/5 border-destructive/30"
                : "bg-success/5 border-success/30"
            }`}
          >
            <div className="flex items-start gap-4">
              {result.risk === "High Risk" ? (
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-7 h-7 text-destructive" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  AI Predicted Risk Level
                </p>
                <p
                  className={`text-2xl font-bold ${
                    result.risk === "High Risk"
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {result.risk}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Risk Score: {(result.score * 100).toFixed(0)}%
                  </p>
                  {result.confidence && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {result.confidence} Confidence
                    </span>
                  )}
                </div>
                
                {result.factors && result.factors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-foreground mb-2">Contributing Factors:</p>
                    <ul className="space-y-1">
                      {result.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendation && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-foreground mb-1">Recommendation:</p>
                    <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
