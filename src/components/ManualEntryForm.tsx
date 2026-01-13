import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { Patient } from "@/types/patient";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

const patientSchema = z.object({
  age: z.number().min(0, "Age must be positive").max(120, "Age must be realistic"),
  n_inpatient: z.number().min(0, "Must be 0 or more"),
  n_emergency: z.number().min(0, "Must be 0 or more"),
  A1Cresult: z.string(),
  max_glu_serum: z.string(),
  diag_1: z.string().min(1, "Diagnosis is required").max(100),
  readmitted: z.number().min(0).max(1),
});

interface ManualEntryFormProps {
  onAddPatient: (patient: Omit<Patient, "id">) => void;
  patientCount: number;
}

export const ManualEntryForm = ({ onAddPatient, patientCount }: ManualEntryFormProps) => {
  const [age, setAge] = useState("");
  const [nInpatient, setNInpatient] = useState("");
  const [nEmergency, setNEmergency] = useState("");
  const [a1cResult, setA1cResult] = useState("");
  const [maxGluSerum, setMaxGluSerum] = useState("");
  const [diag1, setDiag1] = useState("Other");
  const [readmitted, setReadmitted] = useState("0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patientData = {
      age: parseInt(age) || 0,
      n_inpatient: parseInt(nInpatient) || 0,
      n_emergency: parseInt(nEmergency) || 0,
      A1Cresult: a1cResult,
      max_glu_serum: maxGluSerum,
      diag_1: diag1,
      readmitted: parseInt(readmitted),
    };

    const result = patientSchema.safeParse(patientData);
    if (!result.success) {
      toast({
        title: "Validation Error",
        description: result.error.errors[0]?.message || "Invalid input",
        variant: "destructive",
      });
      return;
    }

    onAddPatient(patientData);
    
    // Reset form
    setAge("");
    setNInpatient("");
    setNEmergency("");
    setA1cResult("");
    setMaxGluSerum("");
    setDiag1("Other");
    setReadmitted("0");

    toast({
      title: "Patient Added",
      description: `Patient #${patientCount + 1} has been added successfully.`,
    });
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Add Patient</h3>
          <p className="text-sm text-muted-foreground">
            Enter patient details manually
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min={0}
              max={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_inpatient">Inpatient Visits</Label>
            <Input
              id="n_inpatient"
              type="number"
              placeholder="0"
              value={nInpatient}
              onChange={(e) => setNInpatient(e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_emergency">Emergency Visits</Label>
            <Input
              id="n_emergency"
              type="number"
              placeholder="0"
              value={nEmergency}
              onChange={(e) => setNEmergency(e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="a1c">A1C Result</Label>
            <Select value={a1cResult} onValueChange={setA1cResult}>
              <SelectTrigger>
                <SelectValue placeholder="Select A1C" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value=">7%">&gt;7%</SelectItem>
                <SelectItem value=">8%">&gt;8%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_glu">Max Glucose Serum</Label>
            <Select value={maxGluSerum} onValueChange={setMaxGluSerum}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value=">200">&gt;200</SelectItem>
                <SelectItem value=">300">&gt;300</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diag">Primary Diagnosis</Label>
            <Input
              id="diag"
              type="text"
              placeholder="e.g., Diabetes, Other"
              value={diag1}
              onChange={(e) => setDiag1(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="readmitted">Readmission Status *</Label>
          <Select value={readmitted} onValueChange={setReadmitted}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Not Readmitted (Low Risk)</SelectItem>
              <SelectItem value="1">Readmitted (High Risk)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full md:w-auto">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </form>
    </div>
  );
};
