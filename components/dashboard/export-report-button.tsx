"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportMonthlyReport } from "@/app/actions/reports";

type ExportReportButtonProps = {
    context?: string | null;
    wallet?: string | null;
};

export function ExportReportButton({ context = null, wallet = null }: ExportReportButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        setLoading(true);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const result = await exportMonthlyReport(year, month, { context, wallet });
        setLoading(false);

        if (result.error) {
            alert(result.error);
            return;
        }

        if (result.data) {
            const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `reporte_${year}_${month}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
            className="gap-2"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            Exportar CSV
        </Button>
    );
}
