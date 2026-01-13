import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ManualEntryForm } from "@/components/ManualEntryForm";
import { StatsCards } from "@/components/StatsCards";
import { PatientTable } from "@/components/PatientTable";
import { ReadmissionChart } from "@/components/ReadmissionChart";
import { RiskCalculator } from "@/components/RiskCalculator";
import { calculateStats, getAgeGroupData } from "@/utils/csvParser";
import { Patient } from "@/types/patient";
import { LayoutDashboard, Calculator, Activity, Users } from "lucide-react";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);

  const handleAddPatient = (patientData: Omit<Patient, "id">) => {
    const newPatient: Patient = {
      ...patientData,
      id: patients.length + 1,
    };
    setPatients((prev) => [...prev, newPatient]);
  };

  const handleClearAll = () => {
    setPatients([]);
  };

  const stats = calculateStats(patients);
  const ageGroupData = getAgeGroupData(patients);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Calculator className="w-4 h-4" />
              Risk Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ManualEntryForm
              onAddPatient={handleAddPatient}
              patientCount={patients.length}
            />

            {patients.length > 0 ? (
              <>
                <StatsCards stats={stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ReadmissionChart data={ageGroupData} />
                  <div className="stat-card animate-fade-in flex flex-col justify-center items-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {stats.totalPatients} Patient{stats.totalPatients !== 1 ? "s" : ""} Added
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {stats.highRiskPatients} high-risk, {stats.totalPatients - stats.highRiskPatients} low-risk
                    </p>
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-destructive hover:underline"
                    >
                      Clear all patients
                    </button>
                  </div>
                </div>
                <PatientTable patients={patients} />
              </>
            ) : (
              <div className="stat-card animate-fade-in text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Patients Yet
                </h3>
                <p className="text-muted-foreground">
                  Add your first patient using the form above to see analytics
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calculator">
            <RiskCalculator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
