import { useState } from "react";
import { Calculator, AlertCircle, CheckCircle } from "lucide-react";
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
import { predictReadmission } from "@/utils/riskPredictor";

export const RiskCalculator = () => {
  const [age, setAge] = useState("");
  const [nInpatient, setNInpatient] = useState("");
  const [nEmergency, setNEmergency] = useState("");
  const [a1cResult, setA1cResult] = useState("");
  const [result, setResult] = useState<{ risk: string; score: number } | null>(
    null
  );

  const handleCalculate = () => {
    const prediction = predictReadmission({
      age: parseInt(age) || 0,
      n_inpatient: parseInt(nInpatient) || 0,
      n_emergency: parseInt(nEmergency) || 0,
      A1Cresult: a1cResult,
    });
    setResult(prediction);
  };

  const handleReset = () => {
    setAge("");
    setNInpatient("");
    setNEmergency("");
    setA1cResult("");
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="stat-card animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Risk Calculator
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter patient data to predict readmission risk
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter patient age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_inpatient">Inpatient Visits (n_inpatient)</Label>
            <Input
              id="n_inpatient"
              type="number"
              placeholder="Number of inpatient visits"
              value={nInpatient}
              onChange={(e) => setNInpatient(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_emergency">Emergency Visits (n_emergency)</Label>
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
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleCalculate} className="flex-1">
            Calculate Risk
          </Button>
          <Button variant="outline" onClick={handleReset}>
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
            <div className="flex items-center gap-4">
              {result.risk === "High Risk" ? (
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-destructive" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Predicted Risk Level
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
                <p className="text-sm text-muted-foreground mt-1">
                  Risk Score: {(result.score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
