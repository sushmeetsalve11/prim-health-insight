import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FileUpload } from "@/components/FileUpload";
import { StatsCards } from "@/components/StatsCards";
import { PatientTable } from "@/components/PatientTable";
import { ReadmissionChart } from "@/components/ReadmissionChart";
import { RiskCalculator } from "@/components/RiskCalculator";
import { parseCSV, calculateStats, getAgeGroupData } from "@/utils/csvParser";
import { Patient } from "@/types/patient";
import { LayoutDashboard, Calculator } from "lucide-react";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const handleFileUpload = (content: string) => {
    const parsedPatients = parseCSV(content);
    setPatients(parsedPatients);
    setIsDataLoaded(true);
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
            {!isDataLoaded ? (
              <div className="max-w-xl mx-auto mt-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Upload Patient Data
                  </h2>
                  <p className="text-muted-foreground">
                    Upload a CSV file to analyze patient readmission risk
                  </p>
                </div>
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            ) : (
              <>
                <StatsCards stats={stats} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ReadmissionChart data={ageGroupData} />
                  <div className="stat-card animate-fade-in flex flex-col justify-center items-center text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Activity className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Data Loaded Successfully
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Analyzed {stats.totalPatients.toLocaleString()} patient records
                    </p>
                    <button
                      onClick={() => setIsDataLoaded(false)}
                      className="text-sm text-primary hover:underline"
                    >
                      Upload different file
                    </button>
                  </div>
                </div>
                <PatientTable patients={patients} />
              </>
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

// Add Activity icon import at the top level for the success state
import { Activity } from "lucide-react";

export default Index;
