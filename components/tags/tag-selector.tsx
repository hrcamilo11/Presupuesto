"use client";

import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { Tag } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type Props = {
    allTags: Tag[];
    selectedTagIds: string[];
    onToggleTag: (tagId: string) => void;
};

export function TagSelector({ allTags, selectedTagIds, onToggleTag }: Props) {
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {selectedTagIds.map(id => {
                    const tag = allTags.find(t => t.id === id);
                    if (!tag) return null;
                    return (
                        <Badge
                            key={id}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 flex items-center gap-1 border-none"
                            style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color
                            }}
                        >
                            {tag.name}
                            <button
                                type="button"
                                onClick={() => onToggleTag(id)}
                                className="hover:bg-black/10 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto bg-muted/30">
                {allTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => onToggleTag(tag.id)}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors text-left border border-transparent",
                                isSelected
                                    ? "bg-primary/10 border-primary/20 text-primary"
                                    : "hover:bg-muted bg-background"
                            )}
                        >
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1 truncate">{tag.name}</span>
                            {isSelected && <Check className="h-3 w-3" />}
                        </button>
                    );
                })}
                {allTags.length === 0 && (
                    <p className="text-[10px] text-muted-foreground col-span-full text-center">
                        No hay etiquetas disponibles. Créalas en la sección de Etiquetas.
                    </p>
                )}
            </div>
        </div>
    );
}
