"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryForm } from "./category-form";

export function CategoryFormWrapper() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Categoría
            </Button>
            <CategoryForm open={open} onOpenChange={setOpen} />
        </>
    );
}
