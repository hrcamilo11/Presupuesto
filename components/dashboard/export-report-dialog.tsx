"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPdf, type ExportSectionId } from "@/app/actions/reports";
import { cn } from "@/lib/utils";

const SECTIONS: { id: ExportSectionId; label: string }[] = [
  { id: "balance", label: "Balance general" },
  { id: "ingresos", label: "Ingresos" },
  { id: "gastos", label: "Gastos" },
  { id: "suscripciones", label: "Suscripciones" },
  { id: "prestamos", label: "Préstamos" },
  { id: "impuestos", label: "Impuestos" },
  { id: "cuentas", label: "Cuentas" },
  { id: "ahorros", label: "Ahorros" },
];

type ExportReportDialogProps = {
  context?: string | null;
  wallet?: string | null;
  trigger?: React.ReactNode;
};

export function ExportReportDialog({ context = null, wallet = null, trigger }: ExportReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [sections, setSections] = useState<ExportSectionId[]>(["balance", "ingresos", "gastos"]);
  const [error, setError] = useState<string | null>(null);

  function toggleSection(id: ExportSectionId) {
    setSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSections(SECTIONS.map((s) => s.id));
  }

  function selectNone() {
    setSections([]);
  }

  async function handleExport(type: "excel" | "pdf") {
    if (sections.length === 0) {
      setError("Selecciona al menos una sección.");
      return;
    }
    if (dateFrom > dateTo) {
      setError("La fecha inicial no puede ser mayor que la final.");
      return;
    }
    setError(null);
    setLoading(true);

    const exportFn = type === "excel" ? exportToExcel : exportToPdf;
    const result = await exportFn({
      dateFrom,
      dateTo,
      sections,
      context,
      wallet,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      const bin = atob(result.data);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);

      const mimeType = type === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";
      const extension = type === "excel" ? "xlsx" : "pdf";

      const blob = new Blob([arr], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_presupuesto_${dateFrom}_${dateTo}.${extension}`;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar reporte a Excel</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Elige el rango de fechas y las secciones que quieres incluir. Cada sección se exportará en una hoja distinta.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="dateFrom" className="text-sm font-medium">
                Desde
              </label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dateTo" className="text-sm font-medium">
                Hasta
              </label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Secciones a exportar</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  Todas
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={selectNone}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Ninguna
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
              {SECTIONS.map(({ id, label }) => (
                <label
                  key={id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50",
                    sections.includes(id) && "bg-muted/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={sections.includes(id)}
                    onChange={() => toggleSection(id)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="sm:mr-auto">
            Cancelar
          </Button>
          <Button onClick={() => handleExport("pdf")} disabled={loading || sections.length === 0} variant="outline" className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            PDF
          </Button>
          <Button onClick={() => handleExport("excel")} disabled={loading || sections.length === 0} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
