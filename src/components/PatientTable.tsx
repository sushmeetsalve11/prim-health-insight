import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Patient } from "@/types/patient";

interface PatientTableProps {
  patients: Patient[];
}

export const PatientTable = ({ patients }: PatientTableProps) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredPatients = useMemo(() => {
    if (!search) return patients;
    const searchLower = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.age.toString().includes(searchLower) ||
        p.diag_1.toLowerCase().includes(searchLower) ||
        p.A1Cresult.toLowerCase().includes(searchLower)
    );
  }, [patients, search]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(start, start + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Patient Records</h3>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by age, diagnosis, A1C..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Age</TableHead>
              <TableHead className="font-semibold">Inpatient Visits</TableHead>
              <TableHead className="font-semibold">Emergency Visits</TableHead>
              <TableHead className="font-semibold">A1C Result</TableHead>
              <TableHead className="font-semibold">Diagnosis</TableHead>
              <TableHead className="font-semibold">Risk Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPatients.map((patient) => (
              <TableRow
                key={patient.id}
                className={patient.readmitted === 1 ? "risk-row-high" : ""}
              >
                <TableCell className="font-medium">{patient.id}</TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell>{patient.n_inpatient}</TableCell>
                <TableCell>{patient.n_emergency}</TableCell>
                <TableCell>{patient.A1Cresult || "—"}</TableCell>
                <TableCell>{patient.diag_1}</TableCell>
                <TableCell>
                  <span
                    className={
                      patient.readmitted === 1
                        ? "risk-badge-high"
                        : "risk-badge-low"
                    }
                  >
                    {patient.readmitted === 1 ? "High Risk" : "Low Risk"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedPatients.length} of {filteredPatients.length} patients
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-lg border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
