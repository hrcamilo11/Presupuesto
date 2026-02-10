"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TagForm } from "./tag-form";

export function TagFormWrapper() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Etiqueta
            </Button>
            <TagForm open={open} onOpenChange={setOpen} />
        </>
    );
}
