import { Users, AlertTriangle, Calendar } from "lucide-react";
import { DashboardStats } from "@/types/patient";

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="stat-card-primary animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">
              Total Patients
            </p>
            <p className="text-4xl font-bold mt-2">
              {stats.totalPatients.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              High Risk Patients
            </p>
            <p className="text-4xl font-bold text-destructive mt-2">
              {stats.highRiskPatients.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalPatients > 0
                ? `${((stats.highRiskPatients / stats.totalPatients) * 100).toFixed(1)}% of total`
                : "0%"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
        </div>
      </div>

      <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Average Age
            </p>
            <p className="text-4xl font-bold text-foreground mt-2">
              {stats.averageAge}
            </p>
            <p className="text-xs text-muted-foreground mt-1">years old</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
        </div>
      </div>
    </div>
  );
};
