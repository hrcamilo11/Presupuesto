"use client";

import { useState } from "react";
import { Category } from "@/lib/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Edit2, Trash2, Tag, Utensils, Car, Home, Gamepad2, HeartPulse, Banknote, ShoppingBag, Gift, TrendingUp, Laptop, Coffee, Plane, Book } from "lucide-react";
import { deleteCategory } from "@/app/actions/categories";
import { CategoryForm } from "./category-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const ICON_MAP: Record<string, LucideIcon> = {
    Tag, Utensils, Car, Home, Gamepad2, HeartPulse, Banknote, ShoppingBag, Gift, TrendingUp, Laptop, Coffee, Plane, Book
};

type Props = {
    categories: Category[];
};

export function CategoryList({ categories }: Props) {
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const { toast } = useToast();

    async function handleDelete(id: string) {
        // if (!confirm("¿Eliminar esta categoría? Los movimientos asociados se quedarán sin categoría.")) return;
        const { error } = await deleteCategory(id);
        if (error) {
            toast({
                title: "Error",
                description: error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Categoría eliminada",
                description: "La categoría se ha eliminado correctamente.",
            });
        }
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                    const Icon = ICON_MAP[category.icon] || Tag;
                    return (
                        <Card key={category.id}>
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{category.name}</p>
                                        <p className="text-xs text-muted-foreground uppercase">{category.type === "expense" ? "Gasto" : "Ingreso"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setEditCategory(category);
                                            setFormOpen(true);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <CategoryForm
                open={formOpen}
                onOpenChange={setFormOpen}
                editCategory={editCategory}
            />
        </>
    );
}
