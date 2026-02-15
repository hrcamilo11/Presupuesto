"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BudgetForm } from "./budget-form";
import type { Category } from "@/lib/database.types";

export function BudgetFormWrapper({
    categories,
    sharedAccountId,
}: {
    categories: Category[];
    sharedAccountId: string | null;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Presupuesto
            </Button>
            <BudgetForm
                open={open}
                onOpenChange={setOpen}
                categories={categories}
                sharedAccountId={sharedAccountId}
            />
        </>
    );
}
