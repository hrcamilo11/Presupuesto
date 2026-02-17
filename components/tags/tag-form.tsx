"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTag, updateTag } from "@/app/actions/tags";
import { useRouter } from "next/navigation";
import type { Tag } from "@/lib/database.types";
import { useToast } from "@/components/ui/use-toast";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editTag?: Tag | null;
};

export function TagForm({ open, onOpenChange, editTag }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState(editTag?.name ?? "");
    const [color, setColor] = useState(editTag?.color ?? "#3b82f6");
    const [loading, setLoading] = useState(false);

    const isEdit = Boolean(editTag);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const result = isEdit
            ? await updateTag(editTag!.id, { name, color })
            : await createTag(name, color);

        setLoading(false);
        if (result.error) {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: isEdit ? "Etiqueta actualizada" : "Etiqueta creada",
            description: isEdit
                ? "La etiqueta se ha actualizado correctamente."
                : "La etiqueta se ha creado correctamente.",
        });

        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Etiqueta" : "Nueva Etiqueta"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej. Restaurante, Freelance..."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                id="color"
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="w-12 h-10 p-1"
                            />
                            <Input
                                type="text"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="flex-1"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
