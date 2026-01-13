import { Activity } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="gradient-medical text-primary-foreground py-6 px-8 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PRIM</h1>
            <p className="text-primary-foreground/80 text-sm">
              Patient Risk Intelligence Monitor
            </p>
          </div>
        </div>
        <div className="text-right text-sm text-primary-foreground/80">
          <p>Healthcare Analytics Dashboard</p>
        </div>
      </div>
    </header>
  );
};
