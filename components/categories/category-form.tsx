"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCategory, updateCategory } from "@/app/actions/categories";
import type { Category, CategoryType } from "@/lib/database.types";
import { Loader2 } from "lucide-react";

type CategoryFormProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editCategory?: Category | null;
    type?: CategoryType;
};

const COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
    "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b"
];

// Removed unused ICONS array

export function CategoryForm({ open, onOpenChange, editCategory, type = "expense" }: CategoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [icon, setIcon] = useState("Tag");
    const [catType, setCatType] = useState<CategoryType>(type);

    const isEdit = Boolean(editCategory?.id);

    useState(() => {
        if (editCategory) {
            setName(editCategory.name);
            setColor(editCategory.color);
            setIcon(editCategory.icon);
            setCatType(editCategory.type);
        }
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const data = {
            name,
            color,
            icon,
            type: catType,
            shared_account_id: null,
        };

        const result = isEdit
            ? await updateCategory(editCategory!.id, data)
            : await createCategory(data);

        setLoading(false);
        if (result.error) {
            alert(result.error);
            return;
        }

        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Comida, Alquiler..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={catType} onValueChange={(v) => setCatType(v as CategoryType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="expense">Gasto</SelectItem>
                                <SelectItem value="income">Ingreso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-black dark:border-white" : "border-transparent"}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
