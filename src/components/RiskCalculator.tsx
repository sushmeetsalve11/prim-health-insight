import { useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Loader2, Brain, Sparkles, Upload, FileText, Keyboard } from "lucide-react";
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
  const [mode, setMode] = useState<"manual" | "upload">("upload");
  const [age, setAge] = useState("");
  const [nInpatient, setNInpatient] = useState("");
  const [nEmergency, setNEmergency] = useState("");
  const [a1cResult, setA1cResult] = useState("");
  const [maxGluSerum, setMaxGluSerum] = useState("");
  const [diag1, setDiag1] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseSummary, setParseSummary] = useState("");

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setIsParsing(true);
    setParseSummary("");
    setResult(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("parse-report", {
        body: { image: base64 },
      });

      if (error) {
        console.error("Parse error:", error);
        toast.error("Failed to parse report. Please try manual entry.");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Fill form fields from extracted data
      if (data.age) setAge(String(data.age));
      if (data.n_inpatient != null) setNInpatient(String(data.n_inpatient));
      if (data.n_emergency != null) setNEmergency(String(data.n_emergency));
      if (data.A1Cresult) setA1cResult(data.A1Cresult);
      if (data.max_glu_serum) setMaxGluSerum(data.max_glu_serum === "normal" ? "normal" : data.max_glu_serum);
      if (data.diag_1) setDiag1(data.diag_1);
      if (data.summary) setParseSummary(data.summary);

      toast.success("Report parsed successfully! Review the extracted data below.");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to process report.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

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
    setParseSummary("");
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

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("upload")}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Report
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
            className="flex-1"
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {/* Upload Area */}
        {mode === "upload" && (
          <div className="mb-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileInput}
                className="hidden"
                id="report-upload"
                disabled={isParsing}
              />
              <label htmlFor="report-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  {isParsing ? (
                    <>
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-sm font-medium text-foreground">
                        Analyzing report with AI...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Drop your blood report here
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          or click to browse • PDF, JPG, PNG supported
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAge("72");
                  setNInpatient("2");
                  setNEmergency("3");
                  setA1cResult(">8%");
                  setMaxGluSerum(">300");
                  setDiag1("Diabetes");
                  setParseSummary("Demo: 72-year-old male with uncontrolled Type 2 Diabetes. HbA1c 9.2%, fasting glucose 312 mg/dL, 3 ER visits and 2 inpatient admissions in the past year.");
                  toast.success("Demo report loaded! Click 'Calculate Risk' to see results.");
                }}
                disabled={isParsing}
              >
                <FileText className="w-4 h-4 mr-2" />
                Try Demo Report
              </Button>
              <span className="text-xs text-muted-foreground">Load a sample blood report to test</span>
            </div>

            {parseSummary && (
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{parseSummary}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
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
          <Button onClick={handleCalculate} className="flex-1" disabled={isLoading || isParsing}>
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
          <Button variant="outline" onClick={handleReset} disabled={isLoading || isParsing}>
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
