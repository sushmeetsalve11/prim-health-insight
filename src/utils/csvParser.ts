import { Patient, AgeGroupData } from "@/types/patient";

export const parseCSV = (csvText: string): Patient[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map((line, index) => {
    const values = line.split(',');
    return {
      id: index + 1,
      age: parseInt(values[0]) || 0,
      n_inpatient: parseInt(values[1]) || 0,
      n_emergency: parseInt(values[2]) || 0,
      A1Cresult: values[3] || '',
      max_glu_serum: values[4] || '',
      diag_1: values[5] || '',
      readmitted: parseInt(values[6]) || 0,
    };
  });
};

export const calculateStats = (patients: Patient[]) => {
  const totalPatients = patients.length;
  const highRiskPatients = patients.filter(p => p.readmitted === 1).length;
  const averageAge = patients.length > 0
    ? Math.round(patients.reduce((sum, p) => sum + p.age, 0) / patients.length)
    : 0;

  return { totalPatients, highRiskPatients, averageAge };
};

export const getAgeGroupData = (patients: Patient[]): AgeGroupData[] => {
  const groups: Record<string, { readmitted: number; notReadmitted: number }> = {
    '0-17': { readmitted: 0, notReadmitted: 0 },
    '18-34': { readmitted: 0, notReadmitted: 0 },
    '35-49': { readmitted: 0, notReadmitted: 0 },
    '50-64': { readmitted: 0, notReadmitted: 0 },
    '65-79': { readmitted: 0, notReadmitted: 0 },
    '80+': { readmitted: 0, notReadmitted: 0 },
  };

  patients.forEach(patient => {
    let group: string;
    if (patient.age < 18) group = '0-17';
    else if (patient.age < 35) group = '18-34';
    else if (patient.age < 50) group = '35-49';
    else if (patient.age < 65) group = '50-64';
    else if (patient.age < 80) group = '65-79';
    else group = '80+';

    if (patient.readmitted === 1) {
      groups[group].readmitted++;
    } else {
      groups[group].notReadmitted++;
    }
  });

  return Object.entries(groups).map(([ageGroup, data]) => ({
    ageGroup,
    readmitted: data.readmitted,
    notReadmitted: data.notReadmitted,
    total: data.readmitted + data.notReadmitted,
  }));
};
