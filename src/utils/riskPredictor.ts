interface RiskInput {
  age: number;
  n_inpatient: number;
  n_emergency: number;
  A1Cresult: string;
}

export const predictReadmission = (data: RiskInput): { risk: string; score: number } => {
  let score = 0;

  // Weightage based on feature engineering
  if (data.n_inpatient > 1) score += 0.4;
  if (data.n_emergency > 0) score += 0.2;
  if (data.age > 65) score += 0.15;
  if (data.A1Cresult === '>8%') score += 0.25;

  return {
    risk: score > 0.5 ? "High Risk" : "Low Risk",
    score: Math.min(score, 1)
  };
};

export const getRiskColor = (risk: string): string => {
  return risk === "High Risk" ? "destructive" : "success";
};
