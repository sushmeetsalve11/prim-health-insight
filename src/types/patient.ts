export interface Patient {
  id: number;
  age: number;
  n_inpatient: number;
  n_emergency: number;
  A1Cresult: string;
  max_glu_serum: string;
  diag_1: string;
  readmitted: number;
}

export interface DashboardStats {
  totalPatients: number;
  highRiskPatients: number;
  averageAge: number;
}

export interface AgeGroupData {
  ageGroup: string;
  readmitted: number;
  notReadmitted: number;
  total: number;
}
