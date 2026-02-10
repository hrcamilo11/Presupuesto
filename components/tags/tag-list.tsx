"use client";

import { useState } from "react";
import type { Tag } from "@/lib/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";
import { deleteTag } from "@/app/actions/tags";
import { TagForm } from "./tag-form";
import { Button } from "@/components/ui/button";

type Props = {
    tags: Tag[];
};

export function TagList({ tags }: Props) {
    const [editTag, setEditTag] = useState<Tag | null>(null);
    const [formOpen, setFormOpen] = useState(false);

    async function handleDelete(id: string) {
        if (!confirm("¿Eliminar esta etiqueta? Se quitará de todos los movimientos asociados.")) return;
        const { error } = await deleteTag(id);
        if (error) alert(error);
    }

    return (
        <>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {tags.map((tag) => (
                    <Card key={tag.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className="h-3 w-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: tag.color }}
                                />
                                <span className="font-medium truncate text-sm" title={tag.name}>
                                    {tag.name}
                                </span>
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        setEditTag(tag);
                                        setFormOpen(true);
                                    }}
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(tag.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {tags.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No tienes etiquetas creadas.</p>
                        <Button variant="link" onClick={() => setFormOpen(true)}>
                            Crea tu primera etiqueta
                        </Button>
                    </div>
                )}
            </div>

            <TagForm
                open={formOpen}
                onOpenChange={setFormOpen}
                editTag={editTag}
            />
        </>
    );
}
